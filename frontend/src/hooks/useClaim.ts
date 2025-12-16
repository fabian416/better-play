/* =======================
   Claim (Read + Write)
   ======================= */

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address, Hash } from "viem";
import { toast } from "react-hot-toast";
import { useContracts } from "~~/providers/contracts-context";
import { useConnectedAccount, useGetMarket, usePools, qk } from "./useBetterPlay"; // <- ajustá path si estás dentro del mismo file

// Si no sabés el deployment block, dejalo en 0 (MVP).
// En mainnet puede ser pesado; ideal: setear BETTERPLAY_DEPLOY_BLOCK.
const DEFAULT_FROM_BLOCK = 0;

/** Reads: stakes del user por outcome */
export function useUserStakes(marketId?: bigint, user?: Address) {
  const { contracts } = useContracts();
  const enabled = !!marketId && marketId !== 0n && !!user;

  return useQuery({
    queryKey: ["betterPlay", "userStakes", marketId?.toString() ?? null, user ?? null] as const,
    enabled,
    queryFn: async () => {
      if (!marketId || !user) throw new Error("args not ready");
      const { betterPlay } = await contracts();
      const res = (await betterPlay.userStakes(marketId, user)) as readonly [bigint, bigint, bigint];
      return { home: res[0], draw: res[1], away: res[2] };
    },
  });
}

/** Helper: detecta si ya reclamó mirando eventos */
async function hasClaimedByEvents(args: {
  betterPlay: any;
  marketId: bigint;
  user: Address;
  fromBlock?: number;
}) {
  const { betterPlay, marketId, user, fromBlock = DEFAULT_FROM_BLOCK } = args;

  // event Claimed(uint256 indexed id, address indexed user, uint256 amount)
  const filter = betterPlay.filters.Claimed(marketId, user);

  // "latest" funciona en ethers v6
  const logs = await betterPlay.queryFilter(filter, fromBlock, "latest");
  return logs.length > 0;
}

/** Helper: calcula payout igual que el contrato (sin tocar estado) */
function computeClaimablePayout(params: {
  state: number; // MarketState
  winningOutcome: number;
  feeBps: bigint;
  totalStaked: bigint;
  pools: readonly [bigint, bigint, bigint];
  stakes: { home: bigint; draw: bigint; away: bigint };
}) {
  const { state, winningOutcome, feeBps, totalStaked, pools, stakes } = params;

  // MarketState { Open=0, Closed=1, Resolved=2, Canceled=3 }
  if (state !== 2 && state !== 3) {
    return { claimable: 0n, reason: "NOT_FINAL" as const };
  }

  // Canceled: refund total stake
  if (state === 3) {
    const refund = stakes.home + stakes.draw + stakes.away;
    return { claimable: refund, reason: "CANCELED_REFUND" as const };
  }

  // Resolved:
  const w = winningOutcome; // 0..2
  const userWinStake = w === 0 ? stakes.home : w === 1 ? stakes.draw : stakes.away;
  if (userWinStake === 0n) return { claimable: 0n, reason: "NO_WIN_STAKE" as const };

  const winnersPool = pools[w] ?? 0n;
  if (winnersPool === 0n) return { claimable: 0n, reason: "BAD_WINNERS_POOL" as const };

  const losersPool = totalStaked - winnersPool;
  const netLosers = (losersPool * (10_000n - feeBps)) / 10_000n;

  const payout = userWinStake + (userWinStake * netLosers) / winnersPool;
  return { claimable: payout, reason: "OK" as const };
}

/**
 * READ: ¿Tiene algo para claimear? ¿Cuánto? ¿Ya reclamó?
 */
export function useClaimable(
  marketId?: bigint,
  opts?: { user?: Address; fromBlock?: number }
) {
  const { contracts } = useContracts();
  const { data: connected } = useConnectedAccount();

  const user = (opts?.user ?? connected) as Address | undefined;
  const enabled = !!marketId && marketId !== 0n && !!user;

  // Reusamos tus reads existentes para evitar duplicar calls
  const marketQ = useGetMarket(marketId);
  const poolsQ = usePools(marketId);
  const stakesQ = useUserStakes(marketId, user);

  return useQuery({
    queryKey: ["betterPlay", "claimable", marketId?.toString() ?? null, user ?? null] as const,
    enabled: enabled && !!marketQ.data && !!poolsQ.data && !!stakesQ.data,
    queryFn: async () => {
      if (!marketId || !user) throw new Error("args not ready");
      const { betterPlay } = await contracts();

      const alreadyClaimed = await hasClaimedByEvents({
        betterPlay,
        marketId,
        user,
        fromBlock: opts?.fromBlock ?? DEFAULT_FROM_BLOCK,
      });

      if (alreadyClaimed) {
        return {
          user,
          alreadyClaimed: true,
          canClaim: false,
          claimable: 0n,
          reason: "ALREADY_CLAIMED" as const,
        };
      }

      const market = marketQ.data!;
      const pools = poolsQ.data!;
      const stakes = stakesQ.data!;

      const { claimable, reason } = computeClaimablePayout({
        state: market.state,
        winningOutcome: market.winningOutcome,
        feeBps: market.feeBps,
        totalStaked: market.totalStaked,
        pools,
        stakes,
      });

      return {
        user,
        alreadyClaimed: false,
        canClaim: claimable > 0n,
        claimable,
        reason,
      };
    },
    // el payout cambia cuando se resuelve, no hace falta refetch agresivo
    staleTime: 10_000,
  });
}

/**
 * WRITE: ejecuta claim(marketId)
 */
export function useClaim() {
  const qc = useQueryClient();
  const { contracts } = useContracts();

  return useMutation<string, Error, bigint, { toastId: string }>({
    mutationFn: async (marketId: bigint) => {
      const { betterPlay } = await contracts();
      try {
        const tx = await betterPlay.claim(marketId);
        const rec = await tx.wait();
        return (rec?.hash ?? tx.hash) as Hash as string;
      } catch (e: any) {
        // reutiliza tu prettyEthersError si está en el mismo file
        const msg =
          e?.reason ||
          e?.shortMessage ||
          e?.info?.error?.message ||
          e?.error?.message ||
          e?.message ||
          String(e);

        throw new Error(msg || "El reclamo falló");
      }
    },
    onMutate: () => {
      const toastId = toast.loading("Reclamando…");
      return { toastId };
    },
    onSuccess: (_hash, marketId, ctx) => {
      toast.success("Reclamo exitoso ✅", { id: ctx?.toastId });

      // Refrescar UI
      qc.invalidateQueries({ queryKey: qk.betterPlay.market(marketId) });
      qc.invalidateQueries({ queryKey: qk.betterPlay.pools(marketId) });
      qc.invalidateQueries({ queryKey: ["betterPlay", "claimable"] });
      qc.invalidateQueries({ queryKey: ["usdc", "balanceOf"] });
    },
    onError: (err, _marketId, ctx) => {
      toast.error(err.message || "El reclamo falló", { id: ctx?.toastId });
    },
  });
}

/** (Opcional) sugar: boolean directo */
export function useHasClaimable(marketId?: bigint, opts?: { user?: Address; fromBlock?: number }) {
  const q = useClaimable(marketId, opts);
  return useMemo(() => {
    return {
      ...q,
      hasClaimable: !!q.data?.canClaim,
      claimable: q.data?.claimable ?? 0n,
    };
  }, [q]);
}

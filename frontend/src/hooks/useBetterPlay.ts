"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address, Hash } from "viem";
import { parseUnits } from "viem";
import { toast } from "react-hot-toast";
import { useContracts } from "~~/providers/contracts-context";

/* =======================
   Query Keys
   ======================= */


type MarketSummary = {
  id: bigint;
  state?: number;         // 0..3
  closeTime?: bigint;
  winningOutcome?: number;
};

const keyId = (id?: bigint) => (typeof id === "bigint" ? id.toString() : id ?? null);

export const qk = {
  usdc: {
    decimals: ["usdc", "decimals"] as const,
    balanceOf: (owner?: Address) => ["usdc", "balanceOf", owner ?? null] as const,
    allowance: (owner?: Address, spender?: Address) =>
      ["usdc", "allowance", owner ?? null, spender ?? null] as const,
  },
  betterPlay: {
    pools: (id?: bigint) => ["betterPlay", "pools", keyId(id)] as const,
    per1: (id?: bigint, outcome?: 0 | 1 | 2) =>
      ["betterPlay", "per1", keyId(id), outcome ?? null] as const,
    market: (id?: bigint) => ["betterPlay", "market", keyId(id)] as const,
    userStakes: (id?: bigint, user?: Address) =>
      ["betterPlay", "userStakes", keyId(id), user ?? null] as const,
    claimed: (id?: bigint, user?: Address) =>
      ["betterPlay", "claimed", keyId(id), user ?? null] as const,
    claimState: (id?: bigint, user?: Address) =>
      ["betterPlay", "claimState", keyId(id), user ?? null] as const,
    marketsSummary: (ids: bigint[]) =>
      ["betterPlay", "marketsSummary", ids.map((x) => x.toString()).join(",")] as const,
  },
  meta: {
    connected: ["connectedAddress"] as const,
  },
};

/* =======================
   Helpers de UX / Errores
   ======================= */

function formatAmount(n: bigint, decimals = 6) {
  const neg = n < 0n;
  const abs = neg ? -n : n;
  const s = abs.toString().padStart(decimals + 1, "0");
  const i = s.length - decimals;
  const whole = s.slice(0, i);
  const frac = s.slice(i).replace(/0+$/, "");
  const out = frac ? `${whole}.${frac}` : whole;
  return neg ? `-${out}` : out;
}

function prettyEthersError(e: any): string {
  const msg =
    e?.reason ||
    e?.shortMessage ||
    e?.info?.error?.message ||
    e?.error?.message ||
    e?.message ||
    String(e);

  const lower = (msg || "").toLowerCase();

  if (e?.code === 4001 || lower.includes("user denied") || lower.includes("user rejected")) {
    return "Transacción rechazada por el usuario";
  }

  if (
    lower.includes("insufficient funds for gas") ||
    lower.includes("insufficient funds for intrinsic transaction cost")
  ) {
    return "No tenés suficiente gas para pagar la transacción en esta red";
  }

  if (lower.includes("insufficient allowance")) return "Aprobación de USDC insuficiente";
  if (lower.includes("transfer amount exceeds balance") || lower.includes("insufficient balance")) {
    return "Saldo de USDC insuficiente";
  }

  if (e?.code === "CALL_EXCEPTION" || lower.includes("execution reverted")) {
    return "La transacción fue revertida por el contrato";
  }

  return msg || "Ocurrió un error al enviar la transacción";
}

/* =======================
   Meta
   ======================= */

export function useConnectedAccount() {
  const { contracts } = useContracts();
  return useQuery({
    queryKey: qk.meta.connected,
    queryFn: async () => {
      const { connectedAddress } = await contracts();
      return (connectedAddress ?? undefined) as Address | undefined;
    },
    staleTime: 0,
  });
}

/* =======================
   Reads (ethers Contracts)
   ======================= */

export function useUsdcDecimals() {
  const { contracts } = useContracts();
  return useQuery({
    queryKey: qk.usdc.decimals,
    queryFn: async () => {
      const { usdc } = await contracts();
      const dec = await usdc.decimals();
      return Number(dec);
    },
    staleTime: Infinity,
  });
}

export function useUsdcBalance(owner?: Address) {
  const { contracts } = useContracts();
  const enabled = !!owner;
  return useQuery({
    queryKey: qk.usdc.balanceOf(owner),
    enabled,
    queryFn: async () => {
      if (!owner) throw new Error("account not ready");
      const { usdc } = await contracts();
      return (await usdc.balanceOf(owner)) as bigint;
    },
  });
}

export function useUsdcAllowance(owner?: Address, spender?: Address) {
  const { contracts } = useContracts();
  const enabled = !!owner;
  return useQuery({
    queryKey: qk.usdc.allowance(owner, spender),
    enabled,
    queryFn: async () => {
      if (!owner) throw new Error("account not ready");
      const { usdc, betterPlayAddress } = await contracts();
      const _spender = (spender ?? (betterPlayAddress as Address)) as Address;
      return (await usdc.allowance(owner, _spender)) as bigint;
    },
  });
}

export function usePools(marketId?: bigint) {
  const { contracts } = useContracts();
  const enabled = !!marketId && marketId !== 0n;
  return useQuery({
    queryKey: qk.betterPlay.pools(marketId),
    enabled,
    queryFn: async () => {
      if (!marketId) throw new Error("market not ready");
      const { betterPlay } = await contracts();
      return (await betterPlay.pools(marketId)) as readonly [bigint, bigint, bigint];
    },
  });
}

export function usePreviewPayoutPer1(marketId?: bigint, outcome?: 0 | 1 | 2) {
  const { contracts } = useContracts();
  const enabled = !!marketId && marketId !== 0n && outcome !== undefined;
  return useQuery({
    queryKey: qk.betterPlay.per1(marketId, outcome),
    enabled,
    queryFn: async () => {
      if (!marketId || outcome === undefined) throw new Error("args not ready");
      const { betterPlay } = await contracts();
      return (await betterPlay.previewPayoutPer1(marketId, outcome)) as bigint;
    },
  });
}

export function useGetMarket(marketId?: bigint) {
  const { contracts } = useContracts();
  const enabled = !!marketId && marketId !== 0n;
  return useQuery({
    queryKey: qk.betterPlay.market(marketId),
    enabled,
    queryFn: async () => {
      if (!marketId) throw new Error("market not ready");
      const { betterPlay } = await contracts();
      const res = (await betterPlay.getMarket(marketId)) as readonly [
        Address,
        bigint,
        bigint,
        string,
        bigint | number,
        bigint | number,
        bigint
      ];
      return {
        stakeToken: res[0] as Address,
        feeBps: BigInt(res[1]),
        closeTime: BigInt(res[2]),
        metadataURI: res[3] as string,
        state: Number(res[4] as number | bigint),
        winningOutcome: Number(res[5] as number | bigint),
        totalStaked: BigInt(res[6]),
      };
    },
  });
}

/* =======================
   Approval helper
   ======================= */

export function useApprovalStatus(amountInput: string) {
  const { data: decimals } = useUsdcDecimals();
  const { data: owner } = useConnectedAccount();
  const { data: allowance } = useUsdcAllowance(owner);

  const parsed = useMemo(() => {
    if (!amountInput || !decimals) {
      return { amount: null as bigint | null, error: null as string | null };
    }
    try {
      return { amount: parseUnits(amountInput, decimals), error: null };
    } catch {
      return { amount: null, error: "Monto inválido" };
    }
  }, [amountInput, decimals]);

  const needsApproval =
    !!parsed.amount && typeof allowance === "bigint" ? allowance < parsed.amount : false;

  return { amount: parsed.amount, error: parsed.error, needsApproval, decimals, allowance };
}

/* =======================
   Writes
   ======================= */

export function useApprove() {
  const qc = useQueryClient();
  const { contracts } = useContracts();

  return useMutation<string, Error, bigint, { toastId: string }>({
    mutationFn: async (amount: bigint) => {
      const { usdc, betterPlayAddress } = await contracts();
      try {
        const tx = await usdc.approve(betterPlayAddress, amount);
        const rec = await tx.wait();
        return (rec?.hash ?? tx.hash) as Hash as string;
      } catch (e) {
        throw new Error(prettyEthersError(e));
      }
    },
    onMutate: () => ({ toastId: toast.loading("Aprobando USDC…") }),
    onSuccess: (_hash, _amount, ctx) => {
      toast.success("Aprobación exitosa ✅", { id: ctx?.toastId });
      qc.invalidateQueries({ queryKey: ["usdc", "allowance"] });
      qc.invalidateQueries({ queryKey: ["usdc", "balanceOf"] });
    },
    onError: (err, _vars, ctx) =>
      toast.error(err.message || "Fallo la aprobación", { id: ctx?.toastId }),
  });
}

export function useBet() {
  const qc = useQueryClient();
  const { contracts } = useContracts();

  return useMutation<
    string,
    Error,
    { marketId: bigint; outcome: 0 | 1 | 2; amount: bigint },
    { toastId: string }
  >({
    mutationFn: async ({ marketId, outcome, amount }) => {
      const { betterPlay, usdc, betterPlayAddress, signer } = await contracts();

      // ✅ sender real de la tx (en Beexo suele ser la smart account)
      const sender = await signer.getAddress();

      const market = (await betterPlay.getMarket(marketId)) as readonly any[];
      const closeTime = BigInt(market[2]);
      const state = Number(market[4]); // 0 Open, 1 Closed, 2 Resolved, 3 Canceled

      const now = BigInt(Math.floor(Date.now() / 1000));

      if (state !== 0) throw new Error("El mercado no está abierto");
      if (now >= closeTime) throw new Error("El mercado está cerrado para nuevas apuestas");
      if (amount <= 0n) throw new Error("Monto inválido");

      // ✅ IMPORTANTE: balance/allowance del sender real
      const [balance, allowance] = (await Promise.all([
        usdc.balanceOf(sender),
        usdc.allowance(sender, betterPlayAddress),
      ])) as [bigint, bigint];

      if (allowance < amount) throw new Error("Aprobación de USDC insuficiente");
      if (balance < amount) {
        throw new Error(
          `Saldo de USDC insuficiente (tenés ${formatAmount(balance)} y necesitás ${formatAmount(amount)})`
        );
      }

      try {
        const tx = await betterPlay.bet(marketId, outcome, amount);
        const rec = await tx.wait();

        // ✅ Parseo del event BetPlaced para detectar msg.sender real y guardarlo
        let betSender: string | null = null;

        for (const log of rec?.logs ?? []) {
          try {
            const parsed = betterPlay.interface.parseLog({
              topics: log.topics as string[],
              data: log.data as string,
            });

            if (parsed?.name === "BetPlaced") {
              // event BetPlaced(uint256 indexed id, address indexed user, uint8 outcome, uint256 amount)
              betSender = String(parsed.args.user);
              break;
            }
          } catch {
            // ignore parse errors
          }
        }

        if (betSender && typeof window !== "undefined") {
          window.localStorage.setItem(`bp:lastBetSender:${marketId.toString()}`, betSender);
        }

        return (rec?.hash ?? tx.hash) as Hash as string;
      } catch (e) {
        throw new Error(prettyEthersError(e));
      }
    },

    onMutate: () => ({ toastId: toast.loading("Enviando apuesta…") }),

    onSuccess: (_hash, vars, ctx) => {
      toast.success("¡Apuesta hecha! ✅", { id: ctx?.toastId });

      // ✅ tus invalidations actuales
      qc.invalidateQueries({ queryKey: qk.betterPlay.pools(vars.marketId) });
      qc.invalidateQueries({ queryKey: qk.betterPlay.per1(vars.marketId, vars.outcome) });
      qc.invalidateQueries({ queryKey: ["usdc", "balanceOf"] });
      qc.invalidateQueries({ queryKey: ["usdc", "allowance"] });

      // ✅ IMPORTANTE: refrescar stakes/claim state del user (y cubrir keys distintas)
      qc.invalidateQueries({ queryKey: qk.betterPlay.userStakes(vars.marketId) });
      qc.invalidateQueries({ queryKey: qk.betterPlay.claimState(vars.marketId) });

      // ✅ Fallback: si tu userStakes/claimState usan queryKey con address adentro,
      // invalido por prefijo/predicate para agarrar todas
      const mid = vars.marketId.toString();

      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey;
          return (
            Array.isArray(k) &&
            k.length >= 3 &&
            k[0] === "betterPlay" &&
            (k[1] === "userStakes" || k[1] === "claimState" || k[1] === "claimedEvent") &&
            String(k[2]) === mid
          );
        },
      });
    },

    onError: (err, _vars, ctx) => toast.error(err.message || "No pudimos procesar tu apuesta", { id: ctx?.toastId }),
  });
}

/* =======================
   Claim (Read + Write)
   ======================= */

// ⚠️ si sabés el deploy block real, setealo por env para que queryFilter sea rápido
const DEFAULT_FROM_BLOCK = Number(import.meta.env?.VITE_BETTERPLAY_DEPLOY_BLOCK ?? 0);

export function useUserStakes(marketId?: bigint, user?: Address) {
  const { contracts } = useContracts();
  const enabled = !!marketId && marketId !== 0n && !!user;

  return useQuery({
    queryKey: qk.betterPlay.userStakes(marketId, user),
    enabled,
    queryFn: async () => {
      if (!marketId || !user) throw new Error("args not ready");
      const { betterPlay } = await contracts();
      const res = (await betterPlay.userStakes(marketId, user)) as readonly [bigint, bigint, bigint];
      return { home: res[0], draw: res[1], away: res[2] };
    },
    staleTime: 10_000,
  });
}

export function useHasClaimed(marketId?: bigint, user?: Address, fromBlock = DEFAULT_FROM_BLOCK) {
  const { contracts } = useContracts();
  const enabled = !!marketId && marketId !== 0n && !!user;

  return useQuery({
    queryKey: qk.betterPlay.claimed(marketId, user),
    enabled,
    queryFn: async () => {
      if (!marketId || !user) throw new Error("args not ready");
      const { betterPlay } = await contracts();

      try {
        const filter = betterPlay.filters.Claimed(marketId, user);
        const logs = await betterPlay.queryFilter(filter, fromBlock, "latest");
        return logs.length > 0;
      } catch {
        // si el provider se pone ortiva con logs, NO bloqueamos la UI
        return false;
      }
    },
    staleTime: 20_000,
  });
}

function computeClaimable(params: {
  state: number;
  winningOutcome: number;
  feeBps: bigint;
  totalStaked: bigint;
  pools: readonly [bigint, bigint, bigint];
  stakes: { home: bigint; draw: bigint; away: bigint };
}) {
  const { state, winningOutcome, feeBps, totalStaked, pools, stakes } = params;

  // MarketState { Open=0, Closed=1, Resolved=2, Canceled=3 }
  if (state !== 2 && state !== 3) return { claimable: 0n, reason: "NOT_FINAL" as const };

  if (state === 3) {
    const refund = stakes.home + stakes.draw + stakes.away;
    return { claimable: refund, reason: "CANCELED_REFUND" as const };
  }

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
 * ✅ Hook único: stakes por pozo + total + alreadyClaimed + claimable + canClaim
 * Y lo más importante: NO depende de “120 minutos”, depende de ONCHAIN.
 */
export function useMarketClaimState(
  marketId?: bigint,
  opts?: { user?: Address; fromBlock?: number }
) {
  const { data: connected } = useConnectedAccount();
  const user = (opts?.user ?? connected) as Address | undefined;

  const marketQ = useGetMarket(marketId);
  const poolsQ = usePools(marketId);
  const stakesQ = useUserStakes(marketId, user);
  const claimedQ = useHasClaimed(marketId, user, opts?.fromBlock ?? DEFAULT_FROM_BLOCK);

  const enabled = !!marketId && marketId !== 0n && !!user;

  return useQuery({
    queryKey: qk.betterPlay.claimState(marketId, user),
    enabled,
    queryFn: async () => {
      const market = marketQ.data;
      const pools = poolsQ.data;
      const stakes = stakesQ.data;
      const alreadyClaimed = claimedQ.data ?? false;

      if (!market || !pools || !stakes) {
        return {
          user,
          marketState: market?.state,
          isFinalOnchain: market ? market.state === 2 || market.state === 3 : false,
          alreadyClaimed,
          stakes: stakes ?? { home: 0n, draw: 0n, away: 0n },
          stakedTotal: stakes ? stakes.home + stakes.draw + stakes.away : 0n,
          claimable: 0n,
          canClaim: false,
          reason: "LOADING" as const,
        };
      }

      const stakedTotal = stakes.home + stakes.draw + stakes.away;
      const isFinalOnchain = market.state === 2 || market.state === 3;

      if (alreadyClaimed) {
        return {
          user,
          marketState: market.state,
          isFinalOnchain,
          alreadyClaimed: true,
          stakes,
          stakedTotal,
          claimable: 0n,
          canClaim: false,
          reason: "ALREADY_CLAIMED" as const,
        };
      }

      const { claimable, reason } = computeClaimable({
        state: market.state,
        winningOutcome: market.winningOutcome,
        feeBps: market.feeBps,
        totalStaked: market.totalStaked,
        pools,
        stakes,
      });

      return {
        user,
        marketState: market.state,
        isFinalOnchain,
        alreadyClaimed: false,
        stakes,
        stakedTotal,
        claimable,
        canClaim: isFinalOnchain && claimable > 0n,
        reason,
      };
    },
    staleTime: 10_000,
  });
}


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
      } catch (e) {
        throw new Error(prettyEthersError(e));
      }
    },
    onMutate: () => ({ toastId: toast.loading("Reclamando…") }),
    onSuccess: (_hash, marketId, ctx) => {
      toast.success("Reclamo exitoso ✅", { id: ctx?.toastId });

      qc.invalidateQueries({ queryKey: qk.betterPlay.market(marketId) });
      qc.invalidateQueries({ queryKey: qk.betterPlay.pools(marketId) });
      qc.invalidateQueries({ queryKey: ["betterPlay", "userStakes"] });
      qc.invalidateQueries({ queryKey: ["betterPlay", "claimed"] });
      qc.invalidateQueries({ queryKey: ["betterPlay", "claimState"] });
      qc.invalidateQueries({ queryKey: ["usdc", "balanceOf"] });
    },
    onError: (err, _marketId, ctx) =>
      toast.error(err.message || "El reclamo falló", { id: ctx?.toastId }),
  });
}


// Batch fetch: getMarket para muchos ids
export function useMarketsSummary(ids: bigint[]) {
  const { contracts } = useContracts();
  const enabled = ids.length > 0;

  return useQuery({
    queryKey: qk.betterPlay.marketsSummary(ids),
    enabled,
    queryFn: async () => {
      const { betterPlay } = await contracts();

      const rows = await Promise.all(
        ids.map(async (id): Promise<MarketSummary> => {
          try {
            const res = (await betterPlay.getMarket(id)) as readonly [
              Address,
              bigint,
              bigint,
              string,
              bigint | number,
              bigint | number,
              bigint
            ];

            return {
              id,
              state: Number(res[4] as number | bigint),
              closeTime: BigInt(res[2]),
              winningOutcome: Number(res[5] as number | bigint),
            };
          } catch {
            return { id, state: undefined };
          }
        })
      );

      // map por string id
      const map: Record<string, MarketSummary> = {};
      for (const r of rows) map[r.id.toString()] = r;
      return map;
    },
    staleTime: 15_000,
  });
}

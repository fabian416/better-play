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
  state?: number; // 0..3
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
    per1: (id?: bigint, outcome?: 0 | 1 | 2) => ["betterPlay", "per1", keyId(id), outcome ?? null] as const,
    market: (id?: bigint) => ["betterPlay", "market", keyId(id)] as const,
    userStakes: (id?: bigint, user?: Address) => ["betterPlay", "userStakes", keyId(id), user ?? null] as const,
    claimed: (id?: bigint, user?: Address) => ["betterPlay", "claimed", keyId(id), user ?? null] as const,
    marketsSummary: (ids: bigint[]) => ["betterPlay", "marketsSummary", ids.map((x) => x.toString()).join(",")] as const,
  },
  meta: {
    connected: ["connectedAddress"] as const,
  },
};

/* =======================
   Helpers
======================= */

export function formatAmount(n: bigint, decimals = 6) {
  const neg = n < 0n;
  const abs = neg ? -n : n;
  const s = abs.toString().padStart(decimals + 1, "0");
  const i = s.length - decimals;
  const whole = s.slice(0, i);
  const frac = s.slice(i).replace(/0+$/, "");
  const out = frac ? `${whole}.${frac}` : whole;
  return neg ? `-${out}` : out;
}

export function prettyEthersError(e: any): string {
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
  if (lower.includes("insufficient funds for gas") || lower.includes("intrinsic transaction cost")) {
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
      const { signer } = await contracts();
      const addr = (await signer.getAddress()) as Address;
      return addr;
    },
    staleTime: 0,
  });
}

/* =======================
   Reads
======================= */

export function useUsdcDecimals() {
  const { contracts } = useContracts();
  return useQuery({
    queryKey: qk.usdc.decimals,
    queryFn: async () => {
      const { usdc } = await contracts();
      return Number(await usdc.decimals());
    },
    staleTime: Infinity,
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
    staleTime: 10_000,
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
        Address, // stakeToken
        bigint,  // feeBps
        bigint,  // closeTime
        string,  // metadataURI
        bigint | number, // state
        bigint | number, // winningOutcome
        bigint   // totalStaked
      ];

      return {
        stakeToken: res[0],
        feeBps: BigInt(res[1]),
        closeTime: BigInt(res[2]),
        metadataURI: res[3],
        state: Number(res[4]),
        winningOutcome: Number(res[5]),
        totalStaked: BigInt(res[6]),
      };
    },
    staleTime: 10_000,
  });
}

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

// Si tenés deploy block real, setealo por env para que sea rápido
const DEFAULT_FROM_BLOCK = Number(import.meta.env?.VITE_BETTERPLAY_DEPLOY_BLOCK ?? 0);

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
        return false;
      }
    },
    staleTime: 20_000,
  });
}

/* =======================
   Derivado (NO useQuery)
======================= */

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

  const w = winningOutcome;
  const userWinStake = w === 0 ? stakes.home : w === 1 ? stakes.draw : stakes.away;
  if (userWinStake === 0n) return { claimable: 0n, reason: "NO_WIN_STAKE" as const };

  const winnersPool = pools[w] ?? 0n;
  if (winnersPool === 0n) return { claimable: 0n, reason: "BAD_WINNERS_POOL" as const };

  const losersPool = totalStaked - winnersPool;
  const netLosers = (losersPool * (10_000n - feeBps)) / 10_000n;
  const payout = userWinStake + (userWinStake * netLosers) / winnersPool;

  return { claimable: payout, reason: "OK" as const };
}

export function useMarketClaimState(marketId?: bigint, user?: Address) {
  const marketQ = useGetMarket(marketId);
  const poolsQ = usePools(marketId);
  const stakesQ = useUserStakes(marketId, user);
  const claimedQ = useHasClaimed(marketId, user);

  return useMemo(() => {
    const market = marketQ.data;
    const pools = poolsQ.data;
    const stakes = stakesQ.data;
    const alreadyClaimed = claimedQ.data ?? false;

    const isFinalOnchain = !!market && (market.state === 2 || market.state === 3);

    const safeStakes = stakes ?? { home: 0n, draw: 0n, away: 0n };
    const stakedTotal = safeStakes.home + safeStakes.draw + safeStakes.away;

    if (!market || !pools || !stakes) {
      return {
        user,
        marketState: market?.state,
        isFinalOnchain,
        alreadyClaimed,
        stakes: safeStakes,
        stakedTotal,
        claimable: 0n,
        canClaim: false,
        reason: "LOADING" as const,
        isLoading:
          marketQ.isLoading || poolsQ.isLoading || stakesQ.isLoading || claimedQ.isLoading,
      };
    }

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
        isLoading: false,
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
      isLoading: false,
    };
  }, [
    user,
    marketQ.data,
    poolsQ.data,
    stakesQ.data,
    claimedQ.data,
    marketQ.isLoading,
    poolsQ.isLoading,
    stakesQ.isLoading,
    claimedQ.isLoading,
  ]);
}

/* =======================
   Writes
======================= */

export function useApprovalStatus(amountInput: string) {
  const { data: decimals } = useUsdcDecimals();

  const parsed = useMemo(() => {
    if (!amountInput || decimals == null) return { amount: null as bigint | null, error: null as string | null };
    try {
      return { amount: parseUnits(amountInput, decimals), error: null };
    } catch {
      return { amount: null, error: "Monto inválido" };
    }
  }, [amountInput, decimals]);

  return { amount: parsed.amount, error: parsed.error, decimals };
}

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
    onError: (err, _vars, ctx) => toast.error(err.message || "Falló la aprobación", { id: ctx?.toastId }),
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

      const sender = (await signer.getAddress()) as Address;

      const market = (await betterPlay.getMarket(marketId)) as readonly any[];
      const closeTime = BigInt(market[2]);
      const state = Number(market[4]); // 0 Open

      const now = BigInt(Math.floor(Date.now() / 1000));
      if (state !== 0) throw new Error("El mercado no está abierto");
      if (now >= closeTime) throw new Error("El mercado está cerrado para nuevas apuestas");
      if (amount <= 0n) throw new Error("Monto inválido");

      const [balance, allowance] = (await Promise.all([
        usdc.balanceOf(sender),
        usdc.allowance(sender, betterPlayAddress),
      ])) as [bigint, bigint];

      if (allowance < amount) throw new Error("Aprobación de USDC insuficiente");
      if (balance < amount) {
        throw new Error(`Saldo insuficiente (tenés ${formatAmount(balance)} y necesitás ${formatAmount(amount)})`);
      }

      try {
        const tx = await betterPlay.bet(marketId, outcome, amount);
        const rec = await tx.wait();
        return (rec?.hash ?? tx.hash) as Hash as string;
      } catch (e) {
        throw new Error(prettyEthersError(e));
      }
    },
    onMutate: () => ({ toastId: toast.loading("Enviando apuesta…") }),
    onSuccess: (_hash, vars, ctx) => {
      toast.success("¡Apuesta hecha! ✅", { id: ctx?.toastId });

      // refrescá TODO lo que depende de stake
      qc.invalidateQueries({ queryKey: qk.betterPlay.market(vars.marketId) });
      qc.invalidateQueries({ queryKey: qk.betterPlay.pools(vars.marketId) });
      qc.invalidateQueries({ queryKey: ["betterPlay", "userStakes"] });
      qc.invalidateQueries({ queryKey: ["betterPlay", "claimed"] });

      qc.invalidateQueries({ queryKey: ["usdc", "balanceOf"] });
      qc.invalidateQueries({ queryKey: ["usdc", "allowance"] });
    },
    onError: (err, _vars, ctx) => toast.error(err.message || "No pudimos procesar tu apuesta", { id: ctx?.toastId }),
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
      qc.invalidateQueries({ queryKey: ["usdc", "balanceOf"] });
    },
    onError: (err, _marketId, ctx) => toast.error(err.message || "El reclamo falló", { id: ctx?.toastId }),
  });
}

export function useMarketsSummary(ids: bigint[]) {
  const { contracts } = useContracts();

  // opcional: dedupe para no spamear calls
  const uniqIds = useMemo(() => {
    const s = new Set<string>();
    const out: bigint[] = [];
    for (const id of ids) {
      const k = id.toString();
      if (!s.has(k)) {
        s.add(k);
        out.push(id);
      }
    }
    return out;
  }, [ids]);

  const enabled = uniqIds.length > 0;

  return useQuery({
    queryKey: qk.betterPlay.marketsSummary(uniqIds),
    enabled,
    queryFn: async () => {
      const { betterPlay } = await contracts();

      const rows = await Promise.all(
        uniqIds.map(async (id): Promise<MarketSummary> => {
          try {
            // getMarket returns:
            // (stakeToken, feeBps, closeTime, metadataURI, state, winningOutcome, totalStaked)
            const res = (await betterPlay.getMarket(id)) as readonly any[];

            return {
              id,
              state: Number(res[4]),
              closeTime: BigInt(res[2]),
              winningOutcome: Number(res[5]),
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
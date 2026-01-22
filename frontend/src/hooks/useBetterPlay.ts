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

const keyId = (id?: bigint) =>
  typeof id === "bigint" ? id.toString() : (id ?? null);

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
   Helpers
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

  if (lower.includes("insufficient funds for gas") || lower.includes("intrinsic transaction cost")) {
    return "No tenés suficiente gas para pagar la transacción en esta red";
  }

  if (lower.includes("insufficient allowance")) return "Aprobación de USDC insuficiente";
  if (lower.includes("transfer amount exceeds balance") || lower.includes("insufficient balance")) {
    return "Saldo de USDC insuficiente";
  }

  if (lower.includes("execution reverted") || e?.code === "CALL_EXCEPTION") {
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
   Reads
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
      const res = (await betterPlay.getMarket(marketId)) as readonly any[];

      return {
        stakeToken: res[0] as Address,
        feeBps: BigInt(res[1]),
        closeTime: BigInt(res[2]),
        metadataURI: res[3] as string,
        state: Number(res[4]),
        winningOutcome: Number(res[5]),
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
    if (!amountInput || decimals === undefined) {
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

/**
 * ✅ BET: NO te bloqueo por reads que en Beexo/AA a veces fallan.
 * - si puedo leer market/closeTime/state: te tiro error “de UX”
 * - si NO puedo leer: intento igual y si revierte, te cae el error real.
 */
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
      const { betterPlay, usdc, betterPlayAddress, signer, connectedAddress } = await contracts();

      if (amount <= 0n) throw new Error("Monto inválido");

      // ✅ sender real (en Beexo/AA suele ser la smart account)
      let sender = (connectedAddress as Address | undefined) ?? undefined;
      if (!sender) {
        try {
          sender = (await (signer as any)?.getAddress?.()) as Address;
        } catch {
          sender = undefined;
        }
      }
      if (!sender) throw new Error("Wallet no conectada");

      // ✅ preflight market (best-effort)
      // si falla por RPC/provider, NO bloqueamos, intentamos igual y que revierta si corresponde.
      try {
        const market = (await betterPlay.getMarket(marketId)) as readonly any[];
        const closeTime = BigInt(market[2]);
        const state = Number(market[4]); // 0 Open, 1 Closed, 2 Resolved, 3 Canceled
        const now = BigInt(Math.floor(Date.now() / 1000));

        if (state !== 0) throw new Error("El mercado no está abierto");
        if (now >= closeTime) throw new Error("El mercado está cerrado para nuevas apuestas");
      } catch (e: any) {
        const msg = String(e?.message ?? "");
        // si es un error “nuestro” (de validación), frenamos.
        // si es un error de RPC (timeout, cannot read, etc), seguimos.
        if (
          msg.includes("mercado no está abierto") ||
          msg.includes("mercado está cerrado")
        ) {
          throw new Error(msg);
        }
      }

      // ✅ allowance/balance (best-effort)
      try {
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
      } catch (e: any) {
        const msg = String(e?.message ?? "");
        // si es un error de UX nuestro, frenamos. Si es RPC, seguimos.
        if (msg.includes("Aprobación de USDC insuficiente") || msg.includes("Saldo de USDC insuficiente")) {
          throw new Error(msg);
        }
      }

      // ✅ send tx
      try {
        const tx = await betterPlay.bet(marketId, outcome, amount);
        const rec = await tx.wait();

        // ✅ detectar quién fue el user real del BetPlaced (para AA/Beexo)
        try {
          let betSender: string | null = null;

          for (const log of rec?.logs ?? []) {
            try {
              const parsed = betterPlay.interface.parseLog({
                topics: log.topics as string[],
                data: log.data as string,
              });

              if (parsed?.name === "BetPlaced") {
                // event BetPlaced(uint256 indexed id, address indexed user, uint8 outcome, uint256 amount)
                betSender =
                  (parsed.args?.user as string | undefined) ??
                  (parsed.args?.[1] as string | undefined) ??
                  null;
                break;
              }
            } catch {
              // ignore parse errors
            }
          }

          // fallback al sender si no lo pudimos parsear
          if (!betSender) betSender = String(sender);

          if (betSender && typeof window !== "undefined") {
            window.localStorage.setItem(`bp:lastBetSender:${marketId.toString()}`, betSender);
          }
        } catch {
          // ignore
        }

        return (rec?.hash ?? tx.hash) as Hash as string;
      } catch (e) {
        throw new Error(prettyEthersError(e));
      }
    },

    onMutate: () => ({ toastId: toast.loading("Enviando apuesta…") }),

    onSuccess: (_hash, vars, ctx) => {
      toast.success("¡Apuesta hecha! ✅", { id: ctx?.toastId });

      // refrescos básicos
      qc.invalidateQueries({ queryKey: qk.betterPlay.market(vars.marketId) });
      qc.invalidateQueries({ queryKey: qk.betterPlay.pools(vars.marketId) });
      qc.invalidateQueries({ queryKey: qk.betterPlay.per1(vars.marketId, vars.outcome) });
      qc.invalidateQueries({ queryKey: ["usdc", "balanceOf"] });
      qc.invalidateQueries({ queryKey: ["usdc", "allowance"] });

      // refrescar stakes/claim (para cualquier address)
      const mid = vars.marketId.toString();
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey;
          return (
            Array.isArray(k) &&
            k.length >= 3 &&
            k[0] === "betterPlay" &&
            (k[1] === "userStakes" || k[1] === "claimState" || k[1] === "claimed") &&
            String(k[2]) === mid
          );
        },
      });
    },

    onError: (err, _vars, ctx) =>
      toast.error(err.message || "No pudimos procesar tu apuesta", { id: ctx?.toastId }),
  });
}


/* =======================
   Claim (read + write)
   ======================= */

const DEFAULT_FROM_BLOCK = Number(import.meta.env?.VITE_BETTERPLAY_DEPLOY_BLOCK ?? 0);

export function useUserStakes(marketId?: bigint, user?: Address) {
  const { contracts } = useContracts();
  const enabled = !!marketId && marketId !== 0n;

  return useQuery({
    queryKey: ["betterPlay", "userStakes", keyId(marketId), user ?? "auto"] as const,
    enabled,
    queryFn: async () => {
      if (!marketId) throw new Error("market not ready");
      const { betterPlay, connectedAddress, signer } = await contracts();

      // armamos candidatos: user explícito > connectedAddress > signer.getAddress()
      const candidates: Address[] = [];
      const push = (a?: any) => {
        if (typeof a === "string" && /^0x[a-fA-F0-9]{40}$/.test(a)) candidates.push(a as Address);
      };

      push(user);
      push(connectedAddress);

      try {
        const s = await (signer as any)?.getAddress?.();
        push(s);
      } catch {
        // ignore
      }

      // unique (case-insensitive)
      const uniq: Address[] = [];
      const seen = new Set<string>();
      for (const a of candidates) {
        const k = a.toLowerCase();
        if (!seen.has(k)) {
          seen.add(k);
          uniq.push(a);
        }
      }

      if (uniq.length === 0) {
        return { home: 0n, draw: 0n, away: 0n, user: undefined as Address | undefined };
      }

      // probamos todas y elegimos la que tenga mayor total stake
      let best = { home: 0n, draw: 0n, away: 0n, user: uniq[0] as Address };
      let bestTotal = 0n;

      for (const addr of uniq) {
        try {
          const res = (await betterPlay.userStakes(marketId, addr)) as readonly [
            bigint,
            bigint,
            bigint
          ];
          const home = res[0];
          const draw = res[1];
          const away = res[2];
          const total = home + draw + away;

          if (total > bestTotal) {
            bestTotal = total;
            best = { home, draw, away, user: addr };
          }
        } catch {
          // si falla para un addr, seguimos con el resto
        }
      }

      return best;
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

export function useMarketClaimState(
  marketId?: bigint,
  opts?: { user?: Address; fromBlock?: number }
) {
  const { contracts } = useContracts();
  const { data: connected } = useConnectedAccount();

  const user = (opts?.user ?? connected) as Address | undefined;
  const enabled = !!marketId && marketId !== 0n && !!user;

  return useQuery({
    queryKey: qk.betterPlay.claimState(marketId, user),
    enabled,
    queryFn: async () => {
      if (!marketId || !user) throw new Error("args not ready");

      const { betterPlay } = await contracts();

      const [marketRaw, poolsRaw, stakesRaw] = (await Promise.all([
        betterPlay.getMarket(marketId),
        betterPlay.pools(marketId),
        betterPlay.userStakes(marketId, user),
      ])) as [readonly any[], readonly [bigint, bigint, bigint], readonly [bigint, bigint, bigint]];

      const market = {
        feeBps: BigInt(marketRaw[1]),
        closeTime: BigInt(marketRaw[2]),
        state: Number(marketRaw[4]),
        winningOutcome: Number(marketRaw[5]),
        totalStaked: BigInt(marketRaw[6]),
      };

      const stakes = { home: stakesRaw[0], draw: stakesRaw[1], away: stakesRaw[2] };
      const stakedTotal = stakes.home + stakes.draw + stakes.away;
      const isFinalOnchain = market.state === 2 || market.state === 3;

      // hasClaimed (best effort)
      let alreadyClaimed = false;
      try {
        const fromBlock = opts?.fromBlock ?? DEFAULT_FROM_BLOCK;
        const filter = betterPlay.filters.Claimed(marketId, user);
        const logs = await betterPlay.queryFilter(filter, fromBlock, "latest");
        alreadyClaimed = logs.length > 0;
      } catch {
        alreadyClaimed = false;
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
        };
      }

      const { claimable, reason } = computeClaimable({
        state: market.state,
        winningOutcome: market.winningOutcome,
        feeBps: market.feeBps,
        totalStaked: market.totalStaked,
        pools: poolsRaw,
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

/* =======================
   Batch summary
   ======================= */

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

      const map: Record<string, MarketSummary> = {};
      for (const r of rows) map[r.id.toString()] = r;
      return map;
    },
    staleTime: 15_000,
  });
}

export function useMarketData(marketId: bigint) {
  const poolsQuery = usePools(marketId)
  const marketQuery = useGetMarket(marketId)
  
  // Calcular odds desde los pools
  const pools = poolsQuery.data
  const marketInfo = marketQuery.data
  
  let odds = { home: 1.0, draw: 1.0, away: 1.0 }
  
  if (pools && marketInfo && marketInfo.totalStaked > 0n) {
    const [home, draw, away] = pools
    const { totalStaked, feeBps } = marketInfo
    
    const calculateOdds = (winnerPool: bigint) => {
      if (winnerPool === 0n) return 1.0
      
      const loserPool = totalStaked - winnerPool
      const netLosers = (loserPool * (10000n - feeBps)) / 10000n
      
      // Convertir a float (asumiendo 6 decimals USDC)
      const netLosersFloat = Number(netLosers) / 1e6
      const winnerPoolFloat = Number(winnerPool) / 1e6
      
      return 1 + (netLosersFloat / winnerPoolFloat)
    }
    
    odds = {
      home: calculateOdds(home),
      draw: calculateOdds(draw),
      away: calculateOdds(away),
    }
  }
  
  return {
    pools: pools ? { home: pools[0], draw: pools[1], away: pools[2] } : { home: 0n, draw: 0n, away: 0n },
    marketInfo,
    odds,
    isLoading: poolsQuery.isLoading || marketQuery.isLoading,
    refetch: () => {
      poolsQuery.refetch()
      marketQuery.refetch()
    },
  }
}
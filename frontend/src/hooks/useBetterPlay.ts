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

const keyId = (id?: bigint) => (typeof id === "bigint" ? id.toString() : id ?? null);

export const qk = {
  usdc: {
    decimals: ["usdc", "decimals"] as const,
    balanceOf: (owner?: Address) => ["usdc", "balanceOf", owner ?? null] as const,
    allowance: (owner?: Address, spender?: Address) => ["usdc", "allowance", owner ?? null, spender ?? null] as const,
  },
  betterPlay: {
    pools: (id?: bigint) => ["betterPlay", "pools", keyId(id)] as const,
    per1: (id?: bigint, outcome?: 0 | 1 | 2) => ["betterPlay", "per1", keyId(id), outcome ?? null] as const,
    market: (id?: bigint) => ["betterPlay", "market", keyId(id)] as const,
  },
  meta: {
    connected: ["connectedAddress"] as const,
    contracts: ["__contracts__"] as const,
  },
};

/* =======================
   Helpers de UX / Errores
   ======================= */

function formatAmount(n: bigint, decimals = 6) {
  // Formatea amounts en base 10^decimals (por defecto USDC 6)
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

  // Usuario canceló
  if (e?.code === 4001 || lower.includes("user denied") || lower.includes("user rejected")) {
    return "Transacción rechazada por el usuario";
  }

  // Sin MATIC para gas
  if (lower.includes("insufficient funds for gas") || lower.includes("insufficient funds for intrinsic transaction cost")) {
    return "No tenés suficiente MATIC para pagar el gas en esta red";
  }

  // Reverts típicos de ERC20
  if (lower.includes("insufficient allowance")) {
    return "Aprobación de USDC insuficiente";
  }
  if (lower.includes("transfer amount exceeds balance") || lower.includes("insufficient balance")) {
    return "Saldo de USDC insuficiente";
  }

  // Call exception / revert genérico
  if (e?.code === "CALL_EXCEPTION" || lower.includes("execution reverted")) {
    return "La transacción fue revertida por el contrato";
  }

  return msg || "Ocurrió un error al enviar la transacción";
}

/* =======================
   Meta
   ======================= */

/** Dirección conectada (del signer actual) */
export function useConnectedAccount() {
  const { contracts } = useContracts();
  return useQuery({
    queryKey: qk.meta.connected,
    queryFn: async () => {
      const { connectedAddress } = await contracts();
      return connectedAddress as Address;
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
      const bal = (await usdc.balanceOf(owner)) as bigint;
      return bal;
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
      const allow = (await usdc.allowance(owner, _spender)) as bigint;
      return allow;
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
      const res = (await betterPlay.pools(marketId)) as readonly [bigint, bigint, bigint];
      return res;
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
      const per1 = (await betterPlay.previewPayoutPer1(marketId, outcome)) as bigint;
      return per1;
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
   Helpers de Approval
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
      const amt = parseUnits(amountInput, decimals);
      return { amount: amt, error: null };
    } catch {
      return { amount: null, error: "Monto inválido" };
    }
  }, [amountInput, decimals]);

  const needsApproval =
    !!parsed.amount && typeof allowance === "bigint" ? allowance < parsed.amount : false;

  return { amount: parsed.amount, error: parsed.error, needsApproval, decimals, allowance };
}

/* =======================
   Writes (ethers Contracts)
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
    onMutate: () => {
      const toastId = toast.loading("Aprobando USDC…");
      return { toastId };
    },
    onSuccess: (_hash, _amount, ctx) => {
      toast.success("Aprobación exitosa ✅", { id: ctx?.toastId });
      qc.invalidateQueries({ queryKey: ["usdc", "allowance"] });
      qc.invalidateQueries({ queryKey: ["usdc", "balanceOf"] });
    },
    onError: (err, _vars, ctx) => {
      toast.error(err.message || "Fallo la aprobación", { id: ctx?.toastId });
    },
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
      const { betterPlay, usdc, betterPlayAddress, connectedAddress } = await contracts();

      // === Pre-checks para UX
      // Market state
      const market = (await betterPlay.getMarket(marketId)) as readonly any[];
      const closeTime = BigInt(market[2]);
      const now = BigInt(Math.floor(Date.now() / 1000));
      if (now >= closeTime) {
        throw new Error("El mercado está cerrado para nuevas apuestas");
      }

      // Allowance & Balance
      const [balance, allowance] = (await Promise.all([
        usdc.balanceOf(connectedAddress),
        usdc.allowance(connectedAddress, betterPlayAddress),
      ])) as [bigint, bigint];

      if (allowance < amount) {
        throw new Error("Aprobación de USDC insuficiente");
      }
      if (balance < amount) {
        throw new Error(
          `Saldo de USDC insuficiente (tenés ${formatAmount(balance)} y necesitás ${formatAmount(amount)})`
        );
      }

      // === Tx
      try {
        const tx = await betterPlay.bet(marketId, outcome, amount);
        const rec = await tx.wait();
        return (rec?.hash ?? tx.hash) as Hash as string;
      } catch (e) {
        throw new Error(prettyEthersError(e));
      }
    },
    onMutate: () => {
      const toastId = toast.loading("Enviando apuesta…");
      return { toastId };
    },
    onSuccess: (_hash, vars, ctx) => {
      toast.success("¡Apuesta hecha! ✅", { id: ctx?.toastId });
      qc.invalidateQueries({ queryKey: qk.betterPlay.pools(vars.marketId) });
      qc.invalidateQueries({ queryKey: qk.betterPlay.per1(vars.marketId, vars.outcome) });
      qc.invalidateQueries({ queryKey: ["usdc", "balanceOf"] });
      qc.invalidateQueries({ queryKey: ["usdc", "allowance"] });
    },
    onError: (err, _vars, ctx) => {
      toast.error(err.message || "No pudimos procesar tu apuesta", { id: ctx?.toastId });
    },
  });
}

export function useClaim() {
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
    onMutate: () => {
      const toastId = toast.loading("Reclamando…");
      return { toastId };
    },
    onSuccess: (_hash, _marketId, ctx) => {
      toast.success("Reclamo exitoso ✅", { id: ctx?.toastId });
    },
    onError: (err, _vars, ctx) => {
      toast.error(err.message || "El reclamo falló", { id: ctx?.toastId });
    },
  });
}

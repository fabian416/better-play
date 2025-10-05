// src/hooks/useBetterPlay.ts
"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address, Hash } from "viem";
import { parseUnits } from "viem";
import { toast } from "react-hot-toast";
import { useContracts } from "~~/providers/contracts-context";

/** Query keys */
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

/** Dirección conectada (del signer actual) */
export function useConnectedAccount() {
  const { contracts } = useContracts();
  return useQuery({
    queryKey: qk.meta.connected,
    queryFn: async () => {
      const { connectedAddress } = await contracts();
      return connectedAddress as Address;
    },
    // Se puede refrescar cuando cambie la cuenta
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
      // retorna [pool0, pool1, pool2]
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
      // esperado: [stakeToken, feeBps, closeTime, metadataURI, state, winningOutcome, totalStaked]
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
      return { amount: null, error: "Invalid amount" };
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
      const tx = await usdc.approve(betterPlayAddress, amount);
      const rec = await tx.wait();
      return (rec?.hash ?? tx.hash) as Hash as string;
    },
    onMutate: () => {
      const toastId = toast.loading("Approving USDC…");
      return { toastId };
    },
    onSuccess: (_hash, _amount, ctx) => {
      toast.success("Approval successful ✅", { id: ctx?.toastId });
      // invalidar allowances y balances de forma amplia (prefijo)
      qc.invalidateQueries({ queryKey: ["usdc", "allowance"] });
      qc.invalidateQueries({ queryKey: ["usdc", "balanceOf"] });
    },
    onError: (err, _vars, ctx) => {
      toast.error(err.message || "Approval failed", { id: ctx?.toastId });
    },
  });
}

export function useBet() {
  const qc = useQueryClient();
  const { contracts } = useContracts();

  return useMutation<string, Error, { marketId: bigint; outcome: 0 | 1 | 2; amount: bigint }, { toastId: string }>(
    {
      mutationFn: async ({ marketId, outcome, amount }) => {
        const { betterPlay } = await contracts();
        const tx = await betterPlay.bet(marketId, outcome, amount);
        const rec = await tx.wait();
        return (rec?.hash ?? tx.hash) as Hash as string;
      },
      onMutate: () => {
        const toastId = toast.loading("Placing bet…");
        return { toastId };
      },
      onSuccess: (_hash, vars, ctx) => {
        toast.success("Bet placed ✅", { id: ctx?.toastId });
        qc.invalidateQueries({ queryKey: qk.betterPlay.pools(vars.marketId) });
        qc.invalidateQueries({ queryKey: qk.betterPlay.per1(vars.marketId, vars.outcome) });
        qc.invalidateQueries({ queryKey: ["usdc", "balanceOf"] });
        qc.invalidateQueries({ queryKey: ["usdc", "allowance"] });
      },
      onError: (err, _vars, ctx) => {
        toast.error(err.message || "Bet failed", { id: ctx?.toastId });
      },
    }
  );
}

export function useClaim() {
  const { contracts } = useContracts();

  return useMutation<string, Error, bigint, { toastId: string }>({
    mutationFn: async (marketId: bigint) => {
      const { betterPlay } = await contracts();
      const tx = await betterPlay.claim(marketId);
      const rec = await tx.wait();
      return (rec?.hash ?? tx.hash) as Hash as string;
    },
    onMutate: () => {
      const toastId = toast.loading("Claiming…");
      return { toastId };
    },
    onSuccess: (_hash, _marketId, ctx) => {
      toast.success("Claim successful ✅", { id: ctx?.toastId });
    },
    onError: (err, _vars, ctx) => {
      toast.error(err.message || "Claim failed", { id: ctx?.toastId });
    },
  });
}

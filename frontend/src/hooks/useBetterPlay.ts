"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parseUnits, type Address, type Hash, type Abi } from "viem";
import { useContracts } from "~~/providers/contracts-context";
import { BETTER_PLAY_ABI } from "~~/contracts/betterplay-abi";
import { ERC20_ABI } from "~~/contracts/erc20-abi";
import { toast } from "react-hot-toast";

const asAbi = (x: readonly unknown[]) => x as unknown as Abi;

const CLAIM_ABI = [
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [{ name: "id", type: "uint256" }], outputs: [] },
] as const;

const keyId = (id?: bigint) => (typeof id === "bigint" ? id.toString() : id ?? null);

const qk = {
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
};

/* ===== Reads (same as antes, con enabled guards) ===== */

export function useUsdcDecimals() {
  const { publicClient, address: addrs } = useContracts();
  return useQuery({
    queryKey: qk.usdc.decimals,
    enabled: !!publicClient,
    queryFn: async () => {
      if (!publicClient) throw new Error("RPC not ready");
      return (await publicClient.readContract({
        address: addrs.usdc,
        abi: asAbi(ERC20_ABI),
        functionName: "decimals",
        args: [],
      })) as number;
    },
    staleTime: Infinity,
  });
}

export function useUsdcBalance(owner?: Address) {
  const { publicClient, address: addrs } = useContracts();
  return useQuery({
    queryKey: qk.usdc.balanceOf(owner),
    enabled: !!publicClient && !!owner,
    queryFn: async () => {
      if (!publicClient || !owner) throw new Error("RPC/account not ready");
      return (await publicClient.readContract({
        address: addrs.usdc,
        abi: asAbi(ERC20_ABI),
        functionName: "balanceOf",
        args: [owner],
      })) as bigint;
    },
  });
}

export function useUsdcAllowance(owner?: Address, spender?: Address) {
  const { publicClient, address: addrs } = useContracts();
  const _spender = (spender ?? addrs.betterPlay) as Address;
  return useQuery({
    queryKey: qk.usdc.allowance(owner, _spender),
    enabled: !!publicClient && !!owner,
    queryFn: async () => {
      if (!publicClient || !owner) throw new Error("RPC/account not ready");
      return (await publicClient.readContract({
        address: addrs.usdc,
        abi: asAbi(ERC20_ABI),
        functionName: "allowance",
        args: [owner, _spender],
      })) as bigint;
    },
  });
}

export function usePools(marketId?: bigint) {
  const { publicClient, address: addrs } = useContracts();
  const enabled = !!publicClient && !!marketId && marketId !== 0n;
  return useQuery({
    queryKey: qk.betterPlay.pools(marketId),
    enabled,
    queryFn: async () => {
      if (!publicClient || !marketId) throw new Error("RPC/market not ready");
      return (await publicClient.readContract({
        address: addrs.betterPlay,
        abi: asAbi(BETTER_PLAY_ABI),
        functionName: "pools",
        args: [marketId],
      })) as readonly [bigint, bigint, bigint];
    },
  });
}

export function usePreviewPayoutPer1(marketId?: bigint, outcome?: 0 | 1 | 2) {
  const { publicClient, address: addrs } = useContracts();
  const enabled = !!publicClient && !!marketId && marketId !== 0n && outcome !== undefined;
  return useQuery({
    queryKey: qk.betterPlay.per1(marketId, outcome),
    enabled,
    queryFn: async () => {
      if (!publicClient || !marketId || outcome === undefined) throw new Error("RPC/args not ready");
      return (await publicClient.readContract({
        address: addrs.betterPlay,
        abi: asAbi(BETTER_PLAY_ABI),
        functionName: "previewPayoutPer1",
        args: [marketId, outcome],
      })) as bigint;
    },
  });
}

export function useGetMarket(marketId?: bigint) {
  const { publicClient, address: addrs } = useContracts();
  const enabled = !!publicClient && !!marketId && marketId !== 0n;
  return useQuery({
    queryKey: qk.betterPlay.market(marketId),
    enabled,
    queryFn: async () => {
      if (!publicClient || !marketId) throw new Error("RPC/market not ready");
      const res = (await publicClient.readContract({
        address: addrs.betterPlay,
        abi: asAbi(BETTER_PLAY_ABI),
        functionName: "getMarket",
        args: [marketId],
      })) as readonly [Address, bigint, bigint, string, number, number, bigint];
      return {
        stakeToken: res[0],
        feeBps: res[1],
        closeTime: res[2],
        metadataURI: res[3],
        state: res[4],
        winningOutcome: res[5],
        totalStaked: res[6],
      };
    },
  });
}

/* ===== Helpers ===== */

export function useApprovalStatus(amountInput: string) {
  const { address: addrs, account } = useContracts();
  const { data: decimals } = useUsdcDecimals();
  const { data: allowance } = useUsdcAllowance(account as Address | undefined, addrs.betterPlay);

  const parsed = useMemo(() => {
    if (!amountInput || !decimals) return { amount: null as bigint | null, error: null as string | null };
    try {
      const amt = parseUnits(amountInput, decimals);
      return { amount: amt, error: null };
    } catch {
      return { amount: null, error: "Invalid amount" };
    }
  }, [amountInput, decimals]);

  const needsApproval = !!parsed.amount && typeof allowance === "bigint" ? allowance < parsed.amount : false;
  return { amount: parsed.amount, error: parsed.error, needsApproval, decimals, allowance };
}

/* ===== Writes with toast ===== */

export function useApprove() {
  const qc = useQueryClient();
  const { walletClient, publicClient, address: addrs, account } = useContracts();

  return useMutation<Hash, Error, bigint, { toastId: string }>({
    mutationFn: async (amount: bigint) => {
      if (!walletClient || !account) throw new Error("Wallet not connected");
      if (!publicClient) throw new Error("RPC not ready");
      const hash = (await walletClient.writeContract({
        chain: undefined,
        account,
        address: addrs.usdc,
        abi: asAbi(ERC20_ABI),
        functionName: "approve",
        args: [addrs.betterPlay, amount],
      })) as Hash;
      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    onMutate: () => {
      const toastId = toast.loading("Approving USDC…");
      return { toastId };
    },
    onSuccess: (_hash, _amount, ctx) => {
      toast.success("Approval successful ✅", { id: ctx?.toastId });
      qc.invalidateQueries({ queryKey: qk.usdc.allowance(account as Address | undefined, addrs.betterPlay as Address) });
    },
    onError: (err, _vars, ctx) => {
      toast.error(err.message || "Approval failed", { id: ctx?.toastId });
    },
  });
}

export function useBet() {
  const qc = useQueryClient();
  const { walletClient, publicClient, address: addrs, account } = useContracts();

  return useMutation<Hash, Error, { marketId: bigint; outcome: 0 | 1 | 2; amount: bigint }, { toastId: string }>({
    mutationFn: async (vars) => {
      if (!walletClient || !account) throw new Error("Wallet not connected");
      if (!publicClient) throw new Error("RPC not ready");
      const hash = (await walletClient.writeContract({
        chain: undefined,
        account,
        address: addrs.betterPlay,
        abi: asAbi(BETTER_PLAY_ABI),
        functionName: "bet",
        args: [vars.marketId, vars.outcome, vars.amount],
      })) as Hash;
      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    onMutate: () => {
      const toastId = toast.loading("Placing bet…");
      return { toastId };
    },
    onSuccess: (_hash, vars, ctx) => {
      toast.success("Bet placed ✅", { id: ctx?.toastId });
      qc.invalidateQueries({ queryKey: qk.betterPlay.pools(vars.marketId) });
      qc.invalidateQueries({ queryKey: qk.betterPlay.per1(vars.marketId, vars.outcome) });
      qc.invalidateQueries({ queryKey: qk.usdc.balanceOf(account as Address | undefined) });
      qc.invalidateQueries({ queryKey: qk.usdc.allowance(account as Address | undefined, addrs.betterPlay as Address) });
    },
    onError: (err, _vars, ctx) => {
      toast.error(err.message || "Bet failed", { id: ctx?.toastId });
    },
  });
}

export function useClaim() {
  const { walletClient, publicClient, address: addrs, account } = useContracts();

  return useMutation<Hash, Error, bigint, { toastId: string }>({
    mutationFn: async (marketId: bigint) => {
      if (!walletClient || !account) throw new Error("Wallet not connected");
      if (!publicClient) throw new Error("RPC not ready");
      const hash = (await walletClient.writeContract({
        chain: undefined,
        account,
        address: addrs.betterPlay,
        abi: asAbi(CLAIM_ABI),
        functionName: "claim",
        args: [marketId],
      })) as Hash;
      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
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

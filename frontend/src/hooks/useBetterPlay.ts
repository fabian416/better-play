"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import {
  parseUnits,
  type Address,
  type Hash,
  type Abi,
} from "viem";
import { useContracts } from "~~/providers/ContractsContext";
import { BETTER_PLAY_ABI } from "~~/contracts/betterplay-abi";
import { ERC20_ABI } from "~~/contracts/erc20-abi";

/** Cast helper (no modificamos tus ABIs) */
const asAbi = (x: readonly unknown[]) => x as unknown as Abi;

/** ABI mínimo SOLO para claim (tu ABI principal no lo trae) */
const CLAIM_ABI = [
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
] as const;

/* ----------------------------- Query Keys ----------------------------- */
const qk = {
  usdc: {
    decimals: ["usdc", "decimals"] as const,
    balanceOf: (owner?: Address) => ["usdc", "balanceOf", owner] as const,
    allowance: (owner?: Address, spender?: Address) =>
      ["usdc", "allowance", owner, spender] as const,
  },
  betterPlay: {
    pools: (id?: bigint) => ["betterPlay", "pools", id] as const,
    per1: (id?: bigint, outcome?: number) => ["betterPlay", "per1", id, outcome] as const,
    market: (id?: bigint) => ["betterPlay", "market", id] as const,
  },
};

/* ------------------------------ READ HOOKS ---------------------------- */

export function useUsdcDecimals() {
  const { publicClient, address: addrs } = useContracts();
  return useQuery({
    queryKey: qk.usdc.decimals,
    queryFn: async () => {
      const v = await publicClient.readContract({
        address: addrs.usdc,
        abi: asAbi(ERC20_ABI),
        functionName: "decimals",
        args: [],
      });
      return v as number;
    },
    staleTime: Infinity,
  });
}

export function useUsdcBalance(owner?: Address) {
  const { publicClient, address: addrs } = useContracts();
  return useQuery({
    queryKey: qk.usdc.balanceOf(owner),
    enabled: !!owner,
    queryFn: async () => {
      const v = await publicClient.readContract({
        address: addrs.usdc,
        abi: asAbi(ERC20_ABI),
        functionName: "balanceOf",
        args: [owner!],
      });
      return v as bigint;
    },
  });
}

export function useUsdcAllowance(owner?: Address, spender?: Address) {
  const { publicClient, address: addrs } = useContracts();
  const _spender = (spender ?? addrs.betterPlay) as Address;
  return useQuery({
    queryKey: qk.usdc.allowance(owner, _spender),
    enabled: !!owner,
    queryFn: async () => {
      const v = await publicClient.readContract({
        address: addrs.usdc,
        abi: asAbi(ERC20_ABI),
        functionName: "allowance",
        args: [owner!, _spender],
      });
      return v as bigint;
    },
  });
}

export function usePools(marketId?: bigint) {
  const { publicClient, address: addrs } = useContracts();
  return useQuery({
    queryKey: qk.betterPlay.pools(marketId),
    enabled: !!marketId && marketId !== 0n,
    queryFn: async () => {
      const v = await publicClient.readContract({
        address: addrs.betterPlay,
        abi: asAbi(BETTER_PLAY_ABI),
        functionName: "pools",
        args: [marketId!],
      });
      return v as readonly [bigint, bigint, bigint];
    },
  });
}

export function usePreviewPayoutPer1(marketId?: bigint, outcome?: 0 | 1 | 2) {
  const { publicClient, address: addrs } = useContracts();
  const enabled = !!marketId && marketId !== 0n && outcome !== undefined;
  return useQuery({
    queryKey: qk.betterPlay.per1(marketId, outcome),
    enabled,
    queryFn: async () => {
      const v = await publicClient.readContract({
        address: addrs.betterPlay,
        abi: asAbi(BETTER_PLAY_ABI),
        functionName: "previewPayoutPer1",
        args: [marketId!, outcome!],
      });
      return v as bigint; // 1e18-scaled multiplier
    },
  });
}

export function useGetMarket(marketId?: bigint) {
  const { publicClient, address: addrs } = useContracts();
  return useQuery({
    queryKey: qk.betterPlay.market(marketId),
    enabled: !!marketId && marketId !== 0n,
    queryFn: async () => {
      const res = (await publicClient.readContract({
        address: addrs.betterPlay,
        abi: asAbi(BETTER_PLAY_ABI),
        functionName: "getMarket",
        args: [marketId!],
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

/* ----------------------- APPROVAL STATUS HELPER ----------------------- */
export function useApprovalStatus(amountInput: string) {
  const { address: addrs } = useContracts();
  const { address: owner } = useAccount();
  const { data: decimals } = useUsdcDecimals();
  const { data: allowance } = useUsdcAllowance(owner as Address | undefined, addrs.betterPlay);

  const parsed = useMemo(() => {
    if (!amountInput || !decimals)
      return { amount: null as bigint | null, error: null as string | null };
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

/* --------------------------- WRITE HOOKS ------------------------------ */
/** Nota: viem v2 pide `chain` en writeContract. Pasamos `chain: undefined` y listo. */

export function useApprove() {
  const qc = useQueryClient();
  const { walletClient, publicClient, address: addrs } = useContracts();
  const { address: owner } = useAccount();

  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!walletClient || !owner) throw new Error("Wallet not connected.");

      const hash = (await walletClient.writeContract({
        chain: undefined,
        account: owner,
        address: addrs.usdc,
        abi: asAbi(ERC20_ABI),
        functionName: "approve",
        args: [addrs.betterPlay, amount],
      })) as Hash;

      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: qk.usdc.allowance(owner as Address | undefined, addrs.betterPlay as Address),
      });
    },
  });
}

export function useBet() {
  const qc = useQueryClient();
  const { walletClient, publicClient, address: addrs } = useContracts();
  const { address: owner } = useAccount();

  return useMutation({
    mutationFn: async (vars: { marketId: bigint; outcome: 0 | 1 | 2; amount: bigint }) => {
      if (!walletClient || !owner) throw new Error("Wallet not connected.");

      const hash = (await walletClient.writeContract({
        chain: undefined,
        account: owner,
        address: addrs.betterPlay,
        abi: asAbi(BETTER_PLAY_ABI),
        functionName: "bet",
        args: [vars.marketId, vars.outcome, vars.amount],
      })) as Hash;

      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    onSuccess: (_hash, vars) => {
      qc.invalidateQueries({ queryKey: qk.betterPlay.pools(vars.marketId) });
      qc.invalidateQueries({ queryKey: qk.betterPlay.per1(vars.marketId, vars.outcome) });
      qc.invalidateQueries({ queryKey: qk.usdc.balanceOf(owner as Address | undefined) });
      qc.invalidateQueries({
        queryKey: qk.usdc.allowance(owner as Address | undefined, addrs.betterPlay as Address),
      });
    },
  });
}

export function useClaim() {
  const { walletClient, publicClient, address: addrs } = useContracts();
  const { address: owner } = useAccount();

  return useMutation({
    mutationFn: async (marketId: bigint) => {
      if (!walletClient || !owner) throw new Error("Wallet not connected.");

      const hash = (await walletClient.writeContract({
        chain: undefined,
        account: owner,
        address: addrs.betterPlay,
        abi: asAbi(CLAIM_ABI), // ABI mínimo local para claim
        functionName: "claim",
        args: [marketId],
      })) as Hash;

      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
  });
}

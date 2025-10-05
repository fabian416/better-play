"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import type { Abi, Address, Hash } from "viem";
import { ERC20_ABI } from "~~/contracts/erc20-abi";
import { useContracts } from "~~/providers/contracts-context";

const asAbi = (x: readonly unknown[]) => x as unknown as Abi;

export function useMintUsdc() {
  const qc = useQueryClient();
  const { walletClient, publicClient, address: addrs } = useContracts();
  const { address: owner } = useAccount();

  return useMutation({
    mutationFn: async (amountWhole: bigint) => {
      if (!walletClient || !owner) throw new Error("Wallet not connected.");

      const hash = (await walletClient.writeContract({
        chain: undefined,
        account: owner,
        address: addrs.usdc,
        abi: asAbi(ERC20_ABI),
        functionName: "mint",
        args: [amountWhole],
      })) as Hash;

      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["usdc", "balanceOf", owner as Address],
      });
    },
  });
}

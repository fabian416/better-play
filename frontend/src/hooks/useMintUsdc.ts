"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Abi, Address, Hash } from "viem";
import { useContracts } from "~~/providers/contracts-context";
import { ERC20_ABI } from "~~/contracts/erc20-abi";

const asAbi = (x: readonly unknown[]) => x as unknown as Abi;

/**
 * Mint test USDC on dev/test networks.
 * Expects a token with `function mint(uint256 amount)` (no `to` param).
 */
export function useMintUsdc() {
  const qc = useQueryClient();
  const { walletClient, publicClient, address: addrs, account } = useContracts();

  return useMutation<Hash, Error, bigint>({
    mutationFn: async (amountWhole: bigint) => {
      // Guards to avoid calling before providers are ready
      if (!walletClient || !account) throw new Error("Wallet not connected");
      if (!publicClient) throw new Error("RPC not ready");

      const hash = (await walletClient.writeContract({
        chain: undefined,
        account,
        address: addrs.usdc,
        abi: asAbi(ERC20_ABI),
        functionName: "mint",
        args: [amountWhole],
      })) as Hash;

      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    onSuccess: () => {
      // Invalidate USDC balance for the connected account
      qc.invalidateQueries({ queryKey: ["usdc", "balanceOf", account as Address] });
    },
  });
}

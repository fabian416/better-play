"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Abi, Address, Hash } from "viem";
import { useContracts } from "~~/providers/contracts-context";
import { ERC20_ABI } from "~~/contracts/erc20-abi";
import { toast } from "react-hot-toast";

const asAbi = (x: readonly unknown[]) => x as unknown as Abi;

/**
 * Mint test USDC on dev/test networks.
 * Expects `function mint(uint256 amount)`.
 */
export function useMintUsdc() {
  const qc = useQueryClient();
  const { walletClient, publicClient, address: addrs, account } = useContracts();

  return useMutation<Hash, Error, bigint, { toastId: string }>({
    mutationFn: async (amountWhole: bigint) => {
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
    onMutate: (amountWhole) => {
      const toastId = toast.loading(`Minting USDC…`);
      return { toastId };
    },
    onSuccess: (_hash, _amountWhole, ctx) => {
      toast.success("Mint successful ✅", { id: ctx?.toastId });
      qc.invalidateQueries({ queryKey: ["usdc", "balanceOf", account as Address] });
    },
    onError: (err, _vars, ctx) => {
      toast.error(err.message || "Mint failed", { id: ctx?.toastId });
    },
  });
}

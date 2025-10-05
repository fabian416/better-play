// src/hooks/useMintUsdc.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address, Hash } from "viem";
import { toast } from "react-hot-toast";
import { useContracts } from "~~/providers/contracts-context";
import { qk } from "~~/hooks/useBetterPlay"; // reutilizo keys para invalidar

/**
 * Mint de USDC en redes de test:
 * Requiere que el contrato tenga `function mint(uint256 amount)`.
 */
export function useMintUsdc() {
  const qc = useQueryClient();
  const { contracts } = useContracts();

  return useMutation<string, Error, bigint, { toastId: string }>({
    mutationFn: async (amountWhole: bigint) => {
      const { usdc } = await contracts();
      const tx = await usdc.mint(amountWhole);
      const rec = await tx.wait();
      return (rec?.hash ?? tx.hash) as Hash as string;
    },
    onMutate: () => {
      const toastId = toast.loading("Minting USDC…");
      return { toastId };
    },
    onSuccess: (_hash, _amountWhole, ctx) => {
      toast.success("Mint successful ✅", { id: ctx?.toastId });
      // Invalidar todos los balances de USDC (prefijo)
      qc.invalidateQueries({ queryKey: ["usdc", "balanceOf"] });
      // (opcional) invalidar allowance por si tu UI lo muestra post-mint
      qc.invalidateQueries({ queryKey: ["usdc", "allowance"] });
    },
    onError: (err, _vars, ctx) => {
      toast.error(err.message || "Mint failed", { id: ctx?.toastId });
    },
  });
}

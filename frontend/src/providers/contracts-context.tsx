"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import type { Address, PublicClient, WalletClient } from "viem";
import { getContract } from "viem";
import { BETTER_PLAY_ABI } from "~~/contracts/betterplay-abi";
import { ERC20_ABI } from "~~/contracts/erc20-abi";
import { BETTER_PLAY_ADDRESS, USDC_ADDRESS, CHAIN_ID } from "~~/lib/constants";

type ContractsContextType = {
  chainId: number;
  account?: Address;
  publicClient: PublicClient;
  walletClient?: WalletClient;

  address: {
    betterPlay: Address;
    usdc: Address;
  };

  contracts: {
    read: {
      betterPlay: ReturnType<typeof getContract>;
      usdc: ReturnType<typeof getContract>;
    };
    write?: {
      betterPlay: ReturnType<typeof getContract>;
      usdc: ReturnType<typeof getContract>;
    };
  };
};

const ContractsContext = createContext<ContractsContextType | null>(null);

export function ContractsProvider({ children }: { children: ReactNode }) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address: account } = useAccount();

  if (!publicClient) return null;

  const chainId = publicClient.chain?.id ?? Number(CHAIN_ID);

  const address = useMemo(
    () => ({
      betterPlay: BETTER_PLAY_ADDRESS as Address,
      usdc: USDC_ADDRESS as Address,
    }),
    []
  );

  // Read-only si o si
  const readContracts = useMemo(() => {
    const betterPlay = getContract({
      abi: BETTER_PLAY_ABI,
      address: address.betterPlay,
      client: { public: publicClient },
    });
    const usdc = getContract({
      abi: ERC20_ABI,
      address: address.usdc,
      client: { public: publicClient },
    });
    return { betterPlay, usdc };
  }, [address.betterPlay, address.usdc, publicClient]);

  // Write sólo si hay wallet conectada
  const writeContracts = useMemo(() => {
    if (!walletClient || !account) return undefined;
    const betterPlay = getContract({
      abi: BETTER_PLAY_ABI,
      address: address.betterPlay,
      client: { public: publicClient, wallet: walletClient },
    });
    const usdc = getContract({
      abi: ERC20_ABI,
      address: address.usdc,
      client: { public: publicClient, wallet: walletClient },
    });
    return { betterPlay, usdc };
  }, [walletClient, account, address.betterPlay, address.usdc, publicClient]);

  const value: ContractsContextType = {
    chainId,
    account: account as Address | undefined,
    publicClient,
    walletClient: walletClient ?? undefined,
    address,
    contracts: {
      read: readContracts,
      write: writeContracts,
    },
  };

  return <ContractsContext.Provider value={value}>{children}</ContractsContext.Provider>;
}

export function useContracts() {
  const ctx = useContext(ContractsContext);
  if (!ctx) throw new Error("useContracts must be used within <ContractsProvider>");
  return ctx;
}

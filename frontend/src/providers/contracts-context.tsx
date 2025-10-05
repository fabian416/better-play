"use client";

import React, { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import type { Address, PublicClient, WalletClient } from "viem";
import { getContract } from "viem";
import type { Eip1193Provider, BrowserProvider, Signer, ContractRunner } from "ethers";
import { ethers } from "ethers";
import { XOConnectProvider } from "xo-connect";

import { BETTER_PLAY_ABI } from "~~/contracts/betterplay-abi";
import { ERC20_ABI } from "~~/contracts/erc20-abi";
import { BETTER_PLAY_ADDRESS, USDC_ADDRESS, CHAIN_ID } from "~~/lib/constants";
import { useEmbedded } from "~~/providers/embedded-context";
import { getSettings } from "~~/lib/settings";


type EthersConnectResult = {
  betterPlay: ethers.Contract;
  usdc: ethers.Contract;
  betterPlayAddress: Address;
  usdcAddress: Address;
  signer: Signer;
  connectedAddress: Address;
  provider: Eip1193Provider | XOConnectProvider;
  disconnect: () => Promise<void>;
};

type ViemInstances = {
  read: {
    betterPlay: ReturnType<typeof getContract>;
    usdc: ReturnType<typeof getContract>;
  };
  write?: {
    betterPlay: ReturnType<typeof getContract>;
    usdc: ReturnType<typeof getContract>;
  };
};

type ContractsContextType = {
  /** Chain/account & viem clients kept for your existing hooks */
  chainId: number;
  account?: Address;
  publicClient: PublicClient;
  walletClient?: WalletClient;

  /** Canonical addresses */
  address: {
    betterPlay: Address;
    usdc: Address;
  };

  /** viem getContract instances (read/write) that your hooks may already use */
  viem: ViemInstances;

  /**
   * Ethers-style lazy connector used in embedded (and can also be used in web).
   * Builds an EIP-1193 provider:
   * - Embedded: XOConnectProvider(rpc, chainId)
   * - Normal: walletClient.transport
   * Returns ethers contracts for BetterPlay/USDC (with mint).
   */
  contracts: () => Promise<EthersConnectResult>;
};

const ContractsContext = createContext<ContractsContextType | null>(null);

/** Transform wagmi WalletClient -> EIP-1193 provider */
function walletClientToEip1193Provider(walletClient: WalletClient): Eip1193Provider {
  // WalletClient.transport is EIP-1193 compatible in wagmi/viem v2
  return walletClient.transport as unknown as Eip1193Provider;
}

export function ContractsProvider({ children }: { children: ReactNode }) {
  const publicClient = usePublicClient();
  const { data: walletClientFromWagmi } = useWalletClient();
  const { address: account } = useAccount();
  const { isEmbedded } = useEmbedded();

  // Hard guard: wait until wagmi gives a publicClient (CSR)
  if (!publicClient) return null;

  const chain = publicClient.chain;
  const chainId = chain?.id ?? Number(CHAIN_ID);

  // Settings (rpc + optional backend config URL if you have it)
  const settings = getSettings();
  const rpcFromSettings =
    settings.polygon.rpcUrls[chainId as keyof typeof settings.polygon.rpcUrls] ??
    (chain?.rpcUrls?.default?.http?.[0] ?? "");

  const address = useMemo(
    () => ({
      betterPlay: BETTER_PLAY_ADDRESS as Address,
      usdc: USDC_ADDRESS as Address,
    }),
    []
  );

  // viem read instances (kept for your existing read hooks)
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

  // viem write instances (only if wallet connected)
  const writeContracts = useMemo(() => {
    if (!walletClientFromWagmi || !account) return undefined;
    const betterPlay = getContract({
      abi: BETTER_PLAY_ABI,
      address: address.betterPlay,
      client: { public: publicClient, wallet: walletClientFromWagmi },
    });
    const usdc = getContract({
      abi: ERC20_ABI,
      address: address.usdc,
      client: { public: publicClient, wallet: walletClientFromWagmi },
    });
    return { betterPlay, usdc };
  }, [walletClientFromWagmi, account, address.betterPlay, address.usdc, publicClient]);

  const [cached, setCached] = useState<EthersConnectResult | null>(null);

  const contracts = async (): Promise<EthersConnectResult> => {
    if (cached) return cached;

    // 1) Provider selection
    const connectEmbedded = (): {
      provider: XOConnectProvider;
      disconnect: () => Promise<void>;
    } => {
      const provider = new XOConnectProvider({
        rpcs: { [chainId]: rpcFromSettings },
        defaultChainId: chainId,
      });
      return {
        provider,
        disconnect: async () => {
          // XOConnectProvider usually doesn't need explicit disconnect
        },
      };
    };

    const connectNormal = (): {
      provider: Eip1193Provider;
      disconnect: () => Promise<void>;
    } => {
      if (!walletClientFromWagmi) throw new Error("Wallet client not found");
      const provider = walletClientToEip1193Provider(walletClientFromWagmi);
      return {
        provider,
        disconnect: async () => {
          // Let wagmi handle user disconnects from your UI (ConnectButton)
          setCached(null);
        },
      };
    };

    const { provider, disconnect } = isEmbedded ? connectEmbedded() : connectNormal();

    // 2) Harden: listen account/connection changes and drop cache
    if ("on" in provider && typeof (provider as any).on === "function") {
      (provider as any).on("accountsChanged", async () => setCached(null));
      (provider as any).on("disconnect", () => setCached(null));
    }

    // 3) Ethers v6 signer & contracts
    const ethersProvider = new ethers.BrowserProvider(provider as unknown as Eip1193Provider);
    const signer = await ethersProvider.getSigner(0);
    const connectedAddress = (await signer.getAddress()) as Address;

    const betterPlay = new ethers.Contract(address.betterPlay, BETTER_PLAY_ABI as any, signer);
    const usdc = new ethers.Contract(address.usdc, ERC20_ABI as any, signer);

    const packed: EthersConnectResult = {
      betterPlay,
      usdc,
      betterPlayAddress: address.betterPlay,
      usdcAddress: address.usdc,
      signer,
      connectedAddress,
      provider,
      disconnect,
    };
    setCached(packed);
    return packed;
  };

  const value: ContractsContextType = {
    chainId,
    account: account as Address | undefined,
    publicClient,
    walletClient: walletClientFromWagmi ?? undefined,
    address,
    viem: { read: readContracts, write: writeContracts },
    contracts, // <-- ethers lazy connector for embedded/web
  };

  return <ContractsContext.Provider value={value}>{children}</ContractsContext.Provider>;
}

export function useContracts() {
  const ctx = useContext(ContractsContext);
  if (!ctx) throw new Error("useContracts must be used within <ContractsProvider>");
  return ctx;
}

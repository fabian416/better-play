"use client";

import React, {
  createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, type ReactNode,
} from "react";
import {
  useAccount as useWagmiAccount,
  usePublicClient as useWagmiPublic,
  useWalletClient as useWagmiWallet,
} from "wagmi";
import type { Address, PublicClient, WalletClient } from "viem";
import { getContract, createWalletClient, createPublicClient, custom, http } from "viem";
import { polygon, polygonAmoy } from "viem/chains";
import { XOConnectProvider } from "xo-connect";

import { useEmbedded } from "~~/providers/embedded-context";
import { getSettings } from "~~/lib/settings";
import { BETTER_PLAY_ABI } from "~~/contracts/betterplay-abi";
import { ERC20_ABI } from "~~/contracts/erc20-abi";
import { BETTER_PLAY_ADDRESS, USDC_ADDRESS } from "~~/lib/constants";

type ContractsCtx = {
  chainId: number;
  account?: Address;
  publicClient?: PublicClient;
  walletClient?: WalletClient;
  address: { betterPlay: Address; usdc: Address };
  contracts: {
    read?: { betterPlay: ReturnType<typeof getContract>; usdc: ReturnType<typeof getContract> } | undefined;
    write?: { betterPlay: ReturnType<typeof getContract>; usdc: ReturnType<typeof getContract> } | undefined;
  };
};

const Ctx = createContext<ContractsCtx | null>(null);

export function ContractsProvider({ children }: { children: ReactNode }) {
  const { isEmbedded } = useEmbedded();
  const settings = getSettings();

  // Wagmi (normal mode)
  const wagmiPublic = useWagmiPublic();
  const { data: wagmiWallet } = useWagmiWallet();
  const { address: wagmiAccount } = useWagmiAccount();

  // Local state
  const [account, setAccount] = useState<Address | undefined>(undefined);
  const [publicClient, setPublicClient] = useState<PublicClient | undefined>(undefined);
  const [walletClient, setWalletClient] = useState<WalletClient | undefined>(undefined);

  // Keep XO provider for embedded
  const embeddedProviderRef = useRef<any>(null);

  // Chain + RPC
  const targetId = settings.polygon.chainId; // 137 or 80002
  const chain = targetId === polygon.id ? polygon : polygonAmoy;
  const rpcUrl =
    settings.polygon.rpcUrls[targetId] ??
    (targetId === polygon.id ? polygon.rpcUrls.default.http[0] : polygonAmoy.rpcUrls.default.http[0]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function boot() {
      if (isEmbedded) {
        // Embedded: prepare provider/clients, but DO NOT request accounts interactively.
        const provider = new XOConnectProvider({
          rpcs: { [chain.id]: rpcUrl },
          defaultChainId: chain.id,
        });
        embeddedProviderRef.current = provider;

        // Non-interactive account fetch (works if already authorized by the host app)
        try {
          const accs = (await provider.request({ method: "eth_accounts" })) as string[];
          setAccount((accs?.[0] ?? "") as Address || undefined);
        } catch {
          setAccount(undefined);
        }

        // viem clients
        setPublicClient(createPublicClient({ chain, transport: http(rpcUrl) }));
        setWalletClient(createWalletClient({ chain, transport: custom(provider) }));

        // Keep in sync
        const onAcc = (accs: string[]) => setAccount((accs?.[0] ?? "") as Address || undefined);
        const onDisco = () => setAccount(undefined);
        const onConnect = async () => {
          try {
            const accs = (await provider.request({ method: "eth_accounts" })) as string[];
            setAccount((accs?.[0] ?? "") as Address || undefined);
          } catch {}
        };

        provider.on?.("accountsChanged", onAcc);
        provider.on?.("disconnect", onDisco);
        provider.on?.("connect", onConnect);

        cleanup = () => {
          provider.removeListener?.("accountsChanged", onAcc);
          provider.removeListener?.("disconnect", onDisco);
          provider.removeListener?.("connect", onConnect);
          embeddedProviderRef.current = null;
        };
      } else {
        // Normal: use wagmi
        if (!wagmiPublic) return;
        setPublicClient(wagmiPublic);
        setWalletClient(wagmiWallet ?? undefined);
        setAccount(wagmiAccount as Address | undefined);
        embeddedProviderRef.current = null;
      }
    }

    boot();
    return () => cleanup?.();
  }, [isEmbedded, chain.id, rpcUrl, wagmiPublic, wagmiWallet, wagmiAccount]);

  // Addresses
  const address = useMemo(
    () => ({ betterPlay: BETTER_PLAY_ADDRESS as Address, usdc: USDC_ADDRESS as Address }),
    []
  );

  // Read contracts
  const readContracts = useMemo(() => {
    if (!publicClient) return undefined;
    return {
      betterPlay: getContract({ abi: BETTER_PLAY_ABI, address: address.betterPlay, client: { public: publicClient } }),
      usdc: getContract({ abi: ERC20_ABI, address: address.usdc, client: { public: publicClient } }),
    };
  }, [publicClient, address.betterPlay, address.usdc]);

  // Write contracts
  const writeContracts = useMemo(() => {
    if (!publicClient || !walletClient || !account) return undefined;
    return {
      betterPlay: getContract({ abi: BETTER_PLAY_ABI, address: address.betterPlay, client: { public: publicClient, wallet: walletClient } }),
      usdc: getContract({ abi: ERC20_ABI, address: address.usdc, client: { public: publicClient, wallet: walletClient } }),
    };
  }, [publicClient, walletClient, account, address.betterPlay, address.usdc]);

  const value: ContractsCtx = {
    chainId: chain.id,
    account,
    publicClient,
    walletClient,
    address,
    contracts: { read: readContracts, write: writeContracts },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContracts() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useContracts must be used within <ContractsProvider>");
  return ctx;
}

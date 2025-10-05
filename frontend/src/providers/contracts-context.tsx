"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useAccount as useWagmiAccount, usePublicClient as useWagmiPublic, useWalletClient as useWagmiWallet } from "wagmi";
import type { Address, PublicClient, WalletClient } from "viem";
import { getContract, createWalletClient, createPublicClient, custom, http } from "viem";
import { polygon, polygonAmoy } from "viem/chains";
import { XOConnectProvider } from "xo-connect";
import { useEmbedded } from "~~/providers/embedded-context";
import { getSettings } from "~~/lib/settings";
import { BETTER_PLAY_ABI } from "~~/contracts/betterplay-abi";
import { ERC20_ABI } from "~~/contracts/erc20-abi";
import { BETTER_PLAY_ADDRESS, USDC_ADDRESS } from "~~/lib/constants";

type Ctx = {
  chainId: number;
  account?: Address;
  publicClient: PublicClient;
  walletClient?: WalletClient;
  address: { betterPlay: Address; usdc: Address };
  contracts: {
    read: { betterPlay: ReturnType<typeof getContract>; usdc: ReturnType<typeof getContract> };
    write?: { betterPlay: ReturnType<typeof getContract>; usdc: ReturnType<typeof getContract> };
  };
};

const ContractsContext = createContext<Ctx | null>(null);

export function ContractsProvider({ children }: { children: ReactNode }) {
  const { isEmbedded } = useEmbedded();
  const settings = getSettings();

  // Normal (wagmi) clients
  const wagmiPublic = useWagmiPublic();
  const { data: wagmiWallet } = useWagmiWallet();
  const { address: wagmiAccount } = useWagmiAccount();

  const [account, setAccount] = useState<Address | undefined>(undefined);
  const [publicClient, setPublicClient] = useState<PublicClient | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | undefined>(undefined);

  const targetId = settings.polygon.chainId; // 137 or 80002
  const chain = targetId === polygon.id ? polygon : polygonAmoy;
  const rpcUrl =
    settings.polygon.rpcUrls[targetId] ??
    (targetId === polygon.id ? polygon.rpcUrls.default.http[0] : polygonAmoy.rpcUrls.default.http[0]);

  useEffect(() => {
    let mounted = true;

    async function initEmbedded() {
      // XO provider (EIP-1193)
      const provider = new XOConnectProvider({
        rpcs: { [chain.id]: rpcUrl },
        defaultChainId: chain.id,
      });

      // Request accounts so UI doesn’t stay disabled
      try {
        const accs = (await provider.request({ method: "eth_requestAccounts" })) as string[];
        if (mounted) setAccount((accs?.[0] ?? "") as Address);
      } catch {
        if (mounted) setAccount(undefined);
      }

      // viem clients: http for reads, custom(provider) for writes
      const pub = createPublicClient({ chain, transport: http(rpcUrl) });
      const wal = createWalletClient({ chain, transport: custom(provider) });

      if (!mounted) return;
      setPublicClient(pub);
      setWalletClient(wal);

      // Keep account in sync
      provider.on?.("accountsChanged", (accs: string[]) => {
        if (!mounted) return;
        setAccount((accs?.[0] ?? "") as Address);
      });
      provider.on?.("disconnect", () => {
        if (!mounted) return;
        setAccount(undefined);
      });
    }

    async function initNormal() {
      if (!wagmiPublic) return;
      setPublicClient(wagmiPublic);
      setWalletClient(wagmiWallet ?? undefined);
      setAccount(wagmiAccount as Address | undefined);
    }

    if (isEmbedded) initEmbedded();
    else initNormal();

    return () => {
      mounted = false;
    };
  }, [isEmbedded, wagmiPublic, wagmiWallet, wagmiAccount, chain, rpcUrl]);

  if (!publicClient) return null;

  const address = useMemo(
    () => ({ betterPlay: BETTER_PLAY_ADDRESS as Address, usdc: USDC_ADDRESS as Address }),
    []
  );

  const readContracts = useMemo(() => {
    const betterPlay = getContract({ abi: BETTER_PLAY_ABI, address: address.betterPlay, client: { public: publicClient } });
    const usdc = getContract({ abi: ERC20_ABI, address: address.usdc, client: { public: publicClient } });
    return { betterPlay, usdc };
  }, [address.betterPlay, address.usdc, publicClient]);

  const writeContracts = useMemo(() => {
    if (!walletClient || !account) return undefined;
    const betterPlay = getContract({ abi: BETTER_PLAY_ABI, address: address.betterPlay, client: { public: publicClient, wallet: walletClient } });
    const usdc = getContract({ abi: ERC20_ABI, address: address.usdc, client: { public: publicClient, wallet: walletClient } });
    return { betterPlay, usdc };
  }, [walletClient, account, address.betterPlay, address.usdc, publicClient]);

  const value: Ctx = {
    chainId: chain.id,
    account,
    publicClient,
    walletClient,
    address,
    contracts: { read: readContracts, write: writeContracts },
  };

  return <ContractsContext.Provider value={value}>{children}</ContractsContext.Provider>;
}

export function useContracts() {
  const ctx = useContext(ContractsContext);
  if (!ctx) throw new Error("useContracts must be used within <ContractsProvider>");
  return ctx;
}
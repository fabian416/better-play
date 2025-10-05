"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
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

/** Public context shape kept intentionally simple (loose/optional). */
type ContractsCtx = {
  chainId: number;
  account?: Address;
  publicClient?: PublicClient; // undefined while booting
  walletClient?: WalletClient;
  address: { betterPlay: Address; usdc: Address };
  contracts: {
    read?:
      | {
          betterPlay: ReturnType<typeof getContract>;
          usdc: ReturnType<typeof getContract>;
        }
      | undefined;
    write?:
      | {
          betterPlay: ReturnType<typeof getContract>;
          usdc: ReturnType<typeof getContract>;
        }
      | undefined;
  };
};

const Ctx = createContext<ContractsCtx | null>(null);

/**
 * Simple provider:
 * - Always calls the same hooks (no conditional hooks).
 * - No fancy Boot types; we just bring clients up and memoize contracts when ready.
 */
export function ContractsProvider({ children }: { children: ReactNode }) {
  const { isEmbedded } = useEmbedded();
  const settings = getSettings();

  // wagmi (normal) clients
  const wagmiPublic = useWagmiPublic();
  const { data: wagmiWallet } = useWagmiWallet();
  const { address: wagmiAccount } = useWagmiAccount();

  // local state
  const [account, setAccount] = useState<Address | undefined>(undefined);
  const [publicClient, setPublicClient] = useState<PublicClient | undefined>(undefined);
  const [walletClient, setWalletClient] = useState<WalletClient | undefined>(undefined);

  // chain + rpc
  const targetId = settings.polygon.chainId; // 137 or 80002
  const chain = targetId === polygon.id ? polygon : polygonAmoy;
  const rpcUrl =
    settings.polygon.rpcUrls[targetId] ??
    (targetId === polygon.id ? polygon.rpcUrls.default.http[0] : polygonAmoy.rpcUrls.default.http[0]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let provider: any;

    async function boot() {
      if (isEmbedded) {
        // Embedded: XO EIP-1193 provider
        provider = new XOConnectProvider({
          rpcs: { [chain.id]: rpcUrl },
          defaultChainId: chain.id,
        });

        // Ask accounts so buttons don't stay disabled forever
        try {
          const accs = (await provider.request({ method: "eth_requestAccounts" })) as string[];
          setAccount((accs?.[0] ?? "") as Address);
        } catch {
          setAccount(undefined);
        }

        // viem clients
        setPublicClient(createPublicClient({ chain, transport: http(rpcUrl) }));
        setWalletClient(createWalletClient({ chain, transport: custom(provider) }));

        // keep account in sync
        const onAcc = (accs: string[]) => setAccount((accs?.[0] ?? "") as Address);
        const onDisco = () => setAccount(undefined);
        provider.on?.("accountsChanged", onAcc);
        provider.on?.("disconnect", onDisco);
        cleanup = () => {
          provider.removeListener?.("accountsChanged", onAcc);
          provider.removeListener?.("disconnect", onDisco);
        };
      } else {
        // Normal: use wagmi clients
        if (!wagmiPublic) return;
        setPublicClient(wagmiPublic);
        setWalletClient(wagmiWallet ?? undefined);
        setAccount(wagmiAccount as Address | undefined);
      }
    }

    boot();
    return () => {
      cleanup?.();
    };
  }, [isEmbedded, chain.id, rpcUrl, wagmiPublic, wagmiWallet, wagmiAccount]);

  // static addresses (stable refs)
  const address = useMemo(
    () => ({ betterPlay: BETTER_PLAY_ADDRESS as Address, usdc: USDC_ADDRESS as Address }),
    []
  );

  // read contracts only when public client exists
  const readContracts = useMemo(() => {
    if (!publicClient) return undefined;
    return {
      betterPlay: getContract({
        abi: BETTER_PLAY_ABI,
        address: address.betterPlay,
        client: { public: publicClient },
      }),
      usdc: getContract({
        abi: ERC20_ABI,
        address: address.usdc,
        client: { public: publicClient },
      }),
    };
  }, [publicClient, address.betterPlay, address.usdc]);

  // write contracts only when wallet+account exist
  const writeContracts = useMemo(() => {
    if (!publicClient || !walletClient || !account) return undefined;
    return {
      betterPlay: getContract({
        abi: BETTER_PLAY_ABI,
        address: address.betterPlay,
        client: { public: publicClient, wallet: walletClient },
      }),
      usdc: getContract({
        abi: ERC20_ABI,
        address: address.usdc,
        client: { public: publicClient, wallet: walletClient },
      }),
    };
  }, [publicClient, walletClient, account, address.betterPlay, address.usdc]);

  // final value
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

/** Consumer hook (unchanged API). */
export function useContracts() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useContracts must be used within <ContractsProvider>");
  return ctx;
}

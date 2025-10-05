"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  useAccount as useWagmiAccount,
  usePublicClient as useWagmiPublic,
  useWalletClient as useWagmiWallet,
} from "wagmi";
import type { Address, PublicClient, WalletClient, Chain } from "viem";
import { getContract, createWalletClient, createPublicClient, custom } from "viem";
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

export function ContractsProvider({ children }: { children: ReactNode }) {
  const { isEmbedded } = useEmbedded();
  const settings = getSettings();

  // --- wagmi (normal mode)
  const wagmiPublic = useWagmiPublic();
  const { data: wagmiWallet } = useWagmiWallet();
  const { address: wagmiAccount } = useWagmiAccount();

  // --- state
  const [account, setAccount] = useState<Address | undefined>(undefined);
  const [publicClient, setPublicClient] = useState<PublicClient | undefined>(undefined);
  const [walletClient, setWalletClient] = useState<WalletClient | undefined>(undefined);

  // XO provider ref (embedded)
  const embeddedProviderRef = useRef<any>(null);

  // --- pick target & RPCs from settings (no backend fetch)
  const targetId = settings.polygon.chainId; // 137 or 80002
  const fallbackChain: Chain = targetId === polygon.id ? polygon : polygonAmoy;

  const polygonRpc =
    settings.polygon.rpcUrls?.[polygon.id] ?? polygon.rpcUrls.default.http[0];
  const amoyRpc =
    settings.polygon.rpcUrls?.[polygonAmoy.id] ?? polygonAmoy.rpcUrls.default.http[0];

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | undefined;

    (async () => {
      if (!mounted) return;

      if (!isEmbedded) {
        // === Normal mode: use wagmi's clients directly ===
        if (!wagmiPublic) return;
        setPublicClient(wagmiPublic);
        setWalletClient(wagmiWallet ?? undefined);
        setAccount((wagmiAccount as Address | undefined) ?? undefined);
        embeddedProviderRef.current = null;
        return;
      }

      // === Embedded mode: XOConnectProvider with proper RPC map ===
      // NOTE: we pass BOTH Polygon & Amoy RPCs; we will set defaultChainId and still detect the actual chain via provider.
      const provider = new XOConnectProvider({
        rpcs: {
          [polygon.id]: polygonRpc,
          [polygonAmoy.id]: amoyRpc,
        },
        defaultChainId: fallbackChain.id, // initial default (we'll detect below)
      });
      embeddedProviderRef.current = provider;

      // --- EIP-1193 preflight (same spirit as the working repo)
      // 1) chain id
      let detectedId: number = fallbackChain.id;
      try {
        const hex = await provider.request?.({ method: "eth_chainId" });
        if (typeof hex === "string") detectedId = parseInt(hex, 16);
      } catch {
        // ignore, keep fallback
      }

      // 2) choose viem chain by detected id
      const detectedChain: Chain =
        detectedId === polygon.id
          ? polygon
          : detectedId === polygonAmoy.id
          ? polygonAmoy
          : fallbackChain;

      // 3) accounts (non-interactive, then interactive)
      let accs: string[] = [];
      try {
        accs = (await provider.request?.({ method: "eth_accounts" })) as string[];
      } catch {
        accs = [];
      }
      if (!accs?.length) {
        try {
          accs = (await provider.request?.({ method: "eth_requestAccounts" })) as string[];
        } catch {
          // host may block it, we continue without account
        }
      }

      // 4) route ALL viem traffic via XO provider (reads + writes)
      const transport = custom(provider);
      const pub = createPublicClient({ chain: detectedChain, transport });
      const wal = createWalletClient({ chain: detectedChain, transport });

      if (!mounted) return;
      setPublicClient(pub);
      setWalletClient(wal);
      setAccount((accs?.[0] as Address | undefined) || undefined);

      // --- listeners (EIP-1193)
      const onAcc = (next: string[]) => {
        if (!mounted) return;
        setAccount(((next?.[0] ?? "") as Address) || undefined);
      };
      const onDisco = () => {
        if (!mounted) return;
        setAccount(undefined);
      };

      provider.on?.("accountsChanged", onAcc);
      provider.on?.("disconnect", onDisco);

      cleanup = () => {
        provider.removeListener?.("accountsChanged", onAcc);
        provider.removeListener?.("disconnect", onDisco);
        embeddedProviderRef.current = null;
      };
    })();

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [isEmbedded, wagmiPublic, wagmiWallet, wagmiAccount, polygonRpc, amoyRpc, fallbackChain.id]);

  // --- static addresses (same as your repo)
  const address = useMemo(
    () => ({ betterPlay: BETTER_PLAY_ADDRESS as Address, usdc: USDC_ADDRESS as Address }),
    []
  );

  // --- read contracts (viem getContract)
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

  // --- write contracts (require walletClient + account)
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

  const value: ContractsCtx = {
    chainId: (publicClient?.chain?.id ?? fallbackChain.id) as number,
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

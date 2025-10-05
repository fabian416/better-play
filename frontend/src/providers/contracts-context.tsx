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

  // Normal mode (wagmi)
  const wagmiPublic = useWagmiPublic();
  const { data: wagmiWallet } = useWagmiWallet();
  const { address: wagmiAccount } = useWagmiAccount();

  // State
  const [account, setAccount] = useState<Address | undefined>(undefined);
  const [publicClient, setPublicClient] = useState<PublicClient | undefined>(undefined);
  const [walletClient, setWalletClient] = useState<WalletClient | undefined>(undefined);

  // XO provider ref (embedded)
  const embeddedProviderRef = useRef<any>(null);

  // Default chain from settings (fallback)
  const targetId = settings.polygon.chainId; // 137 o 80002
  const defaultChain = targetId === polygon.id ? polygon : polygonAmoy;

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | undefined;

    (async () => {
      if (!mounted) return;

      if (!isEmbedded) {
        // Normal: wagmi clients
        if (!wagmiPublic) return;
        setPublicClient(wagmiPublic);
        setWalletClient(wagmiWallet ?? undefined);
        setAccount(wagmiAccount as Address | undefined);
        embeddedProviderRef.current = null;
        return;
      }

      // Embedded: XO provider
      const provider = new XOConnectProvider({
        // No fijamos RPCs acá; leemos chain y enrutamos TODO por el provider
        rpcs: {},
        defaultChainId: defaultChain.id,
      });
      embeddedProviderRef.current = provider;

      // Detect chainId desde el provider
      let detectedId: number = defaultChain.id;
      try {
        const hex = await provider.request({ method: "eth_chainId" });
        detectedId = typeof hex === "string" ? parseInt(hex, 16) : Number(hex);
      } catch {
        // ignore
      }

      // Elegí chain soportado o volvé al default
      const detectedChain: Chain =
        detectedId === polygon.id
          ? polygon
          : detectedId === polygonAmoy.id
          ? polygonAmoy
          : defaultChain;

      // Enrutar lecturas y escrituras via provider (evita mismatch de RPC)
      const transport = custom(provider);
      const pub = createPublicClient({ chain: detectedChain, transport });
      const wal = createWalletClient({ chain: detectedChain, transport });

      if (!mounted) return;
      setPublicClient(pub);
      setWalletClient(wal);

      // Obtener cuenta (no-interactivo primero)
      let addr: Address | undefined;
      try {
        const accs = (await provider.request({ method: "eth_accounts" })) as string[];
        addr = ((accs?.[0] ?? "") as Address) || undefined;
      } catch {
        addr = undefined;
      }

      // Fallback: intentar requestAccounts (si el host lo permite sin gesto)
      if (!addr) {
        try {
          const accs = (await provider.request({ method: "eth_requestAccounts" })) as string[];
          addr = ((accs?.[0] ?? "") as Address) || undefined;
        } catch {
          // si lo bloquea, seguimos sin account
        }
      }

      if (mounted) setAccount(addr);

      // Listeners
      const onAcc = (accs: string[]) => {
        if (!mounted) return;
        setAccount(((accs?.[0] ?? "") as Address) || undefined);
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
  }, [isEmbedded, defaultChain.id, wagmiPublic, wagmiWallet, wagmiAccount]);

  // Static addresses
  const address = useMemo(
    () => ({ betterPlay: BETTER_PLAY_ADDRESS as Address, usdc: USDC_ADDRESS as Address }),
    []
  );

  // Read contracts
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

  // Write contracts
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
    chainId: (publicClient?.chain?.id ?? defaultChain.id) as number,
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

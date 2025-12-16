"use client";

import { useEffect, useState } from "react";
import type { Address } from "viem";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "~~/components/ui/button";
import { useMintUsdc } from "~~/hooks/useMintUsdc";
import { useContracts } from "~~/providers/contracts-context";
import { useEmbedded } from "~~/providers/embedded-context";
import { getSettings } from "~~/lib/settings";

export function Header() {
  const { contracts } = useContracts();
  const { isEmbedded } = useEmbedded();
  const mintUsdc = useMintUsdc();

  const [account, setAccount] = useState<Address | null>(null);

  // Detect network (mainnet vs test)
  const settings = getSettings();
  const isMainnet = settings.polygon.chainId === 137; // Polygon mainnet

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { connectedAddress } = await contracts();
        if (!cancelled) setAccount(connectedAddress as Address);
      } catch {
        if (!cancelled) setAccount(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contracts]);

  const onMint = async () => {
    try {
      await mintUsdc.mutateAsync(1000n);
    } catch {
      // toast handled in the hook
    }
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/">
                <h1 className="text-2xl font-bold text-primary cursor-pointer hover:text-primary/80 transition-colors">
                  BetterPlay
                </h1>
              </Link>
            </div>
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              <Link to="/" className="text-foreground hover:text-primary transition-colors">
                Partidos
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Mint button ONLY on non-mainnet */}
            {!isMainnet && (
              <Button
                onClick={onMint}
                disabled={!account || mintUsdc.isPending}
                className="whitespace-nowrap"
                variant="outline"
              >
                {mintUsdc.isPending ? (
                  <span>Minting…</span>
                ) : (
                  <>
                    <span className="inline md:hidden">Mint</span>
                    <span className="hidden md:inline">Mint 1,000 USDC</span>
                  </>
                )}
              </Button>
            )}

            {!isEmbedded && (
              <ConnectButton
                showBalance={false}
                accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

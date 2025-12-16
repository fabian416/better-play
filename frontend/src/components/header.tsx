"use client";

import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { formatUnits } from "viem";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { Button } from "~~/components/ui/button";
import { useMintUsdc } from "~~/hooks/useMintUsdc";
import { useContracts } from "~~/providers/contracts-context";
import { useEmbedded } from "~~/providers/embedded-context";
import { getSettings } from "~~/lib/settings";
import { useUsdcBalance, useUsdcDecimals } from "~~/hooks/useBetterPlay"; // ajustá path si cambia

function formatUsdcForUi(amount: bigint, decimals: number, maxFrac = 2) {
  const s = formatUnits(amount, decimals);
  const [wholeRaw, fracRaw = ""] = s.split(".");
  const whole = wholeRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const frac = fracRaw.slice(0, maxFrac).replace(/0+$/, "");
  return frac ? `${whole},${frac}` : whole;
}

export function Header() {
  const { contracts } = useContracts();
  const { isEmbedded } = useEmbedded();
  const mintUsdc = useMintUsdc();

  const [account, setAccount] = useState<Address | null>(null);

  const settings = getSettings();
  const isMainnet = settings.polygon.chainId === 137;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { connectedAddress } = await contracts();
        if (!cancelled) setAccount((connectedAddress as Address) ?? null);
      } catch {
        if (!cancelled) setAccount(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contracts]);

  const { data: usdcDecimals } = useUsdcDecimals();
  const {
    data: usdcBalance,
    isLoading: isBalLoading,
    isFetching: isBalFetching,
  } = useUsdcBalance(account ?? undefined);

  const usdcText = useMemo(() => {
    if (!account) return null;
    if (usdcDecimals === undefined) return "—";
    if (usdcBalance === undefined) return isBalLoading ? "Cargando…" : "—";
    return formatUsdcForUi(usdcBalance, usdcDecimals, 2);
  }, [account, usdcBalance, usdcDecimals, isBalLoading]);

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
            {/* USDC balance chip: número primero, logo al final */}
            {account && (
              <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1 text-sm whitespace-nowrap">
                <span className="font-large font-bold tabular-nums">
                  {usdcText}
                  {isBalFetching && !isBalLoading ? <span className="opacity-60">…</span> : null}
                </span>

                <img
                  src="/usdc_logo.png"
                  alt="USDC"
                  className="h-6 w-6 rounded-sm"
                  draggable={false}
                />
              </div>
            )}

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

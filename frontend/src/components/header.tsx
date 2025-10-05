import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "~~/components/ui/button";
import { useMintUsdc } from "~~/hooks/useMintUsdc";
import { useContracts } from "~~/providers/contracts-context";
import { useEmbedded } from "~~/providers/embedded-context";

export function Header() {
  const { account } = useContracts();
  const { isEmbedded } = useEmbedded();
  const mintUsdc = useMintUsdc();

  const onMint = async () => {
    try {
      await mintUsdc.mutateAsync(1000n);
    } catch {}
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
              <span className="text-muted-foreground">Liga Argentina</span>
            </nav>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
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

            {!isEmbedded && (
              <ConnectButton showBalance={false} accountStatus={{ smallScreen: "avatar", largeScreen: "full" }} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
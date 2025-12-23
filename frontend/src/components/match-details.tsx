"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "~~/components/ui/card";
import { Button } from "~~/components/ui/button";
import { Badge } from "~~/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { logoFor } from "~~/lib/team-logos";
import { getMatches } from "~~/data/matches";

import type { Address } from "viem";
import {
  formatAmount,
  useApprove,
  useApprovalStatus,
  useBet,
  useClaim,
  useConnectedAccount,
  useGetMarket,
  useMarketClaimState,
  usePools,
  useUserStakes,
} from "~~/hooks/useBetterPlay";

function formatDateAR(unix: bigint) {
  const ms = Number(unix) * 1000;
  return new Date(ms).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function stateLabel(state?: number) {
  // MarketState { Open=0, Closed=1, Resolved=2, Canceled=3 }
  if (state === 0) return "ABIERTO";
  if (state === 1) return "EN VIVO"; // bets cerradas, esperando resolve
  if (state === 2) return "FINALIZADO";
  if (state === 3) return "CANCELADO";
  return "—";
}

export default function MatchDetails() {
  const { id } = useParams<{ id: string }>();
  const [sp] = useSearchParams();

  const marketId = useMemo(() => {
    try {
      return BigInt(id ?? "0");
    } catch {
      return 0n;
    }
  }, [id]);

  const outcomeFromQS = sp.get("outcome"); // "home" | "draw" | "away"
  const defaultOutcome: 0 | 1 | 2 =
    outcomeFromQS === "draw" ? 1 : outcomeFromQS === "away" ? 2 : 0;

  const [outcome, setOutcome] = useState<0 | 1 | 2>(defaultOutcome);
  const [amountInput, setAmountInput] = useState("1");

  // Off-chain match metadata (solo para UI)
  const match = useMemo(() => {
    const all = getMatches(new Date());
    return all.find((m) => String(m.id) === String(id));
  }, [id]);

  const { data: connected } = useConnectedAccount();
  const marketQ = useGetMarket(marketId);
  const poolsQ = usePools(marketId);

  // stakes directo (para mostrar siempre aunque claimState esté cargando)
  const stakesQ = useUserStakes(marketId, connected as Address | undefined);

  // claimState DERIVADO (el fix clave)
  const claimState = useMarketClaimState(marketId, connected as Address | undefined);

  const approve = useApprove();
  const bet = useBet();
  const claim = useClaim();

  const { amount, error: amountError } = useApprovalStatus(amountInput);

  const onchainState = marketQ.data?.state;
  const closeTime = marketQ.data?.closeTime;

  const canBet =
    onchainState === 0 &&
    !!closeTime &&
    BigInt(Math.floor(Date.now() / 1000)) < closeTime &&
    !!amount &&
    amount > 0n;

  const staked = stakesQ.data ?? { home: 0n, draw: 0n, away: 0n };
  const stakedTotal = staked.home + staked.draw + staked.away;

  return (
    <div className="mx-auto w-full max-w-[980px] px-3 sm:px-4 lg:px-6 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold truncate">{match ? `${match.homeTeam} vs ${match.awayTeam}` : `Market #${marketId.toString()}`}</h1>
            <Badge className="text-[11px]">{stateLabel(onchainState)}</Badge>
          </div>

          {match && (
            <div className="mt-2 text-sm text-muted-foreground space-y-1">
              <div className="flex items-center">
                <Calendar className="mr-1.5 h-4 w-4" />
                {match.date} — {match.time}
              </div>
              <div className="flex items-center">
                <MapPin className="mr-1.5 h-4 w-4" />
                {match.stadium}
              </div>
            </div>
          )}
        </div>

        {match && (
          <div className="flex items-center gap-2 shrink-0">
            <img src={logoFor(match.homeTeam) || "/placeholder.svg"} className="h-8 w-8 object-contain" />
            <span className="text-sm text-muted-foreground">vs</span>
            <img src={logoFor(match.awayTeam) || "/placeholder.svg"} className="h-8 w-8 object-contain" />
          </div>
        )}
      </div>

      {/* On-chain info */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-2">
          <div className="text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">MarketId:</span> {marketId.toString()} ·{" "}
              <span className="font-medium text-foreground">State:</span> {onchainState ?? "—"}
            </div>
            <div>
              <span className="font-medium text-foreground">Cierre de apuestas (onchain):</span>{" "}
              {closeTime ? formatDateAR(closeTime) : "—"}
            </div>
          </div>

          {!!poolsQ.data && (
            <div className="grid grid-cols-3 gap-2 pt-2 text-sm">
              <div className="rounded-xl border p-3">
                <div className="text-muted-foreground text-xs">Pool Home</div>
                <div className="font-semibold">{formatAmount(poolsQ.data[0])} USDC</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-muted-foreground text-xs">Pool Draw</div>
                <div className="font-semibold">{formatAmount(poolsQ.data[1])} USDC</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-muted-foreground text-xs">Pool Away</div>
                <div className="font-semibold">{formatAmount(poolsQ.data[2])} USDC</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bet box */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Apostar</h2>
            {onchainState !== undefined && onchainState !== 0 ? (
              <Badge variant="outline">Mercado no abierto</Badge>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={outcome === 0 ? "default" : "outline"}
              onClick={() => setOutcome(0)}
              className="rounded-xl"
            >
              Home
            </Button>
            <Button
              variant={outcome === 1 ? "default" : "outline"}
              onClick={() => setOutcome(1)}
              className="rounded-xl"
            >
              Draw
            </Button>
            <Button
              variant={outcome === 2 ? "default" : "outline"}
              onClick={() => setOutcome(2)}
              className="rounded-xl"
            >
              Away
            </Button>
          </div>

          <div className="flex gap-2 items-center">
            <input
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="Monto (USDC)"
              className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none"
            />
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={!amount || amount <= 0n || approve.isPending}
              onClick={() => {
                if (!amount) return;
                approve.mutate(amount);
              }}
            >
              Aprobar
            </Button>
            <Button
              className="rounded-xl"
              disabled={!canBet || bet.isPending || !!amountError}
              onClick={() => {
                if (!amount) return;
                bet.mutate({ marketId, outcome, amount });
              }}
            >
              Apostar
            </Button>
          </div>

          {amountError ? <div className="text-xs text-destructive">{amountError}</div> : null}
        </CardContent>
      </Card>

      {/* Your funds / claim */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold">Tus fondos</h2>

          <div className="text-sm text-muted-foreground break-all">
            <div>
              <span className="font-medium text-foreground">Wallet:</span> {connected ?? "—"}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-xl border p-3">
              <div className="text-muted-foreground text-xs">Tu stake Home</div>
              <div className="font-semibold">{formatAmount(staked.home)} USDC</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-muted-foreground text-xs">Tu stake Draw</div>
              <div className="font-semibold">{formatAmount(staked.draw)} USDC</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-muted-foreground text-xs">Tu stake Away</div>
              <div className="font-semibold">{formatAmount(staked.away)} USDC</div>
            </div>
          </div>

          {stakedTotal === 0n ? (
            <div className="text-sm text-muted-foreground">
              No detecto apuestas para esta wallet en este market.
              <br />
              (Si vos jurás que apostaste, casi seguro fue con otra wallet / smart wallet / otra red / otro contrato.)
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <div className="text-sm">
              <div className="text-muted-foreground text-xs">Claimable</div>
              <div className="font-semibold">{formatAmount(claimState.claimable)} USDC</div>
            </div>

            <Button
              className="rounded-xl"
              disabled={!claimState.canClaim || claim.isPending || claimState.isLoading}
              onClick={() => claim.mutate(marketId)}
            >
              Cobrar
            </Button>
          </div>

          {!claimState.canClaim && claimState.reason !== "LOADING" ? (
            <div className="text-xs text-muted-foreground">
              Motivo: {claimState.reason}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

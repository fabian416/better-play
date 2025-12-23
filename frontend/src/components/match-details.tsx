"use client";

import * as React from "react";
import type { Match } from "~~/data/matches";
import { Card, CardContent } from "~~/components/ui/card";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Input } from "~~/components/ui/input";
import { Calendar, Clock, MapPin } from "lucide-react";
import { logoFor, abbrFor } from "~~/lib/team-logos";
import {
  useConnectedAccount,
  useApprovalStatus,
  useApprove,
  useBet,
} from "~~/hooks/useBetterPlay";

type Props = { match: Match };

function formatLocalDateTime(date?: string, time?: string) {
  if (!date && !time) return "-";
  if (date && time) return `${date} ${time}`;
  return date ?? time ?? "-";
}

function unixToUtcString(unixSeconds?: number) {
  if (typeof unixSeconds !== "number") return "-";
  const d = new Date(unixSeconds * 1000);
  return d.toISOString().replace(".000Z", "Z");
}

export default function MatchDetails({ match }: Props) {
  const { data: address } = useConnectedAccount();

  const marketId = BigInt(match.marketId);

  // --- Bet UI state
  const [outcome, setOutcome] = React.useState<0 | 1 | 2>(0);
  const [amountInput, setAmountInput] = React.useState("");

  const { amount, error, needsApproval } = useApprovalStatus(amountInput);
  const approve = useApprove();
  const bet = useBet();

  const closeTimeUnix = match.closeTimeUnix; // number | undefined
  const betsClosed =
    typeof closeTimeUnix === "number" ? Date.now() >= closeTimeUnix * 1000 : false;

  const betsCloseTime = match.betsCloseTime ?? match.time;

  const homeLogo = logoFor(match.homeTeam);
  const awayLogo = logoFor(match.awayTeam);

  const canSubmit =
    !!address &&
    !error &&
    typeof amount === "bigint" &&
    amount > 0n &&
    !approve.isPending &&
    !bet.isPending;

  const onApprove = async () => {
    if (!amount || amount <= 0n) return;
    approve.mutate(amount);
  };

  const onBet = async () => {
    if (!amount || amount <= 0n) return;
    bet.mutate({ marketId, outcome, amount });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {match.homeTeam} vs {match.awayTeam}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {match.date}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {match.time}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {match.stadium}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {match.featured ? <Badge>DESTACADO</Badge> : null}
                {betsClosed ? (
                  <Badge variant="secondary">APUESTAS CERRADAS</Badge>
                ) : (
                  <Badge variant="outline">APUESTAS ABIERTAS</Badge>
                )}
              </div>
            </div>

            <div className="text-right text-xs text-muted-foreground">
              <div>Bets close: {betsCloseTime ?? "-"}</div>
              {typeof closeTimeUnix === "number" ? (
                <>
                  <div className="mt-1">
                    closeTimeUnix:{" "}
                    <span className="font-mono">{closeTimeUnix}</span>
                  </div>
                  <div className="mt-1">UTC: {unixToUtcString(closeTimeUnix)}</div>
                </>
              ) : (
                <div className="mt-1">closeTimeUnix: -</div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Teams */}
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {homeLogo ? (
                    <img
                      src={homeLogo}
                      alt={match.homeTeam}
                      className="h-10 w-10 rounded-md object-contain"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted" />
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">Local</div>
                    <div className="text-lg font-medium">{match.homeTeam}</div>
                    <div className="text-xs text-muted-foreground">{abbrFor(match.homeTeam)}</div>
                  </div>
                </div>

                <div className="text-2xl font-semibold text-muted-foreground">vs</div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Visitante</div>
                    <div className="text-lg font-medium">{match.awayTeam}</div>
                    <div className="text-xs text-muted-foreground">{abbrFor(match.awayTeam)}</div>
                  </div>
                  {awayLogo ? (
                    <img
                      src={awayLogo}
                      alt={match.awayTeam}
                      className="h-10 w-10 rounded-md object-contain"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted" />
                  )}
                </div>
              </div>
            </div>

            {/* Bet box */}
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Apostar</div>
                {address ? (
                  <Badge variant="outline">Conectado</Badge>
                ) : (
                  <Badge variant="secondary">No conectado</Badge>
                )}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={outcome === 0 ? "default" : "secondary"}
                  onClick={() => setOutcome(0)}
                >
                  Local
                </Button>
                <Button
                  type="button"
                  variant={outcome === 1 ? "default" : "secondary"}
                  onClick={() => setOutcome(1)}
                >
                  Empate
                </Button>
                <Button
                  type="button"
                  variant={outcome === 2 ? "default" : "secondary"}
                  onClick={() => setOutcome(2)}
                >
                  Visitante
                </Button>
              </div>

              <div className="mt-3">
                <Input
                  inputMode="decimal"
                  placeholder="Monto (ej: 10.5)"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                />
                {error ? (
                  <div className="mt-2 text-xs text-destructive">{error}</div>
                ) : null}
                {betsClosed ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    *El market parece cerrado por tiempo. Igual podés intentar: si está cerrado on-chain, revierte.
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={onApprove}
                  disabled={!canSubmit || !needsApproval}
                >
                  {approve.isPending ? "Aprobando…" : "Approve USDC"}
                </Button>

                <Button
                  className="flex-1"
                  onClick={onBet}
                  disabled={!canSubmit || needsApproval}
                >
                  {bet.isPending ? "Apostando…" : "Apostar"}
                </Button>
              </div>

              {needsApproval ? (
                <div className="mt-2 text-xs text-muted-foreground">
                  Primero necesitás aprobar USDC para poder apostar.
                </div>
              ) : null}
            </div>
          </div>

          {/* Odds */}
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border p-4">
              <div className="text-sm text-muted-foreground">Local</div>
              <div className="mt-1 text-2xl font-semibold">{match.homeOdds}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-sm text-muted-foreground">Empate</div>
              <div className="mt-1 text-2xl font-semibold">{match.drawOdds}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-sm text-muted-foreground">Visitante</div>
              <div className="mt-1 text-2xl font-semibold">{match.awayOdds}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

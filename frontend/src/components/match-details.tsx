"use client";

import * as React from "react";
import type { Match } from "~~/data/matches";
import { Card, CardContent } from "~~/components/ui/card";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Input } from "~~/components/ui/input";
import { Calendar, Clock, MapPin, TrendingUp } from "lucide-react";
import { logoFor, abbrFor } from "~~/lib/team-logos";
import type { Address } from "viem";
import {
  useConnectedAccount,
  useApprovalStatus,
  useApprove,
  useBet,
  useUserStakes,
  useMarketClaimState,
  useClaim,
  useMarketData
} from "~~/hooks/useBetterPlay";

type Props = { match: Match };

const MARKET_STATE_LABEL: Record<number, string> = {
  0: "ABIERTO",
  1: "CERRADO",
  2: "RESUELTO",
  3: "CANCELADO",
};

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

function formatUnits(amount: bigint, decimals: number) {
  const neg = amount < 0n;
  const abs = neg ? -amount : amount;
  const s = abs.toString().padStart(decimals + 1, "0");
  const i = s.length - decimals;
  const whole = s.slice(0, i);
  const frac = s.slice(i).replace(/0+$/, "");
  const out = frac ? `${whole}.${frac}` : whole;
  return neg ? `-${out}` : out;
}

function shortAddr(a?: string) {
  if (!a) return "-";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function MatchDetails({ match }: Props) {
  const { data: address } = useConnectedAccount();
  const marketId = BigInt(match.marketId);
  
  // ✅ Leer datos on-chain del mercado
  const { pools, marketInfo, odds, isLoading: marketLoading } = useMarketData(marketId);

  // outcome + amount
  const [outcome, setOutcome] = React.useState<0 | 1 | 2>(0);
  const [amountInput, setAmountInput] = React.useState("");

  const { amount, error, needsApproval, decimals } = useApprovalStatus(amountInput);
  const usdcDecimals = decimals ?? 6;

  const approve = useApprove();
  const bet = useBet();
  const claim = useClaim();

  // ✅ SOLUCIÓN: Leer desde ambas direcciones conocidas (EOA + Smart Account de Beexo)
  const stakesEOA = useUserStakes(marketId, '0x1f9DFe3F894Fb27Da202Ffe50a08658C73859230' as Address);
  const stakesSA = useUserStakes(marketId, '0x75aE771A98F2B66E1325033040B4A1a89E85F4fB' as Address);

  // Combinar stakes de ambas direcciones
  const stakes = React.useMemo(() => {
    const eoa = stakesEOA.data ?? { home: 0n, draw: 0n, away: 0n };
    const sa = stakesSA.data ?? { home: 0n, draw: 0n, away: 0n };
    
    return {
      home: eoa.home + sa.home,
      draw: eoa.draw + sa.draw,
      away: eoa.away + sa.away,
    };
  }, [stakesEOA.data, stakesSA.data]);

  // Para claims, usar la dirección conectada
  const userForReads = address;
  const claimQ = useMarketClaimState(marketId, { user: userForReads });

  // 🔍 DEBUG: Ver qué está leyendo
  React.useEffect(() => {
    console.log('🔍 Stakes Debug:', {
      address,
      stakesEOA: stakesEOA.data,
      stakesSA: stakesSA.data,
      combined: stakes,
      isLoadingEOA: stakesEOA.isLoading,
      isLoadingSA: stakesSA.isLoading,
    });
  }, [address, stakesEOA.data, stakesSA.data, stakes, stakesEOA.isLoading, stakesSA.isLoading]);

  const closeTimeUnix = match.closeTimeUnix;
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

  const buttonLabel =
    approve.isPending || bet.isPending
      ? "Procesando…"
      : needsApproval
      ? "Aprobar y apostar"
      : "Apostar";

  const onApproveAndBet = async () => {
    if (!amount || amount <= 0n) return;

    try {
      if (needsApproval) await approve.mutateAsync(amount);
      await bet.mutateAsync({ marketId, outcome, amount });
    } catch {
      // los toasts ya los maneja cada mutation
    }
  };

  const stakedTotal = stakes.home + stakes.draw + stakes.away;

  const claimable = claimQ.data?.claimable ?? 0n;
  const canClaim = Boolean(claimQ.data?.canClaim);
  const alreadyClaimed = Boolean(claimQ.data?.alreadyClaimed);
  
  // ✅ Usar el estado del marketInfo si está disponible
  const marketState = marketInfo?.state ?? claimQ.data?.marketState;
  const marketStateLabel =
    typeof marketState === "number" ? MARKET_STATE_LABEL[marketState] ?? String(marketState) : "-";

  const isLoadingStakes = stakesEOA.isLoading || stakesSA.isLoading;

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
                    closeTimeUnix: <span className="font-mono">{closeTimeUnix}</span>
                  </div>
                  <div className="mt-1">UTC: {unixToUtcString(closeTimeUnix)}</div>
                </>
              ) : (
                <div className="mt-1">closeTimeUnix: -</div>
              )}
              <div className="mt-2">
                Conectado: <span className="font-mono">{shortAddr(address)}</span>
              </div>
            </div>
          </div>

          {/* ✅ Total apostado en el mercado */}
          {marketInfo && (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">💰 Total apostado en el mercado</span>
                <span className="text-lg font-bold">
                  {formatUnits(marketInfo.totalStaked, usdcDecimals)} USDC
                </span>
              </div>
            </div>
          )}

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
                {error ? <div className="mt-2 text-xs text-destructive">{error}</div> : null}
              </div>

              <div className="mt-4">
                <Button className="w-full" onClick={onApproveAndBet} disabled={!canSubmit}>
                  {buttonLabel}
                </Button>

                {needsApproval ? (
                  <div className="mt-2 text-xs text-muted-foreground">Vas a firmar 2 transacciones.</div>
                ) : null}

                {betsClosed ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    *Si el market ya cerró on-chain, el contrato revierte aunque acá se vea "abierto".
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Tus stakes + Claim */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Tus apuestas</div>
                {isLoadingStakes ? (
                  <Badge variant="secondary">Cargando…</Badge>
                ) : (
                  <Badge variant="outline">Total: {formatUnits(stakedTotal, usdcDecimals)} USDC</Badge>
                )}
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span>Local</span>
                  <span className="font-mono">{formatUnits(stakes.home, usdcDecimals)} USDC</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Empate</span>
                  <span className="font-mono">{formatUnits(stakes.draw, usdcDecimals)} USDC</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Visitante</span>
                  <span className="font-mono">{formatUnits(stakes.away, usdcDecimals)} USDC</span>
                </div>
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                Estado market: <span className="font-mono">{marketStateLabel}</span>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Claim</div>
                {claimQ.isLoading ? (
                  <Badge variant="secondary">Cargando…</Badge>
                ) : alreadyClaimed ? (
                  <Badge variant="secondary">Ya reclamado</Badge>
                ) : canClaim ? (
                  <Badge>Disponible</Badge>
                ) : (
                  <Badge variant="outline">No disponible</Badge>
                )}
              </div>

              <div className="mt-3 text-sm">
                {claimQ.isLoading ? (
                  <div className="text-muted-foreground">Leyendo estado on-chain…</div>
                ) : alreadyClaimed ? (
                  <div className="text-muted-foreground">Ya reclamaste este mercado ✅</div>
                ) : claimable > 0n ? (
                  <div>
                    Podés reclamar:{" "}
                    <span className="font-semibold">{formatUnits(claimable, usdcDecimals)} USDC</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground">Todavía no hay nada para reclamar.</div>
                )}
              </div>

              <div className="mt-4">
                <Button
                  className="w-full"
                  disabled={!canClaim || claim.isPending}
                  onClick={() => claim.mutate(marketId)}
                >
                  {claim.isPending ? "Reclamando…" : "Claim"}
                </Button>
              </div>
            </div>
          </div>

          {/* ✅ Odds dinámicas + Pools */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Cuotas y pools (actualización en vivo)</span>
              </div>
              {marketLoading && <Badge variant="secondary">Actualizando...</Badge>}
            </div>
            
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {["Local", "Empate", "Visitante"].map((name, idx) => {
                const poolKey = ['home', 'draw', 'away'][idx] as 'home' | 'draw' | 'away';
                const pool = pools[poolKey];
                const odd = odds[poolKey];
                
                return (
                  <div key={name} className="rounded-xl border p-4">
                    <div className="text-sm text-muted-foreground">{name}</div>
                    <div className="mt-1 text-2xl font-semibold">
                      {odd.toFixed(2)}x
                    </div>
                    <div className="mt-2 pt-2 border-t border-muted-foreground/20 text-xs text-muted-foreground">
                      Pool: {formatUnits(pool, usdcDecimals)} USDC
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
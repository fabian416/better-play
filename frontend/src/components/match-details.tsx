"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { formatUnits } from "viem";
import { Link, useLocation } from "react-router-dom";

import { useContracts } from "~~/providers/contracts-context";
import { useEmbedded } from "~~/providers/embedded-context";

import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card";

import { abbrFor, logoFor } from "~~/lib/team-logos";
import {
  useConnectedAccount,
  useGetMarket,
  usePools,
  usePreviewPayoutPer1,
  useUsdcDecimals,
  useUsdcBalance,
  useApprovalStatus,
  useApprove,
  useBet,
  useClaim,
} from "~~/hooks/useBetterPlay";

import { ArrowLeft, Calendar, MapPin, TrendingUp, Users, Trophy, Target, Clock } from "lucide-react";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  stadium: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  volume: string;
  homeForm: string[];
  awayForm: string[];
  headToHead: string;
  isLive?: boolean;
  isFinalized?: boolean;
  featured?: boolean;
}

interface MatchDetailsProps {
  match: Match;
}

type BetSelection = {
  type: "Local" | "Empate" | "Visitante";
  odds: number;
};

const OUTCOME_INDEX: Record<BetSelection["type"], 0 | 1 | 2> = {
  Local: 0,
  Empate: 1,
  Visitante: 2,
};

const MARKET_STATE_LABEL: Record<number, string> = {
  0: "ABIERTO",
  1: "CERRADO",
  2: "RESUELTO",
  3: "CANCELADO",
};

const WIN_LABEL: Record<number, string> = {
  0: "Local",
  1: "Empate",
  2: "Visitante",
};

// si no lo sabés dejalo 0; ideal setear VITE_BETTERPLAY_DEPLOY_BLOCK
const DEFAULT_FROM_BLOCK = Number(import.meta.env.VITE_BETTERPLAY_DEPLOY_BLOCK ?? 0);

function formatUsdc(amount: bigint, decimals: number, maxFrac = 2) {
  const s = formatUnits(amount, decimals);
  const [wholeRaw, fracRaw = ""] = s.split(".");
  const whole = wholeRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const frac = fracRaw.slice(0, maxFrac).replace(/0+$/, "");
  return frac ? `${whole},${frac}` : whole;
}

function computeClaimable(params: {
  state: number;
  winningOutcome: number;
  feeBps: bigint;
  totalStaked: bigint;
  pools: readonly [bigint, bigint, bigint];
  userStakes: readonly [bigint, bigint, bigint];
}) {
  const { state, winningOutcome, feeBps, totalStaked, pools, userStakes } = params;

  // ✅ En tu contrato: claim() SOLO en Resolved(2) o Canceled(3)
  if (state !== 2 && state !== 3) return 0n;

  const [uHome, uDraw, uAway] = userStakes;

  // Canceled => refund total
  if (state === 3) return uHome + uDraw + uAway;

  // Resolved
  const w = winningOutcome; // 0..2
  const userWinStake = w === 0 ? uHome : w === 1 ? uDraw : uAway;
  if (userWinStake === 0n) return 0n;

  const winnersPool = pools[w] ?? 0n;
  if (winnersPool === 0n) return 0n;

  const losersPool = totalStaked - winnersPool;
  const netLosers = (losersPool * (10_000n - feeBps)) / 10_000n;

  return userWinStake + (userWinStake * netLosers) / winnersPool;
}

const BET_BTN_BASE =
  "cursor-pointer flex h-auto flex-col p-4 sm:p-6 transition-all border-2 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--ring)]";
const BET_BTN_UNSELECTED =
  "bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/60";
const BET_BTN_SELECTED = "border-primary shadow-sm";

export function MatchDetails({ match }: MatchDetailsProps) {
  const { contracts } = useContracts();
  const location = useLocation();
  const { isEmbedded } = useEmbedded();
  const homePath = isEmbedded ? "/embedded" : "/";

  const { data: accountQ } = useConnectedAccount();
  const connected = accountQ as Address | undefined;

  const [selectedBet, setSelectedBet] = useState<BetSelection | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [now, setNow] = useState(() => new Date());

  // ✅ address efectiva para reads (Beexo-safe)
  const [readUserOverride, setReadUserOverride] = useState<Address | undefined>(undefined);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const nowSec = useMemo(() => BigInt(Math.floor(now.getTime() / 1000)), [now]);

  const marketId = useMemo(() => {
    const idNum = Number(match.id);
    return Number.isFinite(idNum) ? BigInt(idNum) : 0n;
  }, [match.id]);

  // Prefill outcome via query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const o = params.get("outcome");
    if (o === "home") setSelectedBet({ type: "Local", odds: match.homeOdds });
    if (o === "draw") setSelectedBet({ type: "Empate", odds: match.drawOdds });
    if (o === "away") setSelectedBet({ type: "Visitante", odds: match.awayOdds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔑 levantar override desde localStorage (guardado por useBet())
  useEffect(() => {
    if (!connected || marketId === 0n) {
      setReadUserOverride(undefined);
      return;
    }
    try {
      const raw = window.localStorage.getItem(`bp:lastBetSender:${marketId.toString()}`);
      setReadUserOverride(raw ? (raw as Address) : undefined);
    } catch {
      setReadUserOverride(undefined);
    }
  }, [connected, marketId]);

  const readUser = (readUserOverride ?? connected) as Address | undefined;

  const outcomeIndex = selectedBet ? OUTCOME_INDEX[selectedBet.type] : undefined;

  const marketQ = useGetMarket(marketId);
  const market = marketQ.data;

  const poolsQ = usePools(marketId);
  const pools = poolsQ.data;

  const per1Enabled = market ? market.state === 0 || market.state === 1 : true;
  const per1Outcome = per1Enabled ? outcomeIndex : undefined;
  const { data: per1e18 } = usePreviewPayoutPer1(marketId, per1Outcome);

  const { data: usdcDecimals } = useUsdcDecimals();
  const decimals = usdcDecimals ?? 6;

  const { data: balance } = useUsdcBalance(connected ?? undefined);

  const userStakesQ = useQuery({
    queryKey: ["betterPlay", "userStakes", marketId.toString(), readUser ?? null] as const,
    enabled: !!readUser && marketId !== 0n,
    queryFn: async () => {
      const { betterPlay } = await contracts();
      const res = (await betterPlay.userStakes(marketId, readUser)) as readonly [bigint, bigint, bigint];
      return res;
    },
    staleTime: 10_000,
  });

  const userStakes = userStakesQ.data ?? [0n, 0n, 0n];
  const stakeHome = userStakes[0];
  const stakeDraw = userStakes[1];
  const stakeAway = userStakes[2];

  const userStakedTotal = stakeHome + stakeDraw + stakeAway;
  const hasUserStake = userStakedTotal > 0n;

  const isFinalOnchain = market ? market.state === 2 || market.state === 3 : false;

  const hasClaimedQ = useQuery({
    queryKey: ["betterPlay", "claimedEvent", marketId.toString(), readUser ?? null] as const,
    enabled: !!readUser && marketId !== 0n && isFinalOnchain && hasUserStake,
    queryFn: async () => {
      const { betterPlay } = await contracts();
      const filter = betterPlay.filters.Claimed(marketId, readUser);
      const logs = await betterPlay.queryFilter(filter, DEFAULT_FROM_BLOCK, "latest");
      return logs.length > 0;
    },
    staleTime: 20_000,
  });

  const alreadyClaimed = !!hasClaimedQ.data;

  const claimable = useMemo(() => {
    if (!market || !pools) return 0n;
    return computeClaimable({
      state: market.state,
      winningOutcome: market.winningOutcome,
      feeBps: market.feeBps,
      totalStaked: market.totalStaked,
      pools,
      userStakes,
    });
  }, [market, pools, userStakes]);

  const claimableHuman = useMemo(() => formatUsdc(claimable, decimals, 2), [claimable, decimals]);

  const { amount, needsApproval } = useApprovalStatus(betAmount);

  const approve = useApprove();
  const bet = useBet();
  const claim = useClaim();

  const submitting = approve.isPending || bet.isPending;

  const marketStateLabel = useMemo(() => {
    if (!market) return "—";
    return MARKET_STATE_LABEL[market.state] ?? `STATE_${market.state}`;
  }, [market]);

  // ✅ Badges: FINAL = solo onchain (o si no hay market, fallback a match)
  const showFinal = market ? isFinalOnchain : !!match.isFinalized;
  const showLive = market ? (market.state === 0 || market.state === 1) && !isFinalOnchain : !!match.isLive;
  const showPending = market ? !isFinalOnchain && !!match.isFinalized : false;

  const bettingClosed = useMemo(() => {
    if (!market) return !!match.isLive || !!match.isFinalized;
    if (market.state !== 0) return true; // solo Open permite apostar
    return nowSec >= market.closeTime;
  }, [market, nowSec, match.isLive, match.isFinalized]);

  const onPlaceBet = async () => {
    if (!connected) return;
    if (bettingClosed) return;
    if (!selectedBet || outcomeIndex === undefined) return;
    if (!amount || amount === 0n) return;

    if (needsApproval) await approve.mutateAsync(amount);

    await bet.mutateAsync({ marketId, outcome: outcomeIndex, amount });

    // refresco override
    try {
      const raw = window.localStorage.getItem(`bp:lastBetSender:${marketId.toString()}`);
      if (raw) setReadUserOverride(raw as Address);
    } catch {}

    setBetAmount("");
  };

  const onClaim = async () => {
    if (!connected) return;
    if (!market || marketId === 0n) return;

    // claim() solo en 2/3
    if (!(market.state === 2 || market.state === 3)) return;
    if (alreadyClaimed) return;
    if (claimable <= 0n) return;

    await claim.mutateAsync(marketId);
  };

  const isSelected = (type: BetSelection["type"]) => selectedBet?.type === type;

  const potential = useMemo(() => {
    if (!selectedBet || !betAmount) return null;
    if (per1e18) return parseFloat(betAmount || "0") * (Number(per1e18) / 1e18);
    return parseFloat(betAmount || "0") * selectedBet.odds;
  }, [selectedBet, betAmount, per1e18]);

  const potentialText = useMemo(() => {
    if (potential === null || Number.isNaN(potential)) return null;
    const fixed = potential.toFixed(2);
    const [w, f] = fixed.split(".");
    const whole = w.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${whole},${f}`;
  }, [potential]);

  const getFormColor = (result: string) => {
    switch (result) {
      case "W":
        return "bg-primary text-primary-foreground";
      case "D":
        return "bg-yellow-500 text-yellow-50";
      case "L":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleBetSelect = (type: BetSelection["type"], odds: number) => setSelectedBet({ type, odds });

  const stakedHomeHuman = useMemo(() => formatUsdc(stakeHome, decimals, 2), [stakeHome, decimals]);
  const stakedDrawHuman = useMemo(() => formatUsdc(stakeDraw, decimals, 2), [stakeDraw, decimals]);
  const stakedAwayHuman = useMemo(() => formatUsdc(stakeAway, decimals, 2), [stakeAway, decimals]);
  const stakedTotalHuman = useMemo(() => formatUsdc(userStakedTotal, decimals, 2), [userStakedTotal, decimals]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-3 sm:px-4">
      <Link to={homePath}>
        <Button variant="ghost" className="mb-4 cursor-pointer">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a partidos
        </Button>
      </Link>

      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-4 text-center">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">Liga Argentina</Badge>

              {showFinal ? (
                <Badge className="border border-destructive text-destructive bg-transparent">
                  FINALIZADO
                </Badge>
              ) : showLive ? (
                <Badge variant="destructive" className="animate-pulse">
                  EN VIVO
                </Badge>
              ) : showPending ? (
                <Badge className="bg-muted text-muted-foreground">
                  PENDIENTE ONCHAIN
                </Badge>
              ) : null}

              <Badge className="bg-muted text-muted-foreground">
                ONCHAIN: {marketStateLabel}
              </Badge>

              {market?.state === 2 && market.winningOutcome !== undefined && (
                <Badge className="bg-muted text-muted-foreground">
                  GANADOR: {WIN_LABEL[market.winningOutcome] ?? market.winningOutcome}
                </Badge>
              )}
            </div>

            <div className="flex items-center text-muted-foreground">
              <TrendingUp className="mr-1 h-4 w-4" />
              <span className="font-semibold">{match.volume}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-8">
              <div className="min-w-0 flex flex-col items-center text-center">
                <div className="mb-1 sm:mb-2 flex items-center justify-center gap-2">
                  <img
                    src={logoFor(match.homeTeam)}
                    alt={match.homeTeam}
                    title={match.homeTeam}
                    className="h-8 w-8 object-contain sm:h-10 sm:w-10"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span
                    className="block max-w-[48vw] sm:max-w-[18rem] truncate text-2xl font-bold leading-tight text-foreground sm:text-3xl"
                    title={match.homeTeam}
                    aria-label={match.homeTeam}
                  >
                    <span className="sm:hidden">{abbrFor(match.homeTeam)}</span>
                    <span className="hidden sm:inline">{match.homeTeam}</span>
                  </span>
                </div>
                <div className="text-xs text-muted-foreground sm:text-sm">Local</div>
              </div>

              <div className="shrink-0 text-center">
                <div className="mb-1 text-lg font-bold text-primary sm:mb-2 sm:text-2xl">VS</div>
                <div className="text-xs text-muted-foreground sm:text-sm">
                  {match.date} • {match.time}
                </div>
              </div>

              <div className="min-w-0 flex flex-col items-center text-center">
                <div className="mb-1 sm:mb-2 flex items-center justify-center gap-2">
                  <img
                    src={logoFor(match.awayTeam)}
                    alt={match.awayTeam}
                    title={match.awayTeam}
                    className="h-8 w-8 object-contain sm:h-10 sm:w-10"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span
                    className="block max-w-[48vw] sm:max-w-[18rem] truncate text-2xl font-bold leading-tight text-foreground sm:text-3xl"
                    title={match.awayTeam}
                    aria-label={match.awayTeam}
                  >
                    <span className="sm:hidden">{abbrFor(match.awayTeam)}</span>
                    <span className="hidden sm:inline">{match.awayTeam}</span>
                  </span>
                </div>
                <div className="text-xs text-muted-foreground sm:text-sm">Visitante</div>
              </div>
            </div>

            <div className="flex items-center justify-center text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4" />
              {match.stadium}
            </div>

            {market?.closeTime ? (
              <div className="text-xs text-muted-foreground">
                Cierre de apuestas (onchain):{" "}
                {new Date(Number(market.closeTime) * 1000).toLocaleString("es-AR", {
                  timeZone: "America/Argentina/Buenos_Aires",
                })}
              </div>
            ) : null}

            {readUser ? (
              <div className="text-[11px] text-muted-foreground">
                Wallet lecturas: {readUser}
                {readUserOverride ? " (detectada por BetPlaced)" : ""}
                {" • "}MarketId: {marketId.toString()}
              </div>
            ) : null}
          </div>
        </CardHeader>

        <CardContent>
          {!!connected && (
            <Card className="mb-6 border-primary/30 bg-primary/10">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="font-semibold">Tus fondos</div>

                  {!market ? (
                    <div className="text-sm text-muted-foreground">Cargando estado on-chain…</div>
                  ) : market.state === 1 ? (
                    <div className="text-sm text-muted-foreground">
                      Está CERRADO (state=1). Todavía no se puede cobrar: falta resolve() (state=2) o cancel() (state=3).
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-md bg-background/60 p-3">
                      <div className="text-xs text-muted-foreground">Local</div>
                      <div className="font-semibold">{stakedHomeHuman} USDC</div>
                    </div>
                    <div className="rounded-md bg-background/60 p-3">
                      <div className="text-xs text-muted-foreground">Empate</div>
                      <div className="font-semibold">{stakedDrawHuman} USDC</div>
                    </div>
                    <div className="rounded-md bg-background/60 p-3">
                      <div className="text-xs text-muted-foreground">Visitante</div>
                      <div className="font-semibold">{stakedAwayHuman} USDC</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                      Total apostado: <span className="font-semibold">{stakedTotalHuman}</span> USDC
                      {!hasUserStake ? " (0 en este market)" : ""}
                      {market?.state === 2 && !alreadyClaimed ? (
                        <>
                          {" • "}Claimable: <span className="font-semibold">{claimableHuman}</span> USDC
                        </>
                      ) : null}
                      {alreadyClaimed ? " • Ya cobraste ✅" : null}
                    </div>

                    <Button
                      onClick={onClaim}
                      disabled={
                        !market ||
                        !(market.state === 2 || market.state === 3) ||
                        alreadyClaimed ||
                        claimable <= 0n ||
                        claim.isPending
                      }
                      className="bg-primary hover:bg-primary/90"
                    >
                      {claim.isPending ? "Cobrando..." : "Cobrar"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Betting options */}
          <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
            <Button
              size="lg"
              variant={isSelected("Local") ? "default" : "outline"}
              className={`${BET_BTN_BASE} ${isSelected("Local") ? BET_BTN_SELECTED : BET_BTN_UNSELECTED}`}
              onClick={() => handleBetSelect("Local", match.homeOdds)}
            >
              <Trophy className="mb-2 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="mb-1 text-xs sm:text-sm">Gana {abbrFor(match.homeTeam)}</span>
            </Button>

            <Button
              size="lg"
              variant={isSelected("Empate") ? "default" : "outline"}
              className={`${BET_BTN_BASE} ${isSelected("Empate") ? BET_BTN_SELECTED : BET_BTN_UNSELECTED}`}
              onClick={() => handleBetSelect("Empate", match.drawOdds)}
            >
              <Users className="mb-2 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="mb-1 text-xs sm:text-sm">Empate</span>
            </Button>

            <Button
              size="lg"
              variant={isSelected("Visitante") ? "default" : "outline"}
              className={`${BET_BTN_BASE} ${isSelected("Visitante") ? BET_BTN_SELECTED : BET_BTN_UNSELECTED}`}
              onClick={() => handleBetSelect("Visitante", match.awayOdds)}
            >
              <Target className="mb-2 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="mb-1 text-xs sm:text-sm">Gana {abbrFor(match.awayTeam)}</span>
            </Button>
          </div>

          {/* Bet slip */}
          {selectedBet && (
            <Card className="border-primary/30 bg-primary/10">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-semibold">Apuesta seleccionada:</span>
                  <Badge className="bg-primary text-primary-foreground">
                    {selectedBet.type} ({selectedBet.odds})
                  </Badge>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Monto (USDC)"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2"
                    disabled={bettingClosed}
                  />
                  <Button
                    onClick={onPlaceBet}
                    disabled={bettingClosed || submitting || !connected || !betAmount}
                    className="bg-primary hover:bg-primary/90 sm:w-auto w-full"
                  >
                    {bettingClosed
                      ? "Apuestas cerradas"
                      : needsApproval
                      ? submitting
                        ? "Aprobando..."
                        : "Aprobar y Apostar"
                      : submitting
                      ? "Apostando..."
                      : "Apostar"}
                  </Button>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                  {balance !== undefined && (
                    <div>
                      Saldo: <span className="font-semibold">{formatUsdc(balance, decimals, 2)}</span>{" "}
                      USDC
                    </div>
                  )}
                  {potentialText && (
                    <div aria-live="polite">
                      Ganancia potencial: <span className="font-semibold">${potentialText}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Team stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-primary" />
              {match.homeTeam} - Forma Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              {match.homeForm.map((result, index) => (
                <Badge
                  key={index}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${getFormColor(result)}`}
                >
                  {result}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Últimos 5 partidos (más reciente a la izquierda)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5 text-primary" />
              {match.awayTeam} - Forma Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              {match.awayForm.map((result, index) => (
                <Badge
                  key={index}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${getFormColor(result)}`}
                >
                  {result}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Últimos 5 partidos (más reciente a la izquierda)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Historial Directo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{match.headToHead}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-primary" />
            Información del Partido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-3 text-center sm:p-4">
              <Calendar className="mx-auto mb-2 h-6 w-6 text-primary" />
              <div className="font-semibold">Fecha</div>
              <div className="text-sm text-muted-foreground">{match.date}</div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-center sm:p-4">
              <Clock className="mx-auto mb-2 h-6 w-6 text-primary" />
              <div className="font-semibold">Hora</div>
              <div className="text-sm text-muted-foreground">{match.time}</div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-center sm:p-4">
              <MapPin className="mx-auto mb-2 h-6 w-6 text-primary" />
              <div className="font-semibold">Estadio</div>
              <div className="text-sm text-muted-foreground">{match.stadium}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useContracts } from "~~/providers/contracts-context";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card";
import { abbrFor, logoFor } from "~~/lib/team-logos";
import {
  usePools,
  usePreviewPayoutPer1,
  useUsdcDecimals,
  useUsdcBalance,
  useUsdcAllowance,
  useApprovalStatus,
  useApprove,
  useBet,
} from "~~/hooks/useBetterPlay";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  TrendingUp,
  Users,
  Trophy,
  Target,
  Clock,
} from "lucide-react";
import { useEmbedded } from "~~/providers/embedded-context";

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

export function MatchDetails({ match }: MatchDetailsProps) {
  const { account: address } = useContracts();
  const location = useLocation();
  const { isEmbedded } = useEmbedded();
  const homePath = isEmbedded ? "/embedded" : "/";

  const [selectedBet, setSelectedBet] = useState<BetSelection | null>(null);
  const [betAmount, setBetAmount] = useState("");

  const marketId = useMemo(() => {
    const idNum = Number(match.id);
    return Number.isFinite(idNum) ? BigInt(idNum) : 0n;
  }, [match.id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const o = params.get("outcome");
    if (o === "home") setSelectedBet({ type: "Local", odds: match.homeOdds });
    if (o === "draw") setSelectedBet({ type: "Empate", odds: match.drawOdds });
    if (o === "away") setSelectedBet({ type: "Visitante", odds: match.awayOdds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const outcomeIndex = selectedBet ? OUTCOME_INDEX[selectedBet.type] : undefined;

  const { data: pools } = usePools(marketId);
  const { data: per1e18 } = usePreviewPayoutPer1(marketId, outcomeIndex);
  const { data: usdcDecimals } = useUsdcDecimals();
  const { data: allowance } = useUsdcAllowance(address as `0x${string}` | undefined);
  const { data: balance } = useUsdcBalance(address as `0x${string}` | undefined);

  const { amount, needsApproval } = useApprovalStatus(betAmount);

  const approve = useApprove();
  const bet = useBet();

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

  const potential = useMemo(() => {
    if (!selectedBet || !betAmount) return null;
    if (!per1e18) return (parseFloat(betAmount || "0") * selectedBet.odds).toFixed(2);
    const multiplier = Number(per1e18) / 1e18;
    const val = parseFloat(betAmount || "0") * multiplier;
    return val.toFixed(2);
  }, [selectedBet, betAmount, per1e18]);

  const submitting = approve.isPending || bet.isPending;

  const onPlaceBet = async () => {
    if (!address) return;
    if (!selectedBet || outcomeIndex === undefined) return;
    if (!amount || amount === 0n) return;

    if (needsApproval) {
      await approve.mutateAsync(amount);
    }
    await bet.mutateAsync({
      marketId,
      outcome: outcomeIndex,
      amount,
    });

    setBetAmount("");
  };

  const isSelected = (type: BetSelection["type"]) => selectedBet?.type === type;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-3 sm:px-4">
      {/* Back button con prefix */}
      <Link to={homePath}>
        <Button variant="ghost" className="mb-4 cursor-pointer">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a partidos
        </Button>
      </Link>

      {/* Main match card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-4 text-center">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <Badge className="bg-primary text-primary-foreground">Liga Argentina</Badge>
            <div className="flex items-center text-muted-foreground">
              <TrendingUp className="mr-1 h-4 w-4" />
              <span className="font-semibold">{match.volume}</span>
            </div>
          </div>

          {/* === Responsive header optimizado para wallet === */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-8">
              {/* Home */}
              <div className="min-w-0 flex flex-col items-center text-center">
                <div className="mb-1 sm:mb-2 flex items-center justify-center gap-2">
                  <img
                    src={logoFor(match.homeTeam)}
                    alt={match.homeTeam}
                    title={match.homeTeam}
                    className="h-8 w-8 object-contain sm:h-10 sm:w-10"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
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

              {/* VS & date */}
              <div className="shrink-0 text-center">
                <div className="mb-1 text-lg font-bold text-primary sm:mb-2 sm:text-2xl">VS</div>
                <div className="text-xs text-muted-foreground sm:text-sm">
                  {match.date} • {match.time}
                </div>
              </div>

              {/* Away */}
              <div className="min-w-0 flex flex-col items-center text-center">
                <div className="mb-1 sm:mb-2 flex items-center justify-center gap-2">
                  <img
                    src={logoFor(match.awayTeam)}
                    alt={match.awayTeam}
                    title={match.awayTeam}
                    className="h-8 w-8 object-contain sm:h-10 sm:w-10"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
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
          </div>
        </CardHeader>

        <CardContent>
          {/* Betting options */}
          <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
            <Button
              size="lg"
              variant={isSelected("Local") ? "default" : "outline"}
              className={`cursor-pointer flex h-auto flex-col p-4 sm:p-6 transition-all ${
                isSelected("Local") ? "" : "bg-transparent hover:bg-primary hover:text-primary-foreground"
              } border-2 hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--ring)]`}
              onClick={() => handleBetSelect("Local", match.homeOdds)}
            >
              <Trophy className="mb-2 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="mb-1 text-xs sm:text-sm">Gana {abbrFor(match.homeTeam)}</span>
              <span className="text-xl font-bold sm:text-2xl">{match.homeOdds}</span>
            </Button>

            <Button
              size="lg"
              variant={isSelected("Empate") ? "default" : "outline"}
              className={`cursor-pointer flex h-auto flex-col p-4 sm:p-6 transition-all ${
                isSelected("Empate") ? "" : "bg-transparent hover:bg-primary hover:text-primary-foreground"
              } border-2 hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--ring)]`}
              onClick={() => handleBetSelect("Empate", match.drawOdds)}
            >
              <Users className="mb-2 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="mb-1 text-xs sm:text-sm">Empate</span>
              <span className="text-xl font-bold sm:text-2xl">{match.drawOdds}</span>
            </Button>

            <Button
              size="lg"
              variant={isSelected("Visitante") ? "default" : "outline"}
              className={`cursor-pointer flex h-auto flex-col p-4 sm:p-6 transition-all ${
                isSelected("Visitante") ? "" : "bg-transparent hover:bg-primary hover:text-primary-foreground"
              } border-2 hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--ring)]`}
              onClick={() => handleBetSelect("Visitante", match.awayOdds)}
            >
              <Target className="mb-2 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="mb-1 text-xs sm:text-sm">Gana {abbrFor(match.awayTeam)}</span>
              <span className="text-xl font-bold sm:text-2xl">{match.awayOdds}</span>
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
                    placeholder="Monto ($)"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2"
                  />
                  <Button
                    onClick={onPlaceBet}
                    disabled={submitting || !address || !betAmount}
                    className="bg-primary hover:bg-primary/90 sm:w-auto w-full"
                  >
                    {needsApproval
                      ? (submitting ? "Aprobando..." : "Aprobar y Apostar")
                      : (submitting ? "Apostando..." : "Apostar")}
                  </Button>
                </div>

                {potential && (
                  <div className="mt-2 text-sm text-muted-foreground" aria-live="polite">
                    Ganancia potencial: ${potential}
                  </div>
                )}
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

      {/* Head to head */}
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

      {/* Match info */}
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

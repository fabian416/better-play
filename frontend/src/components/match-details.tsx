import * as React from "react";
import type { Match } from "~~/data/matches";
import { Card, CardContent } from "~~/components/ui/card";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Calendar, Clock, MapPin } from "lucide-react";
import { logoFor, abbrFor } from "~~/lib/team-logos";

type Props = {
  match: Match;
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

export default function MatchDetails({ match }: Props) {
  const currentMs = Date.now();

  const closeTimeUnix = match.closeTimeUnix; // number | undefined
  const betsClosed =
    typeof closeTimeUnix === "number" ? currentMs >= closeTimeUnix * 1000 : false;

  const betsCloseTime = match.betsCloseTime ?? match.time; // string | undefined

  const homeAbbr = abbrFor(match.homeTeam);
  const awayAbbr = abbrFor(match.awayTeam);

  const homeLogo = logoFor(match.homeTeam);
  const awayLogo = logoFor(match.awayTeam);

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
                    <div className="text-xs text-muted-foreground">{homeAbbr}</div>
                  </div>
                </div>

                <div className="text-2xl font-semibold text-muted-foreground">vs</div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Visitante</div>
                    <div className="text-lg font-medium">{match.awayTeam}</div>
                    <div className="text-xs text-muted-foreground">{awayAbbr}</div>
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

            {/* Meta */}
            <div className="rounded-xl border p-4">
              <div className="text-sm text-muted-foreground">Info</div>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span>Partido</span>
                  <span className="font-medium">
                    {formatLocalDateTime(match.date, match.time)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Cierre apuestas</span>
                  <span className="font-medium">
                    {formatLocalDateTime(match.date, betsCloseTime)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Volumen</span>
                  <span className="font-medium">{match.volume ?? "-"}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button className="flex-1" disabled={betsClosed}>
                  Apostar
                </Button>
                <Button variant="secondary" className="flex-1">
                  Ver mercado
                </Button>
              </div>
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

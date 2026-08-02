import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { BetPanel } from "@/components/BetPanel";
import { SignInGate } from "@/components/SignInGate";
import { CrashGame } from "@/components/games/CrashGame";
import { RoadGame } from "@/components/games/RoadGame";
import { TowerGame } from "@/components/games/TowerGame";
import { MinesGame } from "@/components/games/MinesGame";
import { DiceGame } from "@/components/games/DiceGame";
import { ColorGame } from "@/components/games/ColorGame";
import { GAMES, getGame, formatCoins } from "@/lib/games";
import { usePlayRound, usePlayer, useSession, useHistory } from "@/lib/player";

export const Route = createFileRoute("/game/$slug")({
  loader: ({ params }) => {
    const game = getGame(params.slug);
    if (!game) throw notFound();
    return { name: game.name, tagline: game.tagline, studio: game.studio };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Play free on 3CR Arcade` },
          { name: "description", content: `${loaderData.tagline} Free-to-play with virtual coins on 3CR Arcade.` },
          { property: "og:title", content: `${loaderData.name} — 3CR Arcade` },
          { property: "og:description", content: loaderData.tagline },
        ]
      : [],
  }),
  component: GamePage,
});

function GamePage() {
  const { slug } = Route.useParams();
  const game = getGame(slug)!;
  const { user } = useSession();
  const { data: player } = usePlayer();
  const play = usePlayRound();
  const { data: history } = useHistory(8);
  const [bet, setBet] = useState(50);

  const balance = player?.balance ?? 0;

  const settle = async (multiplier: number, details: Record<string, unknown>) => {
    try {
      await play.mutateAsync({ game: slug, bet, multiplier, details });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Round could not be recorded");
    }
  };

  const engineProps = { bet, balance, busy: play.isPending, settle };
  const related = GAMES.filter((g) => g.slug !== slug).slice(0, 6);

  return (
    <AppShell>
      <div className="px-3 py-4">
        <Link
          to="/"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Lobby
        </Link>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-low p-3">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 90% 10%, var(--glow-primary), transparent 55%)",
            }}
          />
          <div className="relative flex items-center gap-3">
            <img
              src={game.image}
              alt=""
              width={512}
              height={512}
              className="size-16 rounded-xl border border-border object-cover shadow-[var(--shadow-glow)]"
            />
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-extrabold">{game.name}</h1>
              <p className="truncate text-xs text-muted-foreground">
                {game.studio} · {game.tagline}
              </p>
              {user && (
                <span className="label-mono mt-1.5 inline-block rounded-full border border-accent/50 bg-accent/15 px-2 py-1 text-accent">
                  Balance {formatCoins(balance)}
                </span>
              )}
            </div>
          </div>
        </div>


        <div className="mt-4 space-y-3">
          {!user ? (
            <SignInGate what={`play ${game.name}`} />
          ) : (
            <>
              {game.engine === "crash" && <CrashGame game={game} {...engineProps} />}
              {game.engine === "road" && <RoadGame game={game} {...engineProps} />}
              {game.engine === "tower" && <TowerGame game={game} {...engineProps} />}
              {game.engine === "mines" && <MinesGame {...engineProps} />}
              {game.engine === "dice" && <DiceGame {...engineProps} />}
              {game.engine === "color" && <ColorGame {...engineProps} />}

              <BetPanel bet={bet} onBet={setBet} balance={balance} disabled={play.isPending} />
            </>
          )}
        </div>

        {history && history.length > 0 && (
          <section className="mt-6">
            <h2 className="label-mono mb-2 text-muted-foreground">Your last rounds</h2>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-low">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <span className="truncate text-muted-foreground">
                    {getGame(h.game_slug)?.name ?? h.game_slug}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      Number(h.payout) > Number(h.bet) ? "text-accent" : "text-muted-foreground"
                    }`}
                  >
                    {Number(h.payout) > 0 ? "+" : ""}
                    {formatCoins(Number(h.payout) - Number(h.bet))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-bold">More games</h2>
          <div className="grid grid-cols-3 gap-2">
            {related.map((g) => (
              <Link
                key={g.slug}
                to="/game/$slug"
                params={{ slug: g.slug }}
                className="flex flex-col active:scale-95"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg border border-border">
                  <img
                    src={g.image}
                    alt={g.name}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="size-full object-cover"
                  />
                  <span className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-surface-lowest to-transparent p-1.5 text-[10px] font-bold uppercase text-foreground">
                    {g.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

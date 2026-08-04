import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, Flame } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CATEGORIES, GAMES, formatCoins, type Category } from "@/lib/games";
import { usePlayer, usePublicWins, useSession } from "@/lib/player";
import heroCoins from "@/assets/hero-coins.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "3CR Arcade — Free Crash, Mines & Skill Games" },
      {
        name: "description",
        content:
          "Play Aviator, Chicken Road 2, Tower Rush, Mines, JetX and more in one free-to-play arcade. Virtual coins only — no deposits, no cash-outs.",
      },
      { property: "og:title", content: "3CR Arcade — Free Crash, Mines & Skill Games" },
      {
        property: "og:description",
        content: "Ten playable arcade titles, one free coin balance. No real money involved.",
      },
    ],
  }),
  component: Home,
});

function JackpotCounter() {
  const [pot, setPot] = useState(3127798);
  useEffect(() => {
    const t = setInterval(() => setPot((p) => p + Math.floor(Math.random() * 9) + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const digits = String(pot).padStart(7, "0").split("");

  return (
    <div className="flex flex-[1.5] flex-col rounded-lg border border-border bg-surface-high p-3">
      <span className="label-mono w-max rounded border border-primary/70 bg-primary/15 px-2 py-1 text-primary">
        Daily Jackpot
      </span>
      <div className="mt-4 flex items-center justify-center gap-0.5">
        <span className="rounded-sm border border-border bg-surface-lowest px-1.5 py-1.5 font-display text-base font-bold">
          🪙
        </span>
        {digits.map((d, i) => (
          <span
            key={i}
            className="animate-tick rounded-sm bg-foreground px-1.5 py-1.5 font-mono text-lg font-bold leading-none text-background"
          >
            {d}
          </span>
        ))}
      </div>
      <p className="label-mono mt-3 text-center text-muted-foreground">Coins, not currency</p>
    </div>
  );
}

function Countdown() {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const end = new Date();
    end.setHours(24, 0, 0, 0);
    const tick = () => {
      const s = Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
      setLeft(
        `${String(Math.floor(s / 3600)).padStart(2, "0")}h : ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m : ${String(s % 60).padStart(2, "0")}s`,
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return <span>{left}</span>;
}

function Home() {
  const { user } = useSession();
  const { data: player } = usePlayer();
  const { data: wins } = usePublicWins();
  const [cat, setCat] = useState<Category>("crash");

  const list = GAMES.filter((g) => g.categories.includes(cat));

  return (
    <AppShell>
      <h1 className="sr-only">3CR Arcade — free-to-play crash and skill games</h1>

      {/* Hero */}
      <section className="px-3 pt-4">
        <div className="relative h-48 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/40">
          <div className="relative z-10 flex h-full flex-col justify-center p-6">
            <p className="label-mono text-primary-foreground/70">Free to play · no deposits</p>
            <p className="mt-1 font-display text-[26px] font-extrabold leading-tight text-primary-foreground">
              Sign up &amp; get
              <br />
              1,000 coins
            </p>
            <Link
              to={user ? "/wheel" : "/auth"}
              search={user ? undefined : { mode: "up" as const }}
              className="mt-4 w-max rounded-full bg-primary-foreground px-6 py-2 font-display text-sm font-bold text-primary shadow-xl active:scale-95"
            >
              {user ? "Spin daily bonus" : "Join now"}
            </Link>
          </div>
          <img
            src={heroCoins}
            alt=""
            width={768}
            height={768}
            className="pointer-events-none absolute -right-6 top-2 size-44 rotate-12 object-contain"
          />
        </div>
      </section>

      {/* Pots */}
      <section className="mt-6 flex gap-2 px-3">
        <div className="flex flex-1 flex-col rounded-lg border border-border bg-surface-high p-3">
          <span className="label-mono text-muted-foreground">Your coins</span>
          <div className="mt-2 flex flex-1 flex-col items-center justify-center">
            <span className="text-3xl" aria-hidden>
              🏆
            </span>
            <p className="mt-1 font-display text-lg font-bold text-accent">
              {player ? formatCoins(player.balance) : "—"}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="size-3" aria-hidden />
            <Countdown />
          </div>
        </div>
        <JackpotCounter />
      </section>

      {/* Colour Trading spotlight */}
      <section className="mt-6 px-3">
        <Link
          to="/game/$slug"
          params={{ slug: "color-trading" }}
          className="flex items-center gap-3 overflow-hidden rounded-2xl border border-accent/40 bg-accent/10 p-3 active:scale-[0.98]"
        >
          <img
            src={GAMES.find((g) => g.slug === "color-trading")?.image}
            alt="Colour Trading"
            loading="lazy"
            width={512}
            height={512}
            className="size-20 rounded-xl border border-border object-cover"
          />
          <div className="min-w-0">
            <span className="label-mono rounded-full bg-accent px-2 py-0.5 text-accent-foreground">
              Live now
            </span>
            <h2 className="mt-1 font-display text-lg font-bold">Colour Trading</h2>
            <p className="truncate text-xs text-muted-foreground">
              Green, red or violet every period — up to 9x.
            </p>
          </div>
        </Link>
      </section>

      {/* Recent wins */}
      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2 px-3">
          <Flame className="size-4 text-primary" aria-hidden />
          <h2 className="font-display text-lg font-bold">Recent big wins</h2>
        </div>
        {wins && wins.length > 0 ? (
          <div className="no-scrollbar flex gap-4 overflow-x-auto px-3 pb-2">
            {wins.map((w) => {
              const g = GAMES.find((x) => x.slug === w.game_slug);
              return (
                <Link
                  key={w.id}
                  to="/game/$slug"
                  params={{ slug: w.game_slug }}
                  className="w-20 shrink-0 text-center"
                >
                  <div className="mb-1 size-20 overflow-hidden rounded-lg border border-border bg-surface-high">
                    {g && (
                      <img
                        src={g.image}
                        alt={g.name}
                        loading="lazy"
                        width={512}
                        height={512}
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                  <p className="label-mono text-primary">x{Number(w.multiplier).toFixed(2)}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{w.masked_player}</p>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="px-3 text-sm text-muted-foreground">
            No big wins yet today — be the first on the board.
          </p>
        )}
      </section>

      {/* Category tabs */}
      <section className="mt-6 border-b border-border">
        <div className="no-scrollbar flex items-center justify-around overflow-x-auto px-3 py-3">
          {CATEGORIES.map((c) => {
            const active = c.id === cat;
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`relative flex shrink-0 flex-col items-center gap-1.5 px-3 ${
                  active ? "text-primary" : "text-muted-foreground opacity-70"
                }`}
              >
                <span className="text-xl" aria-hidden>
                  {c.icon}
                </span>
                <span className="label-mono">{c.label}</span>
                {active && (
                  <span className="absolute -bottom-2 h-[3px] w-3/5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Grid */}
      <section className="mt-6 px-3">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold capitalize">
            {cat}: <span className="text-primary">{list.length}</span>
          </h2>
          <Link
            to="/explore"
            className="label-mono rounded-lg bg-surface-high px-4 py-2 text-muted-foreground"
          >
            More →
          </Link>
        </div>

        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nothing in this category yet. Try Crash or Table.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {list.map((g) => (
              <GameTile key={g.slug} slug={g.slug} />
            ))}
          </div>
        )}
      </section>

      <p className="mt-10 px-4 pb-6 text-center text-xs leading-relaxed text-muted-foreground">
        3CR Arcade is a free-to-play entertainment app. Coins have no monetary value, cannot be
        purchased, and cannot be exchanged for money or prizes.
      </p>
    </AppShell>
  );
}

export function GameTile({ slug }: { slug: string }) {
  const g = GAMES.find((x) => x.slug === slug);
  if (!g) return null;
  return (
    <Link to="/game/$slug" params={{ slug: g.slug }} className="flex flex-col active:scale-95">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border">
        <img
          src={g.image}
          alt={g.name}
          loading="lazy"
          width={512}
          height={512}
          className="size-full object-cover"
        />
        <span className="label-mono absolute right-0 top-0 rounded-bl bg-surface-lowest/85 px-1.5 py-1 text-[8px] text-foreground">
          {g.studio}
        </span>
        <span className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-surface-lowest to-transparent p-1.5 text-[10px] font-bold uppercase leading-tight text-foreground">
          {g.name}
        </span>
      </div>
    </Link>
  );
}

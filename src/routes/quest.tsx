import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SignInGate } from "@/components/SignInGate";
import { useHistory, usePlayer, useSession } from "@/lib/player";
import { formatCoins } from "@/lib/games";

export const Route = createFileRoute("/quest")({
  head: () => ({
    meta: [
      { title: "Daily quests — 3CR Arcade" },
      {
        name: "description",
        content: "Complete daily arcade quests: play rounds, hit multipliers and grow your coins.",
      },
      { property: "og:title", content: "Daily quests — 3CR Arcade" },
      { property: "og:description", content: "Track your daily arcade quest progress." },
    ],
  }),
  component: Quest,
});

function Quest() {
  const { user } = useSession();
  const { data: player } = usePlayer();
  const { data: history } = useHistory(100);

  const today = new Date().toDateString();
  const rounds = (history ?? []).filter((h) => new Date(h.created_at).toDateString() === today);
  const wagered = rounds.reduce((s, h) => s + Number(h.bet), 0);
  const bigWin = rounds.filter((h) => Number(h.multiplier) >= 3).length;
  const games = new Set(rounds.map((h) => h.game_slug)).size;

  const quests = [
    { label: "Play 5 rounds today", now: rounds.length, goal: 5 },
    { label: "Wager 500 coins", now: wagered, goal: 500 },
    { label: "Hit a 3x or better", now: bigWin, goal: 1 },
    { label: "Try 3 different games", now: games, goal: 3 },
  ];

  return (
    <AppShell>
      <div className="px-3 py-5">
        <h1 className="font-display text-2xl font-extrabold">Daily quests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Progress resets at midnight. Rewards are bragging rights and coins only.
        </p>

        {!user ? (
          <div className="mt-4">
            <SignInGate what="track quests" />
          </div>
        ) : (
          <>
            <p className="mt-4 label-mono text-muted-foreground">
              Balance: <span className="text-primary">{player ? formatCoins(player.balance) : "—"}</span>
            </p>
            <ul className="mt-4 space-y-2">
              {quests.map((q) => {
                const done = q.now >= q.goal;
                const pct = Math.min(100, (q.now / q.goal) * 100);
                return (
                  <li key={q.label} className="rounded-xl border border-border bg-surface-high p-4">
                    <div className="flex items-center gap-2">
                      {done ? (
                        <CheckCircle2 className="size-5 text-accent" aria-hidden />
                      ) : (
                        <Circle className="size-5 text-muted-foreground" aria-hidden />
                      )}
                      <span className="flex-1 text-sm font-medium">{q.label}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {Math.min(q.now, q.goal)}/{q.goal}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-lowest">
                      <div
                        className={`h-full rounded-full ${done ? "bg-accent" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </AppShell>
  );
}

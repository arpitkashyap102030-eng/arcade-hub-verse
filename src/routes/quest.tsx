import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, Flame, Gift } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { SignInGate } from "@/components/SignInGate";
import {
  useClaimQuest,
  useHistory,
  usePlayer,
  useQuestClaims,
  useSession,
} from "@/lib/player";
import { formatCoins } from "@/lib/games";

export const Route = createFileRoute("/quest")({
  head: () => ({
    meta: [
      { title: "Daily quests — 3CR Arcade" },
      {
        name: "description",
        content:
          "Claim daily check-in coins, complete play quests and keep your streak alive on 3CR Arcade.",
      },
      { property: "og:title", content: "Daily quests — 3CR Arcade" },
      {
        property: "og:description",
        content: "Daily check-in, play quests and streak rewards — free coins every day.",
      },
    ],
  }),
  component: Quest,
});

type Quest = { key: string; label: string; hint: string; now: number; goal: number; reward: number };

function Quest() {
  const { user } = useSession();
  const { data: player } = usePlayer();
  const { data: history } = useHistory(200);
  const { data: claims } = useQuestClaims();
  const claim = useClaimQuest();

  const today = new Date().toDateString();
  const rounds = (history ?? []).filter((h) => new Date(h.created_at).toDateString() === today);
  const wagered = rounds.reduce((s, h) => s + Number(h.bet), 0);
  const bigWin = rounds.filter((h) => Number(h.multiplier) >= 3).length;
  const games = new Set(rounds.map((h) => h.game_slug)).size;

  const todayIso = new Date().toISOString().slice(0, 10);
  const claimedToday = new Set(
    (claims ?? []).filter((c) => c.quest_date === todayIso).map((c) => c.quest_key),
  );

  /** Consecutive days with at least one claim, ending today. */
  const claimDays = new Set((claims ?? []).map((c) => c.quest_date));
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (claimDays.has(d.toISOString().slice(0, 10))) streak++;
    else if (i > 0) break;
  }

  const quests: Quest[] = [
    { key: "check_in", label: "Daily check-in", hint: "Open the app today", now: 1, goal: 1, reward: 50 },
    { key: "play_5", label: "Play 5 rounds", hint: "Any game counts", now: rounds.length, goal: 5, reward: 100 },
    { key: "wager_500", label: "Wager 500 coins", hint: "Total bets today", now: wagered, goal: 500, reward: 150 },
    { key: "big_win", label: "Hit a 3x or better", hint: "One big win today", now: bigWin, goal: 1, reward: 200 },
    { key: "three_games", label: "Try 3 different games", hint: "Explore the lobby", now: games, goal: 3, reward: 150 },
    { key: "play_20", label: "Marathon: 20 rounds", hint: "For the grinders", now: rounds.length, goal: 20, reward: 300 },
  ];

  const totalToday = quests.reduce((s, q) => s + q.reward, 0);
  const claimedCoins = (claims ?? [])
    .filter((c) => c.quest_date === todayIso)
    .reduce((s, c) => s + Number(c.reward), 0);

  return (
    <AppShell>
      <div className="px-3 py-5">
        <h1 className="font-display text-2xl font-extrabold">Daily quests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Come back every day — quests reset at midnight UTC and pay real coins.
        </p>

        {!user ? (
          <div className="mt-4">
            <SignInGate what="track quests" />
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border bg-surface-low p-3">
                <p className="label-mono text-muted-foreground">Balance</p>
                <p className="font-mono text-sm font-bold text-primary">
                  {player ? formatCoins(player.balance) : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-low p-3">
                <p className="label-mono text-muted-foreground">Streak</p>
                <p className="flex items-center gap-1 font-mono text-sm font-bold text-accent">
                  <Flame className="size-4" aria-hidden /> {streak}d
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-low p-3">
                <p className="label-mono text-muted-foreground">Claimed</p>
                <p className="font-mono text-sm font-bold">
                  {claimedCoins}/{totalToday}
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {quests.map((q) => {
                const done = q.now >= q.goal;
                const claimed = claimedToday.has(q.key);
                const pct = Math.min(100, (q.now / q.goal) * 100);
                return (
                  <li key={q.key} className="rounded-xl border border-border bg-surface-high p-4">
                    <div className="flex items-center gap-2">
                      {claimed ? (
                        <CheckCircle2 className="size-5 text-accent" aria-hidden />
                      ) : (
                        <Circle className="size-5 text-muted-foreground" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{q.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{q.hint}</p>
                      </div>
                      <span className="flex items-center gap-1 font-mono text-xs text-primary">
                        <Gift className="size-3.5" aria-hidden />+{q.reward}
                      </span>
                    </div>

                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-lowest">
                      <div
                        className={`h-full rounded-full ${done ? "bg-accent" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {Math.min(Math.floor(q.now), q.goal)}/{q.goal}
                      </span>
                      <button
                        type="button"
                        disabled={!done || claimed || claim.isPending}
                        onClick={() =>
                          claim
                            .mutateAsync(q.key)
                            .then(() => toast.success(`+${q.reward} coins claimed!`))
                            .catch((e: Error) => toast.error(e.message))
                        }
                        className="h-9 rounded-lg bg-primary px-4 font-display text-xs font-bold uppercase text-primary-foreground disabled:opacity-40"
                      >
                        {claimed ? "Claimed" : done ? "Claim" : "Locked"}
                      </button>
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

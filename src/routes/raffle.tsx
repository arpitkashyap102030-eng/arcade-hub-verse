import { createFileRoute } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SignInGate } from "@/components/SignInGate";
import { useHistory, useSession } from "@/lib/player";
import { usePublicWins } from "@/lib/player";
import { getGame } from "@/lib/games";

export const Route = createFileRoute("/raffle")({
  head: () => ({
    meta: [
      { title: "Weekly raffle — 3CR Arcade" },
      {
        name: "description",
        content: "Earn free raffle tickets by playing rounds and watch the community leaderboard.",
      },
      { property: "og:title", content: "Weekly raffle — 3CR Arcade" },
      { property: "og:description", content: "Free tickets earned by playing. No purchases." },
    ],
  }),
  component: Raffle,
});

function Raffle() {
  const { user } = useSession();
  const { data: history } = useHistory(100);
  const { data: wins } = usePublicWins();

  const tickets = Math.floor((history ?? []).length / 5);

  return (
    <AppShell>
      <div className="px-3 py-5">
        <h1 className="font-display text-2xl font-extrabold">Weekly raffle</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every 5 rounds played earns 1 free ticket. Tickets cannot be bought.
        </p>

        {!user ? (
          <div className="mt-4">
            <SignInGate what="collect raffle tickets" />
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-4 rounded-xl border border-primary/40 bg-primary/10 p-5">
            <Ticket className="size-10 text-primary" aria-hidden />
            <div>
              <p className="font-mono text-3xl font-bold text-primary">{tickets}</p>
              <p className="label-mono text-muted-foreground">tickets this week</p>
            </div>
          </div>
        )}

        <h2 className="mt-8 font-display text-lg font-bold">Community leaderboard</h2>
        {wins && wins.length > 0 ? (
          <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-low">
            {wins.map((w, i) => (
              <li key={w.id} className="flex items-center gap-3 px-3 py-3">
                <span className="w-5 font-mono text-sm text-muted-foreground">{i + 1}</span>
                <span className="flex-1 truncate text-sm">{w.masked_player}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {getGame(w.game_slug)?.name ?? w.game_slug}
                </span>
                <span className="font-mono text-sm font-bold text-accent">
                  x{Number(w.multiplier).toFixed(2)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No entries yet this week.</p>
        )}
      </div>
    </AppShell>
  );
}

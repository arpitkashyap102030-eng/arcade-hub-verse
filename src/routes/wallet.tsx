import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SignInGate } from "@/components/SignInGate";
import { useHistory, usePlayer, useSession } from "@/lib/player";
import { formatCoins, getGame } from "@/lib/games";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Your coins & history — 3CR Arcade" },
      {
        name: "description",
        content: "Track your virtual coin balance, total wagered and every round you've played.",
      },
      { property: "og:title", content: "Your coins & history — 3CR Arcade" },
      { property: "og:description", content: "Balance and round history for your arcade account." },
    ],
  }),
  component: Wallet,
});

function Wallet() {
  const { user } = useSession();
  const { data: player } = usePlayer();
  const { data: history } = useHistory(40);

  return (
    <AppShell>
      <div className="px-3 py-5">
        <h1 className="font-display text-2xl font-extrabold">Your coins</h1>

        {!user ? (
          <div className="mt-4">
            <SignInGate what="see your balance" />
          </div>
        ) : (
          <>
            <div className="mt-4 rounded-xl border border-primary/40 bg-primary/10 p-5 text-center">
              <p className="label-mono text-muted-foreground">Balance</p>
              <p className="mt-1 font-mono text-4xl font-bold text-primary">
                {player ? formatCoins(player.balance) : "—"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Virtual coins · no cash value · cannot be withdrawn
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat label="Total wagered" value={player ? formatCoins(player.total_wagered) : "—"} />
              <Stat label="Total won" value={player ? formatCoins(player.total_won) : "—"} />
            </div>

            <h2 className="mt-7 font-display text-lg font-bold">Round history</h2>
            {history && history.length > 0 ? (
              <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-low">
                {history.map((h) => {
                  const net = Number(h.payout) - Number(h.bet);
                  return (
                    <li key={h.id} className="flex items-center justify-between px-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {getGame(h.game_slug)?.name ?? h.game_slug}
                        </p>
                        <p className="label-mono text-muted-foreground">
                          {new Date(h.created_at).toLocaleString()} · x
                          {Number(h.multiplier).toFixed(2)}
                        </p>
                      </div>
                      <span
                        className={`font-mono text-sm font-bold ${net >= 0 ? "text-accent" : "text-destructive"}`}
                      >
                        {net >= 0 ? "+" : ""}
                        {formatCoins(net)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No rounds played yet.</p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-high p-4">
      <p className="label-mono text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

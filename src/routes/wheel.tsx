import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { SignInGate } from "@/components/SignInGate";
import { useDailyBonus, usePlayer, useSession } from "@/lib/player";
import { formatCoins } from "@/lib/games";
import wheelImg from "@/assets/wheel.png";
import { playSfx } from "@/lib/sound";

const SEGMENTS = [10, 20, 20, 30, 50, 50, 75, 100];

export const Route = createFileRoute("/wheel")({
  head: () => ({
    meta: [
      { title: "Daily bonus wheel — 3CR Arcade" },
      {
        name: "description",
        content: "Spin the free daily wheel once every 24 hours for 10 to 100 arcade coins.",
      },
      { property: "og:title", content: "Daily bonus wheel — 3CR Arcade" },
      { property: "og:description", content: "One free spin every 24 hours — win 10 to 100 coins." },
    ],
  }),
  component: Wheel,
});

function Wheel() {
  const { user } = useSession();
  const { data: player } = usePlayer();
  const bonus = useDailyBonus();
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const last = player?.last_bonus_at ? new Date(player.last_bonus_at).getTime() : 0;
  const readyAt = last + 24 * 3600 * 1000;
  const ready = Date.now() >= readyAt;

  const spin = async () => {
    playSfx("bonus");
    if (spinning) return;
    setSpinning(true);
    setAngle((a) => a + 1440 + Math.floor(Math.random() * 360));
    try {
      const result = await bonus.mutateAsync();
      const gained = result && player ? result.balance - player.balance : 0;
      setTimeout(() => {
        setSpinning(false);
        toast.success(`You won ${formatCoins(gained)} coins!`);
      }, 3200);
    } catch (err) {
      setSpinning(false);
      toast.error(err instanceof Error ? err.message : "Come back later for your next spin");
    }
  };

  return (
    <AppShell>
      <div className="px-4 py-6">
        <h1 className="text-center font-display text-3xl font-extrabold">Daily wheel</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          One free spin every 24 hours. Coins are virtual and have no cash value.
        </p>

        <div className="relative mx-auto mt-8 flex size-64 items-center justify-center">
          <div className="absolute -top-1 z-10 size-0 border-x-8 border-t-[18px] border-x-transparent border-t-primary" />
          <div
            className="size-64 rounded-full border-4 border-primary/70 bg-surface-high p-3 shadow-2xl"
            style={{
              transform: `rotate(${angle}deg)`,
              transition: "transform 3s cubic-bezier(.15,.9,.2,1)",
            }}
          >
            <img src={wheelImg} alt="Bonus wheel" width={512} height={512} className="size-full object-contain" />
          </div>
        </div>

        <div className="mt-6">
          {!user ? (
            <SignInGate what="spin the daily wheel" />
          ) : (
            <button
              onClick={spin}
              disabled={spinning || !ready || bonus.isPending}
              className="w-full rounded-xl bg-primary py-4 font-display text-base font-bold text-primary-foreground active:scale-[0.98] disabled:opacity-50"
            >
              {spinning
                ? "Spinning…"
                : ready
                  ? "Spin for free"
                  : `Next spin ${new Date(readyAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
            </button>
          )}
        </div>

        <ul className="mt-8 grid grid-cols-4 gap-2">
          {SEGMENTS.map((s) => (
            <li
              key={s}
              className="rounded-lg border border-border bg-surface-high py-3 text-center font-mono text-sm font-bold text-primary"
            >
              {s}
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}

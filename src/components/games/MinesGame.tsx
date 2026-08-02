import { useState } from "react";
import { toast } from "sonner";
import { formatCoins, minesMultiplier } from "@/lib/games";
import { playSfx } from "@/lib/sound";

type Props = {
  bet: number;
  balance: number;
  busy: boolean;
  settle: (multiplier: number, details: Record<string, unknown>) => Promise<void>;
};

const TOTAL = 25;
const BOMB_OPTIONS = [1, 3, 5, 10];

function pickBombs(count: number): Set<number> {
  const s = new Set<number>();
  while (s.size < count) s.add(Math.floor(Math.random() * TOTAL));
  return s;
}

export function MinesGame({ bet, balance, busy, settle }: Props) {
  const [bombs, setBombs] = useState(3);
  const [running, setRunning] = useState(false);
  const [field, setField] = useState<Set<number>>(new Set());
  const [opened, setOpened] = useState<number[]>([]);
  const [blown, setBlown] = useState<number | null>(null);

  const picks = opened.length;
  const current = picks === 0 ? 1 : minesMultiplier(TOTAL, bombs, picks);
  const next = minesMultiplier(TOTAL, bombs, picks + 1);

  const begin = () => {
    if (bet > balance) return toast.error("Not enough coins");
    playSfx("start");
    setField(pickBombs(bombs));
    setOpened([]);
    setBlown(null);
    setRunning(true);
  };

  const reveal = async (i: number) => {
    if (opened.includes(i)) return;

    if (field.has(i)) {
      setBlown(i);
      setRunning(false);
      await settle(0, { bombs, picks, hit: i });
      toast.error("Boom! You hit a mine.");
      return;
    }

    playSfx("step");
    const nextOpened = [...opened, i];
    setOpened(nextOpened);

    if (nextOpened.length === TOTAL - bombs) {
      const m = minesMultiplier(TOTAL, bombs, nextOpened.length);
      setRunning(false);
      await settle(m, { bombs, picks: nextOpened.length, cleared: true });
      toast.success(`Field cleared! ${m.toFixed(2)}x`);
    }
  };

  const cashOut = async () => {
    setRunning(false);
    await settle(current, { bombs, picks });
    toast.success(`Banked ${current.toFixed(2)}x — +${formatCoins(bet * current)}`);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-surface-lowest p-3">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="label-mono text-muted-foreground">
            {picks} gems · {bombs} mines
          </span>
          <span className="font-display text-2xl font-extrabold tabular-nums text-primary">
            {current.toFixed(2)}x
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: TOTAL }, (_, i) => {
            const isOpen = opened.includes(i);
            const isBlown = blown === i;
            const exposed = !running && blown !== null && field.has(i);
            return (
              <button
                key={i}
                type="button"
                disabled={!running || busy}
                onClick={() => void reveal(i)}
                aria-label={`Tile ${i + 1}`}
                className={`aspect-square rounded-md border text-xl transition-transform active:scale-95 ${
                  isBlown
                    ? "animate-pop border-destructive bg-destructive/30"
                    : isOpen
                      ? "animate-pop border-accent/70 bg-accent/15"
                      : exposed
                        ? "border-border bg-surface opacity-60"
                        : "border-border bg-surface-high"
                }`}
              >
                {isOpen ? "💎" : isBlown || exposed ? "💣" : ""}
              </button>
            );
          })}
        </div>
      </div>

      {running ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="grid h-14 place-items-center rounded-xl border border-border bg-surface-low">
            <span className="label-mono text-muted-foreground">Next {next.toFixed(2)}x</span>
          </div>
          <button
            onClick={() => void cashOut()}
            disabled={busy || picks === 0}
            className="h-14 rounded-xl bg-accent font-display text-lg font-bold text-accent-foreground active:scale-[0.98] disabled:opacity-40"
          >
            Cash {formatCoins(bet * current)}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-1.5">
            {BOMB_OPTIONS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBombs(b)}
                className={`label-mono rounded-md border py-2.5 ${
                  bombs === b
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-surface-high text-muted-foreground"
                }`}
              >
                {b} mine{b > 1 ? "s" : ""}
              </button>
            ))}
          </div>
          <button
            onClick={begin}
            disabled={busy || bet > balance}
            className="h-14 w-full rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground active:scale-[0.98] disabled:opacity-50"
          >
            {bet > balance ? "Not enough coins" : `Bet ${formatCoins(bet)}`}
          </button>
        </>
      )}
    </div>
  );
}

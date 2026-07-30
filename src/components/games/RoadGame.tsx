import { useState } from "react";
import { toast } from "sonner";
import type { GameDef } from "@/lib/games";
import { formatCoins, stepMultiplier } from "@/lib/games";

type Props = {
  game: GameDef;
  bet: number;
  balance: number;
  busy: boolean;
  settle: (multiplier: number, details: Record<string, unknown>) => Promise<void>;
};

export function RoadGame({ game, bet, balance, busy, settle }: Props) {
  const lanes = Number(game.config.lanes ?? 12);
  const risk = Number(game.config.risk ?? 0.15);
  const icon = String(game.config.icon ?? "🐔");

  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [dead, setDead] = useState(false);

  const current = step === 0 ? 1 : stepMultiplier(step, risk);

  const begin = () => {
    if (bet > balance) return toast.error("Not enough coins");
    setStep(0);
    setDead(false);
    setRunning(true);
  };

  const advance = async () => {
    const next = step + 1;
    if (Math.random() < risk) {
      setStep(next);
      setDead(true);
      setRunning(false);
      await settle(0, { lane: next, survived: false });
      toast.error(`Squashed on lane ${next}`);
      return;
    }
    setStep(next);
    if (next >= lanes) {
      const m = stepMultiplier(lanes, risk);
      setRunning(false);
      await settle(m, { lane: next, survived: true, completed: true });
      toast.success(`Made it across! ${m.toFixed(2)}x`);
    }
  };

  const cashOut = async () => {
    setRunning(false);
    await settle(current, { lane: step, survived: true });
    toast.success(`Banked ${current.toFixed(2)}x — +${formatCoins(bet * current)}`);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-surface-lowest p-3">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="label-mono text-muted-foreground">
            Lane {Math.min(step, lanes)} / {lanes}
          </span>
          <span
            className={`font-display text-2xl font-extrabold tabular-nums ${
              dead ? "text-destructive" : "text-primary"
            }`}
          >
            {dead ? "0.00x" : `${current.toFixed(2)}x`}
          </span>
        </div>

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {Array.from({ length: lanes }, (_, i) => {
            const passed = i < step;
            const isCrash = dead && i === step - 1;
            return (
              <div
                key={i}
                className={`relative flex h-24 w-14 shrink-0 flex-col items-center justify-center rounded-lg border ${
                  isCrash
                    ? "border-destructive bg-destructive/20"
                    : passed
                      ? "border-accent/60 bg-accent/10"
                      : "border-border bg-surface-high"
                }`}
              >
                <span className="label-mono text-muted-foreground">
                  {stepMultiplier(i + 1, risk).toFixed(2)}x
                </span>
                {i === step - 1 && (
                  <span className="animate-pop mt-1 text-2xl" aria-hidden>
                    {isCrash ? "💥" : icon}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {running ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => void advance()}
            disabled={busy}
            className="h-14 rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground active:scale-[0.98] disabled:opacity-60"
          >
            Step forward
          </button>
          <button
            onClick={() => void cashOut()}
            disabled={busy || step === 0}
            className="h-14 rounded-xl bg-accent font-display text-lg font-bold text-accent-foreground active:scale-[0.98] disabled:opacity-40"
          >
            Cash {formatCoins(bet * current)}
          </button>
        </div>
      ) : (
        <button
          onClick={begin}
          disabled={busy || bet > balance}
          className="h-14 w-full rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground active:scale-[0.98] disabled:opacity-50"
        >
          {bet > balance ? "Not enough coins" : `Bet ${formatCoins(bet)}`}
        </button>
      )}
    </div>
  );
}

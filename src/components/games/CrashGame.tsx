import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { GameDef } from "@/lib/games";
import { formatCoins, rollCrashPoint } from "@/lib/games";
import { playSfx } from "@/lib/sound";

type Props = {
  game: GameDef;
  bet: number;
  balance: number;
  busy: boolean;
  settle: (multiplier: number, details: Record<string, unknown>) => Promise<void>;
};

type Phase = "idle" | "flying" | "crashed" | "cashed";

export function CrashGame({ game, bet, balance, busy, settle }: Props) {
  const speed = Number(game.config.speed ?? 0.07);
  const icon = String(game.config.icon ?? "🚀");

  const [phase, setPhase] = useState<Phase>("idle");
  const [mult, setMult] = useState(1);
  const [last, setLast] = useState<number[]>([]);
  const crashAt = useRef(1);
  const raf = useRef<number | null>(null);
  const start = useRef(0);

  const stop = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  useEffect(() => stop, []);

  const finish = useCallback(
    async (m: number, cashed: boolean) => {
      stop();
      setPhase(cashed ? "cashed" : "crashed");
      setLast((l) => [crashAt.current, ...l].slice(0, 10));
      await settle(cashed ? m : 0, { crashAt: crashAt.current, cashedAt: cashed ? m : null });
      if (cashed) toast.success(`Cashed out at ${m.toFixed(2)}x — +${formatCoins(bet * m)}`);
      else toast.error(`Crashed at ${crashAt.current.toFixed(2)}x`);
    },
    [bet, settle],
  );

  const tick = useCallback(() => {
    const t = (performance.now() - start.current) / 1000;
    const m = Math.round(Math.exp(speed * t * 3) * 100) / 100;
    if (m >= crashAt.current) {
      setMult(crashAt.current);
      void finish(crashAt.current, false);
      return;
    }
    setMult(m);
    raf.current = requestAnimationFrame(tick);
  }, [finish, speed]);

  const launch = () => {
    if (bet > balance) return toast.error("Not enough coins");
    crashAt.current = rollCrashPoint();
    playSfx("start");
    setMult(1);
    setPhase("flying");
    start.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };

  const progress = Math.min(1, Math.log(mult) / Math.log(12));
  const crashed = phase === "crashed";

  return (
    <div className="space-y-3">
      <div
        className={`relative h-56 overflow-hidden rounded-xl border border-border bg-surface-lowest ${
          crashed ? "animate-shake" : ""
        }`}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-hairline) 1px, transparent 1px), linear-gradient(90deg, var(--color-hairline) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="absolute bottom-0 left-0 origin-bottom-left"
          style={{
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(to top right, var(--glow-primary), transparent 55%)",
            clipPath: `polygon(0 100%, ${progress * 100}% ${100 - progress * 88}%, ${progress * 100}% 100%)`,
            opacity: phase === "idle" ? 0 : 1,
            transition: "opacity .2s",
          }}
        />
        <div
          className="absolute text-3xl transition-none"
          style={{
            left: `calc(${progress * 82}% + 8px)`,
            bottom: `calc(${progress * 74}% + 12px)`,
            transform: `rotate(${crashed ? 60 : -20}deg)`,
            filter: crashed ? "grayscale(1)" : "none",
          }}
          aria-hidden
        >
          {crashed ? "💥" : icon}
        </div>

        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p
              className={`font-display text-5xl font-extrabold tabular-nums ${
                crashed ? "text-destructive" : phase === "cashed" ? "text-accent" : "text-primary text-glow"
              }`}
            >
              {mult.toFixed(2)}x
            </p>
            <p className="label-mono mt-1 text-muted-foreground">
              {phase === "idle" && "Place your stake"}
              {phase === "flying" && `Potential ${formatCoins(bet * mult)}`}
              {phase === "crashed" && "Flew away"}
              {phase === "cashed" && "Cashed out"}
            </p>
          </div>
        </div>
      </div>

      {last.length > 0 && (
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {last.map((m, i) => (
            <span
              key={i}
              className={`label-mono shrink-0 rounded-full px-2.5 py-1.5 ${
                m >= 2 ? "bg-accent/15 text-accent" : "bg-surface-high text-muted-foreground"
              }`}
            >
              {m.toFixed(2)}x
            </span>
          ))}
        </div>
      )}

      {phase === "flying" ? (
        <button
          onClick={() => void finish(mult, true)}
          disabled={busy}
          className="h-14 w-full rounded-xl bg-accent font-display text-lg font-bold text-accent-foreground active:scale-[0.98] disabled:opacity-60"
        >
          Cash out {formatCoins(bet * mult)}
        </button>
      ) : (
        <button
          onClick={launch}
          disabled={busy || bet > balance}
          className="h-14 w-full rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground active:scale-[0.98] disabled:opacity-50"
        >
          {bet > balance ? "Not enough coins" : `Bet ${formatCoins(bet)}`}
        </button>
      )}
    </div>
  );
}

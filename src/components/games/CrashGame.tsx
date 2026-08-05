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
  settle: (multiplier: number, details: Record<string, unknown>, stake?: number) => Promise<void>;
};

type Phase = "betting" | "flying" | "crashed";

type Slot = {
  stake: number;
  queued: boolean;
  active: boolean;
  cashedAt: number | null;
  auto: string;
};

const BETTING_MS = 5000;
const CRASHED_MS = 2500;

function newSlot(stake: number): Slot {
  return { stake, queued: false, active: false, cashedAt: null, auto: "" };
}

export function CrashGame({ game, bet, balance, busy, settle }: Props) {
  const speed = Number(game.config.speed ?? 0.07);
  const icon = String(game.config.icon ?? "🚀");

  const [phase, setPhase] = useState<Phase>("betting");
  const [countdown, setCountdown] = useState(BETTING_MS);
  const [mult, setMult] = useState(1);
  const [last, setLast] = useState<number[]>([]);
  const [slots, setSlots] = useState<Slot[]>([newSlot(bet), newSlot(bet)]);

  const crashAt = useRef(1);
  const raf = useRef<number | null>(null);
  const start = useRef(0);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const settleRef = useRef(settle);
  settleRef.current = settle;

  const stopRaf = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  };
  useEffect(() => stopRaf, []);

  /* ---- crash: settle any still-active slots as a loss ---- */
  const crash = useCallback(() => {
    stopRaf();
    setMult(crashAt.current);
    setPhase("crashed");
    setLast((l) => [crashAt.current, ...l].slice(0, 12));
    playSfx("lose");

    const losers = slotsRef.current.filter((s) => s.active && s.cashedAt === null);
    losers.forEach((s) => {
      void settleRef.current(0, { crashAt: crashAt.current, cashedAt: null }, s.stake);
    });
    if (losers.length > 0) toast.error(`Crashed at ${crashAt.current.toFixed(2)}x`);
    setSlots((ss) => ss.map((s) => ({ ...s, active: false, cashedAt: null })));
  }, []);

  /* ---- cash out one slot: the plane keeps flying to its real crash point ---- */
  const cashOut = useCallback(
    (i: number) => {
      const s = slotsRef.current[i];
      if (!s || !s.active || s.cashedAt !== null) return;
      const m = mult;
      setSlots((ss) => ss.map((x, idx) => (idx === i ? { ...x, cashedAt: m } : x)));
      playSfx("win");
      toast.success(`Cashed out at ${m.toFixed(2)}x — +${formatCoins(s.stake * m)}`);
      void settleRef.current(m, { crashAt: crashAt.current, cashedAt: m }, s.stake);
    },
    [mult],
  );

  const tick = useCallback(() => {
    const t = (performance.now() - start.current) / 1000;
    const m = Math.round(Math.exp(speed * t * 3) * 100) / 100;
    if (m >= crashAt.current) {
      crash();
      return;
    }
    setMult(m);

    // auto cash-out targets
    slotsRef.current.forEach((s, i) => {
      const target = Number(s.auto);
      if (s.active && s.cashedAt === null && target >= 1.01 && m >= target) cashOut(i);
    });

    raf.current = requestAnimationFrame(tick);
  }, [crash, cashOut, speed]);

  /* ---- round loop ---- */
  useEffect(() => {
    if (phase === "betting") {
      setMult(1);
      const began = performance.now();
      const id = window.setInterval(() => {
        const left = BETTING_MS - (performance.now() - began);
        if (left <= 0) {
          window.clearInterval(id);
          setCountdown(0);
          // lock in queued bets
          setSlots((ss) => ss.map((s) => (s.queued ? { ...s, queued: false, active: true, cashedAt: null } : s)));
          crashAt.current = rollCrashPoint();
          playSfx("start");
          start.current = performance.now();
          setPhase("flying");
        } else {
          setCountdown(left);
        }
      }, 100);
      return () => window.clearInterval(id);
    }

    if (phase === "flying") {
      raf.current = requestAnimationFrame(tick);
      return stopRaf;
    }

    const id = window.setTimeout(() => {
      setCountdown(BETTING_MS);
      setPhase("betting");
    }, CRASHED_MS);
    return () => window.clearTimeout(id);
  }, [phase, tick]);

  const queue = (i: number) => {
    const s = slots[i]!;
    if (s.stake > balance) return toast.error("Not enough coins");
    setSlots((ss) => ss.map((x, idx) => (idx === i ? { ...x, queued: !x.queued } : x)));
    playSfx("chip");
  };

  const setStake = (i: number, v: number) =>
    setSlots((ss) =>
      ss.map((x, idx) =>
        idx === i ? { ...x, stake: Math.max(10, Math.min(100000, Math.round(v || 10))) } : x,
      ),
    );

  const setAuto = (i: number, v: string) =>
    setSlots((ss) => ss.map((x, idx) => (idx === i ? { ...x, auto: v } : x)));

  const progress = Math.min(1, Math.log(mult) / Math.log(12));
  const crashed = phase === "crashed";

  return (
    <div className="space-y-2">
      <div
        className={`relative h-36 overflow-hidden rounded-xl border border-border bg-surface-lowest ${
          crashed ? "animate-shake" : ""
        }`}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-hairline) 1px, transparent 1px), linear-gradient(90deg, var(--color-hairline) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          className="absolute bottom-0 left-0 origin-bottom-left"
          style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(to top right, var(--glow-primary), transparent 55%)",
            clipPath: `polygon(0 100%, ${progress * 100}% ${100 - progress * 88}%, ${progress * 100}% 100%)`,
            opacity: phase === "betting" ? 0 : 1,
            transition: "opacity .2s",
          }}
        />
        <div
          className="absolute text-2xl"
          style={{
            left: `calc(${progress * 82}% + 8px)`,
            bottom: `calc(${progress * 74}% + 10px)`,
            transform: `rotate(${crashed ? 60 : -20}deg)`,
            filter: crashed ? "grayscale(1)" : "none",
          }}
          aria-hidden
        >
          {crashed ? "💥" : icon}
        </div>

        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            {phase === "betting" ? (
              <>
                <p className="font-display text-4xl font-extrabold tabular-nums text-accent">
                  {(countdown / 1000).toFixed(1)}s
                </p>
                <p className="label-mono mt-1 text-muted-foreground">Next round…</p>
              </>
            ) : (
              <>
                <p
                  className={`font-display text-4xl font-extrabold tabular-nums ${
                    crashed ? "text-destructive" : "text-primary text-glow"
                  }`}
                >
                  {mult.toFixed(2)}x
                </p>
                <p className="label-mono mt-1 text-muted-foreground">
                  {crashed ? "Flew away" : "In flight"}
                </p>
              </>
            )}
          </div>
        </div>

        {last.length > 0 && (
          <div className="no-scrollbar absolute inset-x-0 top-0 flex gap-1 overflow-x-auto bg-gradient-to-b from-surface-lowest to-transparent px-2 py-1.5">
            {last.slice(0, 8).map((m, i) => (
              <span
                key={i}
                className={`label-mono shrink-0 rounded-full px-1.5 py-1 text-[9px] ${
                  m >= 2 ? "bg-accent/20 text-accent" : "bg-surface-high text-muted-foreground"
                }`}
              >
                {m.toFixed(2)}x
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {slots.map((s, i) => (
          <BetSlot
            key={i}
            index={i}
            slot={s}
            phase={phase}
            mult={mult}
            busy={busy}
            balance={balance}
            onStake={(v) => setStake(i, v)}
            onAuto={(v) => setAuto(i, v)}
            onQueue={() => queue(i)}
            onCash={() => cashOut(i)}
          />
        ))}
      </div>
    </div>
  );
}

function BetSlot({
  index,
  slot,
  phase,
  mult,
  busy,
  balance,
  onStake,
  onAuto,
  onQueue,
  onCash,
}: {
  index: number;
  slot: Slot;
  phase: Phase;
  mult: number;
  busy: boolean;
  balance: number;
  onStake: (v: number) => void;
  onAuto: (v: string) => void;
  onQueue: () => void;
  onCash: () => void;
}) {
  const canCash = slot.active && slot.cashedAt === null && phase === "flying";
  const locked = slot.active || slot.queued;

  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface-low p-2">
      <div className="mb-1.5 flex min-w-0 items-center justify-between gap-1">
        <span className="label-mono shrink-0 text-[9px] text-muted-foreground">
          Bet {index + 1}
        </span>
        {slot.cashedAt !== null && (
          <span className="label-mono truncate text-[9px] text-accent">
            {slot.cashedAt.toFixed(2)}x
          </span>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-1">
        <input
          type="number"
          inputMode="numeric"
          value={slot.stake}
          disabled={locked}
          onChange={(e) => onStake(Number(e.target.value))}
          aria-label={`Stake for bet ${index + 1}`}
          className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface-lowest px-1 text-center font-mono text-sm font-bold text-accent outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        />
        <input
          type="number"
          inputMode="decimal"
          placeholder="Auto"
          value={slot.auto}
          disabled={locked}
          onChange={(e) => onAuto(e.target.value)}
          aria-label={`Auto cash out for bet ${index + 1}`}
          className="h-9 w-12 shrink-0 rounded-md border border-border bg-surface-lowest px-1 text-center font-mono text-xs text-muted-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        />
      </div>

      <div className="mt-1.5 grid grid-cols-4 gap-1">
        {[10, 50, 100, 500].map((c) => (
          <button
            key={c}
            type="button"
            disabled={locked}
            onClick={() => onStake(c)}
            className="label-mono rounded border border-border bg-surface-high py-1 text-[9px] text-muted-foreground disabled:opacity-40"
          >
            {c}
          </button>
        ))}
      </div>

      {canCash ? (
        <button
          onClick={onCash}
          disabled={busy}
          className="mt-1.5 h-10 w-full truncate rounded-lg bg-primary px-1 font-display text-xs font-bold text-primary-foreground active:scale-[0.98] disabled:opacity-60"
        >
          Cash {formatCoins(slot.stake * mult)}
        </button>
      ) : (
        <button
          onClick={onQueue}
          disabled={slot.active || slot.stake > balance}
          className={`mt-1.5 h-10 w-full truncate rounded-lg px-1 font-display text-xs font-bold active:scale-[0.98] disabled:opacity-50 ${
            slot.queued
              ? "border border-accent bg-accent/20 text-accent"
              : "bg-accent text-accent-foreground"
          }`}
        >
          {slot.active
            ? slot.cashedAt !== null
              ? "Next round"
              : "In play"
            : slot.stake > balance
              ? "Low coins"
              : slot.queued
                ? "Cancel"
                : `Bet ${slot.stake}`}
        </button>
      )}
    </div>
  );
}

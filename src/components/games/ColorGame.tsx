import { useState } from "react";
import { toast } from "sonner";
import { formatCoins, HOUSE_EDGE } from "@/lib/games";

type Props = {
  bet: number;
  balance: number;
  busy: boolean;
  settle: (multiplier: number, details: Record<string, unknown>) => Promise<void>;
};

type Pick =
  | { kind: "color"; value: "green" | "red" | "violet" }
  | { kind: "number"; value: number };

const GREEN = [1, 3, 7, 9];
const RED = [2, 4, 6, 8];
const VIOLET = [0, 5];

/** Colour of a drawn number. 0 and 5 are violet + a half-paying colour. */
function colorsOf(n: number): ("green" | "red" | "violet")[] {
  if (n === 0) return ["red", "violet"];
  if (n === 5) return ["green", "violet"];
  return GREEN.includes(n) ? ["green"] : ["red"];
}

function payoutFor(pick: Pick, n: number): number {
  const cols = colorsOf(n);
  if (pick.kind === "number") return pick.value === n ? 9 * HOUSE_EDGE : 0;
  if (!cols.includes(pick.value)) return 0;
  if (pick.value === "violet") return 4.5 * HOUSE_EDGE;
  // Mixed draw (0 or 5) pays half on the plain colour.
  return (cols.includes("violet") ? 1.5 : 2) * HOUSE_EDGE;
}

const SWATCH: Record<string, string> = {
  green: "bg-accent text-accent-foreground",
  red: "bg-destructive text-destructive-foreground",
  violet: "bg-[oklch(0.55_0.22_305)] text-[oklch(0.97_0.02_305)]",
};

function dotClass(n: number) {
  const cols = colorsOf(n);
  if (cols.length === 2)
    return cols[0] === "green"
      ? "bg-gradient-to-br from-accent to-[oklch(0.55_0.22_305)]"
      : "bg-gradient-to-br from-destructive to-[oklch(0.55_0.22_305)]";
  return cols[0] === "green" ? "bg-accent" : "bg-destructive";
}

export function ColorGame({ bet, balance, busy, settle }: Props) {
  const [pick, setPick] = useState<Pick | null>(null);
  const [drawn, setDrawn] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<boolean | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  const isPicked = (p: Pick) =>
    pick?.kind === p.kind && String(pick.value) === String(p.value);

  const trade = async () => {
    if (!pick) return toast.error("Pick a colour or number first");
    if (bet > balance) return toast.error("Not enough coins");

    setSpinning(true);
    setWon(null);
    for (let i = 0; i < 14; i++) {
      setDrawn(Math.floor(Math.random() * 10));
      await new Promise((r) => setTimeout(r, 60));
    }

    const result = Math.floor(Math.random() * 10);
    setDrawn(result);
    setHistory((h) => [result, ...h].slice(0, 12));
    setSpinning(false);

    const mult = Math.round(payoutFor(pick, result) * 100) / 100;
    setWon(mult > 0);
    await settle(mult, { pick: `${pick.kind}:${pick.value}`, result });
    if (mult > 0) toast.success(`${result} — +${formatCoins(bet * mult)} (${mult.toFixed(2)}x)`);
    else toast.error(`${result} — better luck next period`);
  };

  const potential = pick && drawn !== null ? null : null;
  void potential;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-lowest p-4 shadow-[var(--shadow-glow)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 0%, var(--glow-accent), transparent 55%), radial-gradient(circle at 85% 15%, var(--glow-primary), transparent 50%)",
          }}
        />

        <div className="relative flex items-center justify-between">
          <span className="label-mono text-muted-foreground">Period result</span>
          <span className="label-mono rounded-full border border-primary/60 bg-primary/15 px-2 py-1 text-primary">
            Colour Trading
          </span>
        </div>

        <div className="relative mt-4 grid place-items-center">
          <div
            className={`grid size-28 place-items-center rounded-full border-4 ${
              won === null
                ? "border-border"
                : won
                  ? "border-accent shadow-[var(--shadow-glow-accent)]"
                  : "border-destructive"
            } bg-surface-high ${spinning ? "animate-pop" : ""}`}
          >
            <span className="font-display text-5xl font-extrabold tabular-nums">
              {drawn === null ? "—" : drawn}
            </span>
          </div>
          <p className="label-mono mt-3 text-muted-foreground">
            {spinning
              ? "Drawing…"
              : drawn === null
                ? "Pick a colour or a number"
                : colorsOf(drawn).join(" + ")}
          </p>
        </div>

        {history.length > 0 && (
          <div className="no-scrollbar relative mt-4 flex gap-1.5 overflow-x-auto">
            {history.map((n, i) => (
              <span
                key={i}
                className={`grid size-7 shrink-0 place-items-center rounded-full font-mono text-xs font-bold text-background ${dotClass(n)}`}
              >
                {n}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["green", "violet", "red"] as const).map((c) => {
          const p: Pick = { kind: "color", value: c };
          return (
            <button
              key={c}
              type="button"
              disabled={spinning || busy}
              onClick={() => setPick(p)}
              className={`h-14 rounded-xl font-display text-sm font-bold capitalize transition active:scale-95 disabled:opacity-50 ${SWATCH[c]} ${
                isPicked(p) ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
              }`}
            >
              {c}
              <span className="ml-1.5 font-mono text-[11px] opacity-80">
                {c === "violet" ? "4.5x" : "2x"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, n) => {
          const p: Pick = { kind: "number", value: n };
          return (
            <button
              key={n}
              type="button"
              disabled={spinning || busy}
              onClick={() => setPick(p)}
              className={`grid h-12 place-items-center rounded-xl border border-border bg-surface-high font-mono text-lg font-bold transition active:scale-95 disabled:opacity-50 ${
                isPicked(p) ? "border-primary bg-primary/20 text-primary" : "text-foreground"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>

      <p className="label-mono text-center text-muted-foreground">
        Numbers pay 9x · 0 and 5 are violet
      </p>

      <button
        onClick={() => void trade()}
        disabled={busy || spinning || !pick || bet > balance}
        className="h-14 w-full rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground active:scale-[0.98] disabled:opacity-50"
      >
        {bet > balance
          ? "Not enough coins"
          : spinning
            ? "Drawing…"
            : !pick
              ? "Select a colour"
              : `Trade ${formatCoins(bet)}`}
      </button>
    </div>
  );
}

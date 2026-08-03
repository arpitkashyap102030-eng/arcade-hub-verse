import { useState } from "react";
import { toast } from "sonner";
import { formatCoins, HOUSE_EDGE } from "@/lib/games";
import { playSfx } from "@/lib/sound";

type Props = {
  bet: number;
  balance: number;
  busy: boolean;
  settle: (multiplier: number, details: Record<string, unknown>) => Promise<void>;
};

type Pick =
  | { kind: "color"; value: "green" | "red" | "violet" }
  | { kind: "number"; value: number }
  | { kind: "size"; value: "big" | "small" };

const GREEN = [1, 3, 7, 9];

/** Colour of a drawn number. 0 and 5 are violet + a half-paying colour. */
function colorsOf(n: number): ("green" | "red" | "violet")[] {
  if (n === 0) return ["red", "violet"];
  if (n === 5) return ["green", "violet"];
  return GREEN.includes(n) ? ["green"] : ["red"];
}

function sizeOf(n: number): "big" | "small" {
  return n >= 5 ? "big" : "small";
}

function payoutFor(pick: Pick, n: number): number {
  if (pick.kind === "number") return pick.value === n ? 9 * HOUSE_EDGE : 0;
  if (pick.kind === "size") return pick.value === sizeOf(n) ? 2 * HOUSE_EDGE : 0;
  const cols = colorsOf(n);
  if (!cols.includes(pick.value)) return 0;
  if (pick.value === "violet") return 4.5 * HOUSE_EDGE;
  // Mixed draw (0 or 5) pays half on the plain colour.
  return (cols.includes("violet") ? 1.5 : 2) * HOUSE_EDGE;
}

/** BDG-style ball gradient for a drawn digit. */
function ballClass(n: number) {
  const cols = colorsOf(n);
  if (cols.length === 2)
    return cols[0] === "green"
      ? "bg-[linear-gradient(135deg,oklch(0.72_0.19_150)_0%,oklch(0.72_0.19_150)_50%,oklch(0.55_0.22_305)_50%,oklch(0.55_0.22_305)_100%)]"
      : "bg-[linear-gradient(135deg,oklch(0.62_0.21_25)_0%,oklch(0.62_0.21_25)_50%,oklch(0.55_0.22_305)_50%,oklch(0.55_0.22_305)_100%)]";
  return cols[0] === "green"
    ? "bg-[radial-gradient(circle_at_30%_25%,oklch(0.85_0.15_150),oklch(0.6_0.19_150))]"
    : "bg-[radial-gradient(circle_at_30%_25%,oklch(0.78_0.17_25),oklch(0.55_0.21_25))]";
}

function dotClass(n: number) {
  const cols = colorsOf(n);
  if (cols.length === 2)
    return cols[0] === "green"
      ? "bg-gradient-to-br from-accent to-[oklch(0.55_0.22_305)]"
      : "bg-gradient-to-br from-destructive to-[oklch(0.55_0.22_305)]";
  return cols[0] === "green" ? "bg-accent" : "bg-destructive";
}

const SWATCH: Record<string, string> = {
  green: "bg-[oklch(0.62_0.16_155)] text-[oklch(0.98_0.02_155)]",
  violet: "bg-[oklch(0.6_0.2_305)] text-[oklch(0.98_0.02_305)]",
  red: "bg-[oklch(0.62_0.19_25)] text-[oklch(0.98_0.02_25)]",
};

type Row = { period: string; n: number };

function periodId(seq: number) {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  return `${stamp}${String(1000 + seq).padStart(6, "0")}`;
}

export function ColorGame({ bet, balance, busy, settle }: Props) {
  const [pick, setPick] = useState<Pick | null>(null);
  const [drawn, setDrawn] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<"history" | "chart">("history");

  const isPicked = (p: Pick) =>
    pick?.kind === p.kind && String(pick.value) === String(p.value);

  const trade = async () => {
    playSfx("reveal");
    if (!pick) return toast.error("Pick a colour, number or big/small first");
    if (bet > balance) return toast.error("Not enough coins");

    setSpinning(true);
    setWon(null);
    for (let i = 0; i < 14; i++) {
      setDrawn(Math.floor(Math.random() * 10));
      await new Promise((r) => setTimeout(r, 60));
    }

    const result = Math.floor(Math.random() * 10);
    setDrawn(result);
    setRows((h) => [{ period: periodId(h.length + 1), n: result }, ...h].slice(0, 20));
    setSpinning(false);

    const mult = Math.round(payoutFor(pick, result) * 100) / 100;
    setWon(mult > 0);
    await settle(mult, { pick: `${pick.kind}:${pick.value}`, result });
    if (mult > 0) toast.success(`${result} — +${formatCoins(bet * mult)} (${mult.toFixed(2)}x)`);
    else toast.error(`${result} — better luck next period`);
  };

  return (
    <div className="space-y-3">
      {/* Result panel */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-lowest p-4 shadow-[var(--shadow-glow)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 0%, var(--glow-accent), transparent 55%), radial-gradient(circle at 85% 15%, var(--glow-primary), transparent 50%)",
          }}
        />
        <div className="relative flex items-center justify-between">
          <span className="label-mono text-muted-foreground">
            Period {periodId(rows.length + 1)}
          </span>
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
                ? "Place your prediction"
                : `${colorsOf(drawn).join(" + ")} · ${sizeOf(drawn)}`}
          </p>
        </div>

        {rows.length > 0 && (
          <div className="no-scrollbar relative mt-4 flex gap-1.5 overflow-x-auto">
            {rows.map((r) => (
              <span
                key={r.period}
                className={`grid size-7 shrink-0 place-items-center rounded-full font-mono text-xs font-bold text-background ${dotClass(r.n)}`}
              >
                {r.n}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bet board */}
      <div className="space-y-3 rounded-2xl border border-border bg-surface-low p-3">
        <div className="grid grid-cols-3 gap-2">
          {(["green", "violet", "red"] as const).map((c) => {
            const p: Pick = { kind: "color", value: c };
            return (
              <button
                key={c}
                type="button"
                disabled={spinning || busy}
                onClick={() => setPick(p)}
                className={`h-11 rounded-lg font-display text-sm font-bold capitalize shadow-md transition active:scale-95 disabled:opacity-50 ${SWATCH[c]} ${
                  isPicked(p) ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-low" : ""
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

        <div className="grid grid-cols-5 gap-2 rounded-xl bg-surface-lowest p-2">
          {Array.from({ length: 10 }, (_, n) => {
            const p: Pick = { kind: "number", value: n };
            return (
              <button
                key={n}
                type="button"
                disabled={spinning || busy}
                onClick={() => setPick(p)}
                aria-label={`Bet on number ${n}`}
                className={`grid aspect-square place-items-center rounded-full font-display text-lg font-extrabold text-[oklch(0.98_0.01_260)] shadow-[inset_0_-3px_6px_rgba(0,0,0,0.35)] transition active:scale-95 disabled:opacity-50 ${ballClass(n)} ${
                  isPicked(p) ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-lowest" : ""
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>

        <div className="flex overflow-hidden rounded-full">
          {(["big", "small"] as const).map((s) => {
            const p: Pick = { kind: "size", value: s };
            return (
              <button
                key={s}
                type="button"
                disabled={spinning || busy}
                onClick={() => setPick(p)}
                className={`h-11 flex-1 font-display text-sm font-bold uppercase transition active:scale-95 disabled:opacity-50 ${
                  s === "big"
                    ? "bg-primary text-primary-foreground"
                    : "bg-[oklch(0.6_0.16_250)] text-[oklch(0.98_0.02_250)]"
                } ${isPicked(p) ? "ring-2 ring-inset ring-foreground/70" : ""}`}
              >
                {s} <span className="font-mono text-[11px] opacity-80">2x</span>
              </button>
            );
          })}
        </div>

        <p className="label-mono text-center text-muted-foreground">
          Numbers pay 9x · 0 and 5 are violet · Big 5-9 · Small 0-4
        </p>
      </div>

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
              ? "Select a bet"
              : `Trade ${formatCoins(bet)}`}
      </button>

      {/* History tabs */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface-low">
        <div className="flex gap-2 p-2">
          {(["history", "chart"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`h-9 flex-1 rounded-lg font-display text-xs font-bold uppercase transition ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-high text-muted-foreground"
              }`}
            >
              {t === "history" ? "Game history" : "Chart"}
            </button>
          ))}
        </div>

        {tab === "history" ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-high text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Period</th>
                <th className="px-3 py-2 font-medium">Number</th>
                <th className="px-3 py-2 font-medium">Big/Small</th>
                <th className="px-3 py-2 font-medium">Colour</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                    No rounds yet
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.period} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-muted-foreground">{r.period}</td>
                    <td
                      className={`px-3 py-2 font-display text-base font-bold ${
                        colorsOf(r.n)[0] === "green" ? "text-accent" : "text-destructive"
                      }`}
                    >
                      {r.n}
                    </td>
                    <td className="px-3 py-2 capitalize">{sizeOf(r.n)}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block size-2.5 rounded-full ${dotClass(r.n)}`} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <div className="space-y-1 p-3">
            {rows.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">No data yet</p>
            ) : (
              rows.map((r) => (
                <div key={r.period} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 font-mono text-[10px] text-muted-foreground">
                    {r.period.slice(-6)}
                  </span>
                  <div className="flex flex-1 gap-1">
                    {Array.from({ length: 10 }, (_, i) => (
                      <span
                        key={i}
                        className={`size-4 rounded-full ${
                          i === r.n ? dotClass(r.n) : "bg-surface-high"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

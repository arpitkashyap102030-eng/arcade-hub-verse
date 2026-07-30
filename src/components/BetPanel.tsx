import { Minus, Plus } from "lucide-react";
import { formatCoins } from "@/lib/games";

const CHIPS = [10, 50, 100, 500];

export function BetPanel({
  bet,
  onBet,
  balance,
  disabled,
}: {
  bet: number;
  onBet: (n: number) => void;
  balance: number;
  disabled?: boolean;
}) {
  const clamp = (n: number) => Math.max(10, Math.min(100000, Math.round(n)));

  return (
    <div className="rounded-xl border border-border bg-surface-low p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="label-mono text-muted-foreground">Stake</span>
        <span className="label-mono text-muted-foreground">
          Balance {formatCoins(balance)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onBet(clamp(bet / 2))}
          aria-label="Halve stake"
          className="grid size-11 place-items-center rounded-lg border border-border bg-surface-high text-foreground disabled:opacity-40"
        >
          <Minus className="size-4" aria-hidden />
        </button>

        <input
          type="number"
          inputMode="numeric"
          value={bet}
          disabled={disabled}
          onChange={(e) => onBet(clamp(Number(e.target.value) || 10))}
          className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface-lowest px-3 text-center font-mono text-lg font-bold text-primary outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => onBet(clamp(bet * 2))}
          aria-label="Double stake"
          className="grid size-11 place-items-center rounded-lg border border-border bg-surface-high text-foreground disabled:opacity-40"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            disabled={disabled}
            onClick={() => onBet(c)}
            className="label-mono rounded-md border border-border bg-surface-high py-2 text-muted-foreground disabled:opacity-40"
          >
            {c}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onBet(clamp(balance))}
          className="label-mono rounded-md border border-primary/50 bg-primary/15 py-2 text-primary disabled:opacity-40"
        >
          Max
        </button>
      </div>
    </div>
  );
}

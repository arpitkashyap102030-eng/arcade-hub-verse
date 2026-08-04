import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { SignInGate } from "@/components/SignInGate";
import {
  MIN_DEPOSIT,
  MIN_WITHDRAW,
  useDeposit,
  useHistory,
  usePlayer,
  useSession,
  useTransactions,
  useWithdraw,
  withdrawable,
} from "@/lib/player";
import { formatCoins, getGame } from "@/lib/games";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — deposit, withdraw & history | 3CR Arcade" },
      {
        name: "description",
        content:
          "Add coins, withdraw your winnings and review every deposit, payout and game round in one place.",
      },
      { property: "og:title", content: "Wallet — 3CR Arcade" },
      {
        property: "og:description",
        content: "Deposit, withdraw and track your arcade coin history.",
      },
    ],
  }),
  component: Wallet,
});

type Tab = "add" | "cash" | "txns" | "rounds";

const TABS: { id: Tab; label: string }[] = [
  { id: "add", label: "Deposit" },
  { id: "cash", label: "Withdraw" },
  { id: "txns", label: "Transactions" },
  { id: "rounds", label: "Game history" },
];

const METHODS = ["UPI", "Card", "Netbanking", "Wallet"];

function Wallet() {
  const { user } = useSession();
  const { data: player } = usePlayer();
  const { data: history } = useHistory(40);
  const { data: txs } = useTransactions(40);
  const [tab, setTab] = useState<Tab>("add");

  const canCash = withdrawable(player, txs);

  return (
    <AppShell>
      <div className="px-3 py-5">
        <h1 className="font-display text-2xl font-extrabold">Wallet</h1>

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
                Withdrawable (winnings only):{" "}
                <span className="font-mono text-accent">{formatCoins(canCash)}</span>
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat label="Total wagered" value={player ? formatCoins(player.total_wagered) : "—"} />
              <Stat label="Total won" value={player ? formatCoins(player.total_won) : "—"} />
            </div>

            <div className="no-scrollbar mt-5 flex gap-1.5 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`label-mono shrink-0 rounded-full px-3.5 py-2 ${
                    tab === t.id
                      ? "bg-accent text-accent-foreground"
                      : "border border-border bg-surface-high text-muted-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {tab === "add" && <DepositForm />}
              {tab === "cash" && <WithdrawForm max={canCash} />}
              {tab === "txns" && <TxList txs={txs} />}
              {tab === "rounds" && <RoundList history={history} />}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function DepositForm() {
  const deposit = useDeposit();
  const [amount, setAmount] = useState(MIN_DEPOSIT);
  const [method, setMethod] = useState(METHODS[0]!);

  const submit = async () => {
    if (amount < MIN_DEPOSIT) return toast.error(`Minimum deposit is ${MIN_DEPOSIT} coins`);
    try {
      await deposit.mutateAsync({ amount, method: method.toLowerCase() });
      toast.success(`Deposited ${formatCoins(amount)} coins`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deposit failed");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface-low p-4">
      <div className="flex items-center gap-2">
        <ArrowDownToLine className="size-4 text-accent" aria-hidden />
        <h2 className="font-display text-base font-bold">Add coins</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Minimum deposit {formatCoins(MIN_DEPOSIT)} coins.
      </p>

      <AmountInput value={amount} onChange={setAmount} label="Deposit amount" />

      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {[1000, 2000, 5000, 10000].map((v) => (
          <button
            key={v}
            onClick={() => setAmount(v)}
            className="label-mono rounded-md border border-border bg-surface-high py-2 text-muted-foreground"
          >
            {v / 1000}k
          </button>
        ))}
      </div>

      <MethodPicker method={method} onPick={setMethod} />

      <button
        onClick={() => void submit()}
        disabled={deposit.isPending}
        className="mt-3 h-12 w-full rounded-xl bg-accent font-display text-base font-bold text-accent-foreground active:scale-[0.98] disabled:opacity-60"
      >
        {deposit.isPending ? "Processing…" : `Deposit ${formatCoins(amount)}`}
      </button>
    </div>
  );
}

function WithdrawForm({ max }: { max: number }) {
  const withdraw = useWithdraw();
  const [amount, setAmount] = useState(MIN_WITHDRAW);
  const [method, setMethod] = useState(METHODS[0]!);
  const [note, setNote] = useState("");

  const submit = async () => {
    if (amount < MIN_WITHDRAW) return toast.error(`Minimum withdrawal is ${MIN_WITHDRAW} coins`);
    try {
      await withdraw.mutateAsync({ amount, method: method.toLowerCase(), note });
      toast.success("Withdrawal requested — pending review");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Withdrawal failed");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface-low p-4">
      <div className="flex items-center gap-2">
        <ArrowUpFromLine className="size-4 text-primary" aria-hidden />
        <h2 className="font-display text-base font-bold">Withdraw winnings</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Only coins you have actually won (or deposited) can be withdrawn — starting and bonus coins
        stay in play. Available now:{" "}
        <span className="font-mono text-accent">{formatCoins(max)}</span>
      </p>

      <AmountInput value={amount} onChange={setAmount} label="Withdrawal amount" />

      <div className="mt-2 flex gap-1.5">
        <button
          onClick={() => setAmount(Math.max(MIN_WITHDRAW, Math.floor(max)))}
          className="label-mono flex-1 rounded-md border border-primary/50 bg-primary/15 py-2 text-primary"
        >
          Max
        </button>
      </div>

      <MethodPicker method={method} onPick={setMethod} />

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="UPI id / account (optional)"
        aria-label="Payout details"
        className="mt-2 h-11 w-full rounded-lg border border-border bg-surface-lowest px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />

      <button
        onClick={() => void submit()}
        disabled={withdraw.isPending || max < MIN_WITHDRAW}
        className="mt-3 h-12 w-full rounded-xl bg-primary font-display text-base font-bold text-primary-foreground active:scale-[0.98] disabled:opacity-50"
      >
        {max < MIN_WITHDRAW
          ? "Win some rounds to unlock withdrawal"
          : withdraw.isPending
            ? "Requesting…"
            : `Withdraw ${formatCoins(amount)}`}
      </button>
    </div>
  );
}

function AmountInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(Math.max(0, Math.round(Number(e.target.value) || 0)))}
      className="mt-3 h-12 w-full rounded-lg border border-border bg-surface-lowest px-3 text-center font-mono text-xl font-bold text-foreground outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function MethodPicker({ method, onPick }: { method: string; onPick: (m: string) => void }) {
  return (
    <div className="mt-3 grid grid-cols-4 gap-1.5">
      {METHODS.map((m) => (
        <button
          key={m}
          onClick={() => onPick(m)}
          className={`label-mono rounded-md py-2 ${
            method === m
              ? "border border-accent bg-accent/15 text-accent"
              : "border border-border bg-surface-high text-muted-foreground"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function TxList({ txs }: { txs: ReturnType<typeof useTransactions>["data"] }) {
  if (!txs || txs.length === 0)
    return <p className="text-sm text-muted-foreground">No deposits or withdrawals yet.</p>;

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-low">
      {txs.map((t) => {
        const inbound = t.kind === "deposit";
        return (
          <li key={t.id} className="flex items-center justify-between px-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium capitalize">
                {t.kind} · {t.method}
              </p>
              <p className="label-mono text-muted-foreground">
                {new Date(t.created_at).toLocaleString()} · {t.status}
              </p>
            </div>
            <span
              className={`font-mono text-sm font-bold ${inbound ? "text-accent" : "text-primary"}`}
            >
              {inbound ? "+" : "-"}
              {formatCoins(t.amount)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function RoundList({ history }: { history: ReturnType<typeof useHistory>["data"] }) {
  if (!history || history.length === 0)
    return <p className="text-sm text-muted-foreground">No rounds played yet.</p>;

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-low">
      {history.map((h) => {
        const net = Number(h.payout) - Number(h.bet);
        const win = net >= 0;
        return (
          <li key={h.id} className="flex items-center justify-between px-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {getGame(h.game_slug)?.name ?? h.game_slug}
              </p>
              <p className="label-mono text-muted-foreground">
                {new Date(h.created_at).toLocaleString()} · x{Number(h.multiplier).toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`label-mono rounded-full px-2 py-0.5 ${
                  win ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"
                }`}
              >
                {win ? "WIN" : "LOSS"}
              </span>
              <p
                className={`font-mono text-sm font-bold ${win ? "text-accent" : "text-destructive"}`}
              >
                {win ? "+" : ""}
                {formatCoins(net)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
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

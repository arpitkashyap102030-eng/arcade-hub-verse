import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Ticket, Copy, Share2, Gift, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { SignInGate } from "@/components/SignInGate";
import {
  useClaimReferral,
  useHistory,
  usePlayer,
  usePublicWins,
  useReferralCode,
  useSession,
} from "@/lib/player";
import { getGame } from "@/lib/games";

export const Route = createFileRoute("/raffle")({
  head: () => ({
    meta: [
      { title: "Raffle & invites — 3CR Arcade" },
      {
        name: "description",
        content:
          "Generate your raffle invite link, earn free tickets by playing and give friends 100 bonus coins.",
      },
      { property: "og:title", content: "Raffle & invites — 3CR Arcade" },
      {
        property: "og:description",
        content: "Share your raffle code — your friend gets 100 coins, you get 50.",
      },
    ],
  }),
  component: Raffle,
});

function ReferralCard() {
  const { data: player } = usePlayer();
  const { data: code, isFetching, refetch } = useReferralCode();
  const [generated, setGenerated] = useState(false);

  const link =
    code && typeof window !== "undefined" ? `${window.location.origin}/?ref=${code}` : "";

  const share = async () => {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "3CR Arcade", text: "Play free & get 100 coins", url: link });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(link);
    toast.success("Invite link copied");
  };

  if (!code || !generated) {
    return (
      <div className="mt-4 rounded-2xl border border-primary/40 bg-primary/10 p-5 text-center">
        <Gift className="mx-auto size-8 text-primary" aria-hidden />
        <p className="mt-2 font-display text-lg font-bold">Get your raffle code</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Share the link — your friend gets 100 coins, you get 50.
        </p>
        <button
          type="button"
          disabled={isFetching}
          onClick={async () => {
            await refetch();
            setGenerated(true);
          }}
          className="mt-4 h-12 w-full rounded-xl bg-primary font-display text-base font-bold text-primary-foreground active:scale-[0.98] disabled:opacity-50"
        >
          {isFetching ? "Generating…" : "Get raffle code"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-primary/40 bg-primary/10 p-5">
      <p className="label-mono text-muted-foreground">Your raffle code</p>
      <p className="font-display text-3xl font-extrabold tracking-widest text-primary">{code}</p>
      <p className="mt-3 truncate rounded-lg border border-border bg-surface-lowest px-3 py-2 font-mono text-xs text-muted-foreground">
        {link}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(link);
            toast.success("Link copied");
          }}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-high text-sm font-bold active:scale-95"
        >
          <Copy className="size-4" aria-hidden /> Copy
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground active:scale-95"
        >
          <Share2 className="size-4" aria-hidden /> Share
        </button>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="size-4" aria-hidden />
        {player?.referral_count ?? 0} friends joined with your code
      </p>
    </div>
  );
}

function RedeemCard() {
  const { data: player } = usePlayer();
  const claim = useClaimReferral();
  const [code, setCode] = useState("");

  if (player?.referred_by) {
    return (
      <p className="mt-3 rounded-xl border border-accent/40 bg-accent/10 px-3 py-3 text-sm text-accent">
        Invite bonus already claimed. Thanks for joining!
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-border bg-surface-low p-4">
      <p className="text-sm font-medium">Have a friend&apos;s code?</p>
      <p className="text-xs text-muted-foreground">Redeem it once to get 100 coins.</p>
      <div className="mt-3 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC1234"
          className="h-11 flex-1 rounded-xl border border-border bg-surface-lowest px-3 font-mono text-sm uppercase tracking-widest outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={!code || claim.isPending}
          onClick={() =>
            claim
              .mutateAsync(code.trim())
              .then(() => toast.success("+100 coins added!"))
              .catch((e: Error) => toast.error(e.message))
          }
          className="h-11 rounded-xl bg-primary px-4 font-display text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          Redeem
        </button>
      </div>
    </div>
  );
}

function Raffle() {
  const { user } = useSession();
  const { data: history } = useHistory(100);
  const { data: wins } = usePublicWins();

  const tickets = Math.floor((history ?? []).length / 5);

  return (
    <AppShell>
      <div className="px-3 py-5">
        <h1 className="font-display text-2xl font-extrabold">Raffle &amp; invites</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every 5 rounds played earns 1 free ticket. Tickets cannot be bought.
        </p>

        {!user ? (
          <div className="mt-4">
            <SignInGate what="collect raffle tickets" />
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-4 rounded-xl border border-border bg-surface-low p-5">
              <Ticket className="size-10 text-primary" aria-hidden />
              <div>
                <p className="font-mono text-3xl font-bold text-primary">{tickets}</p>
                <p className="label-mono text-muted-foreground">tickets this week</p>
              </div>
            </div>

            <ReferralCard />
            <RedeemCard />
          </>
        )}

        <h2 className="mt-8 font-display text-lg font-bold">Community leaderboard</h2>
        {wins && wins.length > 0 ? (
          <ol className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-low">
            {wins.map((w, i) => (
              <li key={w.id} className="flex items-center gap-3 px-3 py-3">
                <span className="w-5 font-mono text-sm text-muted-foreground">{i + 1}</span>
                <span className="flex-1 truncate text-sm">{w.masked_player}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {getGame(w.game_slug)?.name ?? w.game_slug}
                </span>
                <span className="font-mono text-sm font-bold text-accent">
                  x{Number(w.multiplier).toFixed(2)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No entries yet this week.</p>
        )}
      </div>
    </AppShell>
  );
}

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Player = {
  id: string;
  username: string;
  balance: number;
  total_wagered: number;
  total_won: number;
  last_bonus_at: string | null;
  referral_code: string | null;
  referred_by: string | null;
  referral_count: number;
  created_at: string;
};

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, ready, user: session?.user ?? null };
}

function normalise(row: Record<string, unknown> | null): Player | null {
  if (!row) return null;
  return {
    ...(row as unknown as Player),
    balance: Number(row.balance),
    total_wagered: Number(row.total_wagered),
    total_won: Number(row.total_won),
  };
}

export function usePlayer() {
  const { user, ready } = useSession();

  return useQuery({
    queryKey: ["player", user?.id],
    enabled: ready && !!user,
    staleTime: 5_000,
    queryFn: async (): Promise<Player | null> => {
      const { data, error } = await supabase.rpc("ensure_player", {
        _username: (user?.user_metadata?.username as string) ?? null,
      });
      if (error) throw error;
      return normalise(data as unknown as Record<string, unknown>);
    },
  });
}

export type RoundInput = {
  game: string;
  bet: number;
  multiplier: number;
  details?: Record<string, unknown>;
};

export function usePlayRound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ game, bet, multiplier, details }: RoundInput) => {
      const { data, error } = await supabase.rpc("play_round", {
        _game_slug: game,
        _bet: bet,
        _multiplier: multiplier,
        _details: (details ?? {}) as never,
      });
      if (error) throw error;
      return normalise(data as unknown as Record<string, unknown>);
    },
    onSuccess: (player) => {
      if (player) qc.setQueryData(["player", player.id], player);
      qc.invalidateQueries({ queryKey: ["history"] });
      qc.invalidateQueries({ queryKey: ["public-wins"] });
    },
  });
}

export function useDailyBonus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_daily_bonus");
      if (error) throw error;
      return normalise(data as unknown as Record<string, unknown>);
    },
    onSuccess: (player) => {
      if (player) qc.setQueryData(["player", player.id], player);
      qc.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useHistory(limit = 30) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["history", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_rounds")
        .select("id, game_slug, bet, payout, multiplier, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePublicWins() {
  return useQuery({
    queryKey: ["public-wins"],
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_wins")
        .select("id, game_slug, multiplier, masked_player, created_at")
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* ---------------- Referral (raffle code) ---------------- */

export const REF_STORAGE_KEY = "3cr:ref";

export function useReferralCode() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["referral-code", user?.id],
    enabled: !!user,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_referral_code");
      if (error) throw error;
      return data as string;
    },
  });
}

export function useClaimReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc("claim_referral", { _code: code });
      if (error) throw error;
      return normalise(data as unknown as Record<string, unknown>);
    },
    onSuccess: (player) => {
      if (player) qc.setQueryData(["player", player.id], player);
      qc.invalidateQueries({ queryKey: ["player"] });
    },
  });
}

/** Captures ?ref=CODE from the URL and redeems it once the player is signed in. */
export function usePendingReferral() {
  const { data: player } = usePlayer();
  const claim = useClaimReferral();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const code = new URLSearchParams(window.location.search).get("ref");
    if (code) localStorage.setItem(REF_STORAGE_KEY, code.toUpperCase());
  }, []);

  useEffect(() => {
    if (done || !player || typeof window === "undefined") return;
    const code = localStorage.getItem(REF_STORAGE_KEY);
    if (!code) return;
    setDone(true);
    claim
      .mutateAsync(code)
      .then(() => {
        localStorage.removeItem(REF_STORAGE_KEY);
        toast.success("Invite bonus: +100 coins added!");
      })
      .catch(() => localStorage.removeItem(REF_STORAGE_KEY));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, done]);
}

/* ---------------- Daily quests ---------------- */

export function useQuestClaims() {
  const { user } = useSession();
  return useQuery({
    queryKey: ["quest-claims", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quest_claims")
        .select("quest_key, reward, quest_date")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useClaimQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      const { data, error } = await supabase.rpc("claim_quest", { _key: key });
      if (error) throw error;
      return normalise(data as unknown as Record<string, unknown>);
    },
    onSuccess: (player) => {
      if (player) qc.setQueryData(["player", player.id], player);
      qc.invalidateQueries({ queryKey: ["quest-claims"] });
    },
  });
}

/* ---------------- Wallet: deposit & withdrawal ---------------- */

export const MIN_DEPOSIT = 1000;
export const MIN_WITHDRAW = 500;

export type WalletTx = {
  id: string;
  kind: "deposit" | "withdraw";
  amount: number;
  method: string;
  note: string | null;
  status: string;
  created_at: string;
};

export function useTransactions(limit = 40) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["wallet-tx", user?.id, limit],
    enabled: !!user,
    queryFn: async (): Promise<WalletTx[]> => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("id, kind, amount, method, note, status, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })) as WalletTx[];
    },
  });
}

/** Coins that came from real winnings or deposits — starting/bonus coins stay locked. */
export function withdrawable(player: Player | null | undefined, txs: WalletTx[] | undefined) {
  if (!player) return 0;
  const dep = (txs ?? []).filter((t) => t.kind === "deposit").reduce((a, t) => a + t.amount, 0);
  const wit = (txs ?? [])
    .filter((t) => t.kind === "withdraw" && t.status !== "rejected")
    .reduce((a, t) => a + t.amount, 0);
  const profit = Math.max(player.total_won - player.total_wagered, 0);
  return Math.max(0, Math.min(player.balance, profit + dep - wit));
}

export function useDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ amount, method }: { amount: number; method: string }) => {
      const { data, error } = await supabase.rpc("make_deposit", {
        _amount: amount,
        _method: method,
      });
      if (error) throw error;
      return normalise(data as unknown as Record<string, unknown>);
    },
    onSuccess: (player) => {
      if (player) qc.setQueryData(["player", player.id], player);
      qc.invalidateQueries({ queryKey: ["wallet-tx"] });
    },
  });
}

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      method,
      note,
    }: {
      amount: number;
      method: string;
      note?: string;
    }) => {
      const { data, error } = await supabase.rpc("request_withdrawal", {
        _amount: amount,
        _method: method,
        _note: note ?? null,
      });
      if (error) throw error;
      return normalise(data as unknown as Record<string, unknown>);
    },
    onSuccess: (player) => {
      if (player) qc.setQueryData(["player", player.id], player);
      qc.invalidateQueries({ queryKey: ["wallet-tx"] });
    },
  });
}

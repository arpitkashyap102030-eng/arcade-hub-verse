import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Player = {
  id: string;
  username: string;
  balance: number;
  total_wagered: number;
  total_won: number;
  last_bonus_at: string | null;
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

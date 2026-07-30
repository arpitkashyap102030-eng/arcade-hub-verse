import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

const search = z.object({ mode: z.enum(["in", "up"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Sign in — 3CR Arcade" },
      {
        name: "description",
        content: "Create a free 3CR Arcade account and start with 1,000 virtual coins.",
      },
      { property: "og:title", content: "Sign in — 3CR Arcade" },
      { property: "og:description", content: "Free account, 1,000 virtual coins, no payments." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [signup, setSignup] = useState(mode !== "in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (signup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created — welcome to the arcade!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="px-4 py-8">
        <h1 className="font-display text-3xl font-extrabold">
          {signup ? "Create account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {signup
            ? "Start with 1,000 free arcade coins. No payment details, ever."
            : "Sign in to pick up your coin balance."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {signup && (
            <Field
              label="Display name"
              value={username}
              onChange={setUsername}
              placeholder="AceRunner"
              autoComplete="nickname"
            />
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
            placeholder="At least 6 characters"
            autoComplete={signup ? "new-password" : "current-password"}
          />

          <button
            type="submit"
            disabled={busy}
            className="h-13 w-full rounded-xl bg-primary py-4 font-display text-base font-bold text-primary-foreground active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Working…" : signup ? "Create free account" : "Sign in"}
          </button>
        </form>

        <button
          onClick={() => setSignup((s) => !s)}
          className="mt-5 w-full text-center text-sm text-muted-foreground underline underline-offset-4"
        >
          {signup ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="label-mono text-muted-foreground">{label}</span>
      <input
        {...rest}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-12 w-full rounded-lg border border-border bg-surface-lowest px-3 text-foreground outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

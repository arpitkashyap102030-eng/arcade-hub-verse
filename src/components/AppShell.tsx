import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Coins,
  Grid3x3,
  Search,
  Ticket,
  ClipboardList,
  LogOut,
  Volume2,
  VolumeX,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer, useSession } from "@/lib/player";
import { formatCoins } from "@/lib/games";
import {
  attachGlobalClickSfx,
  initSound,
  isSoundOn,
  onSoundChange,
  toggleSound,
} from "@/lib/sound";
import wheelImg from "@/assets/wheel.png";
import logo3cr from "@/assets/logo-3cr.png";

function SoundToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    const off = onSoundChange(setOn);
    return () => {
      off();
    };
  }, []);
  useEffect(() => setOn(isSoundOn()), []);

  return (
    <button
      type="button"
      data-sfx="off"
      onClick={() => toggleSound()}
      aria-label={on ? "Mute sound effects" : "Unmute sound effects"}
      className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
    >
      {on ? (
        <Volume2 className="size-4 text-primary" aria-hidden />
      ) : (
        <VolumeX className="size-4" aria-hidden />
      )}
    </button>
  );
}

function TopBar() {
  const { user } = useSession();
  const { data: player } = usePlayer();

  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-border bg-background px-3">
      <Link to="/" className="flex items-center gap-2">
        <img
          src={logo3cr}
          alt="3CR Arcade"
          width={96}
          height={40}
          className="h-8 w-auto object-contain"
        />
        <span className="label-mono rounded-sm bg-surface-high px-1.5 py-1 text-muted-foreground">
          Arcade
        </span>
      </Link>

      {user ? (
        <div className="flex items-center gap-2">
          <Link
            to="/wallet"
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface-high px-2.5 py-1.5"
          >
            <Coins className="size-4 text-primary" aria-hidden />
            <span className="font-mono text-sm font-bold text-primary">
              {player ? formatCoins(player.balance) : "—"}
            </span>
          </Link>
          <SoundToggle />
          <button
            onClick={() => supabase.auth.signOut()}
            aria-label="Sign out"
            className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <SoundToggle />
          <Link to="/auth" search={{ mode: "in" }} className="label-mono text-foreground">
            Sign In
          </Link>
          <Link
            to="/auth"
            search={{ mode: "up" }}
            className="label-mono rounded-md bg-primary px-4 py-2 text-primary-foreground active:scale-95"
          >
            Sign Up
          </Link>
        </div>
      )}
    </header>
  );
}

const NAV = [
  { to: "/", label: "Menu", Icon: Grid3x3 },
  { to: "/explore", label: "Explore", Icon: Search },
  { to: "/raffle", label: "Raffle", Icon: Ticket },
  { to: "/quest", label: "Quest", Icon: ClipboardList },
] as const;

function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="safe-bottom fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-border bg-surface-low px-2 shadow-lg">
      {NAV.slice(0, 2).map(({ to, label, Icon }) => (
        <NavItem key={to} to={to} label={label} Icon={Icon} active={path === to} />
      ))}

      <Link
        to="/wheel"
        className="relative -top-5 flex flex-col items-center transition-transform active:scale-110"
        aria-label="Daily bonus wheel"
      >
        <div className="animate-glow size-[72px] rounded-full bg-primary/60 p-0.5">
          <div className="flex size-full items-center justify-center overflow-hidden rounded-full border border-primary/50 bg-surface-lowest">
            <img src={wheelImg} alt="" width={64} height={64} className="size-14 object-contain" />
          </div>
        </div>
        <span className="label-mono absolute -bottom-2 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
          Free 1700
        </span>
      </Link>

      {NAV.slice(2).map(({ to, label, Icon }) => (
        <NavItem key={to} to={to} label={label} Icon={Icon} active={path === to} />
      ))}
    </nav>
  );
}

function NavItem({
  to,
  label,
  Icon,
  active,
}: {
  to: string;
  label: string;
  Icon: typeof Grid3x3;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 pt-1.5 transition-colors ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <Icon className="size-6" aria-hidden />
      <span className="label-mono">{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />
      <main className="mx-auto w-full max-w-2xl">{children}</main>
      <BottomNav />
    </div>
  );
}

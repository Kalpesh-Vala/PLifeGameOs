import Link from "next/link";
import { Sparkles, ArrowRight, Zap, Trophy, Brain } from "lucide-react";
import { auth } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function Home() {
  const session = await auth();

  const features = [
    {
      icon: Zap,
      title: "Gamified progress",
      body: "Earn XP, level up, keep streaks, and turn big goals into boss battles.",
    },
    {
      icon: Brain,
      title: "AI life assistant",
      body: "A coach with long-term memory that learns your patterns and keeps you accountable.",
    },
    {
      icon: Trophy,
      title: "Every domain, one place",
      body: "Career, health, learning, finance, and habits — unified into a single system.",
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">Life OS</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href={session ? "/dashboard" : "/login"}>
              {session ? "Open app" : "Sign in"}
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5" />
            Your Personal Life Operating System
          </span>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Level up your life,
            <br />
            one quest at a time.
          </h1>
          <p className="mx-auto max-w-xl text-balance text-muted-foreground">
            A gamified, AI-powered second brain for your career, health,
            learning, and habits. Stay accountable every single day.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href={session ? "/dashboard" : "/login"}>
                Get started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-5 text-left"
              >
                <Icon className="size-5 text-primary" />
                <h3 className="mt-3 font-medium">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        Built for the long game.
      </footer>
    </div>
  );
}

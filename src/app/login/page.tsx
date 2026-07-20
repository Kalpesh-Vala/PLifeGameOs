import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { auth } from "@/server/auth";
import {
  isGoogleConfigured,
  isGitHubConfigured,
  isEmailConfigured,
} from "@/env";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <Link
        href="/"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="size-3.5" />
        </div>
        Life OS
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to continue leveling up your life.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm
            providers={{
              google: isGoogleConfigured,
              github: isGitHubConfigured,
              email: isEmailConfigured,
            }}
          />
        </CardContent>
      </Card>

      <p className="mt-6 max-w-xs text-center text-xs text-muted-foreground">
        By continuing you agree to keep showing up for yourself.
      </p>
    </div>
  );
}

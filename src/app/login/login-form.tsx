"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M12 11v3.6h5.1c-.2 1.3-1.6 3.9-5.1 3.9-3.1 0-5.6-2.5-5.6-5.6S8.9 7.3 12 7.3c1.7 0 2.9.7 3.6 1.4l2.5-2.4C16.5 4.8 14.4 4 12 4 7.3 4 3.5 7.8 3.5 12.5S7.3 21 12 21c5.4 0 8.5-3.8 8.5-8.3 0-.6-.1-1-.2-1.5H12z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.11-1.49-1.11-1.49-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 2.5-.34c.85 0 1.71.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"
      />
    </svg>
  );
}

export function LoginForm({
  providers,
}: {
  providers: { google: boolean; github: boolean; email: boolean };
}) {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState<string | null>(null);
  const anyOAuth = providers.google || providers.github;

  const oauth = async (id: "google" | "github") => {
    setLoading(id);
    await signIn(id, { callbackUrl: "/dashboard" });
  };

  const emailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading("email");
    try {
      await signIn("nodemailer", { email, callbackUrl: "/dashboard" });
    } catch {
      toast.error("Could not send the magic link. Try again.");
    } finally {
      setLoading(null);
    }
  };

  const noProviders =
    !providers.google && !providers.github && !providers.email;

  return (
    <div className="w-full space-y-4">
      {providers.google && (
        <Button
          variant="outline"
          className="w-full"
          disabled={loading !== null}
          onClick={() => oauth("google")}
        >
          {loading === "google" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </Button>
      )}

      {providers.github && (
        <Button
          variant="outline"
          className="w-full"
          disabled={loading !== null}
          onClick={() => oauth("github")}
        >
          {loading === "github" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <GitHubIcon />
          )}
          Continue with GitHub
        </Button>
      )}

      {providers.email && (
        <>
          {anyOAuth && (
            <div className="relative py-1">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                or
              </span>
            </div>
          )}
          <form onSubmit={emailSignIn} className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="w-full"
              disabled={loading !== null}
            >
              {loading === "email" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              Send magic link
            </Button>
          </form>
        </>
      )}

      {noProviders && (
        <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-center text-sm text-muted-foreground">
          No sign-in providers are configured yet. Add OAuth or email
          credentials to your{" "}
          <code className="font-mono text-xs">.env.local</code> to enable login.
        </p>
      )}
    </div>
  );
}

"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/react";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { NotificationProvider } from "@/components/notifications/notification-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <TRPCReactProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster richColors position="top-right" />
            <PwaProvider />
            <NotificationProvider />
          </TooltipProvider>
        </TRPCReactProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

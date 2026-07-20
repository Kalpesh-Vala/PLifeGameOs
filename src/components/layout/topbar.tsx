"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Sparkles } from "lucide-react";
import { navigation, bottomNav } from "@/lib/navigation";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

function MobileNav() {
  const pathname = usePathname();
  const mobileOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon" aria-label="Open navigation">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="h-14 flex-row items-center gap-2 border-b px-4">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <SheetTitle>Life OS</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100dvh-3.5rem)] px-2 py-3">
          <nav className="flex flex-col gap-4">
            {[...navigation, { label: "System", items: bottomNav }].map(
              (group) => (
                <div key={group.label} className="flex flex-col gap-1">
                  <p className="px-2.5 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                    {group.label}
                  </p>
                  {group.items.map((navItem) => {
                    const active =
                      pathname === navItem.href ||
                      pathname.startsWith(`${navItem.href}/`);
                    const Icon = navItem.icon;
                    return (
                      <Link
                        key={navItem.slug}
                        href={navItem.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm",
                          active
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent/60",
                        )}
                      >
                        <Icon className="size-4" />
                        {navItem.title}
                      </Link>
                    );
                  })}
                </div>
              ),
            )}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export function Topbar() {
  const toggleCommand = useUiStore((s) => s.toggleCommand);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-sm">
      <MobileNav />

      <button
        onClick={toggleCommand}
        className="flex h-9 flex-1 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:max-w-xs"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <div className="flex-1" />

      <ThemeToggle />
      <UserMenu />
    </header>
  );
}

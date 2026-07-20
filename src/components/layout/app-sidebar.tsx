"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { navigation, bottomNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </div>
        <span className="font-semibold tracking-tight">Life OS</span>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="flex flex-col gap-4">
          {navigation.map((group) => (
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
                  <NavLink
                    key={navItem.slug}
                    href={navItem.href}
                    active={active}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{navItem.title}</span>
                    {navItem.soon && (
                      <Badge
                        variant="outline"
                        className="h-4 px-1 text-[10px] text-muted-foreground/70"
                      >
                        soon
                      </Badge>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t px-2 py-2">
        {bottomNav.map((navItem) => {
          const active = pathname.startsWith(navItem.href);
          const Icon = navItem.icon;
          return (
            <NavLink key={navItem.slug} href={navItem.href} active={active}>
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 truncate">{navItem.title}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}

import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}) {
  const action = actionLabel ? (
    actionHref ? (
      <Button asChild size="sm">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    ) : (
      <Button size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    )
  ) : null;

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        {Icon && (
          <div className="flex size-11 items-center justify-center rounded-full bg-muted">
            <Icon className="size-5 text-muted-foreground" />
          </div>
        )}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && (
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {children}
        {action}
      </CardContent>
    </Card>
  );
}

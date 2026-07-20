import { formatDistanceToNow } from "date-fns";
import { Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ActivityItem } from "@/modules/gamification/types";

function label(item: ActivityItem): string {
  if (item.note) return item.note;
  return item.source.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No activity yet. Check in to earn your first XP.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-xp/15 text-xp">
                  <Zap className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{label(item)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-xp">
                  +{item.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

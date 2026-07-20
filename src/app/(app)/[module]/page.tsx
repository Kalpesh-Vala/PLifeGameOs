import { notFound } from "next/navigation";
import { Construction } from "lucide-react";
import { allNavItems } from "@/lib/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function ModulePlaceholderPage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  const navItem = allNavItems.find((item) => item.slug === module);

  if (!navItem) notFound();

  const Icon = navItem.icon;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={navItem.title} />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Icon className="size-7" />
          </div>
          <div className="space-y-1">
            <p className="flex items-center justify-center gap-2 font-medium">
              <Construction className="size-4 text-warning" />
              {navItem.title} is on the roadmap
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              This module is part of the Life OS vision and will be built in an
              upcoming phase. The foundation, navigation, and gamification core
              come first.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

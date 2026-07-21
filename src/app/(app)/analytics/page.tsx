import { PageHeader } from "@/components/layout/page-header";
import { AnalyticsView } from "@/modules/analytics/components/analytics-view";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Analytics"
        description="Patterns, trends, and the shape of your progress."
      />
      <AnalyticsView />
    </div>
  );
}

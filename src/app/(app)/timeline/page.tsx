import { PageHeader } from "@/components/layout/page-header";
import { TimelineView } from "@/modules/timeline/components/timeline-view";

export default function TimelinePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Daily Timeline"
        description="Log how you actually spend your day."
      />
      <TimelineView />
    </div>
  );
}

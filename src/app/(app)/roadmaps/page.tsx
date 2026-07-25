import { PageHeader } from "@/components/layout/page-header";
import { RoadmapsView } from "@/modules/roadmaps/components/roadmaps-view";

export default function RoadmapsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Roadmaps"
        description="Turn learning paths into step-by-step checklists."
      />
      <RoadmapsView />
    </div>
  );
}

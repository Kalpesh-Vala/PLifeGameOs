import { PageHeader } from "@/components/layout/page-header";
import { LearningView } from "@/modules/learning/components/learning-view";

export default function LearningPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Learning"
        description="Track courses and resources — earn XP when you finish."
      />
      <LearningView />
    </div>
  );
}

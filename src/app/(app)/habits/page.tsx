import { PageHeader } from "@/components/layout/page-header";
import { HabitsView } from "@/modules/habits/components/habits-view";

export default function HabitsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Habits"
        description="Small daily wins compound. Keep your streaks alive."
      />
      <HabitsView />
    </div>
  );
}

import { PageHeader } from "@/components/layout/page-header";
import { FitnessView } from "@/modules/fitness/components/fitness-view";

export default function FitnessPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Fitness"
        description="Track workouts, water, sleep, and weight — and level up your body."
      />
      <FitnessView />
    </div>
  );
}

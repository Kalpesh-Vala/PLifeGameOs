import { PageHeader } from "@/components/layout/page-header";
import { DashboardView } from "@/modules/gamification/components/dashboard-view";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <OnboardingGate />
      <PageHeader
        title="Dashboard"
        description="Your life at a glance. Every action levels up your character."
      />
      <DashboardView />
    </div>
  );
}

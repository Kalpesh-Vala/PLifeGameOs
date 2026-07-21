import { PageHeader } from "@/components/layout/page-header";
import { BossView } from "@/modules/boss/components/boss-view";

export default function GoalsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Boss Battles"
        description="Big goals become epic battles. Defeat them milestone by milestone."
      />
      <BossView />
    </div>
  );
}

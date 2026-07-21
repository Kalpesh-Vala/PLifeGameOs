import { PageHeader } from "@/components/layout/page-header";
import { QuestsView } from "@/modules/quests/components/quests-view";

export default function QuestsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Quests & Missions"
        description="Complete daily quests and weekly missions for bonus XP."
      />
      <QuestsView />
    </div>
  );
}

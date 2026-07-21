import { PageHeader } from "@/components/layout/page-header";
import { MoodView } from "@/modules/mood/components/mood-view";

export default function MoodPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Mood"
        description="Check in with yourself and watch the patterns emerge."
      />
      <MoodView />
    </div>
  );
}

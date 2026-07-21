import { PageHeader } from "@/components/layout/page-header";
import { JournalView } from "@/modules/journal/components/journal-view";

export default function JournalPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Journal"
        description="Reflect daily. Your future self will thank you."
      />
      <JournalView />
    </div>
  );
}

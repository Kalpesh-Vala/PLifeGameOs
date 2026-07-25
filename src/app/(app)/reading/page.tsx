import { PageHeader } from "@/components/layout/page-header";
import { ReadingView } from "@/modules/reading/components/reading-view";

export default function ReadingPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Reading"
        description="Manage your shelves and level up by finishing books."
      />
      <ReadingView />
    </div>
  );
}

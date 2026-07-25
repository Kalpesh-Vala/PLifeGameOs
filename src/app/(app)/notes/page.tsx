import { PageHeader } from "@/components/layout/page-header";
import { NotesView } from "@/modules/notes/components/notes-view";

export default function NotesPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Notes"
        description="Capture ideas and thoughts — your AI can recall them later."
      />
      <NotesView />
    </div>
  );
}

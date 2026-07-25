import { PageHeader } from "@/components/layout/page-header";
import { KnowledgeView } from "@/modules/knowledge/components/knowledge-view";

export default function KnowledgePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Knowledge Base"
        description="Your personal wiki of concepts — organized and AI-searchable."
      />
      <KnowledgeView />
    </div>
  );
}

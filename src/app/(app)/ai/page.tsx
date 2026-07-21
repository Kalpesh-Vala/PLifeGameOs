import { PageHeader } from "@/components/layout/page-header";
import { AiView } from "@/modules/ai/components/ai-view";

export default function AiPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="AI Assistant"
        description="Your coach, mentor, and accountability partner — grounded in your data."
      />
      <AiView />
    </div>
  );
}

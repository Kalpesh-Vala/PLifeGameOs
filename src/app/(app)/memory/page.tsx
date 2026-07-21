import { PageHeader } from "@/components/layout/page-header";
import { MemoryBoard } from "@/modules/memory/components/memory-view";

export default function MemoryPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="AI Memory"
        description="What your assistant remembers about you over the long term."
      />
      <MemoryBoard />
    </div>
  );
}

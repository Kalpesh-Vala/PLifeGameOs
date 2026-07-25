import { PageHeader } from "@/components/layout/page-header";
import { CodingView } from "@/modules/coding/components/coding-view";

export default function CodingPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Coding Tracker"
        description="Log solved problems, build a solving streak, and level up DSA."
      />
      <CodingView />
    </div>
  );
}

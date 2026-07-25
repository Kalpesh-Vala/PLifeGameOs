import { PageHeader } from "@/components/layout/page-header";
import { InterviewView } from "@/modules/interview/components/interview-view";

export default function InterviewPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Interview Prep"
        description="Track topics from 'to learn' to 'confident' and measure readiness."
      />
      <InterviewView />
    </div>
  );
}

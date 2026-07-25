import { PageHeader } from "@/components/layout/page-header";
import { VisionView } from "@/modules/vision/components/vision-view";

export default function VisionPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Vision Board"
        description="Picture the life you're building. Keep it in front of you."
      />
      <VisionView />
    </div>
  );
}

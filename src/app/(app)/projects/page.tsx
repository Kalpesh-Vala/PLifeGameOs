import { PageHeader } from "@/components/layout/page-header";
import { ProjectsView } from "@/modules/projects/components/projects-view";

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Projects"
        description="Track your builds from idea to shipped — and earn big XP when you launch."
      />
      <ProjectsView />
    </div>
  );
}

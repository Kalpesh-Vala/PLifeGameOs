import { PageHeader } from "@/components/layout/page-header";
import { TasksView } from "@/modules/tasks/components/tasks-view";

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Tasks"
        description="Capture what matters and earn XP as you complete it."
      />
      <TasksView />
    </div>
  );
}

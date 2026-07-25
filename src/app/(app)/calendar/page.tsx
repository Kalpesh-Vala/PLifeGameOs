import { PageHeader } from "@/components/layout/page-header";
import { CalendarView } from "@/modules/calendar/components/calendar-view";

export default function CalendarPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Calendar"
        description="Your tasks, events, journals, and mood — all on one calendar."
      />
      <CalendarView />
    </div>
  );
}

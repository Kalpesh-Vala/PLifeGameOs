import { PageHeader } from "@/components/layout/page-header";
import { LeaderboardView } from "@/modules/leaderboard/components/leaderboard-view";

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Leaderboard"
        description="Compete with your past self. Beat your best weeks."
      />
      <LeaderboardView />
    </div>
  );
}

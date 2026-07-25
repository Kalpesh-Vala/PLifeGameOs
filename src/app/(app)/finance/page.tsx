import { PageHeader } from "@/components/layout/page-header";
import { FinanceView } from "@/modules/finance/components/finance-view";

export default function FinancePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Finance"
        description="Track income and expenses, and stay on top of your money."
      />
      <FinanceView />
    </div>
  );
}

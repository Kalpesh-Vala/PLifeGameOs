import { PageHeader } from "@/components/layout/page-header";
import { SettingsView } from "@/modules/settings/components/settings-view";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Settings"
        description="Manage your profile, preferences, and data."
      />
      <SettingsView />
    </div>
  );
}

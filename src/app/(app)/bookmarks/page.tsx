import { PageHeader } from "@/components/layout/page-header";
import { BookmarksView } from "@/modules/bookmarks/components/bookmarks-view";

export default function BookmarksPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Bookmarks"
        description="Save and organize links worth coming back to."
      />
      <BookmarksView />
    </div>
  );
}

import { PageHeader } from "@/components/ui";
import ModerationBoard from "@/components/admin/ModerationBoard";

export default function ModerationPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Modération des événements" />
      <ModerationBoard />
    </div>
  );
}

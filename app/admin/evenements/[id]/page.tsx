import AdminEvenementDetail from "@/components/admin/AdminEvenementDetail";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminEvenementPage({ params }: PageProps) {
  const { id } = await params;

  return <AdminEvenementDetail evenementId={id} />;
}

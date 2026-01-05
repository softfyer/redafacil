import AppHeader from "@/components/dashboard/AppHeader";

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Painel do Aluno" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
      </main>
    </div>
  );
}

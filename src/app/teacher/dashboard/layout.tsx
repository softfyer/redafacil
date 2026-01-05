import AppHeader from "@/components/dashboard/AppHeader";
import AppSidebar from "@/components/dashboard/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ListTodo } from "lucide-react";

const sidebarNavItems = [
    { href: "/teacher/dashboard", icon: ListTodo, label: "Redações para Corrigir" },
]

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar navItems={sidebarNavItems} userRole="teacher" />
      <SidebarInset>
        <AppHeader title="Painel do Professor" />
        <main className="p-4 sm:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

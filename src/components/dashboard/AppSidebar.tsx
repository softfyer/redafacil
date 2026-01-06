'use client';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Feather, LogOut, BookMarked, ListTodo } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useUser } from '@/contexts/UserContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';

type NavItem = {
    href: string;
    icon: React.ElementType;
    label: string;
};

const studentNavItems: NavItem[] = [
    { href: "/student/dashboard", icon: BookMarked, label: "Minhas Redações" },
];

const teacherNavItems: NavItem[] = [
    { href: "/teacher/dashboard", icon: ListTodo, label: "Redações para Corrigir" },
];

type AppSidebarProps = {
    userRole: 'student' | 'teacher';
};

export default function AppSidebar({ userRole }: AppSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { userData, isLoading } = useUser();

    const navItems = userRole === 'student' ? studentNavItems : teacherNavItems;

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const getInitials = (name: string | undefined) => {
        if (!name) return '';
        const nameParts = name.split(' ');
        const initials = nameParts.map(part => part.charAt(0)).join('');
        return initials.toUpperCase();
    };

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <Feather className="w-8 h-8 text-primary" />
                    <h1 className="text-xl font-bold tracking-tighter text-foreground">Redação Online</h1>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {navItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={pathname === item.href}>
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                {isLoading ? (
                    <div className="flex items-center gap-3 p-2">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>{getInitials(userData?.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{userData?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{userData?.email}</p>
                        </div>
                        <button onClick={handleLogout} className="focus:outline-none">
                             <LogOut className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                        </button>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}

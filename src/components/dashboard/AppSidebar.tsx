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
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
    const navItems = userRole === 'student' ? studentNavItems : teacherNavItems;
    const avatar = PlaceHolderImages.find(img => img.id === (userRole === 'student' ? 'user-avatar-1' : 'user-avatar-2'));
    const userName = userRole === 'student' ? 'Juliana Pereira' : 'Prof. Antunes';
    const userEmail = userRole === 'student' ? 'aluno@email.com' : 'professor@email.com';

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
                <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                    <Avatar className="h-9 w-9">
                        {avatar && <AvatarImage src={avatar.imageUrl} alt="User avatar" data-ai-hint={avatar.imageHint} />}
                        <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{userName}</p>
                        <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                    </div>
                    <Link href="/" passHref>
                        <LogOut className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                    </Link>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}

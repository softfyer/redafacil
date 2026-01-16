'use client';

import { Bell, LogOut, User, Sun, Moon, Trash2, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getNotifications, deleteAllNotifications, type Notification } from '@/lib/services/notificationService';
import { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Feather } from 'lucide-react';
import { ProfileModal } from './ProfileModal';
import { ClientOnly } from '../ui/client-only';
import { useUser } from '@/contexts/UserContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// A specific component for notifications, to keep the main header clean
const TeacherNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { toast } = useToast();
    const notificationCount = notifications.length;

    const fetchNotifications = async () => {
        try {
            const fetchedNotifications = await getNotifications();
            setNotifications(fetchedNotifications);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            toast({ title: 'Erro ao buscar notificações', variant: 'destructive' });
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleClearNotifications = async () => {
        if (notificationCount === 0) return;
        try {
            await deleteAllNotifications();
            setNotifications([]);
            toast({ title: 'Notificações limpas!' });
        } catch (error) {
            console.error('Failed to clear notifications:', error);
            toast({ title: 'Erro', description: 'Não foi possível limpar as notificações.', variant: 'destructive' });
        }
    };

    return (
        <Popover onOpenChange={(isOpen) => { if(isOpen) fetchNotifications() }}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{notificationCount}</Badge>
                    )}
                    <span className="sr-only">Ver notificações</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="grid gap-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                    <h4 className="font-medium leading-none">Notificações</h4>
                    {notificationCount > 0 && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-red-500" onClick={handleClearNotifications}>
                            <Trash2 className="mr-1 h-3 w-3" />
                            Limpar Notificações
                        </Button>
                    )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                    {notificationCount > 0
                        ? `Você tem ${notificationCount} novas notificações.`
                        : 'Nenhuma notificação nova.'}
                    </p>
                </div>
                <div className="grid gap-2">
                    {notifications.map(notification => (
                    <div key={notification.id} className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                        <span className='flex h-2 w-2 translate-y-1.5 rounded-full bg-primary' />
                        <div className="grid gap-1">
                        <p className="text-sm font-medium leading-tight">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : 'agora'}
                        </p>
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default function AppHeader({ title }: { title: string }) {
  const { userData, userRole } = useUser();
  const router = useRouter();
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return '';
    return name.split(' ').map(part => part.charAt(0)).join('').toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mr-auto">
          <Feather className="w-7 h-7 text-primary" />
          <h1 className="text-lg font-bold tracking-tighter hidden sm:block">RedaFácil</h1>
        </div>
        
        <div className="flex-1 text-center">
          <h1 className="text-base font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <ClientOnly>
            {userRole === 'teacher' && <TeacherNotifications />}
            {userRole === 'student' && (
                <Button variant="outline" size="sm" asChild>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                        <Youtube className="mr-2 h-4 w-4" />
                        Suporte
                    </a>
                </Button>
            )}
          </ClientOnly>

          <ClientOnly>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(userData?.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userData?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userData?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsProfileModalOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={toggleTheme}>
                  {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                  <span>Alternar Tema</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ClientOnly>
        </div>
      </header>
      <ProfileModal isOpen={isProfileModalOpen} onOpenChange={setIsProfileModalOpen} />
    </>
  );
}

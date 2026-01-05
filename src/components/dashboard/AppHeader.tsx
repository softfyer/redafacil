'use client';

import { Bell, LogOut, User, Settings, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockNotifications } from '@/lib/placeholder-data';
import type { Notification } from '@/lib/placeholder-data';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Feather } from 'lucide-react';
import { ProfileModal } from './ProfileModal';
import { ClientOnly } from '../ui/client-only';

export default function AppHeader({ title }: { title: string }) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;
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

  const handleMarkAsRead = (id: string) => {
    setNotifications(currentNotifications => 
      currentNotifications.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mr-auto">
          <Feather className="w-7 h-7 text-primary" />
          <h1 className="text-lg font-bold tracking-tighter hidden sm:block">Redação Online</h1>
        </div>
        
        <div className="flex-1 text-center">
          <h1 className="text-base font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{unreadCount}</Badge>
                )}
                <span className="sr-only">Toggle notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Notificações</h4>
                  <p className="text-sm text-muted-foreground">
                    Você tem {unreadCount} notificações não lidas.
                  </p>
                </div>
                <div className="grid gap-2">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <span className={`flex h-2 w-2 translate-y-1.5 rounded-full ${!notification.read ? 'bg-primary' : 'bg-muted'}`} />
                      <div className="grid gap-1">
                        <p className="text-sm font-medium">{notification.message}</p>
                        <p className="text-sm text-muted-foreground">
                          <ClientOnly>
                            {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: ptBR })}
                          </ClientOnly>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>JP</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Juliana Pereira</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    aluno@email.com
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
              <DropdownMenuItem asChild>
                  <Link href="/">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                  </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <ProfileModal isOpen={isProfileModalOpen} onOpenChange={setIsProfileModalOpen} />
    </>
  );
}

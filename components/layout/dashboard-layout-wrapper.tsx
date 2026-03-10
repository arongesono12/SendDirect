'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getInitials } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Bell, 
  LayoutDashboard, 
  Send, 
  Users, 
  Wallet, 
  History,
  TrendingUp,
  UserCog,
  LogOut,
} from 'lucide-react';
import { signOutAction } from '@/app/actions/auth';
import { SearchModal } from './search-modal';
import { NotificationModal } from './notification-modal';

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAppStore();
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const mainArea = document.querySelector('main');
    if (!mainArea) return;

    const handleScroll = () => {
      setScrolled(mainArea.scrollTop > 10);
    };

    mainArea.addEventListener('scroll', handleScroll);
    return () => mainArea.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOutAction();
    setUser(null);
    router.push('/login');
  };
  
  const navItems = user?.role === 'admin' 
    ? [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/transfers', label: 'Envíos', icon: Send },
        { href: '/agents', label: 'Gestores', icon: Users },
        { href: '/balance', label: 'Saldos', icon: Wallet },
        { href: '/history', label: 'Historial', icon: History },
      ]
    : [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/transfers', label: 'Enviar', icon: Send },
        { href: '/balance', label: 'Billetera', icon: Wallet },
        { href: '/history', label: 'Actividad', icon: History },
      ];

  return (
    <div className="main-container min-h-screen font-sans bg-background/50">
      <div className="max-w-[1440px] mx-auto w-full dashboard-card flex flex-col h-[calc(100vh-4rem)] relative">
        {/* Top Header Navigation */}
        <header className={cn(
          "h-20 flex items-center justify-between px-10 border-b border-border/10 shrink-0 bg-card/50 backdrop-blur-xl transition-all duration-300 z-50",
          scrolled && "h-16 shadow-lg shadow-black/5"
        )}>
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-gradient text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tighter text-foreground">SendDirect</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      "px-5 py-2 rounded-full text-sm font-bold transition-all duration-300",
                      isActive 
                        ? "bg-brand-gradient text-white shadow-lg shadow-pink-500/20" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-muted-foreground">
              <button 
                onClick={() => setSearchOpen(true)}
                className="p-2 hover:bg-muted/50 rounded-full transition-colors text-foreground/70 hover:text-foreground"
              >
                <Search className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setNotificationsOpen(true)}
                className="p-2 hover:bg-muted/50 rounded-full transition-colors relative text-foreground/70 hover:text-foreground"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-background" />
              </button>
              <ThemeToggle />
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-border/50">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-foreground leading-tight">{user?.name || 'Usuario'}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{user?.email || 'invitado@mail.com'}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-10 w-10 border border-border/20 shadow-sm cursor-pointer transition-transform hover:scale-105 active:scale-95">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-brand-gradient text-white font-black text-xs">
                      {getInitials(user?.name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-black leading-none">{user?.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide bg-background/30">
          {children}
        </main>

        {/* Modals */}
        <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
        <NotificationModal open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      </div>
    </div>
  );
}

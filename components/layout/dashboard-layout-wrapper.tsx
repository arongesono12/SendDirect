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
  Menu,
  X,
  BarChart3,
  Settings,
} from 'lucide-react';
import { signOutAction } from '@/app/actions/auth';
import { SearchModal } from './search-modal';
import { NotificationModal } from './notification-modal';
import { SettingsModal } from './settings-modal';
import { getAgentNotifications } from '@/services/transfer';

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, setUser, theme } = useAppStore();
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  const isDark = theme === 'dark';

  useEffect(() => {
    const mainArea = document.querySelector('main');
    if (!mainArea) return;

    const handleScroll = () => {
      setScrolled(mainArea.scrollTop > 10);
    };

    mainArea.addEventListener('scroll', handleScroll);
    return () => mainArea.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function loadNotificationCount() {
      if (!user?.id) return;
      try {
        const notifications = await getAgentNotifications(user.id);
        setNotificationCount(notifications.length);
      } catch (error) {
        console.error('Error loading notification count:', error);
      }
    }
    loadNotificationCount();
    const interval = setInterval(loadNotificationCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

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
        { href: '/stats', label: 'Estadísticas', icon: BarChart3 },
        { href: '/history', label: 'Historial', icon: History },
      ]
    : [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/transfers', label: 'Enviar', icon: Send },
        { href: '/balance', label: 'Billetera', icon: Wallet },
        { href: '/history', label: 'Actividad', icon: History },
      ];

  return (
    <div className={`main-container min-h-screen font-sans ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Background decoration - hidden on mobile */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className={`absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl ${
            isDark ? 'bg-pink-500/10' : 'bg-pink-100/60'
          }`} />
          <div className={`absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl ${
            isDark ? 'bg-rose-500/10' : 'bg-rose-100/60'
          }`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl ${
            isDark ? 'bg-pink-600/5' : 'bg-pink-50/50'
          }`} />
        </div>
      </div>
      
      {/* Mobile: Full screen card | Desktop: Max width card */}
      <div className={cn(
        "mx-auto w-full relative flex flex-col",
        "md:max-w-[1440px] md:h-[calc(100vh-4rem)] md:rounded-[2.5rem] md:shadow-xl md:shadow-slate-200/20 dark:md:shadow-black/20 md:border md:border-border/10",
        "h-screen md:h-auto"
      )}>
        {/* Top Header Navigation */}
        <header className={cn(
          "h-16 md:h-20 flex items-center justify-between px-4 md:px-10 border-b border-border/10 shrink-0 bg-card/50 backdrop-blur-xl transition-all duration-300 z-50",
          scrolled && "h-14 md:h-16 shadow-lg shadow-black/5"
        )}>
          {/* Left side: Logo + Nav */}
          <div className="flex items-center gap-2">
            <Link 
              href="/" 
              className="flex items-center gap-2"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div className="p-1.5 rounded-lg bg-brand-gradient text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-lg md:text-xl font-black tracking-tighter text-foreground">SendDirect</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 ml-4">
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
                        : "text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-500/20"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side: Menu + Search + Notifications + Theme + Avatar */}
          <div className="flex items-center gap-1 md:gap-4">
            {/* Mobile Menu Button - Right side */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-pink-100 dark:hover:bg-pink-500/20 rounded-full transition-colors text-foreground/70 hover:text-pink-600 dark:hover:text-pink-400"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="flex items-center gap-1 md:gap-2 text-muted-foreground">
              <button 
                onClick={() => setSearchOpen(true)}
                className="p-2 hover:bg-pink-100 dark:hover:bg-pink-500/20 rounded-full transition-colors text-foreground/70 hover:text-pink-600 dark:hover:text-pink-400"
              >
                <Search className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setNotificationsOpen(true)}
                className="p-2 hover:bg-pink-100 dark:hover:bg-pink-500/20 rounded-full transition-colors relative text-foreground/70 hover:text-pink-600 dark:hover:text-pink-400"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
              <ThemeToggle />
            </div>
            </div>

            <div className="flex items-center gap-3 pl-2 md:pl-6 border-l border-border/50">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-foreground leading-tight">{user?.name || 'Usuario'}</p>
                <p className="text-[10px] font-bold text-muted-foreground">{user?.email || 'invitado@mail.com'}</p>
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
                      <p className="text-[10px] font-bold text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
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
          </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 md:top-20 z-40 bg-card/95 backdrop-blur-xl">
            <nav className="flex flex-col p-4 space-y-2 mt-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
                      isActive 
                        ? "bg-brand-gradient text-white shadow-lg shadow-pink-500/20" 
                        : "text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-500/20"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Content Area */}
        <main className={cn(
          "flex-1 overflow-y-auto scrollbar-hide bg-card md:bg-transparent",
          isDark ? 'bg-black md:bg-transparent' : 'bg-white md:bg-transparent',
          "p-4 md:p-10",
          "h-[calc(100vh-4rem)] md:h-auto"
        )}>
          {children}
        </main>

        {/* Modals */}
        <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
        <NotificationModal open={notificationsOpen} onOpenChange={setNotificationsOpen} />
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </div>
  );
}

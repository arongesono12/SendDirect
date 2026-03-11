'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { getAgentDashboardStats, getAdminDashboardStats, getRecentTransfers } from '@/services/dashboard';
import type { DashboardStats, Transfer } from '@/types';
import { formatCurrency, cn, getInitials, convertCurrency } from '@/lib/utils';
import { 
  ArrowUpRight,
  TrendingUp,
  Plus,
  ShieldAlert
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, preferredCurrency } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransfers, setRecentTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const displayCurrency = preferredCurrency || 'XAF';

  const formatBalance = (amount: number) => {
    const converted = convertCurrency(amount, 'XAF', displayCurrency);
    return formatCurrency(converted, displayCurrency);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, transfersData] = await Promise.all([
          user?.role === 'admin' ? getAdminDashboardStats() : getAgentDashboardStats(user?.id || ''),
          getRecentTransfers(5)
        ]);
        setStats(statsData);
        setRecentTransfers(transfersData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground font-semibold">Cargando tablero...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. Header Information Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">Panel</h1>
          <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs md:text-sm">
            <span className="hidden sm:inline">SendDirect x {user?.name || 'Equipo Directo'}</span>
            <span className="sm:hidden">{user?.name || 'Usuario'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hidden md:inline" />
            <span className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors uppercase tracking-widest text-[10px] hidden md:flex">ID S-DIRECT-08PX <ArrowUpRight className="h-3 w-3" /></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick Stats Row - Financial Style */}
          <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-card/50 backdrop-blur-sm rounded-full border border-border/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Comisiones</span>
              <span className="text-sm font-black text-green-500">{formatBalance((stats?.totalSent || 0) * 0.02)}</span>
            </div>
            <div className="w-px h-4 bg-border/50" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Promedio</span>
              <span className="text-sm font-black text-foreground">{formatBalance((stats?.totalSent || 0) / Math.max(stats?.todayTransfers || 1, 1))}</span>
            </div>
            <div className="w-px h-4 bg-border/50" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Tasa</span>
              <span className="text-sm font-black text-pink-500">98.5%</span>
            </div>
          </div>
        </div>
        {user?.role === 'admin' ? (
          <Button 
            disabled 
            className="h-14 px-8 rounded-2xl bg-muted text-muted-foreground font-black text-sm transition-all gap-3 border border-border/10 opacity-50"
          >
            <ShieldAlert className="h-4 w-4" /> Envíos Deshabilitados
          </Button>
        ) : (
          <Link href="/transfers">
            <Button className="h-14 px-8 rounded-2xl bg-brand-gradient text-white font-black text-lg shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all gap-3">
              <Plus className="h-5 w-5" /> Nuevo Envío
            </Button>
          </Link>
        )}
      </div>

      {/* 2 & 3: Today Stats & Radial Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Today Summary (Today Task Style) */}
        <div className="lg:col-span-2 space-y-6 bg-card p-8 rounded-[2.5rem] border border-border/50 shadow-sm text-card-foreground">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Flujo del Día</h2>
            <Button variant="ghost" className="text-sm font-bold text-muted-foreground hover:text-foreground">Ver todo</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Balance */}
            <div className="p-6 rounded-4xl bg-blue-500/5 dark:bg-blue-900/10 border border-blue-500/10 dark:border-blue-900/20 flex flex-col gap-6">
              <Badge className="w-fit bg-card/80 text-blue-600 dark:text-blue-400 border-none shadow-sm text-[10px] font-black uppercase">Capital Total</Badge>
              <div className="space-y-1">
                <p className="text-2xl font-black">{formatBalance(stats?.totalBalance || 0)}</p>
                <p className="text-xs font-bold text-blue-400">Saldo disponible</p>
              </div>
              <div className="mt-auto h-1 w-full bg-blue-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[75%]" />
              </div>
            </div>
            {/* Card 2: Sent */}
            <div className="p-6 rounded-4xl bg-purple-500/5 dark:bg-purple-900/10 border border-purple-500/10 dark:border-purple-900/20 flex flex-col gap-6">
              <Badge className="w-fit bg-card/80 text-purple-600 dark:text-purple-400 border-none shadow-sm text-[10px] font-black uppercase">Enviado Hoy</Badge>
              <div className="space-y-1">
                <p className="text-2xl font-black">{formatBalance(stats?.totalSent || 0)}</p>
                <p className="text-xs font-bold text-purple-400">Volumen procesado</p>
              </div>
              <div className="mt-auto h-1 w-full bg-purple-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[45%]" />
              </div>
            </div>
            {/* Card 3: New Operations */}
            <div className="p-6 rounded-4xl bg-orange-500/5 dark:bg-orange-900/10 border border-orange-500/10 dark:border-orange-900/20 flex flex-col gap-6">
              <Badge className="w-fit bg-card/80 text-orange-600 dark:text-orange-400 border-none shadow-sm text-[10px] font-black uppercase">Operaciones</Badge>
              <div className="space-y-1">
                <p className="text-2xl font-black">{stats?.todayTransfers || 0}</p>
                <p className="text-xs font-bold text-orange-400">Total transacciones</p>
              </div>
              <div className="mt-auto h-1 w-full bg-orange-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-[60%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Radial Distribution (Project Completed Style) */}
        <div className="bg-card p-8 rounded-[2.5rem] border border-border/50 shadow-sm flex flex-col gap-8 text-card-foreground">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Distribución</h2>
            <p className="text-xs font-bold text-muted-foreground">Meta mes 100%</p>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            {/* Custom SVG Radial Chart Placeholder to match image style */}
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" className="stroke-muted/30" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8b5cf6" strokeWidth="10" strokeDasharray="251" strokeDashoffset="125" strokeLinecap="round" />
                <circle cx="50" cy="50" r="30" fill="transparent" className="stroke-muted/30" strokeWidth="8" />
                <circle cx="50" cy="50" r="30" fill="transparent" stroke="#f97316" strokeWidth="10" strokeDasharray="188" strokeDashoffset="47" strokeLinecap="round" />
                <circle cx="50" cy="50" r="20" fill="transparent" className="stroke-muted/30" strokeWidth="8" />
                <circle cx="50" cy="50" r="20" fill="transparent" stroke="#3b82f6" strokeWidth="10" strokeDasharray="125" strokeDashoffset="100" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-xs font-bold text-muted-foreground">Completadas</span>
              </div>
              <span className="text-sm font-black">50%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-xs font-bold text-muted-foreground">En Tránsito</span>
              </div>
              <span className="text-sm font-black">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-muted-foreground">Pendientes</span>
              </div>
              <span className="text-sm font-black">15%</span>
            </div>
          </div>
        </div>
      </div>

      {stats?.balancesByCurrency && Object.keys(stats.balancesByCurrency).length > 0 && (
        <div className="bg-card p-8 rounded-[2.5rem] border border-border/50 shadow-sm text-card-foreground">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black">Saldo por Moneda</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const currencyToShow = preferredCurrency || 'XAF';
              const amount = stats.balancesByCurrency[currencyToShow] || stats.balancesByCurrency['XAF'] || 0;
              return (
                <div key={currencyToShow} className="p-4 rounded-xl border border-border/20 bg-card/60 flex flex-col items-start">
                  <span className="text-xs font-bold text-muted-foreground uppercase">{currencyToShow}</span>
                  <span className="text-lg font-black mt-1">{formatCurrency(amount, currencyToShow)}</span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 4, 5 & 6: Ranking, Tracker & Chat */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {/* Performance (Rank Performance Style) */}
        <div className="space-y-6 bg-card p-8 rounded-[2.5rem] border border-border/50 shadow-sm text-card-foreground">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Actividad Top</h2>
            <Button variant="ghost" className="text-sm font-bold text-muted-foreground">Ver todo</Button>
          </div>
          <div className="space-y-6">
            {recentTransfers.slice(0, 3).map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-xs",
                    idx === 0 ? "bg-orange-400" : idx === 1 ? "bg-blue-400" : "bg-purple-400"
                  )}>
                    {getInitials(item.receiver_name)}
                  </div>
                  <div>
                    <p className="text-sm font-black leading-none">{item.receiver_name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-1">{item.destination_city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{formatBalance(item.amount)}</p>
                  <p className="text-[10px] font-black text-rose-500 uppercase">Monto</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tracker (Tracker Detail Style) */}
        <div className="space-y-6 bg-card p-8 rounded-[2.5rem] border border-border/50 shadow-sm text-card-foreground">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Volumen Semanal</h2>
            <Button variant="ghost" className="text-sm font-bold text-muted-foreground">Ver todo</Button>
          </div>
          <div className="h-48 flex items-end justify-between gap-1 px-2">
            {[40, 70, 50, 90, 60, 80].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative group">
                  <div className="absolute inset-x-0 bottom-0 bg-muted rounded-full h-40 opacity-20" />
                  <div 
                    className={cn(
                      "w-full bg-rose-500 rounded-full transition-all duration-700",
                      i % 2 === 0 ? "bg-rose-500/80" : "bg-blue-500/80"
                    )} 
                    style={{ height: `${h}%` }} 
                    title={`${h}%`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Envíos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Cobros</span>
            </div>
          </div>
        </div>

        {/* Chat / Alert Section (Chat Style) */}
        <div className="space-y-6 bg-card p-8 rounded-[2.5rem] border border-border/50 shadow-sm relative overflow-hidden text-card-foreground">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Soporte</h2>
            <Button variant="ghost" className="text-sm font-bold text-muted-foreground">Ver todo</Button>
          </div>
          
          <div className="space-y-4">
             {/* Admin Message */}
             <div className="flex flex-col items-end gap-1">
                <div className="bg-muted p-3 rounded-2xl rounded-tr-none text-xs font-bold text-muted-foreground max-w-[80%]">
                  Hola {user?.name.split(' ')[0]}, ¿necesitas ayuda con alguna transferencia hoy?
                </div>
                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">Admin - 10:25</span>
             </div>
             
             {/* Audio Message Placeholder Style */}
             <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <div className="h-10 w-10 shrink-0 bg-brand-gradient flex items-center justify-center rounded-xl text-white shadow-lg shadow-pink-500/20">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex gap-0.5 items-center">
                    {[2, 5, 3, 8, 4, 3, 6, 2, 4, 7].map((h, i) => (
                      <div key={i} className="flex-1 bg-primary/30 rounded-full h-px" style={{ height: `${h * 2}px` }} />
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-bold text-primary/60 uppercase tracking-widest">
                    <span>Grabación ID-88</span>
                    <span>0:12</span>
                  </div>
                </div>
             </div>
          </div>
          
          <Button variant="link" className="w-full text-rose-500 font-black text-sm p-0 underline mt-4">Hablar con Administración</Button>
        </div>
      </div>
    </div>
  );
}

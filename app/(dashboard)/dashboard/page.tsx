'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { getAgentDashboardStats, getAdminDashboardStats, getRecentTransfers, getAgentsCommissionStats } from '@/services/dashboard';
import type { DashboardStats, Transfer } from '@/types';
import { formatCurrency, cn, getInitials, convertCurrency } from '@/lib/utils';
import { 
  ArrowUpRight,
  TrendingUp,
  Plus,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SupportModal } from '@/components/layout/support-modal';
import {
  FlujoDiaModal,
  GestoresModal,
  VolumenSemanalModal,
  SoporteModal,
  ComisionesModal,
} from '@/components/layout/dashboard-detail-modals';

export default function DashboardPage() {
  const { user, preferredCurrency } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransfers, setRecentTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportRequestType, setSupportRequestType] = useState<'balance_topup' | 'report_error' | 'general'>('general');
  const [commissionStats, setCommissionStats] = useState<any>(null);

  // Detail modal states
  const [flujoDiaOpen, setFlujoDiaOpen] = useState(false);
  const [gestoresOpen, setGestoresOpen] = useState(false);
  const [volumenOpen, setVolumenOpen] = useState(false);
  const [comisionesOpen, setComisionesOpen] = useState(false);
  const [soporteOpen, setSoporteOpen] = useState(false);

  const displayCurrency = preferredCurrency || 'XAF';

  const formatBalance = (amount: number) => {
    const converted = convertCurrency(amount, 'XAF', displayCurrency);
    return formatCurrency(converted, displayCurrency);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, transfersData, commissionData] = await Promise.all([
          user?.role === 'admin' ? getAdminDashboardStats() : getAgentDashboardStats(user?.id || ''),
          getRecentTransfers(5, user?.role === 'gestor' ? user.id : undefined),
          user?.role === 'admin' ? getAgentsCommissionStats() : Promise.resolve(null)
        ]);
        setStats(statsData);
        setRecentTransfers(transfersData);
        setCommissionStats(commissionData);
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
    <div className="space-y-4 md:space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">Panel</h1>
          <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs md:text-sm">
            <span className="hidden sm:inline">SendDirect x {user?.name || 'Equipo Directo'}</span>
            <span className="sm:hidden">{user?.name || 'Usuario'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hidden md:inline" />
            <span className="items-center gap-1 cursor-pointer hover:text-foreground transition-colors uppercase tracking-widest text-[10px] hidden md:flex">
              ID S-DIRECT-08PX <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2 h-14 px-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-black text-sm">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Envíos Deshabilitados</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> Los administradores no realizan envíos directamente
            </span>
          </div>
        ) : (
          <Link href="/transfers">
            <Button className="h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl bg-brand-gradient text-white font-black text-base md:text-lg shadow-lg md:shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all gap-2 md:gap-3">
              <Plus className="h-4 md:h-5 w-4 md:w-5" /> Nuevo Envío
            </Button>
          </Link>
        )}
      </div>

      {/* 2 & 3: Today Stats & Radial Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* FLUJO DEL DÍA */}
        <div className="lg:col-span-2 space-y-4 bg-card p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-border/50 shadow-sm text-card-foreground">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-black">Flujo del Día</h2>
            <Button
              variant="ghost"
              className="text-sm font-bold text-muted-foreground hover:text-foreground"
              onClick={() => setFlujoDiaOpen(true)}
            >
              Ver todo
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-900/10 border border-blue-500/10 dark:border-blue-900/20 flex flex-col gap-4">
              <Badge className="w-fit bg-card/80 text-blue-600 dark:text-blue-400 border-none shadow-sm text-[10px] font-black uppercase">Capital Total</Badge>
              <div className="space-y-1">
                <p className="text-xl md:text-2xl font-black">{formatBalance(stats?.totalBalance || 0)}</p>
                <p className="text-xs font-bold text-blue-400">Saldo disponible</p>
              </div>
              <div className="mt-auto h-1 w-full bg-blue-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[75%]" />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-900/10 border border-purple-500/10 dark:border-purple-900/20 flex flex-col gap-4">
              <Badge className="w-fit bg-card/80 text-purple-600 dark:text-purple-400 border-none shadow-sm text-[10px] font-black uppercase">Enviado Hoy</Badge>
              <div className="space-y-1">
                <p className="text-xl md:text-2xl font-black">{formatBalance(stats?.totalSent || 0)}</p>
                <p className="text-xs font-bold text-purple-400">Volumen procesado</p>
              </div>
              <div className="mt-auto h-1 w-full bg-purple-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[45%]" />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-orange-500/5 dark:bg-orange-900/10 border border-orange-500/10 dark:border-orange-900/20 flex flex-col gap-4">
              <Badge className="w-fit bg-card/80 text-orange-600 dark:text-orange-400 border-none shadow-sm text-[10px] font-black uppercase">Operaciones</Badge>
              <div className="space-y-1">
                <p className="text-xl md:text-2xl font-black">{stats?.todayTransfers || 0}</p>
                <p className="text-xs font-bold text-orange-400">Total transacciones</p>
              </div>
              <div className="mt-auto h-1 w-full bg-orange-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-[60%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Radial Distribution */}
        <div className="bg-card p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-border/50 shadow-sm flex flex-col gap-4 md:gap-6 text-card-foreground">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-black">Distribución</h2>
            <p className="text-xs font-bold text-muted-foreground">Meta mes 100%</p>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
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

        {/* COMISIONES - Only Admin and Gestor */}
        {user?.role !== 'cliente' && (
        <div className="bg-card p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-border/50 shadow-sm text-card-foreground">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-black">Comisiones</h2>
            <Button
              variant="ghost"
              className="text-sm font-bold text-muted-foreground hover:text-foreground"
              onClick={() => setComisionesOpen(true)}
            >
              Ver todo
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user?.role === 'admin' ? (
              <>
                <div className="p-4 rounded-2xl bg-green-500/5 dark:bg-green-900/10 border border-green-500/10 flex flex-col gap-2">
                  <Badge className="w-fit bg-card/80 text-green-600 dark:text-green-400 border-none text-[10px] font-black uppercase">Comisión Total</Badge>
                  <p className="text-2xl font-black text-green-600 dark:text-green-400">{formatBalance(commissionStats?.totalCommission || 0)}</p>
                  <p className="text-xs font-bold text-muted-foreground">Todos los gestores</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/10 flex flex-col gap-2">
                  <Badge className="w-fit bg-card/80 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-black uppercase">Comisión Hoy</Badge>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatBalance(commissionStats?.todayCommission || 0)}</p>
                  <p className="text-xs font-bold text-muted-foreground">Ganado hoy</p>
                </div>
                <div className="p-4 rounded-2xl bg-teal-500/5 dark:bg-teal-900/10 border border-teal-500/10 flex flex-col gap-2">
                  <Badge className="w-fit bg-card/80 text-teal-600 dark:text-teal-400 border-none text-[10px] font-black uppercase">Gestores</Badge>
                  <p className="text-2xl font-black text-teal-600 dark:text-teal-400">{commissionStats?.agents?.length || 0}</p>
                  <p className="text-xs font-bold text-muted-foreground">Activos</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-green-500/5 dark:bg-green-900/10 border border-green-500/10 flex flex-col gap-2">
                  <Badge className="w-fit bg-card/80 text-green-600 dark:text-green-400 border-none text-[10px] font-black uppercase">Mi Comisión Total</Badge>
                  <p className="text-2xl font-black text-green-600 dark:text-green-400">{formatBalance(stats?.totalCommission || 0)}</p>
                  <p className="text-xs font-bold text-muted-foreground">Ganancias por envíos</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-500/10 flex flex-col gap-2">
                  <Badge className="w-fit bg-card/80 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-black uppercase">Comisión Hoy</Badge>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatBalance(stats?.todayCommission || 0)}</p>
                  <p className="text-xs font-bold text-muted-foreground">Ganado hoy</p>
                </div>
                <div className="p-4 rounded-2xl bg-teal-500/5 dark:bg-teal-900/10 border border-teal-500/10 flex flex-col gap-2">
                  <Badge className="w-fit bg-card/80 text-teal-600 dark:text-teal-400 border-none text-[10px] font-black uppercase">Promedio</Badge>
                  <p className="text-2xl font-black text-teal-600 dark:text-teal-400">{formatBalance(stats?.commissionPerTransfer || 0)}</p>
                  <p className="text-xs font-bold text-muted-foreground">Por transacción</p>
                </div>
              </>
            )}
          </div>
        </div>
        )}

      {stats?.balancesByCurrency && Object.keys(stats.balancesByCurrency).length > 0 && (
        <div className="bg-card p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-border/50 shadow-sm text-card-foreground">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-black">Saldo por Moneda</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const currencyToShow = preferredCurrency || 'XAF';
              const amount = stats.balancesByCurrency![currencyToShow] || stats.balancesByCurrency!['XAF'] || 0;
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

      {/* 4, 5 & 6: Ranking, Tracker & Chat - Only for Admin and Gestor */}
      {user?.role !== 'cliente' && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

        {/* ENVÍOS DE GESTORES */}
        <div className="space-y-4 bg-card p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-border/50 shadow-sm text-card-foreground">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-black">
              {user?.role === 'admin' ? 'Envíos de Gestores' : user?.role === 'gestor' ? 'Actividad Top' : 'Mi Actividad'}
            </h2>
            <Button
              variant="ghost"
              className="text-sm font-bold text-muted-foreground"
              onClick={() => setGestoresOpen(true)}
            >
              Ver todo
            </Button>
          </div>

          {user?.role === 'admin' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wide">
                Supervisión — Admins no realizan envíos directamente
              </span>
            </div>
          )}

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
                    {user?.role === 'admin' && (item as any).agent?.name && (
                      <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                        Gestor: {(item as any).agent.name}
                      </p>
                    )}
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">{item.destination_city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">{formatBalance(item.amount)}</p>
                  <p className="text-[10px] font-black text-rose-500 uppercase">Monto</p>
                </div>
              </div>
            ))}
            {recentTransfers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay transferencias recientes</p>
            )}
          </div>
        </div>

        {/* VOLUMEN SEMANAL */}
        <div className="space-y-4 bg-card p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-border/50 shadow-sm text-card-foreground">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-black">Volumen Semanal</h2>
            <Button
              variant="ghost"
              className="text-sm font-bold text-muted-foreground"
              onClick={() => setVolumenOpen(true)}
            >
              Ver todo
            </Button>
          </div>
          <div className="h-32 md:h-48 flex items-end justify-between gap-1 px-2">
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

        {/* SOPORTE */}
        <div className="space-y-4 bg-card p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-border/50 shadow-sm relative overflow-hidden text-card-foreground">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-black">Soporte</h2>
            <Button
              variant="ghost"
              className="text-sm font-bold text-muted-foreground"
              onClick={() => setSoporteOpen(true)}
            >
              Ver todo
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col items-end gap-1">
              <div className="bg-muted p-3 rounded-2xl rounded-tr-none text-xs font-bold text-muted-foreground max-w-[80%]">
                Hola {user?.name.split(' ')[0]}, ¿necesitas ayuda con alguna transferencia hoy?
              </div>
              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">Admin - 10:25</span>
            </div>

            <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <div className="h-10 w-10 shrink-0 bg-brand-gradient flex items-center justify-center rounded-xl text-white shadow-lg shadow-pink-500/20">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex gap-0.5 items-center">
                  {[2, 5, 3, 8, 4, 3, 6, 2, 4, 7].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary/30 rounded-full" style={{ height: `${h * 2}px` }} />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold text-primary/60 uppercase tracking-widest">
                  <span>Grabación ID-88</span>
                  <span>0:12</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="link"
            className="w-full text-rose-500 font-black text-sm p-0 underline mt-4"
            onClick={() => setSupportOpen(true)}
          >
            Hablar con Administración
          </Button>
        </div>
      </div>
      )}

      {/* ─── MODALES / DRAWERS ──────────────────────────────────────── */}
      <SoporteModal
        open={soporteOpen}
        onClose={() => setSoporteOpen(false)}
        onContactAdmin={() => { setSoporteOpen(false); setSupportRequestType('general'); setSupportOpen(true); }}
        userName={user?.name}
        userRole={user?.role}
        onRequestTopup={() => { setSoporteOpen(false); setSupportRequestType('balance_topup'); setSupportOpen(true); }}
        onReportError={() => { setSoporteOpen(false); setSupportRequestType('report_error'); setSupportOpen(true); }}
        onCheckOrder={() => { setSoporteOpen(false); setGestoresOpen(true); }}
      />

      <ComisionesModal
        open={comisionesOpen}
        onClose={() => setComisionesOpen(false)}
        userRole={user?.role}
        stats={stats}
        commissionStats={commissionStats}
        preferredCurrency={displayCurrency}
      />
    </div>
  );
}

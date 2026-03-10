'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Bell, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { getAgentNotifications } from '@/services/transfer';
import { useAppStore } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCallback, useEffect, useState } from 'react';
import { Notification, Transfer } from '@/types';

type NotificationWithTransfer = Notification & {
  transfer: Pick<Transfer, 'transfer_code' | 'sender_name' | 'receiver_name'>;
};

interface NotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationModal({ open, onOpenChange }: NotificationModalProps) {
  const { user } = useAppStore();
  const [notifications, setNotifications] = useState<NotificationWithTransfer[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getAgentNotifications(user.id);
      const withTransfer = data.filter((n): n is NotificationWithTransfer => 
        Boolean((n as unknown as NotificationWithTransfer).transfer)
      );
      setNotifications(withTransfer);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (open && user?.id) {
      loadNotifications();
    }
  }, [open, user?.id, loadNotifications]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/95 glass-premium border-border/20 rounded-3xl p-0 overflow-hidden outline-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        <DialogHeader className="p-6 border-b border-border/10">
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-foreground">
            <Bell className="h-5 w-5 text-primary" /> Notificaciones de Envío
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Cargando...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-20 text-center">
              <Bell className="h-12 w-12 text-muted/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold">No hay notificaciones recientes</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className="p-4 rounded-2xl bg-muted/30 border border-border/5 hover:bg-muted/50 transition-colors group relative"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-2 rounded-xl shrink-0 mt-1",
                    notif.status === 'sent' ? "bg-green-100 text-green-600 dark:bg-green-900/30" : 
                    notif.status === 'failed' ? "bg-red-100 text-red-600 dark:bg-red-900/30" : 
                    "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                  )}>
                    {notif.status === 'sent' ? <CheckCircle className="h-4 w-4" /> : 
                     notif.status === 'failed' ? <AlertCircle className="h-4 w-4" /> : 
                     <Clock className="h-4 w-4" />}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-foreground uppercase tracking-tighter">
                        {notif.transfer.transfer_code}
                      </p>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-foreground/80 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        Para: {notif.transfer.receiver_name}
                      </span>
                      <div className={cn(
                        "h-1 w-1 rounded-full",
                        notif.status === 'sent' ? "bg-green-500" : "bg-red-500"
                      )} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        SMS {notif.status === 'sent' ? 'Enviado' : 'Fallido'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 bg-muted/20 border-t border-border/5 flex justify-center">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            SendDirect Notification System
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

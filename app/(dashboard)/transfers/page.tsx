'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTransfer } from '@/services/transfer';
import { createClientTransfer } from '@/services/client';
import { formatCurrency } from '@/lib/utils';
import { Send, AlertCircle, CheckCircle, User, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function TransfersPage() {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const [formData, setFormData] = useState({
    sender_name: '',
    sender_phone: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_document: '',
    amount: '',
    currency: 'XAF',
    destination_city: '',
    destination_country: 'Camerún',
    receiver_method: 'efectivo',
  });

  const isClient = user?.role === 'cliente';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = isClient
        ? await createClientTransfer({
            receiver_name: formData.receiver_name,
            receiver_phone: formData.receiver_phone,
            destination_city: formData.destination_city,
            destination_country: formData.destination_country,
            amount: parseFloat(formData.amount),
            currency: formData.currency,
          }, user?.id || '')
        : await createTransfer({
            sender_name: formData.sender_name,
            sender_phone: formData.sender_phone,
            receiver_name: formData.receiver_name,
            receiver_phone: formData.receiver_phone,
            destination_city: formData.destination_city,
            destination_country: formData.destination_country,
            amount: parseFloat(formData.amount),
            currency: formData.currency,
          }, user?.id || '');

      if (result.success) {
        setSuccess('¡Transferencia creada con éxito!');
        setFormData({
          sender_name: '',
          sender_phone: '',
          receiver_name: '',
          receiver_phone: '',
          receiver_document: '',
          amount: '',
          currency: 'XAF',
          destination_city: '',
          destination_country: 'Camerún',
          receiver_method: 'efectivo',
        });
        setIsConfirming(false);
      } else {
        setError(result.error || 'Error al procesar la transferencia');
      }
    } catch {
      setError('Ocurrió un error inesperado. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Admin Security Blocking
  if (user?.role === 'admin') {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="glass-premium p-16 rounded-[3rem] relative overflow-hidden backdrop-blur-xl border-white/10 dark:border-white/5">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-gradient" />
          <div className="mb-8 relative">
             <div className="h-24 w-24 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50 dark:ring-rose-900/10">
                <ShieldAlert className="h-12 w-12 text-rose-600 dark:text-rose-500" />
             </div>
          </div>
          <h1 className="text-4xl font-black text-foreground mb-6 tracking-tighter">Acceso Restringido</h1>
          <p className="text-xl font-bold text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Los administradores no pueden realizar envíos directamente para garantizar la integridad y auditoría del sistema.
          </p>
          <div className="mt-12">
            <Link href="/dashboard">
              <Button variant="outline" className="h-14 px-10 rounded-2xl font-black border-border/10 hover:bg-muted transition-all">
                Volver al Panel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto py-12 animate-in fade-in duration-700">
        <Card className="glass-premium p-10 text-center">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">¡Envío Exitoso!</h2>
          <p className="text-muted-foreground font-bold mb-8">
            La transferencia ha sido procesada y el código de retiro ha sido enviado al destinatario.
          </p>
          <Button 
            className="w-full h-14 rounded-2xl bg-primary text-white font-black text-lg"
            onClick={() => setSuccess('')}
          >
            Realizar otro envío
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          {isClient ? 'Enviar dinero' : 'Nueva transferencia'}
        </h1>
        <p className="text-muted-foreground font-semibold text-sm">
          {isClient 
            ? 'Envía dinero a otro cliente de forma rápida y segura' 
            : 'Completa los datos para realizar una nueva transferencia'}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="glass-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-foreground text-xl font-bold">
              <div className="p-2 rounded-xl bg-primary text-white shadow-lg bg-brand-gradient">
                {isClient ? <User className="h-5 w-5" /> : <Send className="h-5 w-5" />}
              </div>
              {isClient ? 'Datos del destinatario' : 'Datos de la transferencia'}
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              {isClient 
                ? 'Ingresa la información del destinatario' 
                : 'Ingresa la información del remitente y destinatario'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isClient && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="sender_name" className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nombre remitente</Label>
                    <Input id="sender_name" value={formData.sender_name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sender_phone" className="text-[10px] font-black uppercase text-muted-foreground ml-1">Teléfono remitente</Label>
                    <Input id="sender_phone" type="tel" value={formData.sender_phone} onChange={handleChange} required />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="receiver_name" className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nombre destinatario</Label>
                  <Input id="receiver_name" value={formData.receiver_name} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiver_phone" className="text-[10px] font-black uppercase text-muted-foreground ml-1">Teléfono destinatario</Label>
                  <Input id="receiver_phone" type="tel" value={formData.receiver_phone} onChange={handleChange} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-[10px] font-black uppercase text-muted-foreground ml-1">Monto {formData.currency}</Label>
                  <Input id="amount" type="number" step="0.01" min="1" value={formData.amount} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination_city" className="text-[10px] font-black uppercase text-muted-foreground ml-1">Ciudad destino</Label>
                  <Input id="destination_city" value={formData.destination_city} onChange={handleChange} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiver_method" className="text-[10px] font-black uppercase text-muted-foreground ml-1">Método de cobro</Label>
                <Select value={formData.receiver_method} onValueChange={(v) => handleSelectChange('receiver_method', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo en ventanilla</SelectItem>
                    <SelectItem value="movil">Móvil (Orange/MTN)</SelectItem>
                    <SelectItem value="banco">Transferencia bancaria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 text-xs font-bold text-red-600 bg-red-50 rounded-xl border border-red-100 animate-in shake duration-500">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {isConfirming ? (
                <div className="space-y-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in zoom-in-95 duration-300">
                  <p className="text-xs font-black text-foreground uppercase text-center mb-2">Resumen de envío</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-bold">Total a enviar:</span>
                    <span className="text-foreground font-black">{formatCurrency(parseFloat(formData.amount), formData.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-bold">Destino:</span>
                    <span className="text-foreground font-black uppercase">{formData.destination_city}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1 rounded-xl h-12 font-black border-primary/20" onClick={() => setIsConfirming(false)}>
                      Corregir
                    </Button>
                    <Button type="submit" className="flex-2 rounded-xl h-12 bg-brand-gradient text-white font-black shadow-lg shadow-pink-500/20" disabled={loading}>
                      {loading ? 'Procesando...' : 'Confirmar y Enviar'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button type="submit" className="w-full h-14 bg-brand-gradient text-white rounded-2xl font-black text-lg shadow-xl shadow-pink-500/20 hover:scale-[1.02] transition-all" disabled={loading}>
                  Continuar al resumen
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="space-y-8 flex flex-col">
            <Card className="glass-premium p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black text-foreground italic">Recordatorio de Seguridad</h3>
              </div>
              <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                Asegúrese siempre de verificar la identidad del destinatario antes de procesar el envío. SendDirect protege sus fondos con cifrado de grado bancario.
              </p>
            </Card>
            <div className="flex-1 glass-premium p-8 flex flex-col justify-end relative">
               <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
               <div className="relative z-10">
                 <h2 className="text-4xl font-black text-foreground leading-tight">Envía dinero <br/>en segundos</h2>
                 <p className="text-muted-foreground font-bold mt-4 max-w-[240px]">La red de transferencias más rápida y confiable de la región.</p>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}

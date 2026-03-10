'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { signUpAction } from '@/app/actions/auth';
import { TrendingUp, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import type { UserRole } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'gestor' as UserRole,
    document_type: 'dni',
    document_number: '',
    country: '',
    city: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signUpAction(formData);
    
    if (result.success) {
      setShowSuccessModal(true);
    } else {
      setError(result.error || 'Error al registrar usuario');
    }
    setLoading(false);
  };

  return (
    <>
      <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-xl hover:shadow-primary/10 transition-all duration-300 rounded-3xl overflow-hidden ring-1 ring-border/5">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-2xl bg-linear-to-br from-pink-500 to-rose-600 text-white shadow-lg">
              <TrendingUp className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter bg-brand-gradient bg-clip-text text-transparent">
            Crear cuenta
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Únete a SendDirect y comienza a gestionar envíos
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-muted-foreground">Nombre completo</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  className="border-border focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-colors h-11 px-4 rounded-xl text-foreground placeholder:text-muted-foreground"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className="border-border focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-colors h-11 px-4 rounded-xl text-foreground placeholder:text-muted-foreground"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-muted-foreground">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+34 600 000 000"
                  className="border-border focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-colors h-11 px-4 rounded-xl text-foreground placeholder:text-muted-foreground"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="border-border focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-colors h-11 px-4 pr-10 rounded-xl text-foreground placeholder:text-muted-foreground"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-muted-foreground">Tipo de cuenta</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="border-border focus:ring-2 focus:ring-pink-500/50 focus:border-transparent h-11 px-4 rounded-xl text-foreground">
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="gestor">Gestor (Agente)</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document_type" className="text-muted-foreground">Tipo documento</Label>
                <Select 
                  value={formData.document_type} 
                  onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                >
                  <SelectTrigger className="border-border focus:ring-2 focus:ring-pink-500/50 focus:border-transparent h-11 px-4 rounded-xl text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="dni">DNI</SelectItem>
                    <SelectItem value="nie">NIE</SelectItem>
                    <SelectItem value="pasaporte">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="document_number" className="text-muted-foreground">Número</Label>
                <Input
                  id="document_number"
                  placeholder="12345678A"
                  className="border-border focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-colors h-11 px-4 rounded-xl text-foreground placeholder:text-muted-foreground"
                  value={formData.document_number}
                  onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country" className="text-muted-foreground">País</Label>
                <Input
                  id="country"
                  placeholder="España"
                  className="border-border focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-colors h-11 px-4 rounded-xl text-foreground placeholder:text-muted-foreground"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-muted-foreground">Ciudad</Label>
                <Input
                  id="city"
                  placeholder="Madrid"
                  className="border-border focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-colors h-11 px-4 rounded-xl text-foreground placeholder:text-muted-foreground"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-6 pt-2">
            <Button type="submit" className="w-full h-12 rounded-2xl text-base font-black uppercase tracking-widest bg-brand-gradient hover:opacity-90 text-white shadow-lg hover:shadow-primary/25 transition-all duration-300" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="font-medium bg-linear-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent hover:from-pink-600 hover:to-rose-700 dark:from-pink-400 dark:to-rose-400 transition-all">
                Inicia sesión ahora
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-card/95 glass-premium border-border/20 text-center py-10 rounded-3xl outline-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <DialogHeader className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 animate-in zoom-in duration-500">
              <CheckCircle2 className="h-16 w-16" />
            </div>
            <DialogTitle className="text-2xl font-bold dark:text-white">
              ¡Registro Completado!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-lg">
              Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <Button 
              onClick={() => router.push('/login')}
              className="w-full h-12 rounded-xl text-base font-semibold bg-linear-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg transition-all"
            >
              Ir al inicio de sesión
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

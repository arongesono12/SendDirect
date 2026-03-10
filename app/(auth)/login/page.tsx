'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { signInAction } from '@/app/actions/auth';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signInAction(email, password);
    
    if (result.success) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }
    setLoading(false);
  };

  return (
    <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-pink-500/10 dark:hover:shadow-pink-500/5 transition-all duration-300 rounded-2xl">
      <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
          <div className="p-3 rounded-2xl bg-linear-to-br from-pink-500 to-rose-600 text-white shadow-lg">
            <TrendingUp className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight bg-linear-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent dark:from-pink-400 dark:to-rose-400">
          SendDirect
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Ingresa tus credenciales para acceder
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {error && (
            <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              className="bg-card border border-border focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all h-11 px-4 rounded-xl text-foreground placeholder:text-muted-foreground"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="bg-card border border-border focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all h-11 px-4 pr-10 rounded-xl text-foreground placeholder:text-muted-foreground"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-pink-500 dark:hover:text-pink-400 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-6 pt-2">
          <Button 
            type="submit" 
            className="w-full h-11 rounded-xl text-base font-semibold bg-linear-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg hover:shadow-pink-500/25 transition-all" 
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="font-medium bg-linear-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent hover:from-pink-600 hover:to-rose-700 dark:from-pink-400 dark:to-rose-400 transition-all">
              Regístrate ahora
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

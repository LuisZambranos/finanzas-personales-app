import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Wallet, Mail, Lock, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Background Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-primary/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4 animate-pulse-glow">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold">
            <span className="text-gradient">Finanzas Personales</span>
          </h1>
          <p className="text-muted-foreground mt-2">Controla tus ingresos múltiples</p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 md:p-8">
          {/* Tab Toggle */}
          <div className="flex p-1 bg-secondary/50 rounded-lg mb-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLoginMode(true)}
              className={cn(
                'flex-1 rounded-md transition-all',
                isLoginMode && 'bg-background shadow-sm'
              )}
            >
              Iniciar Sesión
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLoginMode(false)}
              className={cn(
                'flex-1 rounded-md transition-all',
                !isLoginMode && 'bg-background shadow-sm'
              )}
            >
              Registrarse
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLoginMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label>Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Tu nombre"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="h-12 pl-10 text-base input-glass"
                    required={!isLoginMode}
                  />
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-12 pl-10 text-base input-glass"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 pl-10 text-base input-glass"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-expense text-center p-3 rounded-lg bg-expense/10"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-display font-semibold bg-primary hover:bg-primary/90 btn-glow"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isLoginMode ? (
                'Iniciar Sesión'
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLoginMode ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-primary hover:underline font-medium"
            >
              {isLoginMode ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>

        {/* Demo Notice */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Demo: Usa cualquier email y contraseña para probar
        </p>
      </motion.div>
    </div>
  );
}

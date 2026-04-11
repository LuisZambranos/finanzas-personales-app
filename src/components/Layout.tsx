import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Target, 
  LogOut, 
  Menu,
  X,
  Wallet
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/new', icon: PlusCircle, label: 'Nueva Transacción' },
  { path: '/history', icon: History, label: 'Historial' },
  { path: '/goals', icon: Target, label: 'Metas' },
];

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="container flex h-16 items-center justify-between px-2 sm:px-4">
          
          {/* Lado Izquierdo: Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            {/* Ocultamos "Finanzas" en móviles muy pequeños para que quepan todos los íconos */}
            <span className="font-display font-bold text-xl hidden sm:block">
              <span className="text-gradient">Finanzas</span>
            </span>
          </Link>

          {/* Centro: Navegación siempre visible (Íconos en móvil, Texto+Ícono en PC) */}
          <nav className="flex items-center justify-center gap-1 sm:gap-2 flex-1 px-1">
            {navItems.map(item => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={location.pathname === item.path ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-2 px-0 w-9 h-9 md:w-auto md:px-3', // Cuadritos en móvil, auto en PC
                    location.pathname === item.path && 'bg-primary/10 text-primary hover:bg-primary/20'
                  )}
                  title={item.label}
                >
                  <item.icon className="h-4 w-4 md:h-4 md:w-4 shrink-0" />
                  <span className="hidden md:inline">{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>

          {/* Lado Derecho: Acciones de Usuario y Menú Hamburguesa */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50">
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{user?.displayName || user?.email}</span>
            </div>
            
            <ThemeToggle />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hidden md:flex text-muted-foreground hover:text-foreground"
              title="Cerrar Sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile Menu Button - Regresa la hamburguesa */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Intacto para los que necesitan ver el nombre de las secciones */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 glass-card border-b border-border/50 md:hidden"
          >
            <nav className="container p-4 space-y-2">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={location.pathname === item.path ? 'default' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3',
                      location.pathname === item.path && 'bg-primary/10 text-primary'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Cambiar tema</span>
                <ThemeToggle />
              </div>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-3 text-muted-foreground"
              >
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="container py-6 px-4 md:px-8">
        {children}
      </main>
    </div>
  );
}
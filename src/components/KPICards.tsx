// src/components/KPICards.tsx
import { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KPICardsProps {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  totalSavings: number; 
}

// Sub-componente para manejar el estado de "abierto/cerrado" de cada info individualmente
function KPICardItem({ 
  title, value, icon: Icon, colorClass, bgClass, textClass, delay, infoText 
}: { 
  title: string, value: number, icon: any, colorClass: string, bgClass: string, textClass: string, delay: number, infoText: string 
}) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="glass-card p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <button 
              onClick={() => setShowInfo(!showInfo)} 
              className={cn("p-1 -ml-1 rounded-full transition-colors", showInfo ? textClass : "text-muted-foreground/50 hover:bg-secondary")}
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </div>
          
          {/* Aquí se despliega la info al hacer click, empujando el número hacia abajo */}
          <AnimatePresence>
            {showInfo && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-[10px] text-muted-foreground leading-snug max-w-[90%] pb-2">
                  {infoText}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className={cn("p-2 rounded-lg shrink-0", bgClass)}>
          <Icon className={cn("h-4 w-4", colorClass)} />
        </div>
      </div>
      <h3 className={cn("text-2xl font-display font-bold mt-auto", textClass)}>
        ${value.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
      </h3>
    </motion.div>
  );
}

export function KPICards({ totalIncome, totalExpenses, netBalance, totalSavings }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICardItem 
        title="Ingresos Líquidos"
        value={totalIncome}
        icon={TrendingUp}
        colorClass="text-income"
        bgClass="bg-income/10"
        textClass="text-income"
        delay={0.1}
        infoText="Suma de los ingresos generados únicamente durante el mes en curso."
      />
      <KPICardItem 
        title="Gastos"
        value={totalExpenses}
        icon={TrendingDown}
        colorClass="text-expense"
        bgClass="bg-expense/10"
        textClass="text-expense"
        delay={0.2}
        infoText="Suma de los gastos registrados únicamente durante el mes en curso."
      />
      <KPICardItem 
        title="Balance Neto"
        value={netBalance}
        icon={Wallet}
        colorClass="text-primary"
        bgClass="bg-primary/10"
        textClass="text-primary"
        delay={0.3}
        infoText="Dinero a favor o en contra generado únicamente en el mes actual (Ingresos - Gastos del mes)."
      />
      <KPICardItem 
        title="Ahorro Total"
        value={totalSavings}
        icon={PiggyBank}
        colorClass="text-warning"
        bgClass="bg-warning/10"
        textClass="text-warning"
        delay={0.4}
        infoText="Dinero acumulado histórico en tu cuenta desde el primer día que empezaste a usar la aplicación."
      />
    </div>
  );
}
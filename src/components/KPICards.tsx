import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardsProps {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  }),
};

export function KPICards({ totalIncome, totalExpenses, netBalance, savingsRate }: KPICardsProps) {
  const cards = [
    {
      label: 'Ingresos Líquidos',
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      color: 'text-income',
      bgColor: 'bg-income/10',
      borderColor: 'border-income/20',
    },
    {
      label: 'Gastos',
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: 'text-expense',
      bgColor: 'bg-expense/10',
      borderColor: 'border-expense/20',
    },
    {
      label: 'Balance Neto',
      value: formatCurrency(netBalance),
      icon: Wallet,
      color: netBalance >= 0 ? 'text-income' : 'text-expense',
      bgColor: netBalance >= 0 ? 'bg-income/10' : 'bg-expense/10',
      borderColor: netBalance >= 0 ? 'border-income/20' : 'border-expense/20',
    },
    {
      label: 'Tasa de Ahorro',
      value: `${savingsRate.toFixed(1)}%`,
      icon: PiggyBank,
      color: savingsRate >= 20 ? 'text-income' : savingsRate >= 10 ? 'text-warning' : 'text-expense',
      bgColor: savingsRate >= 20 ? 'bg-income/10' : savingsRate >= 10 ? 'bg-warning/10' : 'bg-expense/10',
      borderColor: savingsRate >= 20 ? 'border-income/20' : savingsRate >= 10 ? 'border-warning/20' : 'border-expense/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          custom={index}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className={cn('glass-card p-4 md:p-5 border', card.borderColor)}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs md:text-sm text-muted-foreground">{card.label}</span>
            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', card.bgColor)}>
              <card.icon className={cn('h-4 w-4', card.color)} />
            </div>
          </div>
          <p className={cn('text-xl md:text-2xl font-display font-bold', card.color)}>
            {card.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// src/pages/History.tsx
import { Layout } from '@/components/Layout';
import { TransactionHistory } from '@/components/TransactionHistory';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMonthlyStats } from '@/hooks/useMonthlyStats';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, CalendarDays, List, CheckCircle, Clock } from 'lucide-react';

export default function History() {
  const monthlyStats = useMonthlyStats();
  
  // Invertimos el array para que el mes más reciente (o el actual) aparezca de primero
  const reversedStats = [...monthlyStats].reverse();

  return (
    <Layout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            <span className="text-gradient">Historial</span>
          </h1>
          <p className="text-muted-foreground">Analiza tus movimientos y tu evolución mensual</p>
        </motion.div>

        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/50 p-1 rounded-xl h-auto">
            <TabsTrigger 
              value="transactions" 
              className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 sm:py-1.5"
            >
              <List className="h-4 w-4 shrink-0" /> 
              <span className="text-xs sm:text-sm font-medium">Movimientos</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="monthly" 
              className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 sm:py-1.5"
            >
              <CalendarDays className="h-4 w-4 shrink-0" /> 
              <span className="text-xs sm:text-sm font-medium">Resumen Mensual</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-0 outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <TransactionHistory />
            </motion.div>
          </TabsContent>

          <TabsContent value="monthly" className="mt-0 outline-none">
            {reversedStats.length === 0 ? (
               <div className="glass-card p-12 text-center text-muted-foreground flex flex-col items-center">
                 <CalendarDays className="h-12 w-12 mb-4 opacity-20" />
                 <p>Aún no hay transacciones para generar un resumen mensual.</p>
               </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {reversedStats.map((stat, index) => (
                    <motion.div 
                      key={stat.id}
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: index * 0.05 }}
                      className="glass-card p-5 relative overflow-hidden group flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-6 border-b border-border/50 pb-4">
                        <div>
                          <h3 className="font-display text-lg font-bold capitalize text-foreground">{stat.label}</h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            {stat.isCompleted ? (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-secondary/50 px-2 py-0.5 rounded-full">
                                <CheckCircle className="h-3 w-3" /> Cerrado
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full">
                                <Clock className="h-3 w-3" /> En curso
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-income" /> Ingresos
                          </span>
                          <span className="font-medium text-income">+${Math.trunc(stat.income).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-expense" /> Gastos
                          </span>
                          <span className="font-medium text-expense">-${Math.trunc(stat.expense).toLocaleString()}</span>
                        </div>
                        {/* Se quitó el 'Balance del mes' de aquí para no repetirlo */}
                      </div>

                      {/* NUEVA CAJA DESTACADA DOBLE */}
                      <div className="mt-auto bg-secondary/30 p-3 rounded-lg flex flex-col gap-3 border border-border/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground">Ahorrado este mes</span>
                          </div>
                          <span className={cn("font-bold text-sm", stat.monthlySaved >= 0 ? "text-income" : "text-expense")}>
                            {stat.monthlySaved >= 0 ? '+' : ''}${Math.trunc(stat.monthlySaved).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Total Ahorro Acumulado
                          </span>
                          <span className={cn("font-display text-lg font-bold", stat.accumulatedSavings >= 0 ? "text-foreground" : "text-expense")}>
                            ${Math.trunc(stat.accumulatedSavings).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className={cn(
                        "absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-5 blur-3xl z-0 pointer-events-none", 
                        stat.monthlySaved >= 0 ? "bg-income" : "bg-expense"
                      )} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
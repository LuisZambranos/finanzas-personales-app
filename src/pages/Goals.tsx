// src/pages/Goals.tsx
import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, TrendingUp, AlertTriangle, CheckCircle, Calendar, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn, getLocalDateISOString, parseLocalDate } from '@/lib/utils';
import { Goal, Transaction } from '@/types/finance';

export default function Goals() {
  const { goals, addGoal, deleteGoal, transactions } = useFinance();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Estado para el modal de detalles (ver desglose)
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<{ goal: Goal, txs: Transaction[] } | null>(null);

  const initialGoalState = {
    name: '', 
    targetAmount: '', 
    period: 'daily' as Goal['period'],
    startDate: getLocalDateISOString(), 
    endDate: ''
  };
  const [newGoal, setNewGoal] = useState(initialGoalState);

  // --- NUEVA LÓGICA DE PROMEDIOS Y ACUMULADOS ---
  const getGoalData = (goal: Goal) => {
    const start = parseLocalDate(goal.startDate);
    const end = goal.endDate ? parseLocalDate(goal.endDate) : new Date(); // Si no hay fin, hasta hoy
    
    // Normalizamos 'hoy' para conteo de días
    const today = new Date();
    today.setHours(0,0,0,0);

    // 1. Filtrar transacciones RELEVANTES (Ingresos dentro de las fechas)
    const contributingTxs = transactions.filter(t => {
      // Solo consideramos INGRESOS para metas de ventas/ahorro
      if (t.type !== 'income') return false;
      
      const tDate = parseLocalDate(t.date);
      // Validar rango de fecha
      const isAfterStart = tDate >= start;
      // Validar fin (si existe)
      const isBeforeEnd = goal.endDate ? tDate <= parseLocalDate(goal.endDate) : true; 
      
      return isAfterStart && isBeforeEnd;
    });

    // 2. Sumar el total recaudado en ese periodo
    const totalCollected = contributingTxs.reduce((sum, t) => sum + t.netAmount, 0);

    // 3. Calcular la métrica de éxito según el período
    let currentMetric = 0;
    let progress = 0;
    let statusText = '';
    let metricLabel = '';

    if (goal.period === 'daily') {
      // Lógica de PROMEDIO: ¿Cuánto gano por día en promedio desde que empecé?
      // Calculamos diferencia de tiempo en días. +1 para incluir el día de inicio.
      const diffTime = Math.max(0, today.getTime() - start.getTime());
      const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; 
      
      const dailyAverage = daysPassed > 0 ? totalCollected / daysPassed : totalCollected;
      
      currentMetric = dailyAverage;
      progress = (dailyAverage / goal.targetAmount) * 100;
      
      statusText = `Promedio: $${dailyAverage.toLocaleString(undefined, {maximumFractionDigits: 0})}/día`;
      metricLabel = `Promedio en ${daysPassed} día(s)`;
    
    } else {
      // Lógica de ACUMULADO (Semanal/Mensual): ¿Cuánto llevo juntado en total?
      currentMetric = totalCollected;
      progress = (totalCollected / goal.targetAmount) * 100;
      
      statusText = `Acumulado: $${totalCollected.toLocaleString()}`;
      metricLabel = 'Total acumulado en fecha';
    }

    const isOnTrack = currentMetric >= goal.targetAmount;
    const deficit = Math.max(0, goal.targetAmount - currentMetric);

    return { 
      currentMetric, 
      progress, 
      deficit, 
      isOnTrack, 
      contributingTxs,
      statusText,
      metricLabel
    };
  };

  const handleAddGoal = async () => {
    if (!newGoal.name.trim() || !newGoal.targetAmount || Number(newGoal.targetAmount) <= 0) {
      toast({ title: 'Error', description: 'Por favor ingresa un nombre y monto válido.', variant: 'destructive' });
      return;
    }

    await addGoal({
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      period: newGoal.period,
      startDate: newGoal.startDate,
      endDate: newGoal.endDate || undefined,
      accumulatedDeficit: 0,
    });

    toast({ title: '¡Meta creada!', description: 'Comienza a registrar ingresos para ver tu avance.' });
    setNewGoal(initialGoalState);
    setIsCreateOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              <span className="text-gradient">Metas Financieras</span>
            </h1>
            <p className="text-muted-foreground">Monitoreo de objetivos y promedios.</p>
          </motion.div>

          {/* Modal para Crear Meta */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 btn-glow gap-2" onClick={() => setNewGoal(initialGoalState)}>
                <Plus className="h-4 w-4" /> Nueva Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border/50">
              <DialogHeader>
                <DialogTitle>Definir Objetivo</DialogTitle>
                <DialogDescription>Configura tu meta de ingresos.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} className="input-glass" placeholder="Ej: Ventas Diarias, Ahorro Coche..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Monto Meta</Label>
                        <Input type="number" value={newGoal.targetAmount} onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })} className="input-glass pl-4" />
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo de Meta</Label>
                        <Select value={newGoal.period} onValueChange={(v: any) => setNewGoal({ ...newGoal, period: v })}>
                            <SelectTrigger className="input-glass"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Diaria (Promedio)</SelectItem>
                                <SelectItem value="weekly">Semanal (Acumulado)</SelectItem>
                                <SelectItem value="monthly">Mensual (Acumulado)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Desde (Inicio)</Label>
                        <Input type="date" value={newGoal.startDate} onChange={e => setNewGoal({...newGoal, startDate: e.target.value})} className="input-glass" />
                    </div>
                    <div className="space-y-2">
                        <Label>Hasta (Opcional)</Label>
                        <Input type="date" value={newGoal.endDate} onChange={e => setNewGoal({...newGoal, endDate: e.target.value})} className="input-glass" />
                    </div>
                </div>
                <Button onClick={handleAddGoal} className="w-full h-12 bg-primary hover:bg-primary/90 mt-2">Guardar Meta</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* LISTA DE METAS */}
        <AnimatePresence>
          {goals.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Sin metas activas</h3>
              <p className="text-muted-foreground">Crea tu primera meta para comenzar.</p>
            </motion.div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {goals.map((goal, index) => {
                const { currentMetric, progress, deficit, isOnTrack, contributingTxs, statusText, metricLabel } = getGoalData(goal);
                
                return (
                  <motion.div key={goal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                    className="glass-card p-5 relative overflow-hidden group"
                  >
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Target className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-display font-semibold">{goal.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize font-medium">{goal.period === 'daily' ? 'Promedio Diario' : 'Acumulado'}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>Desde {parseLocalDate(goal.startDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {/* BOTÓN VER DETALLES */}
                        <Button variant="ghost" size="icon" onClick={() => setSelectedGoalDetails({ goal, txs: contributingTxs })} 
                                className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors">
                           <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)} 
                                className="h-8 w-8 text-muted-foreground hover:text-expense transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Barra de Progreso */}
                    <div className="space-y-2 mb-4 relative z-10">
                      <div className="h-3 rounded-full bg-secondary overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progress, 100)}%` }}
                          className={cn('h-full rounded-full transition-all', isOnTrack ? 'bg-income' : 'bg-warning')} />
                      </div>
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground font-medium text-xs">{statusText}</span>
                        <span className={cn('font-bold', isOnTrack ? 'text-income' : 'text-warning')}>
                           {Math.min(progress, 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                         <span className="text-[10px] text-muted-foreground">Meta: ${goal.targetAmount.toLocaleString()}</span>
                         <span className="text-[10px] text-muted-foreground">{metricLabel}</span>
                      </div>
                    </div>

                    {/* Aviso de Déficit */}
                    {!isOnTrack && deficit > 0 && (
                      <div className="p-2 rounded bg-warning/10 border border-warning/20 relative z-10 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-warning" />
                        <span className="text-xs text-warning font-medium">
                            {goal.period === 'daily' ? 'Mejora tu promedio en:' : 'Te faltan:'} ${deficit.toLocaleString(undefined, {maximumFractionDigits: 0})}
                        </span>
                      </div>
                    )}
                    
                    {/* Fondo decorativo */}
                    <div className={cn("absolute -right-4 -bottom-4 h-32 w-32 rounded-full opacity-5 blur-2xl z-0", isOnTrack ? "bg-income" : "bg-warning")} />
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* DIALOGO DE DETALLES (TABLA) */}
        <Dialog open={!!selectedGoalDetails} onOpenChange={(open) => !open && setSelectedGoalDetails(null)}>
            <DialogContent className="glass-card max-w-2xl max-h-[80vh] overflow-y-auto border-border/50">
                <DialogHeader>
                    <DialogTitle>{selectedGoalDetails?.goal.name}</DialogTitle>
                    <DialogDescription>
                        Listado de ingresos considerados para esta meta. ({selectedGoalDetails?.txs.length} registros)
                    </DialogDescription>
                </DialogHeader>
                <div className="rounded-md border border-border/50 mt-2">
                  <Table>
                      <TableHeader>
                          <TableRow className="hover:bg-transparent border-border/50">
                              <TableHead>Fecha</TableHead>
                              <TableHead>Categoría</TableHead>
                              <TableHead>Descripción</TableHead>
                              <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {selectedGoalDetails?.txs.length === 0 ? (
                              <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No hay ingresos en este rango de fechas.</TableCell></TableRow>
                          ) : (
                              selectedGoalDetails?.txs.map(tx => (
                                  <TableRow key={tx.id} className="hover:bg-secondary/20 border-border/50">
                                      <TableCell>{tx.date}</TableCell>
                                      <TableCell>{tx.category}</TableCell>
                                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{tx.description || '-'}</TableCell>
                                      <TableCell className="text-right font-medium text-income">+${tx.netAmount.toLocaleString()}</TableCell>
                                  </TableRow>
                              ))
                          )}
                      </TableBody>
                  </Table>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
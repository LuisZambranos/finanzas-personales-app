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
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn, getLocalDateISOString, parseLocalDate } from '@/lib/utils';
import { Goal, Transaction } from '@/types/finance';
import { GoalCard } from '@/components/GoalCard';
import { ManageOffDaysDialog } from '@/components/ManageOffDaysDialog';

export default function Goals() {
  const { goals, addGoal, deleteGoal, transactions } = useFinance();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<{ goal: Goal, txs: Transaction[] } | null>(null);
  const [managingOffDays, setManagingOffDays] = useState<Goal | null>(null);

  // CORRECCIÓN REACT: Usamos string vacío "" en lugar de undefined para no romper el Select
  const initialGoalState = {
    name: '', 
    targetAmount: '', 
    period: 'daily' as Goal['period'],
    startDate: getLocalDateISOString(), 
    endDate: '',
    type: '' as Goal['type'] | '', 
    linkedCategory: '',
    totalInstallments: ''
  };
  const [newGoal, setNewGoal] = useState(initialGoalState);

  const expenseCategories = Array.from(new Set(transactions.filter(t => t.type === 'expense').map(t => t.category)));

  const handleAddGoal = async () => {
    if (!newGoal.type) {
      toast({ title: 'Error', description: 'Por favor, selecciona el Tipo de Meta.', variant: 'destructive' });
      return;
    }
    
    if (!newGoal.name.trim() || !newGoal.targetAmount || Number(newGoal.targetAmount) <= 0) {
      toast({ title: 'Error', description: 'Datos inválidos. Revisa el nombre y el monto.', variant: 'destructive' });
      return;
    }
    
    if (newGoal.type === 'debt' && !newGoal.linkedCategory) {
      toast({ title: 'Error', description: 'Debes vincular una categoría de gasto a la deuda.', variant: 'destructive' });
      return;
    }

    let finalEndDate = newGoal.endDate || "";
    
    if (newGoal.type === 'debt' && newGoal.totalInstallments) {
      const installments = parseInt(newGoal.totalInstallments);
      if (installments > 0) {
        const startDateObj = parseLocalDate(newGoal.startDate);
        startDateObj.setMonth(startDateObj.getMonth() + installments);
        finalEndDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;
      }
    }

    // CORRECCIÓN FIREBASE: Construimos un objeto limpio sin undefineds
    const goalPayload: any = {
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      period: newGoal.type === 'debt' ? 'monthly' : newGoal.period,
      startDate: newGoal.startDate,
      accumulatedDeficit: 0,
      offDays: [],
      type: newGoal.type,
    };

    // Solo agregamos estas propiedades si realmente existen (evitamos mandar undefined)
    if (finalEndDate !== "") {
      goalPayload.endDate = finalEndDate;
    }
    if (newGoal.type === 'debt' && newGoal.linkedCategory !== "") {
      goalPayload.linkedCategory = newGoal.linkedCategory;
    }
    if (newGoal.type === 'debt' && newGoal.totalInstallments !== "") {
      goalPayload.totalInstallments = parseInt(newGoal.totalInstallments);
    }

    try {
      await addGoal(goalPayload);
      toast({ title: 'Meta creada', description: '¡Registrada con éxito!' });
      setNewGoal(initialGoalState);
      setIsCreateOpen(false);
    } catch (error) {
      console.error("Error al guardar la meta:", error);
      toast({ title: 'Error del sistema', description: 'No se pudo guardar. Revisa la consola.', variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl md:text-3xl font-bold"><span className="text-gradient">Metas Financieras</span></h1>
            <p className="text-muted-foreground">Monitoreo de ahorros y pago de deudas.</p>
          </motion.div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 btn-glow gap-2" onClick={() => setNewGoal(initialGoalState)}>
                <Plus className="h-4 w-4" /> Nueva Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border/50 max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva Meta / Deuda</DialogTitle>
                {/* CORRECCIÓN WARNING: Se añadió DialogDescription para cumplir con accesibilidad */}
                <DialogDescription className="text-xs text-muted-foreground">Completa los datos de tu nueva meta o deuda.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                
                <div className="space-y-2">
                    <Label>Tipo de Meta</Label>
                    <Select value={newGoal.type} onValueChange={(v: any) => setNewGoal({ ...newGoal, type: v })}>
                        <SelectTrigger className="input-glass">
                          <SelectValue placeholder="Elige un tipo de meta..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="savings">Meta de Ahorro / Ganancia</SelectItem>
                            <SelectItem value="debt">Pago de Deuda / Cuotas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} className="input-glass" placeholder={newGoal.type === 'debt' ? "Ej: Crédito Auto, Deuda Telefono" : "Ej: Vacaciones, Fondo Seguro"} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>{newGoal.type === 'debt' ? 'Deuda Total' : 'Monto Meta'}</Label>
                        <Input type="number" value={newGoal.targetAmount} onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })} className="input-glass pl-4" />
                    </div>
                    
                    {newGoal.type === 'savings' && (
                      <div className="space-y-2">
                          <Label>Período</Label>
                          <Select value={newGoal.period} onValueChange={(v: any) => setNewGoal({ ...newGoal, period: v })}>
                              <SelectTrigger className="input-glass"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="daily">Diario (Promedio)</SelectItem>
                                  <SelectItem value="weekly">Semanal (Acumulado)</SelectItem>
                                  <SelectItem value="monthly">Mensual (Acumulado)</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                    )}
                </div>

                {newGoal.type === 'debt' && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-secondary/20 rounded-lg border border-border/50">
                     <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label>Vincular a Categoría</Label>
                        <Select value={newGoal.linkedCategory} onValueChange={(v: string) => setNewGoal({ ...newGoal, linkedCategory: v })}>
                            <SelectTrigger className="input-glass"><SelectValue placeholder="Elige categoría" /></SelectTrigger>
                            <SelectContent>
                                {expenseCategories.length === 0 && <SelectItem value="ninguna" disabled>No hay gastos registrados</SelectItem>}
                                {expenseCategories.map(cat => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">Los gastos de esta categoría sumarán progreso.</p>
                     </div>
                     <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label>Nº de Cuotas (Mensuales)</Label>
                        <Input type="number" value={newGoal.totalInstallments} onChange={e => setNewGoal({ ...newGoal, totalInstallments: e.target.value })} className="input-glass" placeholder="Ej: 12" />
                     </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className={cn("space-y-2", newGoal.type === 'debt' && "col-span-2")}>
                        <Label>Desde</Label>
                        <Input type="date" value={newGoal.startDate} onChange={e => setNewGoal({...newGoal, startDate: e.target.value})} className="input-glass" />
                    </div>
                    {newGoal.type !== 'debt' && (
                      <div className="space-y-2">
                          <Label>Hasta (Opcional)</Label>
                          <Input type="date" value={newGoal.endDate} onChange={e => setNewGoal({...newGoal, endDate: e.target.value})} className="input-glass" />
                      </div>
                    )}
                </div>
                <Button onClick={handleAddGoal} className="w-full h-12 bg-primary hover:bg-primary/90 mt-2">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <AnimatePresence>
          {goals.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">Sin metas ni deudas activas.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {goals.map((goal, index) => (
                <GoalCard 
                   key={goal.id}
                   goal={goal}
                   index={index}
                   onDelete={deleteGoal}
                   onManageOffDays={setManagingOffDays}
                   onViewDetails={(g, txs) => setSelectedGoalDetails({ goal: g, txs })}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Modal de Detalles */}
        <Dialog open={!!selectedGoalDetails} onOpenChange={(open) => !open && setSelectedGoalDetails(null)}>
            <DialogContent className="glass-card max-w-2xl max-h-[85vh] overflow-y-auto border-border/50">
                <DialogHeader>
                    <DialogTitle>{selectedGoalDetails?.goal.name}</DialogTitle>
                    <DialogDescription>Listado de movimientos considerados para esta meta.</DialogDescription>
                </DialogHeader>
                <div className="rounded-md border border-border/50 mt-2">
                  <Table>
                      <TableHeader>
                          <TableRow className="hover:bg-transparent border-border/50">
                              <TableHead>Fecha</TableHead>
                              <TableHead>Categoría</TableHead>
                              <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {selectedGoalDetails?.txs.length === 0 ? (
                              <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No hay registros aún.</TableCell></TableRow>
                          ) : (
                              selectedGoalDetails?.txs.map(tx => (
                                  <TableRow key={tx.id} className="hover:bg-secondary/20 border-border/50">
                                      <TableCell>{tx.date}</TableCell>
                                      <TableCell>{tx.category}</TableCell>
                                      <TableCell className={cn("text-right font-medium", tx.type === 'income' ? 'text-income' : 'text-expense')}>
                                          {tx.type === 'income' ? '+' : '-'}${tx.netAmount.toLocaleString()}
                                      </TableCell>
                                  </TableRow>
                              ))
                          )}
                      </TableBody>
                  </Table>
                </div>
            </DialogContent>
        </Dialog>

        <ManageOffDaysDialog 
          goal={managingOffDays} 
          isOpen={!!managingOffDays} 
          onClose={() => setManagingOffDays(null)} 
        />
      </div>
    </Layout>
  );
}
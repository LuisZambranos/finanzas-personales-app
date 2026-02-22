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
import { getLocalDateISOString } from '@/lib/utils';
import { Goal, Transaction } from '@/types/finance';
import { GoalCard } from '@/components/GoalCard';
import { ManageOffDaysDialog } from '@/components/ManageOffDaysDialog';

export default function Goals() {
  const { goals, addGoal, deleteGoal } = useFinance();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<{ goal: Goal, txs: Transaction[] } | null>(null);
  const [managingOffDays, setManagingOffDays] = useState<Goal | null>(null);

  const initialGoalState = {
    name: '', 
    targetAmount: '', 
    period: 'daily' as Goal['period'],
    startDate: getLocalDateISOString(), 
    endDate: '',
    offDays: [] as string[]
  };
  const [newGoal, setNewGoal] = useState(initialGoalState);

  const handleAddGoal = async () => {
    if (!newGoal.name.trim() || !newGoal.targetAmount || Number(newGoal.targetAmount) <= 0) {
      toast({ title: 'Error', description: 'Datos inválidos', variant: 'destructive' });
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
      offDays: []
    });
    toast({ title: 'Meta creada', description: 'A darle con todo!' });
    setNewGoal(initialGoalState);
    setIsCreateOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl md:text-3xl font-bold"><span className="text-gradient">Metas Financieras</span></h1>
            <p className="text-muted-foreground">Monitoreo de objetivos y promedios reales.</p>
          </motion.div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 btn-glow gap-2" onClick={() => setNewGoal(initialGoalState)}>
                <Plus className="h-4 w-4" /> Nueva Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border/50 max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nueva Meta</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} className="input-glass" placeholder="Ej: Meta Ventas" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Monto Meta</Label>
                        <Input type="number" value={newGoal.targetAmount} onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })} className="input-glass pl-4" />
                    </div>
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Desde</Label>
                        <Input type="date" value={newGoal.startDate} onChange={e => setNewGoal({...newGoal, startDate: e.target.value})} className="input-glass" />
                    </div>
                    <div className="space-y-2">
                        <Label>Hasta (Opcional)</Label>
                        <Input type="date" value={newGoal.endDate} onChange={e => setNewGoal({...newGoal, endDate: e.target.value})} className="input-glass" />
                    </div>
                </div>
                <Button onClick={handleAddGoal} className="w-full h-12 bg-primary hover:bg-primary/90 mt-2">Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <AnimatePresence>
          {goals.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">Sin metas activas.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {goals.map((goal, index) => (
                <GoalCard 
                   key={goal.id}
                   goal={goal}
                   index={index}
                   onDelete={deleteGoal}
                   onManageOffDays={setManagingOffDays}
                   onViewDetails={(g, txs) => setSelectedGoalDetails({ goal: g, txs })} // <-- ERROR CORREGIDO
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        <Dialog open={!!selectedGoalDetails} onOpenChange={(open) => !open && setSelectedGoalDetails(null)}>
            <DialogContent className="glass-card max-w-2xl max-h-[85vh] overflow-y-auto border-border/50">
                <DialogHeader>
                    <DialogTitle>{selectedGoalDetails?.goal.name}</DialogTitle>
                    <DialogDescription>Listado de ingresos considerados.</DialogDescription>
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
                              <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No hay ingresos.</TableCell></TableRow>
                          ) : (
                              selectedGoalDetails?.txs.map(tx => (
                                  <TableRow key={tx.id} className="hover:bg-secondary/20 border-border/50">
                                      <TableCell>{tx.date}</TableCell>
                                      <TableCell>{tx.category}</TableCell>
                                      <TableCell className="text-right font-medium text-income">+${tx.netAmount.toLocaleString()}</TableCell>
                                  </TableRow>
                              ))
                          )}
                      </TableBody>
                  </Table>
                </div>
            </DialogContent>
        </Dialog>

        {/* DIALOGO GESTIÓN DÍAS LIBRES USANDO EL NUEVO COMPONENTE */}
        <ManageOffDaysDialog 
          goal={managingOffDays} 
          isOpen={!!managingOffDays} 
          onClose={() => setManagingOffDays(null)} 
        />
      </div>
    </Layout>
  );
}
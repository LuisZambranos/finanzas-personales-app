// src/components/TransactionHistory.tsx
import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Transaction } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TransactionForm } from './TransactionForm';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { formatLocalDate } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function TransactionHistory() {
  const { transactions, deleteTransaction } = useFinance();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return Array.from(cats);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch =
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter]);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast({
      title: 'Eliminado',
      description: 'La transacción ha sido eliminada',
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transacciones..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 h-11 input-glass"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
          <SelectTrigger className="w-full sm:w-[150px] h-11 input-glass">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Ingresos</SelectItem>
            <SelectItem value="expense">Gastos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 input-glass">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredTransactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-8 text-center"
            >
              <p className="text-muted-foreground">No se encontraron transacciones</p>
            </motion.div>
          ) : (
            filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-4 hover:bg-card transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Color & Icon */}
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${transaction.color}20` }}
                  >
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-5 w-5" style={{ color: transaction.color }} />
                    ) : (
                      <TrendingDown className="h-5 w-5" style={{ color: transaction.color }} />
                    )}
                  </div>

                  {/* Info - Versión optimizada para móvil */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      {/* Título con truncado correcto */}
                      <h4 className="font-medium truncate text-sm sm:text-base">{transaction.category}</h4>
                      
                      {/* Badge ajustado */}
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium w-fit',
                          transaction.type === 'income' ? 'income-badge' : 'expense-badge'
                        )}
                      >
                        {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </div>
                    
                    {transaction.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                        {transaction.description}
                      </p>
                    )}
                    
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      {formatLocalDate(transaction.date)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className={cn(
                        'font-display font-bold text-lg',
                        transaction.type === 'income' ? 'text-income' : 'text-expense'
                      )}
                    >
                      {transaction.type === 'income' ? '+' : '-'}${transaction.netAmount.toLocaleString()}
                    </p>
                    {transaction.deductionPercentage > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Bruto: ${transaction.grossAmount.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTransaction(transaction)}
                      className="h-9 w-9 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {/* Botón Borrar con Confirmación */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-card border-border/50">
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el registro permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(transaction.id)} 
                            className="bg-expense text-white hover:bg-expense/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        {/* AGREGADO: max-h-[85vh] overflow-y-auto para permitir scroll */}
        <DialogContent className="glass-card border-border/50 max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Editar Transacción</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <TransactionForm
              editTransaction={editingTransaction}
              onSuccess={() => setEditingTransaction(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { Layout } from '@/components/Layout';
import { TransactionForm } from '@/components/TransactionForm';
import { motion } from 'framer-motion';

export default function NewTransaction() {
  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            <span className="text-gradient">Nueva Transacción</span>
          </h1>
          <p className="text-muted-foreground">Registra un ingreso o gasto</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 md:p-6"
        >
          <TransactionForm />
        </motion.div>
      </div>
    </Layout>
  );
}

import { Layout } from '@/components/Layout';
import { TransactionHistory } from '@/components/TransactionHistory';
import { motion } from 'framer-motion';

export default function History() {
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
          <p className="text-muted-foreground">Todas tus transacciones</p>
        </motion.div>

        <TransactionHistory />
      </div>
    </Layout>
  );
}

import React from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/utils/transactionUtils';
import { MoreHorizontal, Target, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import CategoryIcon from '../categories/CategoryIcon';
import TransactionCard from './TransactionCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  hideValues?: boolean;
  viewMode?: 'PF' | 'PJ';
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  hideValues = false,
  viewMode = 'PF'
}) => {
  const { goals } = useAppContext();
  const { t, currency } = usePreferences();
  const isMobile = useIsMobile();

  // Helper para obter nome da meta
  const getGoalName = (goalId?: string) => {
    if (!goalId) return null;
    const goal = goals.find(g => g.id === goalId);
    return goal ? goal.name : null;
  };

  // Helper para valores mascarados
  const renderHiddenValue = () => {
    return '******';
  };

  // Helper para badges de status usando traduções
  const getStatusBadge = (status: string) => {
    const statusVariants = {
      'paid': 'success',
      'pending': 'warning',
      'overdue': 'destructive',
      'projected': 'info'
    };

    const variant = statusVariants[status] || 'outline';
    const text = t(`paymentStatus.${status}`, status);

    return (
      <Badge variant={variant as any}>
        {text}
      </Badge>
    );
  };

  // Helper para obter o tipo da transação traduzido
  const getTransactionTypeText = (type: string) => {
    return t(`transactionTypes.${type}`, type);
  };

  // Helper para determinar se é entrada ou saída
  const isInflow = (type: string) => {
    return type === 'income' || type.includes('_inflow');
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M16 6h6"></path><path d="M21 12h1"></path><path d="M16 18h6"></path><path d="M8 6H3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h5"></path><path d="M10 18H3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h7"></path><path d="m7 14 4-4"></path><path d="m7 10 4 4"></path>
            </svg>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">{t('pages.transactions.noTransactions')}</p>
            <p className="text-sm text-muted-foreground">
              {viewMode === 'PF' 
                ? t('pages.transactions.noTransactionsPF')
                : t('pages.transactions.noTransactionsPJ')
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Layout mobile com cards
  if (isMobile) {
    return (
      <div className="space-y-3">
        {transactions.map((transaction, index) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            onEdit={onEdit}
            onDelete={onDelete}
            hideValues={hideValues}
            index={index}
          />

import React from 'react';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/utils/transactionUtils';
import { MoreHorizontal, Target, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import CategoryIcon from '../categories/CategoryIcon';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  hideValues?: boolean;
  index?: number;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  hideValues = false,
  index = 0
}) => {
  const { goals } = useAppContext();
  const { t, currency } = usePreferences();

  // ATENÇÃO:
  // A função `getCategoryName` foi removida, pois agora esperamos que a
  // propriedade `categories` venha populada com os dados aninhados do Supabase.
  // Garanta que a sua função de busca (`useGetTransactions.ts` ou similar)
  // está usando um `JOIN` para incluir os dados da categoria na transação.
  // Exemplo: `.select('*, categories (name, icon)')`

  // Helper to get goal name
  const getGoalName = (goalId?: string) => {
    if (!goalId) return null;
    const goal = goals.find(g => g.id === goalId);
    return goal ? goal.name : null;
  };

  // Helper to render masked values
  const renderHiddenValue = () => {
    return '******';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">{t('paymentStatus.paid')}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('paymentStatus.pending')}</Badge>;
      case 'overdue':
        return <Badge variant="destructive">{t('paymentStatus.overdue')}</Badge>;
      case 'projected':
        return <Badge variant="info">{t('paymentStatus.projected')}</Badge>;
      default:
        return null;
    }
  };

  const isIncome = transaction.type === 'income';
  const iconColor = isIncome ? '#26DE81' : '#EF4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header: Type Icon + Amount */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isIncome ? "bg-green-100" : "bg-red-100"
          )}>
            {isIncome ? (
              <ArrowUp className="w-5 h-5 text-green-600" />
            ) : (
              <ArrowDown className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div>
            <span className={cn(
              "text-lg font-semibold",
              isIncome ? "text-green-600" : "text-red-600"
            )}>
              {isIncome ? '+' : '-'}
              {hideValues ? renderHiddenValue() : formatCurrency(transaction.amount, currency)}
            </span>
            <p className="text-sm text-muted-foreground">
              {formatDate(transaction.date)}
            </p>
          </div>
        </div>
        
        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t('common.edit')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(transaction)}>
                {t('common.edit')}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem 
                onClick={() => onDelete(transaction.id)}
                className="text-red-600"
              >
                {t('common.delete')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Category and Description */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <CategoryIcon 
            icon={transaction.categories?.icon || 'default-icon'} // Acessando o ícone do objeto aninhado
            color={iconColor} 
            size={16}
          />
          <Badge variant="outline" className={cn(
            "text-xs",
            isIncome 
              ? "bg-green-50 text-green-600 border-green-200"
              : "bg-red-50 text-red-600 border-red-200"
          )}>
            {transaction.categories?.name || 'N/A'} // Acessando o nome da categoria do objeto aninhado
          </Badge>
        </div>
        
        {transaction.description && (
          <p className="text-sm text-foreground font-medium">
            {transaction.description}
          </p>
        )}
      </div>

      {/* New PJ fields */}
      {transaction.supplier && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <span className="text-sm font-medium text-muted-foreground">{t('common.supplier')}:</span>
          <span className="text-sm text-foreground">{transaction.supplier}</span>
        </div>
      )}
      {transaction.due_date && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <span className="text-sm font-medium text-muted-foreground">{t('common.dueDate')}:</span>
          <span className="text-sm text-foreground">{formatDate(transaction.due_date)}</span>
        </div>
      )}
      {transaction.original_amount && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <span className="text-sm font-medium text-muted-foreground">{t('common.originalAmount')}:</span>
          <span className="text-sm text-foreground">{formatCurrency(transaction.original_amount, currency)}</span>
        </div>
      )}
      {transaction.payment_status && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <span className="text-sm font-medium text-muted-foreground">{t('common.status')}:</span>
          <span className="text-sm text-foreground">
            {getStatusBadge(transaction.payment_status)}
          </span>
        </div>
      )}

      {/* Goal (if exists) */}
      {transaction.goalId && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            {getGoalName(transaction.goalId)}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default TransactionCard;

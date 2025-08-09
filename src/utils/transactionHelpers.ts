// utils/transactionHelpers.ts
import { usePreferences } from '@/contexts/PreferencesContext';

/**
 * Hook para obter textos traduzidos relacionados a transações
 */
export const useTransactionHelpers = () => {
  const { t } = usePreferences();

  // Helper para obter o tipo da transação traduzido
  const getTransactionTypeText = (type: string): string => {
    return t(`transactionTypes.${type}`, type);
  };

  // Helper para obter tradução de status de pagamento
  const getPaymentStatusText = (status: string): string => {
    return t(`paymentStatus.${status}`, status);
  };

  // Helper para determinar se é entrada ou saída
  const isInflow = (type: string): boolean => {
    return type === 'income' || type.includes('_inflow');
  };

  // Helper para obter variant do badge baseado no status
  const getStatusBadgeVariant = (status: string): string => {
    const statusVariants = {
      'paid': 'success',
      'pending': 'warning', 
      'overdue': 'destructive',
      'projected': 'info'
    };
    return statusVariants[status] || 'outline';
  };

  // Helper para obter cores baseadas no tipo de transação
  const getTransactionColors = (type: string) => {
    const isInflowType = isInflow(type);
    return {
      iconBg: isInflowType ? 'bg-green-100' : 'bg-red-100',
      iconColor: isInflowType ? 'text-green-600' : 'text-red-600',
      textColor: isInflowType ? 'text-green-600' : 'text-red-600',
      badgeClasses: isInflowType 
        ? 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200'
        : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'
    };
  };

  return {
    getTransactionTypeText,
    getPaymentStatusText,
    isInflow,
    getStatusBadgeVariant,
    getTransactionColors,
    t
  };
};

/**
 * Constantes para tipos de transação PJ
 */
export const PJ_TRANSACTION_TYPES = [
  'operational_inflow',
  'operational_outflow', 
  'investment_inflow',
  'investment_outflow',
  'financing_inflow',
  'financing_outflow'
] as const;

/**
 * Constantes para tipos de transação PF  
 */
export const PF_TRANSACTION_TYPES = [
  'income',
  'expense'
] as const;

/**
 * Função para filtrar transações por modo (PF/PJ)
 */
export const filterTransactionsByMode = (transactions: any[], viewMode: 'PF' | 'PJ') => {
  if (viewMode === 'PJ') {
    return transactions.filter(transaction => {
      if (!transaction.category) return false;
      
      return PJ_TRANSACTION_TYPES.includes(transaction.type) || 
             transaction.category.type.startsWith('operational') ||
             transaction.category.type.startsWith('investment') ||
             transaction.category.type.startsWith('financing');
    });
  }
  
  // Filtrar transações PF
  return transactions.filter(transaction => {
    if (!transaction.category) return false;
    return PF_TRANSACTION_TYPES.includes(transaction.type);
  });
};

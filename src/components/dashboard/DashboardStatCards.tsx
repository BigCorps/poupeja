// src/components/dashboard/DashboardStatCards.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

// Função local para formatação de moeda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

interface DashboardStatCardsProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  hideValues: boolean;
  onNavigateToTransactionType: (type: 'receita' | 'despesa') => void;
}

const DashboardStatCards: React.FC<DashboardStatCardsProps> = ({
  totalIncome,
  totalExpenses,
  balance,
  hideValues,
  onNavigateToTransactionType
}) => {
  const formatValue = (value: number) => {
    if (hideValues) return '••••••';
    return formatCurrency(value);
  };

  const getBalanceColor = () => {
    if (balance > 0) return 'text-green-600 dark:text-green-400';
    if (balance < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const getBalanceIconColor = () => {
    if (balance >= 0) return 'text-blue-600 dark:text-blue-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getBalanceBackgroundColor = () => {
    if (balance >= 0) return 'bg-blue-100 dark:bg-blue-900/20';
    return 'bg-orange-100 dark:bg-orange-900/20';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Card de Receitas */}
      <Card className="border-border hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={() => onNavigateToTransactionType('receita')}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Receitas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatValue(totalIncome)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Despesas */}
      <Card className="border-border hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onNavigateToTransactionType('despesa')}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Despesas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatValue(totalExpenses)}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Saldo Total */}
      <Card className="border-border hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
              <p className={`text-2xl font-bold ${getBalanceColor()}`}>
                {formatValue(balance)}
              </p>
            </div>
            <div className={`p-3 ${getBalanceBackgroundColor()} rounded-full`}>
              <Wallet className={`h-6 w-6 ${getBalanceIconColor()}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStatCards;

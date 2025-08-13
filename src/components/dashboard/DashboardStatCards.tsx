// src/components/dashboard/DashboardStatCards.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

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
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card de Receitas */}
      <Card className="border-green-200 hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={() => onNavigateToTransactionType('receita')}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receitas</p>
              <p className="text-2xl font-bold text-green-600">
                {formatValue(totalIncome)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Despesas */}
      <Card className="border-red-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onNavigateToTransactionType('despesa')}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Despesas</p>
              <p className="text-2xl font-bold text-red-600">
                {formatValue(totalExpenses)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Saldo - ✅ Agora com borda igual aos outros */}
      <Card className={`${balance >= 0 ? 'border-blue-200' : 'border-orange-200'} hover:shadow-lg transition-shadow`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo Total</p>
              <p className={`text-2xl font-bold ${getBalanceColor()}`}>
                {formatValue(balance)}
              </p>
            </div>
            <div className={`p-3 ${balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'} rounded-full`}>
              <Wallet className={`h-6 w-6 ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStatCards;

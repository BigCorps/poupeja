// src/components/common/SaldoSummary.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, CreditCard, Banknote, Landmark, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils'; // Assumindo que você tem uma função de formatação aqui

interface SaldoSummaryProps {
  totals: {
    totalWorkingCapital: number;
    totalInvestments: number;
    totalCards: number;
    grandTotal: number;
  };
}

const SaldoSummary = ({ totals }: SaldoSummaryProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Capital de Giro</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-xl md:text-2xl font-bold">{formatCurrency(totals.totalWorkingCapital)}</div>
          <div className="p-2 rounded-full bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300">
            <Landmark className="w-4 h-4 md:w-6 md:h-6" />
          </div>
        </CardContent>
      </Card>
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Aplicações</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-xl md:text-2xl font-bold">{formatCurrency(totals.totalInvestments)}</div>
          <div className="p-2 rounded-full bg-purple-100 text-purple-500 dark:bg-purple-900 dark:text-purple-300">
            <Wallet className="w-4 h-4 md:w-6 md:h-6" />
          </div>
        </CardContent>
      </Card>
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cartões</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-xl md:text-2xl font-bold">{formatCurrency(totals.totalCards)}</div>
          <div className="p-2 rounded-full bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-300">
            <CreditCard className="w-4 h-4 md:w-6 md:h-6" />
          </div>
        </CardContent>
      </Card>
      <Card className="flex-1 bg-primary text-primary-foreground">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-primary-foreground">Total Geral</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-xl md:text-2xl font-bold">{formatCurrency(totals.grandTotal)}</div>
          <div className="p-2 rounded-full bg-primary-foreground text-primary">
            <Plus className="w-4 h-4 md:w-6 md:h-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SaldoSummary;

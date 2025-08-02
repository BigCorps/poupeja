// src/components/common/SaldoAccountList.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Account } from '@/types'; // Assumindo que você tem um tipo Account

interface SaldoAccountListProps {
  accounts: Account[];
  loading: boolean;
}

const SaldoAccountList = ({ accounts, loading }: SaldoAccountListProps) => {
  const isMobile = useIsMobile();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className={cn(isMobile ? "p-4" : "p-6")}>
      <h3 className={cn("font-semibold mb-4 text-foreground", isMobile ? "text-lg" : "text-xl")}>
        Minhas Contas
      </h3>
      {loading ? (
        <p className="text-center text-muted-foreground py-4">Carregando contas...</p>
      ) : accounts.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">Nenhuma conta cadastrada ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {account.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {account.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {formatCurrency(account.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default SaldoAccountList;

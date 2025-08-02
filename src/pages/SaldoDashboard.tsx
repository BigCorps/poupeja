import React, { useState, useMemo } from 'react';
import { Plus, CreditCard, Banknote, Landmark, Wallet } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import AccountList from '@/components/common/AccountList';
import AccountForm from '@/components/common/AccountForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { Account } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const SaldoDashboard = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const { accounts, deleteAccount } = useAppContext();
  const isMobile = useIsMobile();

  const handleAddAccount = () => {
    setEditingAccount(null);
    setFormOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setFormOpen(true);
  };

  const handleDeleteAccount = (id: string) => {
    deleteAccount(id);
  };

  // Memoização dos cálculos para evitar re-renderizações desnecessárias
  const totals = useMemo(() => {
    const totalWorkingCapital = accounts
      .filter(acc => acc.type === 'Conta Corrente')
      .reduce((sum, acc) => sum + acc.value, 0);

    const totalInvestments = accounts
      .filter(acc => acc.type === 'Investimento')
      .reduce((sum, acc) => sum + acc.value, 0);

    const totalCards = accounts
      .filter(acc => acc.type === 'Cartão de Crédito')
      .reduce((sum, acc) => sum + acc.value, 0);
      
    const grandTotal = totalWorkingCapital + totalInvestments + totalCards;

    return {
      totalWorkingCapital,
      totalInvestments,
      totalCards,
      grandTotal
    };
  }, [accounts]);

  // Formatação do valor para moeda brasileira
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <MainLayout>
      <SubscriptionGuard feature="gestão de saldo">
        <div className="w-full px-4 py-4 md:py-8 pb-20 md:pb-8">
          {/* Desktop Add Button */}
          {!isMobile && (
            <div className="mb-6">
              <Button onClick={handleAddAccount} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Conta
              </Button>
            </div>
          )}
          
          {/* Content Container */}
          <div className={cn(
            isMobile ? "space-y-4" : "space-y-6"
          )}>
            {/* Header for Mobile */}
            {isMobile && (
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Seu Saldo</h1>
              </div>
            )}

            {/* Desktop Header */}
            {!isMobile && (
              <div>
                <h2 className="text-2xl font-bold text-foreground">Seu Saldo</h2>
                <p className="text-muted-foreground mt-1">Visão geral e cadastro das suas finanças.</p>
              </div>
            )}
            
            {/* Seção de Resumo */}
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

              {/* Card Total Geral */}
              <Card className="flex-1 bg-primary text-primary-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-primary-foreground">Total Geral</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-xl md:text-2xl font-bold">{formatCurrency(totals.grandTotal)}</div>
                  <div className="p-2 rounded-full bg-primary-foreground text-primary">
                    <Banknote className="w-4 h-4 md:w-6 md:h-6" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Content */}
            {isMobile ? (
              <AccountList 
                accounts={accounts}
                onEdit={handleEditAccount}
                onDelete={handleDeleteAccount}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Contas Cadastradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <AccountList 
                    accounts={accounts}
                    onEdit={handleEditAccount}
                    onDelete={handleDeleteAccount}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Mobile Floating Action Button */}
        {isMobile && (
          <div className="fixed bottom-20 right-4 z-50">
            <Button 
              onClick={handleAddAccount}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">Adicionar Conta</span>
            </Button>
          </div>
        )}

        <AccountForm
          open={formOpen}
          onOpenChange={setFormOpen}
          initialData={editingAccount}
          mode={editingAccount ? 'edit' : 'create'}
        />
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default SaldoDashboard;

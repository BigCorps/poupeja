import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import TransactionList from '@/components/common/TransactionList';
import TransactionForm from '@/components/common/TransactionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Transaction } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
// import { useUserPlan } from '@/hooks/useUserPlan'; // Descomente quando implementar

const TransactionsPage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<'PF' | 'PJ'>('PF');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  const { transactions, deleteTransaction } = useAppContext();
  const { t } = usePreferences();
  const isMobile = useIsMobile();

  // Temporariamente liberado para testes - descomente as linhas abaixo quando implementar o sistema de planos
  // const { plan } = useUserPlan();
  // const hasPremiumPlan = plan === 'premium';
  const hasPremiumPlan = true;

  const handleAddTransaction = useCallback(() => {
    setEditingTransaction(null);
    setFormOpen(true);
  }, []);

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  }, []);

  const handleDeleteTransaction = useCallback((id: string) => {
    if (confirm(t('common.confirmDelete', 'Tem certeza que deseja excluir esta transação?'))) {
      deleteTransaction(id);
    }
  }, [deleteTransaction, t]);

  useEffect(() => {
    // Filtragem melhorada baseada no tipo de categoria
    const getFilteredTransactions = () => {
      if (viewMode === 'PJ') {
        // Filtrar transações PJ baseado nos tipos específicos
        return transactions.filter(transaction => {
          if (!transaction.category) return false;
          
          // Verificar se o tipo da transação corresponde a PJ
          const pjTypes = [
            'operational_inflow',
            'operational_outflow', 
            'investment_inflow',
            'investment_outflow',
            'financing_inflow',
            'financing_outflow'
          ];
          
          return pjTypes.includes(transaction.type) || 
                 transaction.category.type.startsWith('operational') ||
                 transaction.category.type.startsWith('investment') ||
                 transaction.category.type.startsWith('financing');
        });
      }
      
      // Filtrar transações PF (income e expense tradicionais)
      return transactions.filter(transaction => {
        if (!transaction.category) return false;
        return transaction.type === 'income' || transaction.type === 'expense';
      });
    };

    setFilteredTransactions(getFilteredTransactions());
  }, [viewMode, transactions]);

  return (
    <MainLayout>
      <SubscriptionGuard feature={t('subscription.unlimitedTransactions', 'transações ilimitadas')}>
        <div className="w-full px-4 py-4 md:py-8 pb-20 md:pb-8">
          {/* Cabeçalho da página */}
          <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h1 className="text-xl md:text-3xl font-semibold text-foreground">
              {t('pages.transactions.title')}
            </h1>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Toggle PF/PJ */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button
                  onClick={() => setViewMode('PF')}
                  variant={viewMode === 'PF' ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "text-xs md:text-sm transition-all",
                    viewMode === 'PF' 
                      ? "bg-background shadow-sm" 
                      : "hover:bg-background/50"
                  )}
                >
                  {t('pages.transactions.personType.pf')}
                </Button>
                {hasPremiumPlan && (
                  <Button
                    onClick={() => setViewMode('PJ')}
                    variant={viewMode === 'PJ' ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      "text-xs md:text-sm transition-all",
                      viewMode === 'PJ' 
                        ? "bg-background shadow-sm" 
                        : "hover:bg-background/50"
                    )}
                  >
                    {t('pages.transactions.personType.pj')}
                  </Button>
                )}
              </div>

              {/* Botão Adicionar (Desktop) */}
              {!isMobile && (
                <Button onClick={handleAddTransaction} size="default" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('pages.transactions.addTransaction')}
                </Button>
              )}
            </div>
          </div>
          
          {/* Indicador do modo atual e estatísticas */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                viewMode === 'PF' ? "bg-blue-500" : "bg-purple-500"
              )} />
              <span>
                {viewMode === 'PF' ? t('pages.transactions.viewingPF') : t('pages.transactions.viewingPJ')}
              </span>
              <span>•</span>
              <span>{filteredTransactions.length} {t('pages.transactions.transactionsFound')}</span>
            </div>
            
            {!hasPremiumPlan && viewMode === 'PJ' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">{t('premium.required')}:</span> {t('premium.upgradeMessage')}
                </p>
              </div>
            )}
          </div>
          
          {/* Container do conteúdo */}
          <div className={cn(isMobile ? "space-y-4" : "")}>
            {isMobile ? (
              <TransactionList 
                transactions={filteredTransactions}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                viewMode={viewMode}
              />
            ) : (
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-medium">
                    {viewMode === 'PF' 
                      ? t('pages.transactions.recentTransactionsPF')
                      : t('pages.transactions.recentTransactionsPJ')
                    }
                  </CardTitle>
                  
                  {filteredTransactions.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {filteredTransactions.length} {t('common.of')} {transactions.length} {t('pages.transactions.transactionsFound')}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <TransactionList 
                    transactions={filteredTransactions}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                    viewMode={viewMode}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Botão Flutuante Mobile */}
        {isMobile && (
          <div className="fixed bottom-20 right-4 z-50">
            <Button 
              onClick={handleAddTransaction}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">{t('pages.transactions.addTransaction')}</span>
            </Button>
          </div>
        )}

        {/* Formulário de Transação */}
        <TransactionForm
          open={formOpen}
          onOpenChange={setFormOpen}
          initialData={editingTransaction}
          mode={editingTransaction ? 'edit' : 'create'}
          viewMode={viewMode}
        />
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default TransactionsPage;

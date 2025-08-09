import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import TransactionList from '@/components/common/TransactionList';
import TransactionForm from '@/components/common/TransactionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Transaction } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
// import { useUserPlan } from '@/hooks/useUserPlan'; // Importe este hook quando for implementar a lógica de planos

const TransactionsPage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<'PF' | 'PJ'>('PF');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  const { transactions, deleteTransaction } = useAppContext();
  const isMobile = useIsMobile();

  // No futuro, descomente a linha abaixo e use o estado do plano para controlar o acesso
  // const { plan } = useUserPlan();
  // const hasPremiumPlan = plan === 'premium';
  
  // Por enquanto, o acesso à seção PJ está liberado para todos para testes
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
    deleteTransaction(id);
  }, [deleteTransaction]);

  useEffect(() => {
    // Esta é uma lógica de filtragem simples. No futuro, é recomendado que a API
    // já retorne os dados filtrados para melhor performance.
    const getFilteredTransactions = () => {
      // Filtrar transações por tipo de categoria com base no modo de visualização
      if (viewMode === 'PJ') {
        return transactions.filter(t => 
          t.category && (
            t.category.type.startsWith('operational') ||
            t.category.type.startsWith('investment') ||
            t.category.type.startsWith('financing')
          )
        );
      }
      // Padrão para PF (income e expense)
      return transactions.filter(t => 
        t.category && (
          t.category.type === 'income' || t.category.type === 'expense'
        )
      );
    };
    setFilteredTransactions(getFilteredTransactions());
  }, [viewMode, transactions]);

  return (
    <MainLayout>
      {/* O SubscriptionGuard deve ser ajustado para o contexto de planos */}
      <SubscriptionGuard feature="movimentações ilimitadas">
        <div className="w-full px-4 py-4 md:py-8 pb-20 md:pb-8">
          {/* Cabeçalho da página com os botões PF/PJ */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl md:text-3xl font-semibold">Transações</h1>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setViewMode('PF')}
                variant={viewMode === 'PF' ? 'default' : 'ghost'}
                size="sm"
              >
                Pessoa Física
              </Button>
              {hasPremiumPlan && (
                <Button
                  onClick={() => setViewMode('PJ')}
                  variant={viewMode === 'PJ' ? 'default' : 'ghost'}
                  size="sm"
                >
                  Pessoa Jurídica
                </Button>
              )}
            </div>
            {/* Botão Adicionar Transação (Desktop) */}
            {!isMobile && (
              <Button onClick={handleAddTransaction} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Transação
              </Button>
            )}
          </div>
          
          {/* Content Container */}
          <div className={cn(isMobile ? "space-y-4" : "")}>
            {isMobile ? (
              <TransactionList 
                transactions={filteredTransactions}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
              />
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    {viewMode === 'PF' ? 'Transações Recentes (PF)' : 'Transações Recentes (PJ)'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TransactionList 
                    transactions={filteredTransactions}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
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
              onClick={handleAddTransaction}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">Adicionar Transação</span>
            </Button>
          </div>
        )}

        <TransactionForm
          open={formOpen}
          onOpenChange={setFormOpen}
          initialData={editingTransaction}
          mode={editingTransaction ? 'edit' : 'create'}
          // Alteração principal: a prop "viewMode" foi renomeada para "personType"
          // no novo componente TransactionForm para melhor clareza.
          personType={viewMode}
        />
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default TransactionsPage;

// pages/TransactionsPage.tsx
import React, { useState, useEffect } from 'react';
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
import { useUser } from '@/hooks/useUser'; // Assumindo que você tem um hook para o usuário

// Supondo que você tenha um hook ou contexto para o status da assinatura
const useUserPlan = () => {
  // Você precisará implementar a lógica real para buscar o plano do usuário
  // por enquanto, vamos simular que ele tem um plano premium
  return { plan: 'premium', isLoading: false };
};

const TransactionsPage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<'PF' | 'PJ'>('PF');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  const { transactions, deleteTransaction } = useAppContext();
  const { plan } = useUserPlan(); // Obtém o plano do usuário
  const isMobile = useIsMobile();

  // Função para filtrar as transações com base no viewMode
  useEffect(() => {
    // Nota: Aqui a lógica de filtro de categorias será mais robusta no futuro
    // mas por enquanto, vamos fazer um filtro simples. O ideal é que a API já retorne os dados filtrados.
    const getFilteredTransactions = () => {
      if (viewMode === 'PJ') {
        // Exemplo de como você filtraria por um tipo de categoria PJ
        return transactions.filter(t => 
          t.category?.type?.includes('operational') ||
          t.category?.type?.includes('investment') ||
          t.category?.type?.includes('financing')
        );
      }
      // Padrão para PF
      return transactions.filter(t => 
        t.category?.type === 'income' || t.category?.type === 'expense'
      );
    };
    setFilteredTransactions(getFilteredTransactions());
  }, [viewMode, transactions]);

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setFormOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
  };

  // Verificamos se o usuário tem o plano premium
  const hasPremiumPlan = plan === 'premium';

  return (
    <MainLayout>
      <SubscriptionGuard feature="movimentações ilimitadas">
        <div className="w-full px-4 py-4 md:py-8 pb-20 md:pb-8">
          {/* Cabeçalho da página (Desktop e Mobile) */}
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
          <div className={cn(
            isMobile ? "space-y-4" : ""
          )}>
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
          viewMode={viewMode} // Passa o modo de visualização para o formulário
        />
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default TransactionsPage;

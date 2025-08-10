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
// import { useUserPlan } from '@/hooks/useUserPlan';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TransactionsPage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<'PF' | 'PJ'>('PF');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  const { transactions, deleteTransaction, categories } = useAppContext();
  const isMobile = useIsMobile();
  
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
    const getFilteredTransactions = () => {
      // Filtra as categorias com base na viewMode e depois filtra as transações.
      if (viewMode === 'PJ') {
        // Filtra transações PJ com base no tipo
        return transactions.filter(t => 
          t.type && (
            t.type.startsWith('operational') ||
            t.type.startsWith('investment') ||
            t.type.startsWith('financing')
          )
        );
      }
      // Filtra transações PF com base no tipo
      return transactions.filter(t => 
        t.type === 'income' || t.type === 'expense'
      );
    };
    setFilteredTransactions(getFilteredTransactions());
  }, [viewMode, transactions]);

  const getCategoryNameById = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'N/A';
  }

  const renderTablePJ = (data: Transaction[]) => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center p-6 text-muted-foreground">
          Nenhum dado disponível
        </div>
      );
    }
    
    const displayHeaders = ['Fornecedor', 'Descrição', 'Categoria', 'Valor Original', 'Data de Vencimento', 'Status'];

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {displayHeaders.map((header, index) => (
              <TableHead key={index}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((transaction, index) => (
            <TableRow key={index} onClick={() => handleEditTransaction(transaction)}>
              <TableCell>{transaction.supplier || 'N/A'}</TableCell>
              <TableCell>{transaction.description || 'N/A'}</TableCell>
              <TableCell>{getCategoryNameById(transaction.categoryId) || 'N/A'}</TableCell>
              <TableCell>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(transaction.originalAmount || 0)}
              </TableCell>
              <TableCell>
                {transaction.dueDate ? format(parseISO(transaction.dueDate), "dd/MM/yyyy") : 'N/A'}
              </TableCell>
              <TableCell>{transaction.paymentStatus || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderTablePF = (data: Transaction[]) => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center p-6 text-muted-foreground">
          Nenhum dado disponível
        </div>
      );
    }
    
    const displayHeaders = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor'];

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {displayHeaders.map((header, index) => (
              <TableHead key={index}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((transaction, index) => (
            <TableRow key={index} onClick={() => handleEditTransaction(transaction)}>
              <TableCell>
                {transaction.transactionDate ? format(parseISO(transaction.transactionDate), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
              </TableCell>
              <TableCell>
                <span className={cn(
                  "font-semibold",
                  transaction.type === 'income' ? "text-green-500" : "text-red-500"
                )}>
                  {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                </span>
              </TableCell>
              <TableCell>{getCategoryNameById(transaction.categoryId) || 'N/A'}</TableCell>
              <TableCell>{transaction.description || 'N/A'}</TableCell>
              <TableCell>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(transaction.amount || 0)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <MainLayout>
      <SubscriptionGuard feature="movimentações ilimitadas">
        <div className="w-full px-4 py-4 md:py-8 pb-20 md:pb-8">
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
            {!isMobile && (
              <Button onClick={handleAddTransaction} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Transação
              </Button>
            )}
          </div>
          
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
                  {viewMode === 'PF' ? renderTablePF(filteredTransactions) : renderTablePJ(filteredTransactions)}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

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
          personType={viewMode}
        />
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default TransactionsPage;

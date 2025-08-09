import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit, MoreVertical, ArrowLeft } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useApp } from '@/contexts/AppContext';
import { Transaction, TransactionType, TransactionCategory } from '@/types/transactions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TransactionForm from '@/components/transactions/TransactionForm';
import { Separator } from '@/components/ui/separator';

const TransactionsPage: React.FC = () => {
  const { t } = usePreferences();
  const { transactions, isLoading, addTransaction, updateTransaction, deleteTransaction } = useApp();
  
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [personType, setPersonType] = useState<'PF' | 'PJ'>('PF');
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setTransactionFormOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionFormOpen(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (transactionToDelete) {
      try {
        await deleteTransaction(transactionToDelete.id);
      } catch (error) {
        console.error("Erro ao deletar transação:", error);
      } finally {
        setDeleteDialogOpen(false);
        setTransactionToDelete(null);
      }
    }
  };

  const handleSaveTransaction = async (transaction: Omit<Transaction, 'id'> | Transaction) => {
    try {
      if ('id' in transaction) {
        await updateTransaction(transaction as Transaction);
      } else {
        await addTransaction(transaction as Omit<Transaction, 'id'>);
      }
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
    } finally {
      setTransactionFormOpen(false);
    }
  };

  // Filtra as transações com base no tipo de pessoa
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.personType === personType);
  }, [transactions, personType]);

  const getTranslatedColumnName = (key: string) => {
    // Esta função traduz as chaves para nomes de colunas amigáveis.
    // Você deve ter um objeto de tradução (t) que mapeia essas chaves.
    // Exemplo: t('common.supplier') retorna 'Fornecedor'
    // Como não temos acesso ao arquivo de tradução, vou usar um switch/case para simular.
    switch(key) {
      case 'common.supplier':
        return 'Fornecedor';
      case 'common.dueDate':
        return 'Data de Vencimento';
      case 'common.originalAmount':
        return 'Valor Original';
      case 'common.paymentStatus':
        return 'Status';
      case 'common.type':
        return 'Tipo';
      case 'common.date':
        return 'Data';
      case 'common.category':
        return 'Categoria';
      case 'common.description':
        return 'Descrição';
      case 'common.value':
        return 'Valor';
      default:
        return key;
    }
  };

  // Funções de validação para os campos (a lógica completa deve estar no TransactionForm)
  // Mas para o exemplo, vamos simular aqui.
  const getValidationRules = (personType: 'PF' | 'PJ') => {
    if (personType === 'PJ') {
      return {
        // Exemplo: 'valor' e 'data' são obrigatórios, outros não
        valor: true,
        data: true,
        // Todos os outros campos são opcionais, a validação não irá quebrá-los.
      }
    }
    return {
      // Regras para PF
    }
  }


  if (isLoading) {
    return (
      <MainLayout title={t('transactions.title')}>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={t('transactions.title')}>
      <div className="space-y-4">
        {/* Cabeçalho da página: Título e botões de navegação PF/PJ */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold">{t('transactions.title')}</h1>
          <div className="flex space-x-2">
            <Button
              variant={personType === 'PF' ? 'default' : 'outline'}
              onClick={() => setPersonType('PF')}
            >
              Pessoa Física
            </Button>
            {/* Corrigido o nome "Pessoa Juridica" para "Pessoa Jurídica" */}
            <Button
              variant={personType === 'PJ' ? 'default' : 'outline'}
              onClick={() => setPersonType('PJ')}
            >
              Pessoa Jurídica
            </Button>
          </div>
        </div>
        
        <Separator />
        
        {/* Controles de filtro (Despesas/Receitas) e botão de ação */}
        <div className="flex justify-between items-center mt-4">
          <Tabs
            defaultValue="expense"
            value={transactionType}
            onValueChange={(value) => setTransactionType(value as 'expense' | 'income')}
          >
            <TabsList className="grid grid-cols-2 w-72">
              <TabsTrigger value="expense" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                {t('common.expense')}
              </TabsTrigger>
              <TabsTrigger value="income" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                {t('common.income')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleAddTransaction}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Transação
          </Button>
        </div>

        {/* Tabela de Transações */}
        <div className="mt-4 overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4">
            {t('transactions.recent', { type: personType === 'PF' ? 'PF' : 'PJ' })}
          </h2>
          <table className="min-w-full divide-y divide-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{getTranslatedColumnName('common.type')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{getTranslatedColumnName('common.date')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{getTranslatedColumnName('common.category')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{getTranslatedColumnName('common.description')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{getTranslatedColumnName('common.supplier')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{getTranslatedColumnName('common.dueDate')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{getTranslatedColumnName('common.originalAmount')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{getTranslatedColumnName('common.paymentStatus')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{getTranslatedColumnName('common.value')}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {filteredTransactions
                .filter(t => t.type === transactionType)
                .map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div className={`flex items-center gap-2 ${transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                      {/* Ícone de despesa/receita */}
                      <span>{transaction.type === 'expense' ? 'Despesas' : 'Receitas'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(transaction.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{transaction.category?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{transaction.description || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{transaction.supplier || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{transaction.originalAmount ? `R$ ${transaction.originalAmount.toFixed(2)}` : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{transaction.paymentStatus || 'N/A'}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                    {`R$ ${transaction.value.toFixed(2)}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteTransaction(transaction)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum dado disponível.
            </div>
          )}
        </div>
      </div>

      <TransactionForm
        open={transactionFormOpen}
        onOpenChange={setTransactionFormOpen}
        initialData={editingTransaction}
        onSave={handleSaveTransaction}
        personType={personType} // Passa o tipo de pessoa para o formulário
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('transactions.deleteConfirmation')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('transactions.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTransaction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default TransactionsPage;

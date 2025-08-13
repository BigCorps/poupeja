import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, BarChart, Filter, Plus } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useToast } from '@/components/ui/use-toast';

// ✅ REMOVIDO: Imports relacionados às seções conflitantes
// - TransactionList from '@/components/common/TransactionList'
// - TransactionForm from '@/components/common/TransactionForm'
// - TimeRangeSelector from '@/components/common/TimeRangeSelector'
// - formatCurrency from '@/utils/transactionUtils'

const ExpensesPage = () => {
  // ✅ MODIFICADO: Usar lancamentos ao invés de filteredTransactions
  const { 
    lancamentos, 
    deleteLancamento,
    categories
  } = useAppContext();
  
  const { t, currency } = usePreferences();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // ✅ MODIFICADO: Filtrar despesas dos lançamentos
  const expenses = useMemo(() => {
    return lancamentos?.filter(l => l.classificacao === 'despesa') || [];
  }, [lancamentos]);

  // ✅ REMOVIDO: Estados relacionados ao TransactionForm
  // - transactionDialogOpen
  // - selectedTransaction

  // ✅ MODIFICADO: Calcular dados por categoria usando lançamentos
  const categoryData = useMemo(() => {
    const categoryMap = new Map();
    
    expenses.forEach(expense => {
      // Buscar nome da categoria pelo ID
      const category = categories?.find(c => c.id === expense.categoria_id);
      const categoryName = category?.name || 'Sem categoria';
      
      const current = categoryMap.get(categoryName) || 0;
      categoryMap.set(categoryName, current + expense.valor_pago);
    });
    
    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value
    }));
  }, [expenses, categories]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  // ✅ MODIFICADO: Navegar para página de lançamentos ao invés de abrir dialog
  const handleAddExpense = () => {
    navigate('/lancamentos?type=despesa');
  };

  const handleEditLancamento = (id: string) => {
    navigate(`/lancamentos?edit=${id}`);
  };

  const handleDeleteLancamento = async (id: string) => {
    try {
      if (deleteLancamento) {
        await deleteLancamento(id);
        toast({
          title: 'Lançamento excluído',
          description: 'Despesa excluída com sucesso.',
        });
      }
    } catch (error) {
      console.error('Error deleting lancamento:', error);
      toast({
        title: t('common.error'),
        description: 'Erro ao excluir despesa.',
        variant: 'destructive',
      });
    }
  };

  // ✅ ADICIONADO: Função para formatar moeda (simplificada)
  const formatCurrency = (value: number, currencyCode: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
    }).format(value);
  };

  // ✅ ADICIONADO: Componente simples para lista de lançamentos
  const LancamentosList = ({ lancamentos, onEdit, onDelete }: {
    lancamentos: any[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
  }) => {
    if (!lancamentos || lancamentos.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma despesa encontrada.</p>
          <Button className="mt-4" onClick={handleAddExpense}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Despesa
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {lancamentos.map((lancamento) => {
          const category = categories?.find(c => c.id === lancamento.categoria_id);
          return (
            <div key={lancamento.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{lancamento.descricao || 'Despesa'}</p>
                <p className="text-sm text-muted-foreground">
                  {category?.name || 'Sem categoria'} • {new Date(lancamento.data_referencia).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-red-600">
                  -{formatCurrency(lancamento.valor_pago, currency)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(lancamento.id)}
                >
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(lancamento.id)}
                >
                  Excluir
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <MainLayout title="Despesas">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold">Despesas</h2>
          <div className="flex gap-2 items-center">
            {/* ✅ REMOVIDO: TimeRangeSelector */}
            <Button onClick={handleAddExpense}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Despesa
            </Button>
          </div>
        </div>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList>
            <TabsTrigger value="summary">
              <PieChart className="mr-2 h-4 w-4" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="list">
              <BarChart className="mr-2 h-4 w-4" />
              Todas as Despesas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
                  <CardDescription>Distribuição das suas despesas</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => {
                          return typeof value === 'number' 
                            ? formatCurrency(value, currency)
                            : formatCurrency(Number(value), currency);
                        }} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Nenhuma despesa encontrada para exibir o gráfico.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Despesas Recentes</CardTitle>
                  <CardDescription>Últimas 5 despesas</CardDescription>
                </CardHeader>
                <CardContent>
                  <LancamentosList 
                    lancamentos={expenses.slice(0, 5)}
                    onEdit={handleEditLancamento}
                    onDelete={handleDeleteLancamento}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="list">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Todas as Despesas</CardTitle>
                  <CardDescription>Lista completa das suas despesas</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" /> Filtrar
                </Button>
              </CardHeader>
              <CardContent>
                <LancamentosList 
                  lancamentos={expenses}
                  onEdit={handleEditLancamento}
                  onDelete={handleDeleteLancamento}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ✅ REMOVIDO: TransactionForm - agora redirecionamos para página de lançamentos */}
    </MainLayout>
  );
};

export default ExpensesPage;

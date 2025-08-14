import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MonthNavigation from '@/components/common/MonthNavigation';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useSaldoContext } from '@/contexts/SaldoContext';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Eye, EyeOff, Plus, Receipt } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

// Função para formatar valores monetários (mantida em Index.tsx)
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Calcular resumos por categoria baseado em lançamentos (movido de DashboardContent.tsx)
const calculateCategorySummaries = (lancamentos, classificacao) => {
  const categoryMap = new Map();

  lancamentos
    .filter(lancamento => lancamento.classificacao === classificacao)
    .forEach(lancamento => {
      const categoryName = lancamento.categoria?.name || 'Sem Categoria';
      const categoryColor = lancamento.categoria?.color || '#6B7280';
      const currentAmount = categoryMap.get(categoryName)?.amount || 0;

      categoryMap.set(categoryName, {
        category: categoryName,
        amount: currentAmount + lancamento.valor_pago,
        color: categoryColor
      });
    });

  return Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount);
};

// Gerar dados do gráfico baseado nos lançamentos (movido de DashboardContent.tsx)
const generateChartData = (lancamentos, month) => {
  const lancamentosByDay = new Map();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    lancamentosByDay.set(i, {
      day: i,
      receitas: 0,
      despesas: 0,
      dateLabel: `${i}/${month.getMonth() + 1}`
    });
  }

  lancamentos.forEach(lancamento => {
    const lancamentoDate = new Date(lancamento.data_referencia);
    const day = lancamentoDate.getDate();

    if (lancamentoDate.getMonth() !== month.getMonth() ||
      lancamentoDate.getFullYear() !== month.getFullYear()) {
      return;
    }

    const dayData = lancamentosByDay.get(day) || {
      day,
      receitas: 0,
      despesas: 0,
      dateLabel: `${day}/${month.getMonth() + 1}`
    };

    if (lancamento.classificacao === 'receita') {
      dayData.receitas += lancamento.valor_pago;
    } else {
      dayData.despesas += lancamento.valor_pago;
    }

    lancamentosByDay.set(day, dayData);
  });

  const result = Array.from(lancamentosByDay.values());
  result.forEach(item => {
    item.saldo = item.receitas - item.despesas;
  });

  result.sort((a, b) => a.day - b.day);

  if (daysInMonth > 10) {
    const condensedData = [];
    const step = Math.ceil(daysInMonth / 10);

    for (let i = 0; i < daysInMonth; i += step) {
      const group = result.slice(i, i + step);
      if (group.length > 0) {
        const groupData = {
          day: group[0].day,
          dateLabel: `${group[0].day}-${group[group.length - 1].day}/${month.getMonth() + 1}`,
          receitas: group.reduce((sum, item) => sum + item.receitas, 0),
          despesas: group.reduce((sum, item) => sum + item.despesas, 0),
          saldo: group.reduce((sum, item) => sum + item.saldo, 0)
        };
        condensedData.push(groupData);
      }
    }
    return condensedData;
  }
  return result;
};

// Componente DashboardCharts (movido de DashboardContent.tsx)
const DashboardCharts = ({ currentMonth = new Date(), hideValues = false, lancamentos }) => {
  const despesaSummaries = calculateCategorySummaries(lancamentos, 'despesa');
  const monthData = generateChartData(lancamentos, currentMonth);
  const monthName = format(currentMonth, 'MMMM', { locale: pt });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border rounded-md shadow-sm">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'receitas'
                ? 'Receitas'
                : entry.name === 'despesas'
                  ? 'Despesas'
                  : 'Saldo'}: {
                hideValues
                  ? '******'
                  : formatCurrency(entry.value)
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6"> {/* Espaçamento vertical ajustado para 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Espaçamento horizontal ajustado para 1 */}
        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Receitas vs Despesas - {monthName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="dateLabel" />
                  <YAxis tickFormatter={(value) =>
                    hideValues
                      ? '***'
                      : formatCurrency(value).split(',')[0]
                  } />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="receitas"
                    name="Receitas"
                    stroke="#26DE81"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="despesas"
                    name="Despesas"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Despesas - {monthName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {despesaSummaries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={despesaSummaries}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="category"
                      label={({ category, percent }) =>
                        `${category}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {despesaSummaries.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip
                      formatter={(value) =>
                        hideValues
                          ? '******'
                          : formatCurrency(Number(value))
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">Nenhuma despesa encontrada</p>
                  <p className="text-sm text-muted-foreground">
                    Adicione lançamentos para ver os gráficos
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const {
    lancamentos,
    getLancamentos,
    hideValues,
    toggleHideValues
  } = useAppContext();
  
  const { totals } = useSaldoContext();
  const { t } = usePreferences();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Cálculos baseados em lançamentos
  const calculateMonthlyLancamentos = () => {
    if (!lancamentos || lancamentos.length === 0) {
      return {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthLancamentos: []
      };
    }

    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
    
    const monthLancamentos = lancamentos.filter(lancamento => {
      const dataRef = new Date(lancamento.data_referencia);
      return dataRef >= firstDay && dataRef <= lastDay;
    });

    const monthlyIncome = monthLancamentos
      .filter(l => l.classificacao === 'receita')
      .reduce((sum, l) => sum + l.valor_pago, 0);

    const monthlyExpenses = monthLancamentos
      .filter(l => l.classificacao === 'despesa')
      .reduce((sum, l) => sum + l.valor_pago, 0);

    return {
      monthlyIncome,
      monthlyExpenses,
      monthLancamentos
    };
  };

  const monthlyData = calculateMonthlyLancamentos();
  const totalIncome = monthlyData.monthlyIncome;
  const totalExpenses = monthlyData.monthlyExpenses;
  const balance = totals.grandTotal;

  // Carregar dados de lançamentos
  useEffect(() => {
    const loadInitialData = async () => {
      console.log("Dashboard: Loading initial data...");
      try {
        if (getLancamentos) {
          await getLancamentos();
        }
        console.log("Dashboard: Initial data loaded successfully");
      } catch (error) {
        console.error("Dashboard: Error loading initial data:", error);
      }
    };

    loadInitialData();
  }, [getLancamentos]);

  const handleMonthChange = (date: Date) => {
    console.log("Dashboard: Month changed to:", date.toDateString());
    setCurrentMonth(date);
  };

  // Navegação para lançamentos
  const handleAddLancamento = (type: 'income' | 'expense' = 'expense') => {
    const typeMap = { income: 'receita', expense: 'despesa' };
    navigate(`/lancamentos?type=${typeMap[type]}`);
  };

  const navigateToLancamentoType = (type: 'receita' | 'despesa') => {
    navigate(`/lancamentos?type=${type}`);
  };

  const formatValue = (value: number) => {
    if (hideValues) return '••••••';
    return formatCurrency(value);
  };

  const getBalanceColor = () => {
    if (balance > 0) return 'text-green-600 dark:text-green-400';
    if (balance < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const getBalanceIconColor = () => {
    if (balance >= 0) return 'text-blue-600 dark:text-blue-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getBalanceBackgroundColor = () => {
    if (balance >= 0) return 'bg-blue-100 dark:bg-blue-900/20';
    return 'bg-orange-100 dark:bg-orange-900/20';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  // Filtrar lançamentos recentes (últimos 5) - movido de DashboardContent.tsx
  const recentLancamentos = monthlyData.monthLancamentos.slice(0, 5);

  return (
    <MainLayout title="Painel">
      <SubscriptionGuard feature="o dashboard completo">
        <div className="w-full p-6 md:p-8">
            <motion.div
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
            {/* Header Unificado */}
            <motion.div variants={itemVariants}>
              {isMobile ? (
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-semibold">Painel Principal</h1>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAddLancamento('expense')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Lançamento
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Painel Principal</h2>
                  <div className="flex-1 flex justify-center">
                    <MonthNavigation currentMonth={currentMonth} onMonthChange={handleMonthChange} />
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleHideValues}
                      className="flex items-center gap-2"
                    >
                      {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {hideValues ? 'Mostrar' : 'Ocultar'} Valores
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAddLancamento('expense')}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Lançamento
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Navegação de Mês */}


            {/* Cards de Estatísticas */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card de Receitas */}
                <Card className="border-border hover:shadow-lg transition-shadow cursor-pointer" 
                      onClick={() => navigateToLancamentoType('receita')}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Receitas</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatValue(totalIncome)}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                        <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card de Despesas */}
                <Card className="border-border hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigateToLancamentoType('despesa')}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Despesas</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {formatValue(totalExpenses)}
                        </p>
                      </div>
                      <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                        <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card de Saldo Total */}
                <Card className="border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
                        <p className={`text-2xl font-bold ${getBalanceColor()}`}>
                          {formatValue(balance)}
                        </p>
                      </div>
                      <div className={`p-3 ${getBalanceBackgroundColor()} rounded-full`}>
                        <Wallet className={`h-6 w-6 ${getBalanceIconColor()}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Conteúdo do Dashboard - Agora diretamente aqui */}
            <motion.div variants={itemVariants}>
              <div className="space-y-6"> {/* Adicionado padding para corresponder ao Header e espaçamento vertical ajustado para 1 */}
                {/* Gráficos */}
                <motion.div variants={itemVariants}>
                  <DashboardCharts
                    currentMonth={currentMonth}
                    hideValues={hideValues}
                    lancamentos={monthlyData.monthLancamentos}
                  />
                </motion.div>

                {recentLancamentos.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <Card className="shadow-lg border">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-semibold">Lançamentos Recentes</h3>
                          <Button variant="outline" asChild>
                            <Link to="/lancamentos">Ver Todos</Link>
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {recentLancamentos.map((lancamento) => (
                            <div key={lancamento.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  lancamento.classificacao === 'receita' ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                                <div>
                                  <p className="font-medium">
                                    {lancamento.descricao || `${lancamento.classificacao} - ${lancamento.categoria?.name}`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(lancamento.data_referencia).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-medium ${
                                  lancamento.classificacao === 'receita' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {hideValues ? '***' :
                                    new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL'
                                    }).format(lancamento.valor_pago)
                                  }
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {lancamento.status_pagamento}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {monthlyData.monthLancamentos.length > 5 && (
                          <div className="mt-6 text-center">
                            <Button variant="outline" asChild>
                              <Link to="/lancamentos">Ver Todos os Lançamentos</Link>
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {recentLancamentos.length === 0 && (
                  <motion.div variants={itemVariants}>
                    <Card className="shadow-lg border">
                      <CardContent className="p-6 text-center">
                        <Receipt size={48} className="mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum lançamento encontrado</h3>
                        <p className="text-muted-foreground mb-4">
                          Comece criando seu primeiro lançamento financeiro
                        </p>
                        <Button asChild>
                          <Link to="/lancamentos">Criar Lançamento</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default Index;

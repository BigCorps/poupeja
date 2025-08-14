// src/pages/Index.tsx - Versão Unificada
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MonthNavigation from '@/components/common/MonthNavigation';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useSaldoContext } from '@/contexts/SaldoContext';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Eye, EyeOff, Plus } from 'lucide-react';

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

  // Função local para formatação de moeda
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

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

  return (
    <MainLayout title="Painel">
      <SubscriptionGuard feature="o dashboard completo">
        <div className="w-full px-4 py-4 md:py-8 pb-20 md:pb-8">
          <motion.div
            className={cn(isMobile ? "space-y-4" : "space-y-6")}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header Unificado */}
            <motion.div variants={itemVariants}>
              {isMobile ? (
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-semibold">Painel</h1>
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Painel</h2>
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
            <motion.div variants={itemVariants}>
              <MonthNavigation currentMonth={currentMonth} onMonthChange={handleMonthChange} />
            </motion.div>

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

            {/* Conteúdo do Dashboard */}
            <motion.div variants={itemVariants}>
              <DashboardContent
                lancamentos={monthlyData.monthLancamentos}
                currentMonth={currentMonth}
                hideValues={hideValues}
              />
            </motion.div>
          </motion.div>
        </div>
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default Index;

// src/pages/Index.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStatCards from '@/components/dashboard/DashboardStatCards';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useSaldoContext } from '@/contexts/SaldoContext';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

// ✅ REMOVIDO: Imports relacionados às seções conflitantes
// - calculateMonthlyFinancialData, getGoalsForMonth from transactionUtils
// - markAsPaid from scheduledTransactionService
// - ScheduledTransaction type
// - TransactionForm component

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // ✅ REMOVIDO: Estados e funções relacionadas às seções conflitantes
  const {
    // filteredTransactions, - removido
    // transactions, - removido
    // setCustomDateRange, - removido
    // goals, - removido
    hideValues,
    toggleHideValues,
    // getTransactions, - removido
    // getGoals, - removido
    // deleteTransaction, - removido
    // scheduledTransactions - removido
    
    // ✅ ADICIONADO: Funções para lançamentos (serão implementadas no AppContext)
    lancamentos,
    getLancamentos
  } = useAppContext();
  
  const { totals } = useSaldoContext();
  const { t } = usePreferences();

  // ✅ REMOVIDO: Estados relacionados às seções conflitantes
  // - transactionDialogOpen
  // - selectedTransaction  
  // - formMode
  // - transactionType
  // - currentGoalIndex

  const [currentMonth, setCurrentMonth] = useState(new Date());

  console.log("Dashboard rendered with:", {
    lancamentosCount: lancamentos?.length || 0,
    totals: totals
  });

  // ✅ MODIFICADO: Cálculos baseados em lançamentos ao invés de transações
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

  // ✅ MODIFICADO: Carregar dados de lançamentos ao invés de transações/goals
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

  // ✅ MODIFICADO: Navegação para lançamentos ao invés de transações
  const handleAddLancamento = (type: 'receita' | 'despesa' = 'despesa') => {
    navigate(`/lancamentos?type=${type}`);
  };

  const navigateToLancamentoType = (type: 'receita' | 'despesa') => {
    navigate(`/lancamentos?type=${type}`);
  };

  // ✅ REMOVIDO: Todas as funções relacionadas às seções conflitantes
  // - handleEditTransaction
  // - handleDeleteTransaction  
  // - handleMarkScheduledAsPaid

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
    <MainLayout title={t('dashboard.title')} onAddTransaction={handleAddLancamento}>
      <SubscriptionGuard feature="o dashboard completo">
        <motion.div
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header com navegação de mês e toggle de visibilidade */}
          <DashboardHeader
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
            hideValues={hideValues}
            toggleHideValues={toggleHideValues}
            onAddTransaction={handleAddLancamento}
          />

          {/* 3 Cards principais na mesma linha */}
          <motion.div variants={itemVariants}>
            <DashboardStatCards
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              balance={balance}
              hideValues={hideValues}
              onNavigateToTransactionType={navigateToLancamentoType}
            />
          </motion.div>

          {/* ✅ MODIFICADO: Conteúdo simplificado sem seções conflitantes */}
          <motion.div variants={itemVariants}>
            <DashboardContent
              lancamentos={monthlyData.monthLancamentos}
              currentMonth={currentMonth}
              hideValues={hideValues}
              onAddLancamento={handleAddLancamento}
            />
          </motion.div>
        </motion.div>
      </SubscriptionGuard>

      {/* ✅ REMOVIDO: Dialog do formulário de transação */}
      {/* TransactionForm foi removido - agora redirecionamos para a página de lançamentos */}
    </MainLayout>
  );
};

export default Index;

// src/pages/Index.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import TransactionForm from '@/components/common/TransactionForm';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStatCards from '@/components/dashboard/DashboardStatCards';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useSaldoContext } from '@/contexts/SaldoContext';
import { calculateMonthlyFinancialData, getGoalsForMonth } from '@/utils/transactionUtils';
import { useToast } from '@/components/ui/use-toast';
import { markAsPaid } from '@/services/scheduledTransactionService';
import { ScheduledTransaction } from '@/types';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js'; // Importa o createClient
import TypebotIframeLoader from '@/components/agente-ia/TypebotIframeLoader'; // Importa o componente de pré-carregamento
import { useIsMobile } from '@/hooks/use-mobile'; // Importa o hook useIsMobile

// Inicializa o cliente Supabase fora do componente para evitar recriação
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    filteredTransactions,
    transactions,
    setCustomDateRange,
    goals,
    hideValues,
    toggleHideValues,
    getTransactions,
    getGoals,
    deleteTransaction,
    scheduledTransactions,
    user // ✅ Adicionado 'user' para obter o email do contexto
  } = useAppContext();
  const { totals } = useSaldoContext();
  const { t } = usePreferences();

  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);

  // Estado para armazenar o email do usuário para o TypebotIframeLoader
  const [userEmailForTypebot, setUserEmailForTypebot] = useState<string | null>(null);
  // Estado para controlar se o iframe pré-carregado terminou de carregar
  const [preloadedIframeLoaded, setPreloadedIframeLoaded] = useState(false);
  const isMobile = useIsMobile(); // Usa o hook useIsMobile

  console.log("Dashboard rendered with:", {
    transactionsCount: transactions.length,
    filteredTransactionsCount: filteredTransactions.length,
    goalsCount: goals.length,
    scheduledTransactionsCount: scheduledTransactions.length
  });

  // Calculate month-specific financial data
  const monthlyData = calculateMonthlyFinancialData(transactions, currentMonth);
  const monthlyGoals = getGoalsForMonth(goals, currentMonth);

  const totalIncome = monthlyData.monthlyIncome;
  const totalExpenses = monthlyData.monthlyExpenses;
  const balance = totals.grandTotal;

  // Load initial data and user email for Typebot when component mounts
  useEffect(() => {
    const loadInitialDataAndUserEmail = async () => {
      console.log("Dashboard: Loading initial data...");
      try {
        await Promise.all([getTransactions(), getGoals()]);
        console.log("Dashboard: Initial data loaded successfully");

        // Obtém o email do usuário para o TypebotIframeLoader
        if (user?.email) {
          setUserEmailForTypebot(user.email);
        } else {
          // Fallback: tenta obter da sessão Supabase se não estiver no contexto
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            setUserEmailForTypebot(session.user.email);
          }
        }
      } catch (error) {
        console.error("Dashboard: Error loading initial data:", error);
      }
    };

    loadInitialDataAndUserEmail();
  }, [user]); // Depende do objeto user do contexto

  // Update date range when month changes
  useEffect(() => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
    setCustomDateRange(firstDay, lastDay);
    console.log("Dashboard: Date range updated for month:", currentMonth.toDateString());
  }, [currentMonth, setCustomDateRange]);

  const handleMonthChange = (date: Date) => {
    console.log("Dashboard: Month changed to:", date.toDateString());
    setCurrentMonth(date);

    // Update filtered transactions range to match the selected month
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    setCustomDateRange(firstDay, lastDay);
  };

  const handleAddTransaction = (type: 'income' | 'expense' = 'expense') => {
    setSelectedTransaction(null);
    setFormMode('create');
    setTransactionType(type);
    setTransactionDialogOpen(true);
  };

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setFormMode('edit');
    setTransactionDialogOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast({
        title: t('transactions.deleted'),
        description: t('transactions.deleteSuccess'),
      });

      console.log("Dashboard: Refreshing data after delete...");
      await Promise.all([
        getTransactions(),
        getGoals()
      ]);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: t('common.error'),
        description: t('transactions.deleteError'),
        variant: 'destructive',
      });
    }
  };

  const handleMarkScheduledAsPaid = async (transaction: ScheduledTransaction) => {
    const success = await markAsPaid(transaction.id);
    if (success) {
      toast({
        title: t('schedule.marked_as_paid'),
        description: t('schedule.transaction_marked_as_paid')
      });
      console.log("Dashboard: Refreshing data after marking as paid...");
      await Promise.all([
        getTransactions(),
        getGoals()
      ]);
    } else {
      toast({
        title: t('common.error'),
        description: t('common.somethingWentWrong'),
        variant: "destructive"
      });
    }
  };

  const navigateToTransactionType = (type: 'income' | 'expense') => {
    navigate(`/transactions?type=${type}`);
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
    <MainLayout title={t('dashboard.title')} onAddTransaction={handleAddTransaction}>
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
            onAddTransaction={handleAddTransaction}
          />

          {/* 3 Cards principais na mesma linha */}
          <motion.div variants={itemVariants}>
            <DashboardStatCards
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              balance={balance}
              hideValues={hideValues}
              onNavigateToTransactionType={navigateToTransactionType}
            />
          </motion.div>

          {/* Conteúdo do dashboard */}
          <DashboardContent
            filteredTransactions={monthlyData.monthTransactions}
            goals={monthlyGoals}
            scheduledTransactions={scheduledTransactions}
            currentGoalIndex={currentGoalIndex}
            currentMonth={currentMonth}
            hideValues={hideValues}
            onGoalChange={setCurrentGoalIndex}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onMarkScheduledAsPaid={handleMarkScheduledAsPaid}
          />
        </motion.div>
      </SubscriptionGuard>

      {/* Dialog do formulário de transação */}
      <TransactionForm
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        initialData={selectedTransaction}
        mode={formMode}
        defaultType={transactionType}
      />

      {/* Oculta o TypebotIframeLoader em uma div que não afeta o layout visível */}
      {userEmailForTypebot && (
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
          <TypebotIframeLoader
            userEmail={userEmailForTypebot}
            isVisible={false} // O iframe é carregado, mas não visível
            onIframeLoad={() => setPreloadedIframeLoaded(true)} // Notifica quando o pré-carregamento estiver completo
            isMobile={isMobile}
          />
        </div>
      )}
    </MainLayout>
  );
};

export default Index;


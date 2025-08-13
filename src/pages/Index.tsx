// src/pages/Index.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStatCards from '@/components/dashboard/DashboardStatCards';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useSaldoContext } from '@/contexts/SaldoContext';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    lancamentos,
    getLancamentos,
    hideValues,
    toggleHideValues
  } = useAppContext();
  
  const { totals } = useSaldoContext();
  const { t } = usePreferences();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  console.log("Dashboard rendered with:", {
    lancamentosCount: lancamentos?.length || 0,
    totals: totals
  });

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
  const handleAddLancamento = (type: 'receita' | 'despesa' = 'despesa') => {
    navigate(`/lancamentos?type=${type}`);
  };

  const navigateToLancamentoType = (type: 'receita' | 'despesa') => {
    navigate(`/lancamentos?type=${type}`);
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
    <MainLayout 
      title={t('dashboard.title')} 
      onAddTransaction={handleAddLancamento}
      addButtonText="Adicionar Lançamento" // ✅ Novo texto do botão
    >
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

          {/* ✅ REMOVIDO: DashboardContent que continha as seções redundantes */}
          {/* Agora o dashboard mostra apenas os 3 cards principais e os gráficos do header */}
          
          {/* Espaçamento final para não ficar muito próximo do rodapé */}
          <motion.div variants={itemVariants} className="h-8"></motion.div>
        </motion.div>
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default Index;

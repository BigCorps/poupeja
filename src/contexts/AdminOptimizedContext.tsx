import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { supabase } from '@/integrations/supabase/client';
import { User, UserProfile, SubscriptionPlan } from '@/types';
import {
  fetchRecentTransactions,
  fetchSpendingHabits,
  fetchUserCount,
  fetchPlanDistribution,
} from '@/services/adminService';
import { toast } from '@/components/ui/use-toast';

interface AdminOptimizedContextType {
  // Dados administrativos
  userCount: number | null;
  planDistribution: Record<string, number> | null;
  recentTransactions: any[];
  spendingHabits: any[];

  // Métodos
  fetchAdminData: () => Promise<void>;
  updateUserRole: (userId: string, newRole: 'admin' | 'user') => Promise<void>;

  // Estado do carregamento
  isAdminDataLoading: boolean;
  isAdmin: boolean;
}

const AdminOptimizedContext = createContext<AdminOptimizedContextType | undefined>(undefined);

export const AdminOptimizedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAppContext();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [planDistribution, setPlanDistribution] = useState<Record<string, number> | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [spendingHabits, setSpendingHabits] = useState<any[]>([]);
  const [isAdminDataLoading, setIsAdminDataLoading] = useState(false);

  const fetchAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setIsAdminDataLoading(true);
    try {
      const [count, distribution, transactions, habits] = await Promise.all([
        fetchUserCount(),
        fetchPlanDistribution(),
        fetchRecentTransactions(),
        fetchSpendingHabits(),
      ]);

      setUserCount(count);
      setPlanDistribution(distribution);
      setRecentTransactions(transactions);
      setSpendingHabits(habits);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Erro ao carregar dados de administração",
        description: "Não foi possível carregar os dados administrativos. Verifique a conexão.",
        variant: "destructive",
      });
    } finally {
      setIsAdminDataLoading(false);
    }
  }, [isAdmin]);

  const updateUserRole = useCallback(async (userId: string, newRole: 'admin' | 'user') => {
    if (!isAdmin) {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para alterar o papel do usuário.",
        variant: "destructive",
      });
      return;
    }
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Papel do usuário atualizado",
        description: `O usuário agora é um ${newRole}.`,
      });

      // Opcionalmente, você pode re-buscar os dados para refletir a mudança
      // fetchAdminData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Erro ao atualizar papel do usuário",
        description: "Não foi possível atualizar o papel do usuário.",
        variant: "destructive",
      });
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, fetchAdminData]);

  const value = useMemo(
    () => ({
      userCount,
      planDistribution,
      recentTransactions,
      spendingHabits,
      isAdminDataLoading,
      isAdmin,
      fetchAdminData,
      updateUserRole,
    }),
    [userCount, planDistribution, recentTransactions, spendingHabits, isAdminDataLoading, isAdmin, fetchAdminData, updateUserRole]
  );

  return <AdminOptimizedContext.Provider value={value}>{children}</AdminOptimizedContext.Provider>;
};

export const useAdminOptimizedContext = () => {
  const context = useContext(AdminOptimizedContext);
  if (context === undefined) {
    throw new Error('useAdminOptimizedContext must be used within an AdminOptimizedProvider');
  }
  return context;
};

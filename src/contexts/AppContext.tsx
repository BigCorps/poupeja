import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, Goal, ScheduledTransaction, User, TimeRange } from '@/types';
import { setupAuthListener, getCurrentSession } from '@/services/authService';
import { recalculateGoalAmounts as recalculateGoalAmountsService } from '@/services/goalService';
import { RealtimeChannel } from '@supabase/supabase-js';

// ===================================================
// TIPOS E INTERFACES
// ===================================================

// Use database types directly from Supabase
interface Category {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense' | 'operational_inflow' | 'operational_outflow' | 'investment_inflow' | 'investment_outflow' | 'financing_inflow' | 'financing_outflow';
  color: string;
  icon: string | null;
  is_default: boolean | null;
  parent_id?: string | null;
}

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  scheduledTransactions: ScheduledTransaction[];
  isLoading: boolean;
  error: string | null;
  user: User | null;
  session: any | null;
  hideValues: boolean;
  timeRange: TimeRange;
  customStartDate: string | null;
  customEndDate: string | null;
  filteredTransactions: Transaction[];
}

interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  toggleHideValues: () => void;
  logout: () => void;
  setTimeRange: (range: TimeRange) => void;
  setCustomDateRange: (startDate: string, endDate: string) => void;
  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => Promise<Transaction | undefined>;
  updateTransaction: (transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Category actions
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'user_id'>) => Promise<Category | undefined>;
  updateCategory: (category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // Goal actions
  addGoal: (goal: Omit<Goal, 'id' | 'created_at' | 'user_id'>) => Promise<Goal | undefined>;
  updateGoal: (goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  // Scheduled Transaction actions
  addScheduledTransaction: (st: Omit<ScheduledTransaction, 'id' | 'created_at' | 'user_id'>) => Promise<ScheduledTransaction | undefined>;
  updateScheduledTransaction: (st: Partial<ScheduledTransaction>) => Promise<void>;
  deleteScheduledTransaction: (id: string) => Promise<void>;
}

type AppAction =
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'SET_SCHEDULED_TRANSACTIONS'; payload: ScheduledTransaction[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SESSION'; payload: any | null }
  | { type: 'TOGGLE_HIDE_VALUES' }
  | { type: 'SET_TIME_RANGE'; payload: TimeRange }
  | { type: 'SET_CUSTOM_DATE_RANGE'; payload: { startDate: string | null, endDate: string | null } };

// Mock data and functions to make the code runnable
const initialState: AppState = {
  transactions: [],
  categories: [],
  goals: [],
  scheduledTransactions: [],
  isLoading: false,
  error: null,
  user: null,
  session: null,
  hideValues: false,
  timeRange: 'currentMonth',
  customStartDate: null,
  customEndDate: null,
  filteredTransactions: [],
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    // ... add other cases as needed
    default:
      return state;
  }
};

const transformCategory = (data: any): Category => data; // Placeholder
const transformGoal = (data: any): Goal => data; // Placeholder

// ===================================================
// PROVIDER DO CONTEXTO
// ===================================================
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  // Ações
  const toggleHideValues = useCallback(() => {
    dispatch({ type: 'TOGGLE_HIDE_VALUES' });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const setTimeRange = useCallback((range: TimeRange) => {
    dispatch({ type: 'SET_TIME_RANGE', payload: range });
  }, []);

  const setCustomDateRange = useCallback((startDate: string, endDate: string) => {
    dispatch({ type: 'SET_CUSTOM_DATE_RANGE', payload: { startDate, endDate } });
  }, []);

  // ===================================================
  // FUNÇÕES DE BUSCA DE DADOS
  // ===================================================
  
  // Função para buscar as categorias
  const getCategories = useCallback(async (): Promise<void> => {
    if (!state.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .select('*')
        .eq('user_id', state.user.id);
      
      if (error) {
        throw error;
      }
      
      const transformedCategories = (data || []).map(transformCategory);
      dispatch({ type: 'SET_CATEGORIES', payload: transformedCategories });
    } catch (err) {
      console.error("Erro inesperado ao buscar categorias:", err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro inesperado ao buscar categorias.' });
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
    }
  }, [state.user?.id]);

  // Função para buscar as metas
  const getGoals = useCallback(async (): Promise<Goal[]> => {
    if (!state.user?.id) return [];
    try {
      console.log('AppContext: Fetching goals...');
      // Agora usamos o user do estado do contexto, não uma função de autenticação
      const { data, error } = await supabase
        .from('poupeja_goals')
        .select('*')
        .eq('user_id', state.user.id);

      if (error) throw error;
      
      const goals = (data || []).map(transformGoal);
      console.log('AppContext: Goals fetched successfully:', goals.length);
      dispatch({ type: 'SET_GOALS', payload: goals });
      return goals;
    } catch (error) {
      console.error('Error fetching goals:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao buscar metas' });
      dispatch({ type: 'SET_GOALS', payload: [] });
      throw error;
    }
  }, [state.user?.id]);

  // Função para buscar as transações
  const getTransactions = useCallback(async (): Promise<void> => {
    if (!state.user?.id) return;
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data, error } = await supabase
        .from('poupeja_transactions')
        .select('*')
        .eq('user_id', state.user.id);
      if (error) throw error;
      dispatch({ type: 'SET_TRANSACTIONS', payload: data });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao buscar transações' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user?.id]);
  
  // Função para buscar agendamentos
  const getScheduledTransactions = useCallback(async (): Promise<void> => {
    if (!state.user?.id) return;
    // ... lógica para buscar transações agendadas
  }, [state.user?.id]);

  // Efeito para configurar o listener de autenticação
  useEffect(() => {
    // Configura o listener de autenticação. Sempre que a sessão mudar,
    // o estado do user e session no contexto é atualizado.
    const { data: { subscription } } = setupAuthListener((session) => {
      if (session) {
        dispatch({ type: 'SET_SESSION', payload: session });
        dispatch({ type: 'SET_USER', payload: session.user });
      } else {
        dispatch({ type: 'SET_SESSION', payload: null });
        dispatch({ type: 'SET_USER', payload: null });
      }
    });

    // Limpa a inscrição ao desmontar o componente
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Efeito para buscar os dados iniciais do usuário quando a autenticação é confirmada
  useEffect(() => {
    if (state.user?.id) {
      console.log("Usuário autenticado, buscando dados iniciais...");
      getCategories();
      getGoals();
      getTransactions();
      getScheduledTransactions();
      // Outras chamadas de busca de dados podem ser adicionadas aqui
    }
  }, [state.user?.id, getCategories, getGoals, getTransactions, getScheduledTransactions]);

  const value = useMemo(() => ({
    ...state,
    toggleHideValues,
    logout,
    setTimeRange,
    setCustomDateRange,
    // Placeholder actions
    addTransaction: async () => undefined,
    updateTransaction: async () => {},
    deleteTransaction: async () => {},
    addCategory: async () => undefined,
    updateCategory: async () => {},
    deleteCategory: async () => {},
    addGoal: async () => undefined,
    updateGoal: async () => {},
    deleteGoal: async () => {},
    addScheduledTransaction: async () => undefined,
    updateScheduledTransaction: async () => {},
    deleteScheduledTransaction: async () => {},
  }), [
    state,
    toggleHideValues,
    logout,
    setTimeRange,
    setCustomDateRange,
    // Re-add fetch functions to the dependency array if they are used
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ===================================================
// HOOKS CUSTOMIZADOS
// ===================================================

// Hook principal para usar o contexto
const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Hook compatível com nome antigo - exportado para manter compatibilidade
const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// ===================================================
// EXPORTAÇÕES
// ===================================================

// Exporta ambos os hooks para garantir compatibilidade
export { useApp, useAppContext };

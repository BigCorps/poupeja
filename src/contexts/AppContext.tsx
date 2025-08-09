import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, Goal, ScheduledTransaction, User, TimeRange } from '@/types';
import { setupAuthListener } from '@/services/authService';
import { RealtimeChannel } from '@supabase/supabase-js';

// ===================================================
// TIPOS E INTERFACES
// ===================================================

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
  // Fetching functions
  getCategories: () => Promise<void>;
  getGoals: () => Promise<Goal[]>;
  getTransactions: () => Promise<void>;
  getScheduledTransactions: () => Promise<void>;
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
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'TOGGLE_HIDE_VALUES':
      return { ...state, hideValues: !state.hideValues };
    case 'SET_TIME_RANGE':
      return { ...state, timeRange: action.payload };
    case 'SET_CUSTOM_DATE_RANGE':
      return { ...state, customStartDate: action.payload.startDate, customEndDate: action.payload.endDate };
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
    console.log('AppContext: getCategories - Início da busca.');
    if (!state.user?.id) {
      console.log('AppContext: getCategories - Usuário não autenticado, retornando.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .select('*')
        .eq('user_id', state.user.id);
      
      if (error) {
        console.error("AppContext: Erro ao buscar categorias:", error);
        throw error;
      }
      
      const transformedCategories = (data || []).map(transformCategory);
      console.log(`AppContext: getCategories - ${transformedCategories.length} categorias carregadas com sucesso.`);
      dispatch({ type: 'SET_CATEGORIES', payload: transformedCategories });
    } catch (err) {
      console.error("AppContext: Erro inesperado ao buscar categorias:", err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro inesperado ao buscar categorias.' });
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
    }
  }, [state.user?.id]);

  // Função para buscar as metas
  const getGoals = useCallback(async (): Promise<Goal[]> => {
    console.log('AppContext: getGoals - Início da busca.');
    if (!state.user?.id) {
      console.log('AppContext: getGoals - Usuário não autenticado, retornando.');
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('poupeja_goals')
        .select('*')
        .eq('user_id', state.user.id);

      if (error) {
        console.error("AppContext: Erro ao buscar metas:", error);
        throw error;
      }
      
      const goals = (data || []).map(transformGoal);
      console.log(`AppContext: getGoals - ${goals.length} metas carregadas com sucesso.`);
      dispatch({ type: 'SET_GOALS', payload: goals });
      return goals;
    } catch (error) {
      console.error('AppContext: Erro inesperado ao buscar metas:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao buscar metas' });
      dispatch({ type: 'SET_GOALS', payload: [] });
      throw error;
    }
  }, [state.user?.id]);

  // Função para buscar as transações
  const getTransactions = useCallback(async (): Promise<void> => {
    console.log('AppContext: getTransactions - Início da busca.');
    if (!state.user?.id) {
      console.log('AppContext: getTransactions - Usuário não autenticado, retornando.');
      return;
    }
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data, error } = await supabase
        .from('poupeja_transactions')
        .select('*')
        .eq('user_id', state.user.id);
      if (error) {
        console.error("AppContext: Erro ao buscar transações:", error);
        throw error;
      }
      console.log(`AppContext: getTransactions - ${data.length} transações carregadas com sucesso.`);
      dispatch({ type: 'SET_TRANSACTIONS', payload: data });
    } catch (error) {
      console.error('AppContext: Erro inesperado ao buscar transações:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao buscar transações' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user?.id]);
  
  // Função para buscar agendamentos
  const getScheduledTransactions = useCallback(async (): Promise<void> => {
    console.log('AppContext: getScheduledTransactions - Início da busca.');
    if (!state.user?.id) {
      console.log('AppContext: getScheduledTransactions - Usuário não autenticado, retornando.');
      return;
    }
    // ... lógica para buscar transações agendadas
    // Por enquanto, apenas um console.log para saber se a função foi chamada
    console.log('AppContext: getScheduledTransactions - Função chamada, mas sem lógica de busca implementada.');
  }, [state.user?.id]);

  // Efeito para configurar o listener de autenticação
  useEffect(() => {
    const { data: { subscription } } = setupAuthListener((session) => {
      console.log("AppContext: Listener de autenticação ativado.");
      if (session) {
        console.log("AppContext: Sessão encontrada, definindo usuário e sessão.");
        dispatch({ type: 'SET_SESSION', payload: session });
        dispatch({ type: 'SET_USER', payload: session.user });
      } else {
        console.log("AppContext: Nenhuma sessão encontrada, limpando usuário e sessão.");
        dispatch({ type: 'SET_SESSION', payload: null });
        dispatch({ type: 'SET_USER', payload: null });
      }
    });

    return () => {
      console.log("AppContext: Listener de autenticação desativado.");
      subscription.unsubscribe();
    };
  }, []);

  // Efeito para buscar os dados iniciais do usuário quando a autenticação é confirmada
  useEffect(() => {
    if (state.user?.id) {
      console.log("AppContext: Usuário autenticado, buscando dados iniciais...");
      getCategories();
      getGoals();
      getTransactions();
      getScheduledTransactions();
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
    // Exposing the fetch functions to the context value
    getCategories,
    getGoals,
    getTransactions,
    getScheduledTransactions
  }), [
    state,
    toggleHideValues,
    logout,
    setTimeRange,
    setCustomDateRange,
    // Include the fetch functions in the dependency array
    getCategories,
    getGoals,
    getTransactions,
    getScheduledTransactions,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ===================================================
// HOOKS CUSTOMIZADOS
// ===================================================

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

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

export { useApp, useAppContext };


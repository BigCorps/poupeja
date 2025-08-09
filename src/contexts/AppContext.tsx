import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, Goal, ScheduledTransaction, User, TimeRange } from '@/types';
import { setupAuthListener, getCurrentSession } from '@/services/authService';
import { recalculateGoalAmounts as recalculateGoalAmountsService } from '@/services/goalService';

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
  accountType: 'PF' | 'PJ';
}

interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  toggleHideValues: () => void;
  logout: () => void;
  setTimeRange: (timeRange: TimeRange) => void;
  setCustomDateRange: (startDate: string, endDate: string) => void;
  getTransactions: () => Promise<void>;
  getCategories: () => Promise<void>;
  getGoals: () => Promise<Goal[]>;
  getScheduledTransactions: () => Promise<void>;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  addScheduledTransaction: (scheduledTransaction: ScheduledTransaction) => void;
  updateScheduledTransaction: (scheduledTransaction: ScheduledTransaction) => void;
  deleteScheduledTransaction: (id: string) => void;
  setAccountType: (accountType: 'PF' | 'PJ') => void;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SESSION'; payload: any | null }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'SET_SCHEDULED_TRANSACTIONS'; payload: ScheduledTransaction[] }
  | { type: 'TOGGLE_HIDE_VALUES' }
  | { type: 'SET_TIME_RANGE'; payload: TimeRange }
  | { type: 'SET_CUSTOM_DATE_RANGE'; payload: { startDate: string; endDate: string } }
  | { type: 'SET_FILTERED_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_ACCOUNT_TYPE'; payload: 'PF' | 'PJ' }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'ADD_SCHEDULED_TRANSACTION'; payload: ScheduledTransaction }
  | { type: 'UPDATE_SCHEDULED_TRANSACTION'; payload: ScheduledTransaction }
  | { type: 'DELETE_SCHEDULED_TRANSACTION'; payload: string };


const initialAppState: AppState = {
  transactions: [],
  categories: [],
  goals: [],
  scheduledTransactions: [],
  isLoading: true,
  error: null,
  user: null,
  session: null,
  hideValues: false,
  timeRange: 'last_30_days',
  customStartDate: null,
  customEndDate: null,
  filteredTransactions: [],
  accountType: 'PF', // Default to PF
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// ===================================================
// REDUTOR
// ===================================================

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isLoading: false };
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: Array.isArray(action.payload) ? action.payload : [] };
    case 'SET_CATEGORIES':
      return { ...state, categories: Array.isArray(action.payload) ? action.payload : [] };
    case 'SET_GOALS':
      return { ...state, goals: Array.isArray(action.payload) ? action.payload : [] };
    case 'SET_SCHEDULED_TRANSACTIONS':
      return { ...state, scheduledTransactions: Array.isArray(action.payload) ? action.payload : [] };
    case 'TOGGLE_HIDE_VALUES':
      return { ...state, hideValues: !state.hideValues };
    case 'SET_TIME_RANGE':
      return { ...state, timeRange: action.payload, customStartDate: null, customEndDate: null };
    case 'SET_CUSTOM_DATE_RANGE':
      return { ...state, timeRange: 'custom', customStartDate: action.payload.startDate, customEndDate: action.payload.endDate };
    case 'SET_FILTERED_TRANSACTIONS':
      return { ...state, filteredTransactions: action.payload };
    case 'SET_ACCOUNT_TYPE':
      return { ...state, accountType: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'UPDATE_TRANSACTION':
      return { ...state, transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t ) };
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return { ...state, categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g) };
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.payload) };
    case 'ADD_SCHEDULED_TRANSACTION':
      return { ...state, scheduledTransactions: [...state.scheduledTransactions, action.payload] };
    case 'UPDATE_SCHEDULED_TRANSACTION':
      return { ...state, scheduledTransactions: state.scheduledTransactions.map(st => st.id === action.payload.id ? action.payload : st) };
    case 'DELETE_SCHEDULED_TRANSACTION':
      return { ...state, scheduledTransactions: state.scheduledTransactions.filter(st => st.id !== action.payload) };
    default:
      return state;
  }
};

// ===================================================
// FUNÇÕES DE TRANSFORMAÇÃO (MOCK)
// Aparentemente, essas funções estavam ausentes no seu arquivo. Elas são necessárias
// para evitar erros de referência no `getGoals` e `getCategories`.
// ===================================================
const transformGoal = (data: any): Goal => {
  return data;
};

const transformCategory = (data: any): Category => {
  return data;
};

const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  const toggleHideValues = useCallback(() => {
    dispatch({ type: 'TOGGLE_HIDE_VALUES' });
  }, []);

  const setAccountType = useCallback((accountType: 'PF' | 'PJ') => {
    dispatch({ type: 'SET_ACCOUNT_TYPE', payload: accountType });
  }, []);

  const setTimeRange = useCallback((timeRange: TimeRange) => {
    dispatch({ type: 'SET_TIME_RANGE', payload: timeRange });
  }, []);

  const setCustomDateRange = useCallback((startDate: string, endDate: string) => {
    dispatch({ type: 'SET_CUSTOM_DATE_RANGE', payload: { startDate, endDate } });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'SET_USER', payload: null });
  }, []);
  
  const getTransactions = useCallback(async () => {
    try {
      if (!state.user) return; // ✅ Adicionado para evitar chamadas de API desnecessárias
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data, error } = await supabase.from('poupeja_transactions')
        .select(`
          id, created_at, date, amount, description, type, is_recurring, is_paid,
          category:poupeja_categories(id, name, icon, color, type, parent_id),
          goal_id, account_id, currency, user_id, supplier, due_date, payment_date,
          original_amount, late_interest_amount, payment_status, account_type
        `)
        .eq('user_id', state.user.id)
        .eq('account_type', state.accountType)
        .order('date', { ascending: false });

      if (error) {
        console.error("Erro ao buscar transações:", error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      } else {
        dispatch({ type: 'SET_TRANSACTIONS', payload: data || [] });
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar transações:", err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro inesperado ao buscar transações.' });
      dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user, state.accountType]);

  const getCategories = useCallback(async () => {
    try {
      if (!state.user) return; // ✅ Adicionado para evitar chamadas de API desnecessárias
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data, error } = await supabase.from('poupeja_categories')
        .select('*')
        .or(`user_id.eq.${state.user.id},is_default.eq.true`);

      if (error) {
        console.error("Erro ao buscar categorias:", error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        dispatch({ type: 'SET_CATEGORIES', payload: [] });
      } else {
        dispatch({ type: 'SET_CATEGORIES', payload: (data || []).map(transformCategory) });
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar categorias:", err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro inesperado ao buscar categorias.' });
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user]);

  const getGoals = useCallback(async (): Promise<Goal[]> => {
    try {
      if (!state.user) return []; // ✅ Adicionado para evitar chamadas de API desnecessárias
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data, error } = await supabase
        .from('poupeja_goals')
        .select('*')
        .eq('user_id', state.user.id);

      if (error) throw error;
      
      const goals = (data || []).map(transformGoal); // Garante que a transformação é feita em um array
      dispatch({ type: 'SET_GOALS', payload: goals });
      return goals;
    } catch (error) {
      console.error('Error fetching goals:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao buscar metas' });
      dispatch({ type: 'SET_GOALS', payload: [] });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user]);

  const getScheduledTransactions = useCallback(async (): Promise<void> => {
    try {
      if (!state.user) return; // ✅ Adicionado para evitar chamadas de API desnecessárias
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data, error } = await supabase.from('poupeja_scheduled_transactions')
        .select('*')
        .eq('user_id', state.user.id);

      if (error) throw error;

      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: data || [] });
    } catch (error) {
      console.error('Error fetching scheduled transactions:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao buscar transações agendadas' });
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user]);

  // Ações de manipulação do estado (transações, categorias, etc.)
  const addTransaction = (transaction: Transaction) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
  };
  const updateTransaction = (transaction: Transaction) => {
    dispatch({ type: 'UPDATE_TRANSACTION', payload: transaction });
  };
  const deleteTransaction = (id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  };
  const addCategory = (category: Category) => {
    dispatch({ type: 'ADD_CATEGORY', payload: category });
  };
  const updateCategory = (category: Category) => {
    dispatch({ type: 'UPDATE_CATEGORY', payload: category });
  };
  const deleteCategory = (id: string) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
  };
  const addGoal = (goal: Goal) => {
    dispatch({ type: 'ADD_GOAL', payload: goal });
  };
  const updateGoal = (goal: Goal) => {
    dispatch({ type: 'UPDATE_GOAL', payload: goal });
  };
  const deleteGoal = (id: string) => {
    dispatch({ type: 'DELETE_GOAL', payload: id });
  };
  const addScheduledTransaction = (scheduledTransaction: ScheduledTransaction) => {
    dispatch({ type: 'ADD_SCHEDULED_TRANSACTION', payload: scheduledTransaction });
  };
  const updateScheduledTransaction = (scheduledTransaction: ScheduledTransaction) => {
    dispatch({ type: 'UPDATE_SCHEDULED_TRANSACTION', payload: scheduledTransaction });
  };
  const deleteScheduledTransaction = (id: string) => {
    dispatch({ type: 'DELETE_SCHEDULED_TRANSACTION', payload: id });
  };
  
  // Efeito para o listener de autenticação
  useEffect(() => {
    // Configura o listener e armazena o objeto de unsubscribe
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        dispatch({ type: 'SET_SESSION', payload: session });
        if (session) {
          dispatch({ type: 'SET_USER', payload: session.user });
        } else {
          dispatch({ type: 'SET_USER', payload: null });
        }
      }
    );

    // Retorna a função de cleanup que cancela a assinatura do listener
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Efeito para buscar os dados quando o usuário muda
  useEffect(() => {
    if (state.user) {
      getTransactions();
      getCategories();
      getGoals();
      getScheduledTransactions();
    } else {
      // Limpar o estado quando o usuário faz logout
      dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
      dispatch({ type: 'SET_GOALS', payload: [] });
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
    }
  }, [state.user, getTransactions, getCategories, getGoals, getScheduledTransactions]);

  const value = useMemo(() => ({
    ...state,
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
    setAccountType,
    getTransactions,
    getCategories,
    getGoals,
    getScheduledTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addGoal,
    updateGoal,
    deleteGoal,
    addScheduledTransaction,
    updateScheduledTransaction,
    deleteScheduledTransaction,
  }), [
    state,
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
    setAccountType,
    getTransactions,
    getCategories,
    getGoals,
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

export { useApp, useAppContext, AppProvider };

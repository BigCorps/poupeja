import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, Goal, ScheduledTransaction, User, TimeRange } from '@/types';
import { setupAuthListener, getCurrentSession, getCurrentUser } from '@/services/authService';
import { recalculateGoalAmounts as recalculateGoalAmountsService } from '@/services/goalService';
import { getFilteredTransactions as getFilteredTransactionsService } from '@/services/transactionService';

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
  accountType: 'PF' | 'PJ';
}

interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  toggleHideValues: () => void;
  logout: () => Promise<void>;
  setCustomDateRange: (startDate: string, endDate: string) => void;
  setTimeRange: (range: TimeRange) => void;
  // Ações de dados
  getTransactions: () => Promise<void>;
  getCategories: () => Promise<void>;
  getGoals: () => Promise<Goal[]>;
  getScheduledTransactions: () => Promise<void>;
  // Ações de transação
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  // Ações de categoria
  addCategory: (category: Partial<Category>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  // Ações de meta
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  // Ações de transação agendada
  addScheduledTransaction: (scheduledTransaction: ScheduledTransaction) => Promise<void>;
  updateScheduledTransaction: (scheduledTransaction: ScheduledTransaction) => Promise<void>;
  deleteScheduledTransaction: (scheduledTransactionId: string) => Promise<void>;
}

const initialState: AppState = {
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
  accountType: 'PF',
};

type AppAction =
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'SET_SCHEDULED_TRANSACTIONS'; payload: ScheduledTransaction[] }
  | { type: 'ADD_SCHEDULED_TRANSACTION'; payload: ScheduledTransaction }
  | { type: 'UPDATE_SCHEDULED_TRANSACTION'; payload: ScheduledTransaction }
  | { type: 'DELETE_SCHEDULED_TRANSACTION'; payload: string }
  | { type: 'SET_IS_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SESSION'; payload: any | null }
  | { type: 'TOGGLE_HIDE_VALUES' }
  | { type: 'SET_TIME_RANGE'; payload: TimeRange }
  | { type: 'SET_CUSTOM_DATE_RANGE'; payload: { startDate: string; endDate: string } }
  | { type: 'SET_FILTERED_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_ACCOUNT_TYPE'; payload: 'PF' | 'PJ' }
  | { type: 'RESET_STATE' };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    case 'SET_SCHEDULED_TRANSACTIONS':
      return { ...state, scheduledTransactions: action.payload };
    case 'SET_IS_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'TOGGLE_HIDE_VALUES':
      return { ...state, hideValues: !state.hideValues };
    case 'SET_TIME_RANGE':
      return { ...state, timeRange: action.payload };
    case 'SET_CUSTOM_DATE_RANGE':
      return {
        ...state,
        customStartDate: action.payload.startDate,
        customEndDate: action.payload.endDate,
        timeRange: 'custom',
      };
    case 'SET_FILTERED_TRANSACTIONS':
      return { ...state, filteredTransactions: action.payload };
    case 'SET_ACCOUNT_TYPE':
      return { ...state, accountType: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ===================================================
// UTILS E TRANSFORMAÇÕES
// ===================================================

const transformCategory = (category: any): Category => {
  return {
    ...category,
    is_default: category.is_default ?? false,
    parent_id: category.parent_id ?? null,
  };
};

const transformGoal = (goal: any): Goal => {
  return {
    ...goal,
    current_amount: goal.current_amount ?? 0,
    end_date: goal.end_date ?? null,
  };
};

// ===================================================
// PROVIDER
// ===================================================

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Função para buscar dados do usuário
  const fetchUserData = useCallback(async () => {
    if (!state.user) {
      return;
    }
    dispatch({ type: 'SET_IS_LOADING', payload: true });
    await Promise.all([
      getCategories(),
      getGoals(),
      getScheduledTransactions(),
    ]);
    dispatch({ type: 'SET_IS_LOADING', payload: false });
  }, [state.user]);

  // Handle Supabase Auth Listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        dispatch({ type: 'SET_SESSION', payload: session });
        if (session) {
          dispatch({ type: 'SET_USER', payload: session.user as User });
        } else {
          dispatch({ type: 'SET_USER', payload: null });
          dispatch({ type: 'RESET_STATE' });
        }
        setIsAuthReady(true);
      }
    );

    // Cleanup the auth listener on component unmount
    return () => {
      authListener.unsubscribe();
    };
  }, []);

  // Fetch initial data after authentication is ready
  useEffect(() => {
    if (isAuthReady && state.user) {
      fetchUserData();
    }
  }, [isAuthReady, state.user, fetchUserData]);

  // NEW: Real-time subscription for transactions
  // This is the core change to fix the `unsubscribe` error.
  // We use a useEffect with a proper cleanup function.
  useEffect(() => {
    if (!state.user?.id) {
      console.log('User not logged in, skipping real-time subscription.');
      return;
    }

    console.log('Subscribing to real-time transactions...');

    const channel = supabase
      .channel('poupeja_transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poupeja_transactions',
          filter: `user_id=eq.${state.user.id}`,
        },
        (payload) => {
          console.log('Change received!', payload);
          // Here you would handle the real-time data changes, e.g.:
          // getTransactions(); // Or a more granular update
        }
      )
      .subscribe();

    // IMPORTANT: The cleanup function returns the channel unsubscribe
    // This ensures `unsubscribe` is always a function and is called correctly.
    return () => {
      console.log('Unsubscribing from real-time transactions.');
      channel.unsubscribe();
    };
  }, [state.user?.id]); // Re-subscribe when the user changes

  const getTransactions = useCallback(async () => {
    if (!state.user?.id) {
      return;
    }
    try {
      dispatch({ type: 'SET_IS_LOADING', payload: true });
      const { data, error } = await supabase
        .from('poupeja_transactions')
        .select('*')
        .eq('user_id', state.user.id);
      if (error) throw error;
      dispatch({ type: 'SET_TRANSACTIONS', payload: data });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Error fetching transactions:', err);
    } finally {
      dispatch({ type: 'SET_IS_LOADING', payload: false });
    }
  }, [state.user?.id]);

  const getCategories = useCallback(async () => {
    if (!state.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .select('*')
        .eq('user_id', state.user.id);
      if (error) throw error;
      const transformedCategories = (data || []).map(transformCategory);
      dispatch({ type: 'SET_CATEGORIES', payload: transformedCategories });
    } catch (err) {
      console.error('Erro inesperado ao buscar categorias:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro inesperado ao buscar categorias.' });
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
    }
  }, [state.user?.id]);

  const getGoals = useCallback(async (): Promise<Goal[]> => {
    if (!state.user?.id) return [];
    try {
      const { data, error } = await supabase
        .from('poupeja_goals')
        .select('*')
        .eq('user_id', state.user.id);
      if (error) throw error;
      const goals = (data || []).map(transformGoal);
      dispatch({ type: 'SET_GOALS', payload: goals });
      return goals;
    } catch (error) {
      console.error('Error fetching goals:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao buscar metas' });
      dispatch({ type: 'SET_GOALS', payload: [] });
      throw error;
    }
  }, [state.user?.id]);

  const getScheduledTransactions = useCallback(async () => {
    if (!state.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_scheduled_transactions')
        .select('*')
        .eq('user_id', state.user.id);
      if (error) throw error;
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: data });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      console.error('Error fetching scheduled transactions:', err);
    }
  }, [state.user?.id]);

  const toggleHideValues = useCallback(() => {
    dispatch({ type: 'TOGGLE_HIDE_VALUES' });
  }, []);

  const setCustomDateRange = useCallback((startDate: string, endDate: string) => {
    dispatch({ type: 'SET_CUSTOM_DATE_RANGE', payload: { startDate, endDate } });
  }, []);

  const setTimeRange = useCallback((range: TimeRange) => {
    dispatch({ type: 'SET_TIME_RANGE', payload: range });
  }, []);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }, []);

  const addTransaction = useCallback(async (transaction: Transaction) => {
    const { data, error } = await supabase.from('poupeja_transactions').insert(transaction).select();
    if (error) throw error;
    dispatch({ type: 'ADD_TRANSACTION', payload: data[0] });
  }, []);
  const updateTransaction = useCallback(async (transaction: Transaction) => {
    const { data, error } = await supabase.from('poupeja_transactions').update(transaction).eq('id', transaction.id).select();
    if (error) throw error;
    dispatch({ type: 'UPDATE_TRANSACTION', payload: data[0] });
  }, []);
  const deleteTransaction = useCallback(async (transactionId: string) => {
    const { error } = await supabase.from('poupeja_transactions').delete().eq('id', transactionId);
    if (error) throw error;
    dispatch({ type: 'DELETE_TRANSACTION', payload: transactionId });
  }, []);
  const addCategory = useCallback(async (category: Partial<Category>) => {
    const { data, error } = await supabase.from('poupeja_categories').insert(category).select();
    if (error) throw error;
    dispatch({ type: 'ADD_CATEGORY', payload: data[0] });
  }, []);
  const updateCategory = useCallback(async (category: Category) => {
    const { data, error } = await supabase.from('poupeja_categories').update(category).eq('id', category.id).select();
    if (error) throw error;
    dispatch({ type: 'UPDATE_CATEGORY', payload: data[0] });
  }, []);
  const deleteCategory = useCallback(async (categoryId: string) => {
    const { error } = await supabase.from('poupeja_categories').delete().eq('id', categoryId);
    if (error) throw error;
    dispatch({ type: 'DELETE_CATEGORY', payload: categoryId });
  }, []);
  const addGoal = useCallback(async (goal: Goal) => {
    const { data, error } = await supabase.from('poupeja_goals').insert(goal).select();
    if (error) throw error;
    dispatch({ type: 'ADD_GOAL', payload: data[0] });
  }, []);
  const updateGoal = useCallback(async (goal: Goal) => {
    const { data, error } = await supabase.from('poupeja_goals').update(goal).eq('id', goal.id).select();
    if (error) throw error;
    dispatch({ type: 'UPDATE_GOAL', payload: data[0] });
  }, []);
  const deleteGoal = useCallback(async (goalId: string) => {
    const { error } = await supabase.from('poupeja_goals').delete().eq('id', goalId);
    if (error) throw error;
    dispatch({ type: 'DELETE_GOAL', payload: goalId });
  }, []);
  const addScheduledTransaction = useCallback(async (scheduledTransaction: ScheduledTransaction) => {
    const { data, error } = await supabase.from('poupeja_scheduled_transactions').insert(scheduledTransaction).select();
    if (error) throw error;
    dispatch({ type: 'ADD_SCHEDULED_TRANSACTION', payload: data[0] });
  }, []);
  const updateScheduledTransaction = useCallback(async (scheduledTransaction: ScheduledTransaction) => {
    const { data, error } = await supabase.from('poupeja_scheduled_transactions').update(scheduledTransaction).eq('id', scheduledTransaction.id).select();
    if (error) throw error;
    dispatch({ type: 'UPDATE_SCHEDULED_TRANSACTION', payload: data[0] });
  }, []);
  const deleteScheduledTransaction = useCallback(async (scheduledTransactionId: string) => {
    const { error } = await supabase.from('poupeja_scheduled_transactions').delete().eq('id', scheduledTransactionId);
    if (error) throw error;
    dispatch({ type: 'DELETE_SCHEDULED_TRANSACTION', payload: scheduledTransactionId });
  }, []);

  const value = useMemo(() => ({
    ...state,
    // Estado
    // Ações
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
    // Ações de dados
    getTransactions,
    getCategories,
    getGoals,
    getScheduledTransactions,
    // Ações de transação
    addTransaction,
    updateTransaction,
    deleteTransaction,
    // Ações de categoria
    addCategory,
    updateCategory,
    deleteCategory,
    // Ações de meta
    addGoal,
    updateGoal,
    deleteGoal,
    // Ações de transação agendada
    addScheduledTransaction,
    updateScheduledTransaction,
    deleteScheduledTransaction,
  }), [
    state,
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
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

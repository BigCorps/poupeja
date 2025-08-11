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
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addScheduledTransaction: (scheduledTransaction: Omit<ScheduledTransaction, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateScheduledTransaction: (scheduledTransaction: ScheduledTransaction) => Promise<void>;
  deleteScheduledTransaction: (id: string) => Promise<void>;
  setAccountType: (accountType: 'PF' | 'PJ') => void;
  // Adicionado para expor as categorias já processadas
  parentCategories: Category[];
  subcategories: Category[];
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
// FUNÇÕES DE HELPERS
// ===================================================

const transformGoal = (goalData: any): Goal => {
  return {
    ...goalData,
    goal_amount: typeof goalData.goal_amount === 'string' ? parseFloat(goalData.goal_amount) : goalData.goal_amount,
    current_amount: typeof goalData.current_amount === 'string' ? parseFloat(goalData.current_amount) : goalData.current_amount,
  };
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
      // O `parent_id` já está sendo selecionado corretamente com `*`
      const { data, error } = await supabase.from('poupeja_categories')
        .select('*')
        .or(`user_id.eq.${state.user.id},is_default.eq.true`);

      if (error) {
        console.error("Erro ao buscar categorias:", error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        dispatch({ type: 'SET_CATEGORIES', payload: [] });
      } else {
        // A lista de categorias e subcategorias é salva no estado
        dispatch({ type: 'SET_CATEGORIES', payload: data || [] });
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
  const addTransaction = useCallback(async (transaction: Transaction) => {
    if (!state.user) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_transactions')
        .insert({ ...transaction, user_id: state.user.id, account_type: state.accountType })
        .select(`
          id, created_at, date, amount, description, type, is_recurring, is_paid,
          category:poupeja_categories(id, name, icon, color, type, parent_id),
          goal_id, account_id, currency, user_id, supplier, due_date, payment_date,
          original_amount, late_interest_amount, payment_status, account_type
        `)
        .single();
      
      if (error) throw error;
      dispatch({ type: 'ADD_TRANSACTION', payload: data });
      if (data.goal_id) {
        await recalculateGoalAmountsService(state.user.id, data.goal_id);
        getGoals();
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar transação.' });
    }
  }, [state.user, state.accountType, getGoals]);

  const updateTransaction = useCallback(async (transaction: Transaction) => {
    if (!state.user) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_transactions')
        .update({ ...transaction, user_id: state.user.id })
        .eq('id', transaction.id)
        .select(`
          id, created_at, date, amount, description, type, is_recurring, is_paid,
          category:poupeja_categories(id, name, icon, color, type, parent_id),
          goal_id, account_id, currency, user_id, supplier, due_date, payment_date,
          original_amount, late_interest_amount, payment_status, account_type
        `)
        .single();

      if (error) throw error;
      dispatch({ type: 'UPDATE_TRANSACTION', payload: data });
      if (data.goal_id) {
        await recalculateGoalAmountsService(state.user.id, data.goal_id);
        getGoals();
      }
    } catch (err) {
      console.error('Error updating transaction:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar transação.' });
    }
  }, [state.user, getGoals]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!state.user) return;
    try {
      const transactionToDelete = state.transactions.find(t => t.id === id);
      const { error } = await supabase
        .from('poupeja_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      if (transactionToDelete?.goal_id) {
        await recalculateGoalAmountsService(state.user.id, transactionToDelete.goal_id);
        getGoals();
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar transação.' });
    }
  }, [state.user, state.transactions, getGoals]);

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'created_at' | 'user_id'>) => {
    if (!state.user) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .insert({ ...category, user_id: state.user.id })
        .select()
        .single();
      
      if (error) throw error;
      dispatch({ type: 'ADD_CATEGORY', payload: data });
    } catch (err) {
      console.error('Error adding category:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar categoria.' });
    }
  }, [state.user]);

  const updateCategory = useCallback(async (category: Category) => {
    if (!state.user) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .update({ ...category, user_id: state.user.id })
        .eq('id', category.id)
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: 'UPDATE_CATEGORY', payload: data });
    } catch (err) {
      console.error('Error updating category:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar categoria.' });
    }
  }, [state.user]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!state.user) return;
    try {
      const { error } = await supabase
        .from('poupeja_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
    } catch (err) {
      console.error('Error deleting category:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar categoria.' });
    }
  }, [state.user]);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'created_at' | 'user_id'>) => {
    if (!state.user) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_goals')
        .insert({ ...goal, user_id: state.user.id })
        .select()
        .single();
      
      if (error) throw error;
      dispatch({ type: 'ADD_GOAL', payload: transformGoal(data) });
    } catch (err) {
      console.error('Error adding goal:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar meta.' });
    }
  }, [state.user]);

  const updateGoal = useCallback(async (goal: Goal) => {
    if (!state.user) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_goals')
        .update({ ...goal, user_id: state.user.id })
        .eq('id', goal.id)
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: 'UPDATE_GOAL', payload: transformGoal(data) });
    } catch (err) {
      console.error('Error updating goal:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar meta.' });
    }
  }, [state.user]);

  const deleteGoal = useCallback(async (id: string) => {
    if (!state.user) return;
    try {
      const { error } = await supabase
        .from('poupeja_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      dispatch({ type: 'DELETE_GOAL', payload: id });
    } catch (err) {
      console.error('Error deleting goal:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar meta.' });
    }
  }, [state.user]);

  const addScheduledTransaction = useCallback(async (scheduledTransaction: Omit<ScheduledTransaction, 'id' | 'created_at' | 'user_id'>) => {
    if (!state.user) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_scheduled_transactions')
        .insert({ ...scheduledTransaction, user_id: state.user.id })
        .select()
        .single();
      
      if (error) throw error;
      dispatch({ type: 'ADD_SCHEDULED_TRANSACTION', payload: data });
    } catch (err) {
      console.error('Error adding scheduled transaction:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar transação agendada.' });
    }
  }, [state.user]);

  const updateScheduledTransaction = useCallback(async (scheduledTransaction: ScheduledTransaction) => {
    if (!state.user) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_scheduled_transactions')
        .update({ ...scheduledTransaction, user_id: state.user.id })
        .eq('id', scheduledTransaction.id)
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: 'UPDATE_SCHEDULED_TRANSACTION', payload: data });
    } catch (err) {
      console.error('Error updating scheduled transaction:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar transação agendada.' });
    }
  }, [state.user]);

  const deleteScheduledTransaction = useCallback(async (id: string) => {
    if (!state.user) return;
    try {
      const { error } = await supabase
        .from('poupeja_scheduled_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      dispatch({ type: 'DELETE_SCHEDULED_TRANSACTION', payload: id });
    } catch (err) {
      console.error('Error deleting scheduled transaction:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar transação agendada.' });
    }
  }, [state.user]);
  
  // Efeito para o listener de autenticação
  useEffect(() => {
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
      dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
      dispatch({ type: 'SET_GOALS', payload: [] });
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
    }
  }, [state.user, getTransactions, getCategories, getGoals, getScheduledTransactions]);
  
  // Lógica para separar categorias e subcategorias
  const parentCategories = useMemo(() => {
    return state.categories.filter(cat => !cat.parent_id);
  }, [state.categories]);

  const subcategories = useMemo(() => {
    return state.categories.filter(cat => cat.parent_id);
  }, [state.categories]);
  
  const value = useMemo(() => ({
    ...state,
    dispatch,
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
    // Adicionado para expor as listas processadas
    parentCategories,
    subcategories
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
    parentCategories,
    subcategories
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

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, Goal, ScheduledTransaction, User, TimeRange } from '@/types';
import { setupAuthListener, getCurrentSession } from '@/services/authService';
import { recalculateGoalAmounts as recalculateGoalAmountsService } from '@/services/goalService';
import { addDays, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, isAfter, isBefore } from 'date-fns';

// ===================================================
// TIPOS E INTERFACES
// ===================================================

// Use database types directly from Supabase
interface Category {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string | null;
  is_default: boolean | null;
  parent_id: string | null;
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
  fetchUserData: () => void;
  toggleHideValues: () => void;
  logout: () => Promise<void>;
  setCustomDateRange: (start: Date | null, end: Date | null) => void;
  setTimeRange: (range: string) => void;
  setAccountType: (type: 'PF' | 'PJ') => void;
  
  // Data fetching methods
  getTransactions: (startDate: string, endDate: string) => Promise<Transaction[]>;
  getCategories: () => Promise<Category[]>;
  getGoals: () => Promise<Goal[]>;
  getScheduledTransactions: () => Promise<ScheduledTransaction[]>;
  recalculateGoalAmounts: () => Promise<boolean>;
  updateUserProfile: (data: any) => Promise<void>;
  
  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Category actions
  addCategory: (category: Omit<Category, 'id' | 'created_at'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Goal actions
  addGoal: (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Scheduled Transaction actions
  addScheduledTransaction: (transaction: Omit<ScheduledTransaction, 'id' | 'created_at'>) => Promise<void>;
  updateScheduledTransaction: (id: string, transaction: Partial<ScheduledTransaction>) => Promise<void>;
  deleteScheduledTransaction: (id: string) => Promise<void>;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'SET_SCHEDULED_TRANSACTIONS'; payload: ScheduledTransaction[] }
  | { type: 'SET_SESSION'; payload: any | null }
  | { type: 'TOGGLE_HIDE_VALUES' }
  | { type: 'SET_TIME_RANGE'; payload: TimeRange }
  | { type: 'SET_CUSTOM_DATE_RANGE'; payload: { startDate: string | null; endDate: string | null } }
  | { type: 'SET_FILTERED_TRANSACTIONS'; payload: Transaction[] }
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
  | { type: 'DELETE_SCHEDULED_TRANSACTION'; payload: string }
  | { type: 'SET_ACCOUNT_TYPE'; payload: 'PF' | 'PJ' };

// ===================================================
// ESTADO INICIAL E REDUCER
// ===================================================

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
  timeRange: 'last30days',
  customStartDate: null,
  customEndDate: null,
  filteredTransactions: [],
  accountType: 'PF',
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
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
    case 'SET_SCHEDULED_TRANSACTIONS':
      return { ...state, scheduledTransactions: action.payload };
    case 'TOGGLE_HIDE_VALUES':
      return { ...state, hideValues: !state.hideValues };
    case 'SET_TIME_RANGE':
      return { ...state, timeRange: action.payload, customStartDate: null, customEndDate: null };
    case 'SET_CUSTOM_DATE_RANGE':
      return { ...state, timeRange: 'custom', ...action.payload };
    case 'SET_FILTERED_TRANSACTIONS':
      return { ...state, filteredTransactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t => 
          t.id === action.payload.id ? action.payload : t
        )
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload)
      };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c => 
          c.id === action.payload.id ? action.payload : c
        )
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload)
      };
    case 'ADD_GOAL':
      return {
        ...state,
        goals: [...state.goals, action.payload]
      };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g =>
          g.id === action.payload.id ? action.payload : g
        )
      };
    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(g => g.id !== action.payload)
      };
    case 'ADD_SCHEDULED_TRANSACTION':
      return {
        ...state,
        scheduledTransactions: [...state.scheduledTransactions, action.payload]
      };
    case 'UPDATE_SCHEDULED_TRANSACTION':
      return {
        ...state,
        scheduledTransactions: state.scheduledTransactions.map(st =>
          st.id === action.payload.id ? action.payload : st
        )
      };
    case 'DELETE_SCHEDULED_TRANSACTION':
      return {
        ...state,
        scheduledTransactions: state.scheduledTransactions.filter(st => st.id !== action.payload)
      };
    case 'SET_ACCOUNT_TYPE':
      return { ...state, accountType: action.payload };
    default:
      return state;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// ===================================================
// PROVIDER PRINCIPAL
// ===================================================

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper function to get current user with better error handling
  const getCurrentUser = async () => {
    try {
      const session = await getCurrentSession();
      if (!session?.user) {
        throw new Error('User not authenticated');
      }
      return session.user;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  };

  // Helper function to transform database types to proper types
  const transformTransaction = (dbTransaction: any): Transaction => {
    return {
      id: dbTransaction.id,
      type: dbTransaction.type as 'income' | 'expense',
      amount: dbTransaction.amount,
      category: dbTransaction.category?.name || 'Unknown',
      categoryIcon: dbTransaction.category?.icon || 'circle',
      categoryColor: dbTransaction.category?.color || '#607D8B',
      description: dbTransaction.description || '',
      date: dbTransaction.date,
      goalId: dbTransaction.goal_id,
      categoryId: dbTransaction.category_id,
      userId: dbTransaction.user_id,
      supplier: dbTransaction.supplier || '',
      dueDate: dbTransaction.due_date,
      paymentDate: dbTransaction.payment_date,
      originalAmount: dbTransaction.original_amount,
      lateInterestAmount: dbTransaction.late_interest_amount,
      paymentStatus: dbTransaction.payment_status,
      accountId: dbTransaction.account_id,
      isRecurring: dbTransaction.is_recurring,
      isPaid: dbTransaction.is_paid,
      accountType: dbTransaction.account_type,
    };
  };

  const getTransactions = useCallback(async (startDate: string, endDate: string) => {
    if (!state.user?.id) {
      console.warn('User not authenticated, skipping transaction fetch.');
      return [];
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const { data, error } = await supabase
        .from('poupeja_transactions')
        .select(`
          id,
          created_at,
          date,
          amount,
          description,
          type,
          is_recurring,
          is_paid,
          category:poupeja_categories(
            id,
            name,
            icon,
            color,
            type,
            parent_id
          ),
          goal_id,
          account_id,
          currency,
          user_id,
          supplier,
          due_date,
          payment_date,
          original_amount,
          late_interest_amount,
          payment_status,
          account_type
        `)
        .eq('user_id', state.user.id)
        .eq('account_type', state.accountType)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }
      
      const formattedTransactions = (data || []).map(t => ({
        ...t,
        category: t.category ? (Array.isArray(t.category) ? t.category[0] : t.category) : null,
        goal_id: t.goal_id || null,
      }));

      dispatch({ type: 'SET_TRANSACTIONS', payload: formattedTransactions as Transaction[] });
      return formattedTransactions as Transaction[];
      
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to fetch transactions' });
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user, state.accountType]);

  const getCategories = useCallback(async () => {
    if (!state.user?.id) return [];
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .select('*')
        .or(`user_id.eq.${state.user.id},is_default.eq.true`)
        .order('sort_order');
      if (error) throw error;
      dispatch({ type: 'SET_CATEGORIES', payload: data as Category[] });
      return data as Category[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch categories' });
      return [];
    }
  }, [state.user]);

  const getGoals = useCallback(async () => {
    if (!state.user?.id) return [];
    try {
      const { data, error } = await supabase
        .from('poupeja_goals')
        .select('*')
        .eq('user_id', state.user.id)
        .order('end_date');
      if (error) throw error;
      const goalsWithRecalculatedAmounts = recalculateGoalAmountsService(data as Goal[], state.transactions);
      dispatch({ type: 'SET_GOALS', payload: goalsWithRecalculatedAmounts });
      return goalsWithRecalculatedAmounts;
    } catch (error) {
      console.error('Error fetching goals:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch goals' });
      return [];
    }
  }, [state.user, state.transactions]);

  const getScheduledTransactions = useCallback(async () => {
    if (!state.user?.id) return [];
    try {
      const { data, error } = await supabase
        .from('poupeja_scheduled_transactions')
        .select('*')
        .eq('user_id', state.user.id)
        .order('next_due_date');
      if (error) throw error;
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: data as ScheduledTransaction[] });
      return data as ScheduledTransaction[];
    } catch (error) {
      console.error('Error fetching scheduled transactions:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch scheduled transactions' });
      return [];
    }
  }, [state.user]);
  
  const recalculateGoalAmounts = useCallback(async () => {
    if (!state.user?.id) return false;
    try {
      const updatedGoals = recalculateGoalAmountsService(state.goals, state.transactions);
      dispatch({ type: 'SET_GOALS', payload: updatedGoals });
      return true;
    } catch (error) {
      console.error('Error recalculating goal amounts:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to recalculate goal amounts' });
      return false;
    }
  }, [state.goals, state.transactions, dispatch]);

  const addTransaction = useCallback(async (newTransaction: Omit<Transaction, 'id' | 'created_at'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data, error } = await supabase
        .from('poupeja_transactions')
        .insert({ ...newTransaction, user_id: state.user?.id })
        .select()
        .single();
      if (error) throw error;
      dispatch({ type: 'ADD_TRANSACTION', payload: data as Transaction });
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to add transaction' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user]);

  const updateTransaction = useCallback(async (id: string, updatedFields: Partial<Transaction>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data, error } = await supabase
        .from('poupeja_transactions')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      dispatch({ type: 'UPDATE_TRANSACTION', payload: data as Transaction });
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update transaction' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { error } = await supabase
        .from('poupeja_transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to delete transaction' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const addCategory = useCallback(async (newCategory: Omit<Category, 'id' | 'created_at'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .insert({ ...newCategory, user_id: state.user?.id })
        .select()
        .single();
      if (error) throw error;
      dispatch({ type: 'ADD_CATEGORY', payload: data as Category });
    } catch (error: any) {
      console.error('Error adding category:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to add category' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user]);

  const updateCategory = useCallback(async (id: string, updatedFields: Partial<Category>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      dispatch({ type: 'UPDATE_CATEGORY', payload: data as Category });
    } catch (error: any) {
      console.error('Error updating category:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update category' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { error } = await supabase
        .from('poupeja_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to delete category' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const addGoal = useCallback(async (newGoal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data, error } = await supabase
        .from('poupeja_goals')
        .insert({ ...newGoal, user_id: state.user?.id })
        .select()
        .single();
      if (error) throw error;
      dispatch({ type: 'ADD_GOAL', payload: data as Goal });
    } catch (error: any) {
      console.error('Error adding goal:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to add goal' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user]);

  const updateGoal = useCallback(async (id: string, updatedFields: Partial<Goal>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data, error } = await supabase
        .from('poupeja_goals')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      dispatch({ type: 'UPDATE_GOAL', payload: data as Goal });
    } catch (error: any) {
      console.error('Error updating goal:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update goal' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { error } = await supabase
        .from('poupeja_goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
      dispatch({ type: 'DELETE_GOAL', payload: id });
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to delete goal' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const addScheduledTransaction = useCallback(async (newScheduledTransaction: Omit<ScheduledTransaction, 'id' | 'created_at'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data, error } = await supabase
        .from('poupeja_scheduled_transactions')
        .insert({ ...newScheduledTransaction, user_id: state.user?.id })
        .select()
        .single();
      if (error) throw error;
      dispatch({ type: 'ADD_SCHEDULED_TRANSACTION', payload: data as ScheduledTransaction });
    } catch (error: any) {
      console.error('Error adding scheduled transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to add scheduled transaction' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user]);

  const updateScheduledTransaction = useCallback(async (id: string, updatedFields: Partial<ScheduledTransaction>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data, error } = await supabase
        .from('poupeja_scheduled_transactions')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      dispatch({ type: 'UPDATE_SCHEDULED_TRANSACTION', payload: data as ScheduledTransaction });
    } catch (error: any) {
      console.error('Error updating scheduled transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update scheduled transaction' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const deleteScheduledTransaction = useCallback(async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { error } = await supabase
        .from('poupeja_scheduled_transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      dispatch({ type: 'DELETE_SCHEDULED_TRANSACTION', payload: id });
    } catch (error: any) {
      console.error('Error deleting scheduled transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to delete scheduled transaction' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    if (state.user?.id) {
      await Promise.all([
        getCategories(),
        getTransactions(format(startOfMonth(new Date()), 'yyyy-MM-dd'), format(endOfMonth(new Date()), 'yyyy-MM-dd')),
        getGoals(),
        getScheduledTransactions(),
      ]);
    }
  }, [state.user, getCategories, getTransactions, getGoals, getScheduledTransactions]);

  const toggleHideValues = useCallback(() => {
    dispatch({ type: 'TOGGLE_HIDE_VALUES' });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'SET_USER', payload: null });
    dispatch({ type: 'SET_SESSION', payload: null });
    dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
    dispatch({ type: 'SET_CATEGORIES', payload: [] });
    dispatch({ type: 'SET_GOALS', payload: [] });
    dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
  }, []);

  const setCustomDateRange = useCallback((startDate: Date | null, endDate: Date | null) => {
    dispatch({ type: 'SET_CUSTOM_DATE_RANGE', payload: { startDate: startDate ? format(startDate, 'yyyy-MM-dd') : null, endDate: endDate ? format(endDate, 'yyyy-MM-dd') : null } });
  }, []);

  const setTimeRange = useCallback((range: string) => {
    dispatch({ type: 'SET_TIME_RANGE', payload: range as TimeRange });
  }, []);

  const setAccountType = useCallback((type: 'PF' | 'PJ') => {
    dispatch({ type: 'SET_ACCOUNT_TYPE', payload: type });
  }, []);

  const updateUserProfile = useCallback(async (data: any) => {
    // Implementação de updateUserProfile...
    console.log('Update user profile not yet implemented:', data);
  }, []);

  useEffect(() => {
    const authListener = setupAuthListener(async (session) => {
      dispatch({ type: 'SET_SESSION', payload: session });
      dispatch({ type: 'SET_USER', payload: session?.user || null });
      if (session) {
        await fetchUserData();
      } else {
        dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
        dispatch({ type: 'SET_CATEGORIES', payload: [] });
        dispatch({ type: 'SET_GOALS', payload: [] });
        dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
        dispatch({ type: 'SET_USER', payload: null });
      }
      setIsInitialized(true);
    });

    return () => {
      authListener.unsubscribe();
    };
  }, [fetchUserData]);

  useEffect(() => {
    if (isInitialized && state.user) {
      let startDate: string | null = null;
      let endDate: string | null = null;
      
      switch (state.timeRange) {
        case 'last7days':
          startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
          endDate = format(new Date(), 'yyyy-MM-dd');
          break;
        case 'last30days':
          startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
          endDate = format(new Date(), 'yyyy-MM-dd');
          break;
        case 'thisMonth':
          startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
          endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
          break;
        case 'lastMonth':
          startDate = format(subMonths(startOfMonth(new Date()), 1), 'yyyy-MM-dd');
          endDate = format(subMonths(endOfMonth(new Date()), 1), 'yyyy-MM-dd');
          break;
        case 'thisWeek':
          startDate = format(startOfWeek(new Date()), 'yyyy-MM-dd');
          endDate = format(endOfWeek(new Date()), 'yyyy-MM-dd');
          break;
        case 'custom':
          startDate = state.customStartDate;
          endDate = state.customEndDate;
          break;
        default:
          startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
          endDate = format(new Date(), 'yyyy-MM-dd');
      }

      if (startDate && endDate) {
        getTransactions(startDate, endDate);
      }
    }
  }, [state.timeRange, state.customStartDate, state.customEndDate, state.user, isInitialized, getTransactions]);

  const filteredTransactions = useMemo(() => {
    if (!state.transactions) return [];

    let filtered = state.transactions;

    // Filter by date range
    if (state.customStartDate && state.customEndDate) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        const start = new Date(state.customStartDate!);
        const end = new Date(state.customEndDate!);
        return isAfter(transactionDate, start) && isBefore(transactionDate, end);
      });
    }

    // Filter by account type
    filtered = filtered.filter(t => t.accountType === state.accountType);

    return filtered;
  }, [state.transactions, state.customStartDate, state.customEndDate, state.accountType]);

  useEffect(() => {
    dispatch({ type: 'SET_FILTERED_TRANSACTIONS', payload: filteredTransactions });
  }, [filteredTransactions]);

  const value = useMemo(() => ({
    ...state,
    fetchUserData,
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
    setAccountType,
    getTransactions,
    getCategories,
    getGoals,
    getScheduledTransactions,
    recalculateGoalAmounts,
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
    updateUserProfile,
  }), [
    state,
    fetchUserData,
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
    setAccountType,
    getTransactions,
    getCategories,
    getGoals,
    getScheduledTransactions,
    recalculateGoalAmounts,
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
    updateUserProfile,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

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

export { useApp, useAppContext };

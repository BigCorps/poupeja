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
  // Ações básicas
  dispatch: React.Dispatch<AppAction>;
  fetchUserData: () => void;
  toggleHideValues: () => void;
  logout: () => Promise<void>;
  setCustomDateRange: (start: Date | null, end: Date | null) => void;
  setTimeRange: (range: TimeRange) => void;
  setAccountType: (type: 'PF' | 'PJ') => void;
  // Data fetching methods
  getTransactions: () => Promise<Transaction[]>;
  getCategories: () => Promise<void>;
  getGoals: () => Promise<Goal[]>;
  getScheduledTransactions: () => Promise<void>;
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
      return { ...state, goals: [...state.goals, action.payload] };
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
      return { ...state, scheduledTransactions: [...state.scheduledTransactions, action.payload] };
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
    default:
      return state;
  }
};

// ===================================================
// PROVEDOR DE CONTEXTO
// ===================================================

const AppContext = createContext<AppContextType | undefined>(undefined);

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

  // Helper function to transform database types to proper types - com proteção contra valores undefined
  const transformTransaction = (dbTransaction: any): Transaction => {
    return {
      id: dbTransaction?.id || '',
      type: (dbTransaction?.type as 'income' | 'expense') || 'expense',
      amount: dbTransaction?.amount || 0,
      category: dbTransaction?.category?.name || 'Unknown',
      categoryIcon: dbTransaction?.category?.icon || 'circle',
      categoryColor: dbTransaction?.category?.color || '#607D8B',
      description: dbTransaction?.description || '',
      date: dbTransaction?.date || new Date().toISOString(),
      goalId: dbTransaction?.goal_id || null,
      category_id: dbTransaction?.category_id || null,
      goal_id: dbTransaction?.goal_id || null,
      user_id: dbTransaction?.user_id || '',
      created_at: dbTransaction?.created_at || new Date().toISOString(),
    };
  };

  const transformCategory = (dbCategory: any): Category => ({
    id: dbCategory?.id || '',
    created_at: dbCategory?.created_at || new Date().toISOString(),
    user_id: dbCategory?.user_id || '',
    name: dbCategory?.name || 'Unknown',
    type: (dbCategory?.type as 'income' | 'expense' | 'operational_inflow' | 'operational_outflow' | 'investment_inflow' | 'investment_outflow' | 'financing_inflow' | 'financing_outflow') || 'expense',
    color: dbCategory?.color || '#607D8B',
    icon: dbCategory?.icon || null,
    is_default: dbCategory?.is_default || null,
    parent_id: dbCategory?.parent_id || null,
  });

  const transformGoal = (dbGoal: any): Goal => ({
    id: dbGoal?.id || '',
    name: dbGoal?.name || 'Unknown Goal',
    targetAmount: dbGoal?.target_amount || 0,
    currentAmount: dbGoal?.current_amount || 0,
    startDate: dbGoal?.start_date || new Date().toISOString(),
    endDate: dbGoal?.end_date || new Date().toISOString(),
    deadline: dbGoal?.deadline || new Date().toISOString(),
    color: dbGoal?.color || '#3B82F6',
    transactions: [],
    target_amount: dbGoal?.target_amount || 0,
    current_amount: dbGoal?.current_amount || 0,
    start_date: dbGoal?.start_date || new Date().toISOString(),
    end_date: dbGoal?.end_date || new Date().toISOString(),
    user_id: dbGoal?.user_id || '',
    created_at: dbGoal?.created_at || new Date().toISOString(),
    updated_at: dbGoal?.updated_at || new Date().toISOString(),
  });

  const transformScheduledTransaction = (dbScheduledTransaction: any): ScheduledTransaction => {
    const categoryName = dbScheduledTransaction?.category?.name || 'Outros';
    const categoryIcon = dbScheduledTransaction?.category?.icon || 'DollarSign';
    const categoryColor = dbScheduledTransaction?.category?.color || '#6B7280';
    return {
      id: dbScheduledTransaction?.id || '',
      type: (dbScheduledTransaction?.type as 'income' | 'expense') || 'expense',
      amount: dbScheduledTransaction?.amount || 0,
      category: categoryName,
      categoryIcon: categoryIcon,
      categoryColor: categoryColor,
      description: dbScheduledTransaction?.description || '',
      scheduledDate: dbScheduledTransaction?.scheduled_date || new Date().toISOString(),
      recurrence: (dbScheduledTransaction?.recurrence as 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly') || 'once',
      goalId: dbScheduledTransaction?.goal_id || null,
      status: (dbScheduledTransaction?.status as 'pending' | 'paid' | 'overdue' | 'upcoming') || 'pending',
      paidDate: dbScheduledTransaction?.paid_date || null,
      paidAmount: dbScheduledTransaction?.paid_amount || null,
      lastExecutionDate: dbScheduledTransaction?.last_execution_date || null,
      nextExecutionDate: dbScheduledTransaction?.next_execution_date || null,
      category_id: dbScheduledTransaction?.category_id || null,
      goal_id: dbScheduledTransaction?.goal_id || null,
      user_id: dbScheduledTransaction?.user_id || '',
      scheduled_date: dbScheduledTransaction?.scheduled_date || new Date().toISOString(),
      paid_date: dbScheduledTransaction?.paid_date || null,
      last_execution_date: dbScheduledTransaction?.last_execution_date || null,
      next_execution_date: dbScheduledTransaction?.next_execution_date || null,
      created_at: dbScheduledTransaction?.created_at || new Date().toISOString(),
    };
  };

  // Filter transactions based on time range
  const filterTransactionsByTimeRange = (transactions: Transaction[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    if (state.timeRange === 'custom' && state.customStartDate && state.customEndDate) {
      startDate = new Date(state.customStartDate);
      endDate = new Date(state.customEndDate);
    } else {
      switch (state.timeRange) {
        case 'today':
          startDate = today;
          endDate = today;
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          startDate = yesterday;
          endDate = yesterday;
          break;
        case '7days':
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
          startDate = sevenDaysAgo;
          endDate = today;
          break;
        case '14days':
          const fourteenDaysAgo = new Date(today);
          fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
          startDate = fourteenDaysAgo;
          endDate = today;
          break;
        case 'last30days':
        case '30days':
        default:
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
          startDate = thirtyDaysAgo;
          endDate = today;
          break;
      }
    }
    
    if (!startDate || !endDate) return transactions;
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const transactionDateOnly = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
      return transactionDateOnly >= startDate && transactionDateOnly <= endDate;
    });
  };

  // Update filtered transactions when transactions or time range changes
  useEffect(() => {
    const filtered = filterTransactionsByTimeRange(state.transactions);
    dispatch({ type: 'SET_FILTERED_TRANSACTIONS', payload: filtered });
  }, [state.transactions, state.timeRange, state.customStartDate, state.customEndDate]);

  const fetchUserData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const [{ data: transactions, error: transactionsError }, { data: categories, error: categoriesError }] =
        await Promise.all([
          supabase.from('poupeja_transactions').select(`
            *,
            category:poupeja_categories(id, name, icon, color, type, parent_id)
          `).eq('user_id', user.id).eq('account_type', state.accountType),
          supabase.from('poupeja_categories').select('*').or(`user_id.eq.${user.id},is_default.eq.true`)
        ]);

      if (transactionsError || categoriesError) {
        dispatch({ type: 'SET_ERROR', payload: transactionsError?.message || categoriesError?.message || 'Erro ao buscar dados.' });
      } else {
        const transformedTransactions = (transactions || []).map(transformTransaction);
        const transformedCategories = (categories || []).map(transformCategory);
        dispatch({ type: 'SET_TRANSACTIONS', payload: transformedTransactions });
        dispatch({ type: 'SET_CATEGORIES', payload: transformedCategories });
      }
    } else {
      dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  // Setup auth state listener and initial session check - CORRIGIDO
  useEffect(() => {
    let mounted = true;
    
    const handleAuthChange = async (session: any) => {
      if (!mounted) return;
      
      if (session?.user) {
        dispatch({ type: 'SET_SESSION', payload: session });
        dispatch({ type: 'SET_USER', payload: session.user });
        
        if (!isInitialized || state.user?.id !== session.user.id) {
          await loadUserData(session.user);
        }
      } else {
        dispatch({ type: 'SET_SESSION', payload: null });
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
        dispatch({ type: 'SET_CATEGORIES', payload: [] });
        dispatch({ type: 'SET_GOALS', payload: [] });
        dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
        dispatch({ type: 'SET_LOADING', payload: false });
        setIsInitialized(true);
      }
    };

    // Set up auth state listener - CORRIGIDO para lidar com diferentes formatos de retorno
    let subscription: any = null;
    try {
      const authResponse = setupAuthListener(handleAuthChange);
      
      // Verifica se o retorno tem a estrutura { data: { subscription } }
      if (authResponse && authResponse.data && authResponse.data.subscription) {
        subscription = authResponse.data.subscription;
      }
      // Ou se é diretamente o subscription
      else if (authResponse && typeof authResponse.unsubscribe === 'function') {
        subscription = authResponse;
      }
      // Ou se tem um método unsubscribe diretamente
      else if (authResponse && authResponse.subscription) {
        subscription = authResponse.subscription;
      }
    } catch (error) {
      console.error('Error setting up auth listener:', error);
    }

    // Check for existing session
    const checkInitialSession = async () => {
      try {
        const session = await getCurrentSession();
        
        if (session?.user) {
          await handleAuthChange(session);
        } else {
          await handleAuthChange(null);
        }
      } catch (error) {
        console.error('AppContext: Error during initialization:', error);
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
        dispatch({ type: 'SET_LOADING', payload: false });
        setIsInitialized(true);
      }
    };

    checkInitialSession();

    return () => {
      mounted = false;
      // Cleanup subscription com verificação de tipo
      if (subscription) {
        try {
          if (typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
          } else if (typeof subscription === 'function') {
            subscription();
          }
        } catch (error) {
          console.error('Error unsubscribing from auth listener:', error);
        }
      }
    };
  }, []);

  // Load user data function with better error handling
  const loadUserData = async (user: any) => {
    if (!user?.id) {
      console.error('AppContext: Cannot load data - no user ID');
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Verify user session before making requests
      const session = await getCurrentSession();
      if (!session?.user) {
        throw new Error('Session expired or invalid');
      }
      
      // Load all data in parallel with error handling
      const [transactionsRes, categoriesRes, goalsRes, scheduledRes] = await Promise.allSettled([
        supabase.from('poupeja_transactions')
          .select(`
            *,
            category:poupeja_categories(id, name, icon, color, type, parent_id)
          `)
          .eq('user_id', user.id)
          .eq('account_type', state.accountType)
          .order('date', { ascending: false }),
        supabase.from('poupeja_categories').select('*').or(`user_id.eq.${user.id},is_default.eq.true`),
        supabase.from('poupeja_goals').select('*').eq('user_id', user.id),
        supabase.from('poupeja_scheduled_transactions')
          .select(`
            *,
            category:poupeja_categories(id, name, icon, color, type, parent_id)
          `)
          .eq('user_id', user.id)
      ]);

      // Process results with error checking
      const transactions = transactionsRes.status === 'fulfilled' && !transactionsRes.value.error 
        ? (transactionsRes.value.data || []).map(transformTransaction)
        : [];
      
      const categories = categoriesRes.status === 'fulfilled' && !categoriesRes.value.error
        ? (categoriesRes.value.data || []).map(transformCategory)
        : [];
      
      const goals = goalsRes.status === 'fulfilled' && !goalsRes.value.error
        ? (goalsRes.value.data || []).map(transformGoal)
        : [];
      
      const scheduledTransactions = scheduledRes.status === 'fulfilled' && !scheduledRes.value.error
        ? (scheduledRes.value.data || []).map(transformScheduledTransaction)
        : [];

      // Dispatch the data
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      dispatch({ type: 'SET_GOALS', payload: goals });
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: scheduledTransactions });
      
      console.log('AppContext: User data loaded successfully', {
        transactions: transactions.length,
        categories: categories.length,
        goals: goals.length,
        scheduled: scheduledTransactions.length
      });
      
    } catch (error) {
      console.error('AppContext: Error loading user data:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      setIsInitialized(true);
    }
  };

  const toggleHideValues = useCallback(() => {
    dispatch({ type: 'TOGGLE_HIDE_VALUES' });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'SET_USER', payload: null });
    dispatch({ type: 'SET_SESSION', payload: null });
  }, []);

  const setTimeRange = useCallback((range: TimeRange) => {
    dispatch({ type: 'SET_TIME_RANGE', payload: range });
  }, []);

  const setCustomDateRange = useCallback((start: Date | null, end: Date | null) => {
    dispatch({ 
      type: 'SET_CUSTOM_DATE_RANGE', 
      payload: { 
        startDate: start ? start.toISOString().split('T')[0] : null, 
        endDate: end ? end.toISOString().split('T')[0] : null 
      } 
    });
  }, []);

  const setAccountType = useCallback((type: 'PF' | 'PJ') => {
    dispatch({ type: 'SET_ACCOUNT_TYPE', payload: type });
  }, []);

  // Data fetching methods (memoized to prevent unnecessary re-renders)
  const getTransactions = useCallback(async (): Promise<Transaction[]> => {
    try {
      console.log('AppContext: Fetching transactions...');
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('poupeja_transactions')
        .select(`
          *,
          category:poupeja_categories(id, name, icon, color, type, parent_id)
        `)
        .eq('user_id', user.id)
        .eq('account_type', state.accountType)
        .order('date', { ascending: false });
  
      if (error) throw error;
      
      const transactions = (data || []).map(transformTransaction);
      console.log('AppContext: Transactions fetched successfully:', transactions.length);
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao buscar transações' });
      dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      throw error;
    }
  }, [state.user?.id, state.accountType]);

  const getCategories = useCallback(async (): Promise<void> => {
    try {
      console.log('AppContext: Fetching categories...');
      const { data, error } = await supabase.from('poupeja_categories')
        .select('*')
        .or(`user_id.eq.${state.user?.id},is_default.eq.true`);

      if (error) {
        console.error("Erro ao buscar categorias:", error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        dispatch({ type: 'SET_CATEGORIES', payload: [] });
      } else {
        const transformedCategories = (data || []).map(transformCategory);
        dispatch({ type: 'SET_CATEGORIES', payload: transformedCategories });
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar categorias:", err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro inesperado ao buscar categorias.' });
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
    }
  }, [state.user?.id]);

  const getGoals = useCallback(async (): Promise<Goal[]> => {
    try {
      console.log('AppContext: Fetching goals...');
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('poupeja_goals')
        .select('*')
        .eq('user_id', user.id);

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
  }, []);

  const getScheduledTransactions = useCallback(async (): Promise<void> => {
    try {
      console.log('AppContext: Fetching scheduled transactions...');
      const { data, error } = await supabase.from('poupeja_scheduled_transactions')
        .select(`
          *,
          category:poupeja_categories(id, name, icon, color, type, parent_id)
        `)
        .eq('user_id', state.user?.id);

      if (error) {
        console.error("Erro ao buscar transações agendadas:", error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
      } else {
        const transformedScheduledTransactions = (data || []).map(transformScheduledTransaction);
        dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: transformedScheduledTransactions });
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar transações agendadas:", err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro inesperado ao buscar transações agendadas.' });
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
    }
  }, [state.user?.id]);

  const recalculateGoalAmounts = async (): Promise<boolean> => {
    try {
      console.log('Recalculating goal amounts...');
      const success = await recalculateGoalAmountsService();
      if (success) {
        await getGoals();
      }
      return success;
    } catch (error) {
      console.error('Error recalculating goal amounts:', error);
      return false;
    }
  };

  const updateUserProfile = async (data: any): Promise<void> => {
    try {
      console.log('AppContext: updateUserProfile called with data:', data);
      
      const { updateUserProfile: updateUserProfileService } = await import('@/services/userService');
      const result = await updateUserProfileService(data);
      
      if (!result) {
        throw new Error('Failed to update user profile');
      }
      
      console.log('AppContext: Profile updated successfully:', result);
    } catch (error) {
      console.error('AppContext: Error updating user profile:', error);
      throw error;
    }
  };

  // Transaction actions
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    try {
      console.log('AppContext: Adding transaction...', transaction);
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('poupeja_transactions')
        .insert({ 
          type: transaction.type,
          amount: transaction.amount,
          category_id: transaction.category_id,
          description: transaction.description,
          date: transaction.date,
          goal_id: transaction.goalId,
          user_id: user.id,
          account_type: state.accountType, // Adicionado para suportar tipo de conta
        })
        .select(`
          *,
          category:poupeja_categories(id, name, icon, color, type, parent_id)
        `)
        .single();
  
      if (error) throw error;
      const transformedTransaction = transformTransaction(data);
      console.log('AppContext: Transaction added successfully:', transformedTransaction);
      dispatch({ type: 'ADD_TRANSACTION', payload: transformedTransaction });
      
      if (transaction.goalId) {
        console.log('AppContext: Recalculating goal amounts...');
        await recalculateGoalAmounts();
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };
  
  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    try {
      const { data, error } = await supabase
        .from('poupeja_transactions')
        .update({
          type: transaction.type,
          amount: transaction.amount,
          category_id: transaction.category_id,
          description: transaction.description,
          date: transaction.date,
          goal_id: transaction.goalId,
        })
        .eq('id', id)
        .select(`
          *,
          category:poupeja_categories(id, name, icon, color, type, parent_id)
        `)
        .single();
  
      if (error) throw error;
      const transformedTransaction = transformTransaction(data);
      dispatch({ type: 'UPDATE_TRANSACTION', payload: transformedTransaction });
      
      if (transaction.goalId) {
        await recalculateGoalAmounts();
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };
  
  const deleteTransaction = async (id: string) => {
    try {
      const { data: transactionData } = await supabase
        .from('poupeja_transactions')
        .select('goal_id')
        .eq('id', id)
        .single();
        
      const hasGoal = transactionData?.goal_id;
      
      const { error } = await supabase
        .from('poupeja_transactions')
        .delete()
        .eq('id', id);
  
      if (error) throw error;
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      
      if (hasGoal) {
        await recalculateGoalAmounts();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  // Category actions
  const addCategory = async (category: Omit<Category, 'id' | 'created_at'>) => {
    try {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('poupeja_categories')
        .insert({ ...category, user_id: user.id })
        .select()
        .single();
  
      if (error) throw error;
      const transformedCategory = transformCategory(data);
      dispatch({ type: 'ADD_CATEGORY', payload: transformedCategory });
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, category: Partial<Category>) => {
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();
  
      if (error) throw error;
      const transformedCategory = transformCategory(data);
      dispatch({ type: 'UPDATE_CATEGORY', payload: transformedCategory });
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('poupeja_categories')
        .delete()
        .eq('id', id);
  
      if (error) throw error;
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  // Goal actions
  const addGoal = async (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('poupeja_goals')
        .insert({ 
          name: goal.name,
          target_amount: goal.targetAmount || goal.target_amount,
          current_amount: goal.currentAmount || goal.current_amount || 0,
          start_date: goal.startDate || goal.start_date,
          end_date: goal.endDate || goal.end_date,
          deadline: goal.deadline,
          color: goal.color,
          user_id: user.id,
        })
        .select()
        .single();
  
      if (error) throw error;
      const transformedGoal = transformGoal(data);
      dispatch({ type: 'ADD_GOAL', payload: transformedGoal });
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  };

  const updateGoal = async (id: string, goal: Partial<Goal>) => {
    try {
      const { data, error } = await supabase
        .from('poupeja_goals')
        .update({
          name: goal.name,
          target_amount: goal.targetAmount || goal.target_amount,
          current_amount: goal.currentAmount || goal.current_amount,
          start_date: goal.startDate || goal.start_date,
          end_date: goal.endDate || goal.end_date,
          deadline: goal.deadline,
          color: goal.color,
        })
        .eq('id', id)
        .select()
        .single();
  
      if (error) throw error;
      const transformedGoal = transformGoal(data);
      dispatch({ type: 'UPDATE_GOAL', payload: transformedGoal });
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('poupeja_goals')
        .delete()
        .eq('id', id);
  
      if (error) throw error;
      dispatch({ type: 'DELETE_GOAL', payload: id });
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  };

  // Scheduled Transaction actions
  const addScheduledTransaction = async (transaction: Omit<ScheduledTransaction, 'id' | 'created_at'>) => {
    try {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('poupeja_scheduled_transactions')
        .insert({ 
          type: transaction.type,
          amount: transaction.amount,
          category_id: transaction.category_id,
          description: transaction.description,
          scheduled_date: transaction.scheduledDate || transaction.scheduled_date,
          recurrence: transaction.recurrence,
          goal_id: transaction.goalId || transaction.goal_id,
          status: transaction.status,
          user_id: user.id,
        })
        .select(`
          *,
          category:poupeja_categories(id, name, icon, color, type, parent_id)
        `)
        .single();
  
      if (error) throw error;
      const transformedTransaction = transformScheduledTransaction(data);
      dispatch({ type: 'ADD_SCHEDULED_TRANSACTION', payload: transformedTransaction });
    } catch (error) {
      console.error('Error adding scheduled transaction:', error);
      throw error;
    }
  };

  const updateScheduledTransaction = async (id: string, transaction: Partial<ScheduledTransaction>) => {
    try {
      const { data, error } = await supabase
        .from('poupeja_scheduled_transactions')
        .update({
          type: transaction.type,
          amount: transaction.amount,
          category_id: transaction.category_id,
          description: transaction.description,
          scheduled_date: transaction.scheduledDate || transaction.scheduled_date,
          recurrence: transaction.recurrence,
          goal_id: transaction.goalId || transaction.goal_id,
          status: transaction.status,
        })
        .eq('id', id)
        .select(`
          *,
          category:poupeja_categories(id, name, icon, color, type, parent_id)
        `)
        .single();
  
      if (error) throw error;
      const transformedTransaction = transformScheduledTransaction(data);
      dispatch({ type: 'UPDATE_SCHEDULED_TRANSACTION', payload: transformedTransaction });
    } catch (error) {
      console.error('Error updating scheduled transaction:', error);
      throw error;
    }
  };

  const deleteScheduledTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('poupeja_scheduled_transactions')
        .delete()
        .eq('id', id);
  
      if (error) throw error;
      dispatch({ type: 'DELETE_SCHEDULED_TRANSACTION', payload: id });
    } catch (error) {
      console.error('Error deleting scheduled transaction:', error);
      throw error;
    }
  };

  // Effect para carregar dados quando accountType muda
  useEffect(() => {
    if (state.user && isInitialized) {
      getTransactions();
    }
  }, [state.accountType, state.user, isInitialized, getTransactions]);

  const value: AppContextType = useMemo(() => ({
    ...state,
    dispatch,
    fetchUserData,
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
    setAccountType, // Adicionado
    // Data fetching methods
    getTransactions,
    getCategories, // Adicionado
    getGoals,
    getScheduledTransactions, // Adicionado
    recalculateGoalAmounts,
    updateUserProfile,
    // Transaction actions
    addTransaction,
    updateTransaction,
    deleteTransaction,
    // Category actions
    addCategory,
    updateCategory,
    deleteCategory,
    // Goal actions
    addGoal,
    updateGoal,
    deleteGoal,
    // Scheduled Transaction actions
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

// Exporta o useApp como default para ser o hook principal
export default useApp;

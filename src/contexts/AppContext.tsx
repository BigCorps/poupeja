import React, { createContext, useContext, useReducer, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, Goal, ScheduledTransaction, User, TimeRange } from '@/types';
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
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
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
  | { type: 'SET_ACCOUNT_TYPE'; payload: 'PF' | 'PJ' };

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
    default:
      return state;
  }
};

// ===================================================
// FUNÇÕES DE HELPERS
// ===================================================

// Função para garantir que os dados de meta tenham o tipo correto
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

  // Funções de CRUD do Supabase, agora com melhor tratamento de erro
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => {
    if (!state.user) return;
    try {
      const { error } = await supabase
        .from('poupeja_transactions')
        .insert({ ...transaction, user_id: state.user.id, account_type: state.accountType });
      
      if (error) throw error;
      // Não precisamos de dispatch aqui, pois a assinatura em tempo real fará isso.
    } catch (err) {
      console.error('Error adding transaction:', err);
      dispatch({ type: 'SET_ERROR', payload: `Erro ao adicionar transação: ${err.message}` });
    }
  }, [state.user, state.accountType]);

  const updateTransaction = useCallback(async (transaction: Transaction) => {
    if (!state.user) return;
    try {
      const { error } = await supabase
        .from('poupeja_transactions')
        .update(transaction)
        .eq('id', transaction.id);

      if (error) throw error;

    } catch (err) {
      console.error('Error updating transaction:', err);
      dispatch({ type: 'SET_ERROR', payload: `Erro ao atualizar transação: ${err.message}` });
    }
  }, [state.user]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!state.user) return;
    try {
      const { error } = await supabase
        .from('poupeja_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
    } catch (err) {
      console.error('Error deleting transaction:', err);
      dispatch({ type: 'SET_ERROR', payload: `Erro ao deletar transação: ${err.message}` });
    }
  }, [state.user]);

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'created_at' | 'user_id'>) => {
    if (!state.user) return;
    try {
      const { error } = await supabase
        .from('poupeja_categories')
        .insert({ ...category, user_id: state.user.id });
      
      if (error) throw error;
    } catch (err) {
      console.error('Error adding category:', err);
      dispatch({ type: 'SET_ERROR', payload: `Erro ao adicionar categoria: ${err.message}` });
    }
  }, [state.user]);

  const updateCategory = useCallback(async (category: Category) => {
    if (!state.user) return;
    try {
      const { error } = await supabase
        .from('poupeja_categories')
        .update(category)
        .eq('id', category.id);

      if (error) throw error;

    } catch (err) {
      console.error('Error updating category:', err);
      dispatch({ type: 'SET_ERROR', payload: `Erro ao atualizar categoria: ${err.message}` });
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

    } catch (err) {
      console.error('Error deleting category:', err);
      dispatch({ type: 'SET_ERROR', payload: `Erro ao deletar categoria: ${err.message}` });
    }
  }, [state.user]);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'created_at' | 'user_id'>) => {
    if (!state.user) return;
    try {
      const { error } = await supabase
        .from('poupeja_goals')
        .insert({ ...goal, user_id: state.user.id });
      
      if (error) throw error;
    } catch (err) {
      console.error('Error adding goal:', err);
      dispatch({ type: 'SET_ERROR', payload: `Erro ao adicionar meta: ${err.message}` });
    }
  }, [state.user]);

  const updateGoal = useCallback(async (goal: Goal) => {
    if (!state.user) return;
    try {
      const { error } = await supabase
        .from('poupeja_goals')
        .update(goal)
        .eq('id', goal.id);

      if (error) throw error;

    } catch (err) {
      console.error('Error updating goal:', err);
      dispatch({ type: 'SET_ERROR', payload: `Erro ao atualizar meta: ${err.message}` });
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

    } catch (err) {
      console.error('Error deleting goal:', err);
      dispatch({ type: 'SET_ERROR', payload: `Erro ao deletar meta: ${err.message}` });
    }
  }, [state.user]);

  const addScheduledTransaction = useCallback(async (scheduledTransaction: Omit<ScheduledTransaction, 'id' | 'created_at' | 'user_id'>) => {
    if (!state.user) return;
    try {
      const { error } = await supabase
        .from('poupeja_scheduled_transactions')
        .insert({ ...scheduledTransaction, user_id: state.user.id });
      
      if (error) throw error;
    } catch (err) {
      console.error('Error adding scheduled transaction:', err);
      dispatch({ type: 'SET_ERROR', payload: `Erro ao adicionar transação agendada: ${err.message}` });
    }
  }, [state.user]);

  const updateScheduledTransaction = useCallback(async (scheduledTransaction: ScheduledTransaction) => {
    if (!state.user) return;
    try {
      const { error } = await supabase
        .from('poupeja_scheduled_transactions')
        .update(scheduledTransaction)
        .eq('id', scheduledTransaction.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating scheduled transaction:', err);
      dispatch({ type: 'SET_ERROR', payload: `Erro ao atualizar transação agendada: ${err.message}` });
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
    } catch (err) {
      console.error('Error deleting scheduled transaction:', err);
      dispatch({ type: 'SET_ERROR', payload: `Erro ao deletar transação agendada: ${err.message}` });
    }
  }, [state.user]);

  // Efeito para o listener de autenticação e busca inicial de dados
  useEffect(() => {
    let transactionSubscription: any;
    let categorySubscription: any;
    let goalSubscription: any;
    let scheduledTransactionSubscription: any;

    const setupSubscriptions = async (userId: string) => {
      // Listener de transações em tempo real
      transactionSubscription = supabase
        .channel('public:poupeja_transactions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'poupeja_transactions' },
          (payload) => {
            console.log('Change received!', payload);
            if (payload.new) {
              dispatch({ type: 'SET_TRANSACTIONS', payload: payload.new });
            }
          }
        )
        .subscribe();
      
      // Listener de categorias em tempo real
      categorySubscription = supabase
        .channel('public:poupeja_categories')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'poupeja_categories' },
          (payload) => {
            console.log('Change received!', payload);
            if (payload.new) {
              dispatch({ type: 'SET_CATEGORIES', payload: payload.new });
            }
          }
        )
        .subscribe();
      
      // Listener de metas em tempo real
      goalSubscription = supabase
        .channel('public:poupeja_goals')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'poupeja_goals' },
          (payload) => {
            console.log('Change received!', payload);
            if (payload.new) {
              dispatch({ type: 'SET_GOALS', payload: payload.new });
            }
          }
        )
        .subscribe();

      // Listener de transações agendadas em tempo real
      scheduledTransactionSubscription = supabase
        .channel('public:poupeja_scheduled_transactions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'poupeja_scheduled_transactions' },
          (payload) => {
            console.log('Change received!', payload);
            if (payload.new) {
              dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: payload.new });
            }
          }
        )
        .subscribe();

      // Busca inicial de dados
      const { data: transactions, error: transactionsError } = await supabase.from('poupeja_transactions')
        .select(`
          id, created_at, date, amount, description, type, is_recurring, is_paid,
          category:poupeja_categories(id, name, icon, color, type, parent_id),
          goal_id, account_id, currency, user_id, supplier, due_date, payment_date,
          original_amount, late_interest_amount, payment_status, account_type
        `)
        .eq('user_id', userId)
        .eq('account_type', state.accountType)
        .order('date', { ascending: false });

      if (transactionsError) {
        console.error("Erro ao buscar transações:", transactionsError);
        dispatch({ type: 'SET_ERROR', payload: transactionsError.message });
      } else {
        dispatch({ type: 'SET_TRANSACTIONS', payload: transactions || [] });
      }
      
      const { data: categories, error: categoriesError } = await supabase.from('poupeja_categories')
        .select('*')
        .or(`user_id.eq.${userId},is_default.eq.true`);

      if (categoriesError) {
        console.error("Erro ao buscar categorias:", categoriesError);
        dispatch({ type: 'SET_ERROR', payload: categoriesError.message });
      } else {
        dispatch({ type: 'SET_CATEGORIES', payload: categories || [] });
      }

      const { data: goals, error: goalsError } = await supabase.from('poupeja_goals')
        .select('*')
        .eq('user_id', userId);

      if (goalsError) {
        console.error("Erro ao buscar metas:", goalsError);
        dispatch({ type: 'SET_ERROR', payload: goalsError.message });
      } else {
        dispatch({ type: 'SET_GOALS', payload: (goals || []).map(transformGoal) });
      }

      const { data: scheduledTransactions, error: scheduledTransactionsError } = await supabase.from('poupeja_scheduled_transactions')
        .select('*')
        .eq('user_id', userId);

      if (scheduledTransactionsError) {
        console.error("Erro ao buscar transações agendadas:", scheduledTransactionsError);
        dispatch({ type: 'SET_ERROR', payload: scheduledTransactionsError.message });
      } else {
        dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: scheduledTransactions || [] });
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    };

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        dispatch({ type: 'SET_SESSION', payload: session });
        if (session) {
          dispatch({ type: 'SET_USER', payload: session.user });
          setupSubscriptions(session.user.id);
        } else {
          dispatch({ type: 'SET_USER', payload: null });
          // Cleanup subscriptions on logout
          if (transactionSubscription) supabase.removeChannel(transactionSubscription);
          if (categorySubscription) supabase.removeChannel(categorySubscription);
          if (goalSubscription) supabase.removeChannel(goalSubscription);
          if (scheduledTransactionSubscription) supabase.removeChannel(scheduledTransactionSubscription);
          
          dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
          dispatch({ type: 'SET_CATEGORIES', payload: [] });
          dispatch({ type: 'SET_GOALS', payload: [] });
          dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    );

    return () => {
      authSubscription.unsubscribe();
      if (transactionSubscription) supabase.removeChannel(transactionSubscription);
      if (categorySubscription) supabase.removeChannel(categorySubscription);
      if (goalSubscription) supabase.removeChannel(goalSubscription);
      if (scheduledTransactionSubscription) supabase.removeChannel(scheduledTransactionSubscription);
    };
  }, [state.accountType]);

  const value = useMemo(() => ({
    ...state,
    dispatch,
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
    setAccountType,
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

export { useApp, AppProvider };

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useState,
  useMemo,
  useCallback,
  useRef
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, Goal, ScheduledTransaction, User, TimeRange } from '@/types';
import { setupAuthListener } from '@/services/authService';
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
  // Ações básicas
  dispatch: React.Dispatch<AppAction>;
  toggleHideValues: () => void;
  logout: () => void;
  setCustomDateRange: (startDate: string, endDate: string) => void;
  setTimeRange: (timeRange: TimeRange) => void;
  // Funções CRUD - Otimizadas para usar listeners
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addScheduledTransaction: (scheduledTransaction: Omit<ScheduledTransaction, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateScheduledTransaction: (scheduledTransaction: ScheduledTransaction) => Promise<void>;
  deleteScheduledTransaction: (scheduledTransactionId: string) => Promise<void>;
}

// ===================================================
// ESTADO INICIAL E REDUCER
// ===================================================

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
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SESSION'; payload: any | null }
  | { type: 'TOGGLE_HIDE_VALUES' }
  | { type: 'SET_TIME_RANGE'; payload: TimeRange }
  | { type: 'SET_CUSTOM_DATE_RANGE'; payload: { startDate: string; endDate: string } }
  | { type: 'SET_FILTERED_TRANSACTIONS'; payload: Transaction[] };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload),
      };
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? action.payload : g
        ),
      };
    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
      };
    case 'SET_SCHEDULED_TRANSACTIONS':
      return { ...state, scheduledTransactions: action.payload };
    case 'ADD_SCHEDULED_TRANSACTION':
      return { ...state, scheduledTransactions: [...state.scheduledTransactions, action.payload] };
    case 'UPDATE_SCHEDULED_TRANSACTION':
      return {
        ...state,
        scheduledTransactions: state.scheduledTransactions.map((st) =>
          st.id === action.payload.id ? action.payload : st
        ),
      };
    case 'DELETE_SCHEDULED_TRANSACTION':
      return {
        ...state,
        scheduledTransactions: state.scheduledTransactions.filter((st) => st.id !== action.payload),
      };
    case 'SET_LOADING':
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
      return { ...state, customStartDate: action.payload.startDate, customEndDate: action.payload.endDate };
    case 'SET_FILTERED_TRANSACTIONS':
      return { ...state, filteredTransactions: action.payload };
    default:
      return state;
  }
};

// ===================================================
// PROVIDER E LÓGICA DO CONTEXTO
// ===================================================

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helpers para transformar dados do Supabase
const transformTransaction = (data: any): Transaction => ({
  ...data,
  amount: parseFloat(data.amount),
  created_at: new Date(data.created_at),
  date: new Date(data.date),
});

const transformGoal = (data: any): Goal => ({
  ...data,
  current_amount: parseFloat(data.current_amount),
  target_amount: parseFloat(data.target_amount),
  created_at: new Date(data.created_at),
  target_date: new Date(data.target_date),
});

const transformScheduledTransaction = (data: any): ScheduledTransaction => ({
  ...data,
  amount: parseFloat(data.amount),
  created_at: new Date(data.created_at),
  next_occurrence_date: new Date(data.next_occurrence_date),
});

const transformCategory = (data: any): Category => ({
  ...data,
  created_at: new Date(data.created_at),
});


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // ===================================================
  // FUNÇÕES DE BUSCA DE DADOS COM useCallback
  // ===================================================
  // Estas funções buscam os dados mais recentes do Supabase.
  // Elas são otimizadas com useCallback para evitar re-renderizações desnecessárias.
  const getTransactions = useCallback(async (): Promise<void> => {
    if (!state.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_transactions')
        .select('*')
        .eq('user_id', state.user!.id)
        .order('date', { ascending: false });
      if (error) throw error;
      const transactions = (data || []).map(transformTransaction);
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao buscar transações' });
    }
  }, [state.user]);

  const getCategories = useCallback(async (): Promise<void> => {
    if (!state.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .select('*')
        .or(`user_id.eq.${state.user!.id},is_default.eq.true`)
        .order('name', { ascending: true });
      if (error) throw error;
      const transformedCategories = (data || []).map(transformCategory);
      dispatch({ type: 'SET_CATEGORIES', payload: transformedCategories });
    } catch (err) {
      console.error("Erro inesperado ao buscar categorias:", err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro inesperado ao buscar categorias.' });
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
    }
  }, [state.user]);
  
  const getGoals = useCallback(async (): Promise<void> => {
    if (!state.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_goals')
        .select('*')
        .eq('user_id', state.user!.id);
      if (error) throw error;
      const goals = (data || []).map(transformGoal);
      dispatch({ type: 'SET_GOALS', payload: goals });
    } catch (error) {
      console.error('Error fetching goals:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao buscar metas' });
      dispatch({ type: 'SET_GOALS', payload: [] });
    }
  }, [state.user]);

  const getScheduledTransactions = useCallback(async (): Promise<void> => {
    if (!state.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_scheduled_transactions')
        .select('*')
        .eq('user_id', state.user!.id);
      if (error) throw error;
      const scheduledTransactions = (data || []).map(transformScheduledTransaction);
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: scheduledTransactions });
    } catch (error) {
      console.error('Error fetching scheduled transactions:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao buscar transações agendadas' });
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
    }
  }, [state.user]);


  // ===================================================
  // LÓGICA DE AUTENTICAÇÃO E INICIALIZAÇÃO DE DADOS
  // ===================================================
  // Este useEffect escuta a autenticação e gerencia o estado inicial.
  useEffect(() => {
    // Escuta as mudanças de autenticação
    const { data: { subscription } } = setupAuthListener((session) => {
      dispatch({ type: 'SET_SESSION', payload: session });
      dispatch({ type: 'SET_USER', payload: session ? session.user : null });
    });

    // Função de limpeza para desinscrever o listener de auth.
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // ===================================================
  // LÓGICA DE LISTENERS EM TEMPO REAL E BUSCA INICIAL
  // ===================================================
  // Este useEffect é executado APENAS quando o usuário é autenticado.
  useEffect(() => {
    let channels: RealtimeChannel[] = [];
    
    const initializeDataAndListeners = async () => {
      if (state.user) {
        console.log('User authenticated, fetching initial data and setting up listeners...');
        dispatch({ type: 'SET_LOADING', payload: true });

        // Fetch de todos os dados iniciais
        await Promise.all([
          getTransactions(),
          getCategories(),
          getGoals(),
          getScheduledTransactions()
        ]).then(() => {
          dispatch({ type: 'SET_LOADING', payload: false });
        }).catch(err => {
          console.error('Error fetching initial data:', err);
          dispatch({ type: 'SET_LOADING', payload: false });
          dispatch({ type: 'SET_ERROR', payload: 'Erro ao buscar dados iniciais.' });
        });
        
        // Setup real-time listeners only AFTER initial data is fetched
        const userId = state.user.id;
        
        // Listener de Transações
        const transactionsChannel = supabase
          .channel('poupeja_transactions')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'poupeja_transactions', filter: `user_id=eq.${userId}` }, () => {
            getTransactions();
          })
          .subscribe();
        channels.push(transactionsChannel);

        // Listener de Categorias
        const categoriesChannel = supabase
          .channel('poupeja_categories')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'poupeja_categories', filter: `user_id=eq.${userId}` }, () => {
            getCategories();
          })
          .subscribe();
        channels.push(categoriesChannel);
        
        // Listener de Metas
        const goalsChannel = supabase
          .channel('poupeja_goals')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'poupeja_goals', filter: `user_id=eq.${userId}` }, () => {
            getGoals();
          })
          .subscribe();
        channels.push(goalsChannel);

        // Listener de Transações Agendadas
        const scheduledTransactionsChannel = supabase
          .channel('poupeja_scheduled_transactions')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'poupeja_scheduled_transactions', filter: `user_id=eq.${userId}` }, () => {
            getScheduledTransactions();
          })
          .subscribe();
        channels.push(scheduledTransactionsChannel);
        
        // Recalcular as metas após o fetch inicial
        recalculateGoalAmountsService(state.goals, state.transactions, dispatch);
      } else {
        // Se o usuário não está logado, limpa todos os dados
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
        dispatch({ type: 'SET_CATEGORIES', payload: [] });
        dispatch({ type: 'SET_GOALS', payload: [] });
        dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
      }
    };
    
    initializeDataAndListeners();

    // Função de limpeza: desinscreve de todos os listeners quando o componente é desmontado
    // ou quando o state.user muda (ou seja, quando o usuário faz logout).
    return () => {
      console.log('Cleaning up real-time listeners...');
      channels.forEach(channel => {
        if (channel) {
          channel.unsubscribe();
        }
      });
    };
  }, [state.user]); // Este useEffect é re-executado apenas quando o usuário loga ou desloga


  // ===================================================
  // OUTRAS FUNÇÕES DE AÇÃO (CRUD)
  // ===================================================

  // Funções CRUD agora apenas disparam a requisição,
  // e o listener de tempo real irá atualizar o estado.
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => {
    if (!state.user) return;
    try {
      await supabase.from('poupeja_transactions').insert({ ...transaction, user_id: state.user.id });
    } catch (error) {
      console.error('Error adding transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar transação' });
    }
  }, [state.user]);

  const updateTransaction = useCallback(async (transaction: Transaction) => {
    if (!state.user) return;
    try {
      await supabase.from('poupeja_transactions').update(transaction).eq('id', transaction.id);
    } catch (error) {
      console.error('Error updating transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar transação' });
    }
  }, [state.user]);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    if (!state.user) return;
    try {
      await supabase.from('poupeja_transactions').delete().eq('id', transactionId);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar transação' });
    }
  }, [state.user]);

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'created_at' | 'user_id'>) => {
    if (!state.user) return;
    try {
      await supabase.from('poupeja_categories').insert({ ...category, user_id: state.user.id });
    } catch (error) {
      console.error('Error adding category:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar categoria' });
    }
  }, [state.user]);

  const updateCategory = useCallback(async (category: Category) => {
    if (!state.user) return;
    try {
      await supabase.from('poupeja_categories').update(category).eq('id', category.id);
    } catch (error) {
      console.error('Error updating category:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar categoria' });
    }
  }, [state.user]);

  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!state.user) return;
    try {
      await supabase.from('poupeja_categories').delete().eq('id', categoryId);
    } catch (error) {
      console.error('Error deleting category:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar categoria' });
    }
  }, [state.user]);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'created_at' | 'user_id'>) => {
    if (!state.user) return;
    try {
      await supabase.from('poupeja_goals').insert({ ...goal, user_id: state.user.id });
    } catch (error) {
      console.error('Error adding goal:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar meta' });
    }
  }, [state.user]);

  const updateGoal = useCallback(async (goal: Goal) => {
    if (!state.user) return;
    try {
      await supabase.from('poupeja_goals').update(goal).eq('id', goal.id);
    } catch (error) {
      console.error('Error updating goal:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar meta' });
    }
  }, [state.user]);

  const deleteGoal = useCallback(async (goalId: string) => {
    if (!state.user) return;
    try {
      await supabase.from('poupeja_goals').delete().eq('id', goalId);
    } catch (error) {
      console.error('Error deleting goal:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar meta' });
    }
  }, [state.user]);

  const addScheduledTransaction = useCallback(async (scheduledTransaction: Omit<ScheduledTransaction, 'id' | 'created_at' | 'user_id'>) => {
    if (!state.user) return;
    try {
      await supabase.from('poupeja_scheduled_transactions').insert({ ...scheduledTransaction, user_id: state.user.id });
    } catch (error) {
      console.error('Error adding scheduled transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar transação agendada' });
    }
  }, [state.user]);

  const updateScheduledTransaction = useCallback(async (scheduledTransaction: ScheduledTransaction) => {
    if (!state.user) return;
    try {
      await supabase.from('poupeja_scheduled_transactions').update(scheduledTransaction).eq('id', scheduledTransaction.id);
    } catch (error) {
      console.error('Error updating scheduled transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar transação agendada' });
    }
  }, [state.user]);

  const deleteScheduledTransaction = useCallback(async (scheduledTransactionId: string) => {
    if (!state.user) return;
    try {
      await supabase.from('poupeja_scheduled_transactions').delete().eq('id', scheduledTransactionId);
    } catch (error) {
      console.error('Error deleting scheduled transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar transação agendada' });
    }
  }, [state.user]);

  // ===================================================
  // LÓGICA DE FILTRAGEM
  // ===================================================

  const filterTransactions = useCallback(() => {
    const { transactions, timeRange, customStartDate, customEndDate } = state;
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (timeRange) {
      case 'last_30_days':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        endDate = now;
        break;
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'current_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'custom_range':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
          endDate = now;
        }
        break;
      case 'all_time':
      default:
        startDate = new Date('1970-01-01');
        endDate = new Date();
        break;
    }

    const filtered = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      return transactionDate >= startDate && transactionDate <= endDate;
    });

    dispatch({ type: 'SET_FILTERED_TRANSACTIONS', payload: filtered });
  }, [state.transactions, state.timeRange, state.customStartDate, state.customEndDate]);

  useEffect(() => {
    filterTransactions();
  }, [filterTransactions]);

  const toggleHideValues = useCallback(() => {
    dispatch({ type: 'TOGGLE_HIDE_VALUES' });
  }, []);

  const logout = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error logging out:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao fazer logout' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const setTimeRange = useCallback((timeRange: TimeRange) => {
    dispatch({ type: 'SET_TIME_RANGE', payload: timeRange });
  }, []);

  const setCustomDateRange = useCallback((startDate: string, endDate: string) => {
    dispatch({ type: 'SET_CUSTOM_DATE_RANGE', payload: { startDate, endDate } });
  }, []);


  const value = useMemo(() => ({
    ...state,
    dispatch,
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
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

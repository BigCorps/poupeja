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
import { getCurrentUser } from '@/services/authService'; // Importa a função de autenticação
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
  // Ações de fetch
  getTransactions: () => Promise<Transaction[]>;
  getCategories: () => Promise<void>;
  getGoals: () => Promise<Goal[]>;
  getScheduledTransactions: () => Promise<void>;
  // Ações de transação
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  // Ações de categoria
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  // Ações de meta
  addGoal: (goal: Omit<Goal, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  // Ações de transação agendada
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
  const listenersRef = useRef<RealtimeChannel[]>([]);

  // ===================================================
  // LÓGICA DE AUTENTICAÇÃO E INICIALIZAÇÃO
  // ===================================================

  useEffect(() => {
    // Escutando mudanças na autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        dispatch({ type: 'SET_SESSION', payload: session });
        if (session) {
          dispatch({ type: 'SET_USER', payload: session.user });
        } else {
          dispatch({ type: 'SET_USER', payload: null });
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    );

    // Tentando pegar a sessão atual na montagem
    getCurrentUser()
      .then((user) => {
        if (user) {
          dispatch({ type: 'SET_USER', payload: user });
        }
      })
      .finally(() => {
        dispatch({ type: 'SET_LOADING', payload: false });
      });

    // Função de limpeza para o listener de autenticação
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // ===================================================
  // LÓGICA DOS LISTENERS EM TEMPO REAL
  // ===================================================

  useEffect(() => {
    if (state.user?.id) {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Limpa listeners antigos antes de criar novos
      listenersRef.current.forEach(listener => {
        if (listener) {
          console.log(`AppContext: Unsubscribing from a listener...`);
          listener.unsubscribe();
        }
      });
      listenersRef.current = []; // Zera a lista

      console.log('AppContext: Setting up new real-time listeners...');

      const setupListeners = async () => {
        const userId = state.user.id;

        // Listener de Transações
        const transactionsListener = supabase
          .channel('public:poupeja_transactions')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'poupeja_transactions', filter: `user_id=eq.${userId}` }, (payload: any) => {
            console.log('AppContext: Transaction change received!', payload);
            getTransactions();
          })
          .subscribe();
        listenersRef.current.push(transactionsListener);
      
        // Listener de Categorias
        const categoriesListener = supabase
          .channel('public:poupeja_categories')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'poupeja_categories', filter: `user_id=eq.${userId}` }, (payload: any) => {
            console.log('AppContext: Category change received!', payload);
            getCategories();
          })
          .subscribe();
        listenersRef.current.push(categoriesListener);

        // Listener de Metas
        const goalsListener = supabase
          .channel('public:poupeja_goals')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'poupeja_goals', filter: `user_id=eq.${userId}` }, (payload: any) => {
            console.log('AppContext: Goal change received!', payload);
            getGoals();
          })
          .subscribe();
        listenersRef.current.push(goalsListener);

        // Listener de Transações Agendadas
        const scheduledTransactionsListener = supabase
          .channel('public:poupeja_scheduled_transactions')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'poupeja_scheduled_transactions', filter: `user_id=eq.${userId}` }, (payload: any) => {
            console.log('AppContext: Scheduled Transaction change received!', payload);
            getScheduledTransactions();
          })
          .subscribe();
        listenersRef.current.push(scheduledTransactionsListener);
      };
      
      setupListeners();
      
      // Função de limpeza do useEffect para desinscrever de todos os listeners
      return () => {
        listenersRef.current.forEach(listener => {
          console.log('AppContext: Unsubscribing from listener on cleanup.');
          listener.unsubscribe();
        });
        listenersRef.current = [];
      };
    } else {
      // Se não houver usuário, limpa todos os dados
      dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
      dispatch({ type: 'SET_GOALS', payload: [] });
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
    }
  }, [state.user?.id]); // Re-executa o efeito quando o usuário loga ou desloga
  

  // Efeito para buscar dados iniciais e recalcular metas
  useEffect(() => {
    if (state.user?.id) {
      dispatch({ type: 'SET_LOADING', payload: true });
      Promise.all([
        getTransactions(),
        getCategories(),
        getGoals(),
        getScheduledTransactions()
      ]).then(() => {
        dispatch({ type: 'SET_LOADING', payload: false });
        recalculateGoalAmountsService(state.goals, state.transactions, state.dispatch);
      }).catch(err => {
        console.error('Error fetching initial data:', err);
        dispatch({ type: 'SET_LOADING', payload: false });
      });
    }
  }, [state.user?.id]);


  // ===================================================
  // FUNÇÕES DE AÇÃO (CRUD)
  // ===================================================

  const getTransactions = useCallback(async (): Promise<Transaction[]> => {
    try {
      console.log('AppContext: Fetching transactions...');
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('poupeja_transactions')
        .select('*')
        .eq('user_id', user.id)
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
  }, []);

  const getCategories = useCallback(async (): Promise<void> => {
    try {
      console.log('AppContext: Fetching categories...');
      const user = await getCurrentUser();
      if (!user) {
        console.log('AppContext: No user found, skipping category fetch.');
        dispatch({ type: 'SET_CATEGORIES', payload: [] });
        return;
      }
  
      const { data, error } = await supabase
        .from('poupeja_categories')
        .select('*')
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .order('name', { ascending: true });
  
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
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('poupeja_scheduled_transactions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const scheduledTransactions = (data || []).map(transformScheduledTransaction);
      console.log('AppContext: Scheduled transactions fetched successfully:', scheduledTransactions.length);
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: scheduledTransactions });
    } catch (error) {
      console.error('Error fetching scheduled transactions:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao buscar transações agendadas' });
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
      throw error;
    }
  }, []);
  
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('poupeja_transactions')
        .insert({ ...transaction, user_id: user.id })
        .select();

      if (error) throw error;

      console.log('AppContext: Transaction added successfully:', data[0]);
      dispatch({ type: 'ADD_TRANSACTION', payload: transformTransaction(data[0]) });
    } catch (error) {
      console.error('Error adding transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao adicionar transação' });
    }
  }, []);

  const updateTransaction = useCallback(async (transaction: Transaction) => {
    try {
      const { data, error } = await supabase
        .from('poupeja_transactions')
        .update({ ...transaction, updated_at: new Date() })
        .eq('id', transaction.id)
        .select();

      if (error) throw error;

      console.log('AppContext: Transaction updated successfully:', data[0]);
      dispatch({ type: 'UPDATE_TRANSACTION', payload: transformTransaction(data[0]) });
    } catch (error) {
      console.error('Error updating transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao atualizar transação' });
    }
  }, []);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('poupeja_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      console.log('AppContext: Transaction deleted successfully:', transactionId);
      dispatch({ type: 'DELETE_TRANSACTION', payload: transactionId });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao deletar transação' });
    }
  }, []);

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('poupeja_categories')
        .insert({ ...category, user_id: user.id })
        .select();
  
      if (error) throw error;
  
      console.log('AppContext: Category added successfully:', data[0]);
      dispatch({ type: 'ADD_CATEGORY', payload: transformCategory(data[0]) });
    } catch (error) {
      console.error('Error adding category:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao adicionar categoria' });
    }
  }, []);
  
  const updateCategory = useCallback(async (category: Category) => {
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .update(category)
        .eq('id', category.id)
        .select();
  
      if (error) throw error;
  
      console.log('AppContext: Category updated successfully:', data[0]);
      dispatch({ type: 'UPDATE_CATEGORY', payload: transformCategory(data[0]) });
    } catch (error) {
      console.error('Error updating category:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao atualizar categoria' });
    }
  }, []);
  
  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('poupeja_categories')
        .delete()
        .eq('id', categoryId);
  
      if (error) throw error;
  
      console.log('AppContext: Category deleted successfully:', categoryId);
      dispatch({ type: 'DELETE_CATEGORY', payload: categoryId });
    } catch (error) {
      console.error('Error deleting category:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao deletar categoria' });
    }
  }, []);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('poupeja_goals')
        .insert({ ...goal, user_id: user.id })
        .select();

      if (error) throw error;

      console.log('AppContext: Goal added successfully:', data[0]);
      dispatch({ type: 'ADD_GOAL', payload: transformGoal(data[0]) });
    } catch (error) {
      console.error('Error adding goal:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao adicionar meta' });
    }
  }, []);
  
  const updateGoal = useCallback(async (goal: Goal) => {
    try {
      const { data, error } = await supabase
        .from('poupeja_goals')
        .update({ ...goal, updated_at: new Date() })
        .eq('id', goal.id)
        .select();

      if (error) throw error;

      console.log('AppContext: Goal updated successfully:', data[0]);
      dispatch({ type: 'UPDATE_GOAL', payload: transformGoal(data[0]) });
    } catch (error) {
      console.error('Error updating goal:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao atualizar meta' });
    }
  }, []);

  const deleteGoal = useCallback(async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('poupeja_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      console.log('AppContext: Goal deleted successfully:', goalId);
      dispatch({ type: 'DELETE_GOAL', payload: goalId });
    } catch (error) {
      console.error('Error deleting goal:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao deletar meta' });
    }
  }, []);

  const addScheduledTransaction = useCallback(async (scheduledTransaction: Omit<ScheduledTransaction, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from('poupeja_scheduled_transactions')
        .insert({ ...scheduledTransaction, user_id: user.id })
        .select();

      if (error) throw error;

      console.log('AppContext: Scheduled transaction added successfully:', data[0]);
      dispatch({ type: 'ADD_SCHEDULED_TRANSACTION', payload: transformScheduledTransaction(data[0]) });
    } catch (error) {
      console.error('Error adding scheduled transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao adicionar transação agendada' });
    }
  }, []);

  const updateScheduledTransaction = useCallback(async (scheduledTransaction: ScheduledTransaction) => {
    try {
      const { data, error } = await supabase
        .from('poupeja_scheduled_transactions')
        .update({ ...scheduledTransaction, updated_at: new Date() })
        .eq('id', scheduledTransaction.id)
        .select();

      if (error) throw error;

      console.log('AppContext: Scheduled transaction updated successfully:', data[0]);
      dispatch({ type: 'UPDATE_SCHEDULED_TRANSACTION', payload: transformScheduledTransaction(data[0]) });
    } catch (error) {
      console.error('Error updating scheduled transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao atualizar transação agendada' });
    }
  }, []);

  const deleteScheduledTransaction = useCallback(async (scheduledTransactionId: string) => {
    try {
      const { error } = await supabase
        .from('poupeja_scheduled_transactions')
        .delete()
        .eq('id', scheduledTransactionId);

      if (error) throw error;

      console.log('AppContext: Scheduled transaction deleted successfully:', scheduledTransactionId);
      dispatch({ type: 'DELETE_SCHEDULED_TRANSACTION', payload: scheduledTransactionId });
    } catch (error) {
      console.error('Error deleting scheduled transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao deletar transação agendada' });
    }
  }, []);
  
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
          // Fallback para último mês se o range customizado não estiver definido
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
      // Remove a parte do tempo para comparação exata de data
      transactionDate.setHours(0, 0, 0, 0);

      // Garante que as datas de início e fim também sejam comparadas sem tempo
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      return transactionDate >= startDate && transactionDate <= endDate;
    });

    dispatch({ type: 'SET_FILTERED_TRANSACTIONS', payload: filtered });
  }, [state.transactions, state.timeRange, state.customStartDate, state.customEndDate]);

  // Efeito para recalcular as transações filtradas sempre que o estado necessário muda
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
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Error logging out:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao fazer logout' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const setTimeRange = useCallback((timeRange: TimeRange) => {
    dispatch({ type: 'SET_TIME_RANGE', payload: timeRange });
  }, []);

  const setCustomDateRange = useCallback((startDate: string, endDate: string) => {
    dispatch({ type: 'SET_CUSTOM_DATE_RANGE', payload: { startDate, endDate } });
  }, []);

  // Memóiza o valor do contexto para evitar re-renderizações desnecessárias
  const value = useMemo(() => ({
    ...state,
    // Ações básicas
    dispatch,
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
    // Ações de fetch
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

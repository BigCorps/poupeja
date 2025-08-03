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
  type: 'income' | 'expense';
  color: string;
  icon: string | null;
  is_default: boolean | null;
}

// 🎯 Nova interface para os bancos conectados
interface ConnectedBank {
  id: string;
  created_at: string;
  user_id: string;
  bank_name: string;
  access_token: string;
  token_expires_at: string;
}

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  scheduledTransactions: ScheduledTransaction[];
  // 🎯 Adicionando o novo estado para os bancos conectados
  connectedBanks: ConnectedBank[];
  isLoading: boolean;
  error: string | null;
  user: User | null;
  session: any | null; // ✅ Adicionado para armazenar a sessão do Supabase
  hideValues: boolean;
  timeRange: TimeRange;
  customStartDate: string | null;
  customEndDate: string | null;
  filteredTransactions: Transaction[];
}

interface AppContextType extends AppState {
  // Ações básicas
  dispatch: React.Dispatch<AppAction>;
  fetchUserData: () => void;
  toggleHideValues: () => void;
  logout: () => Promise<void>;
  setCustomDateRange: (start: Date | null, end: Date | null) => void;
  setTimeRange: (range: string) => void;
  // Data fetching methods
  getTransactions: () => Promise<Transaction[]>;
  getGoals: () => Promise<Goal[]>;
  // 🎯 Adicionando métodos para a API de Bancos
  getConnectedBanks: () => Promise<ConnectedBank[]>;
  addConnectedBank: (bank: Omit<ConnectedBank, 'id' | 'created_at'>) => Promise<void>;
  updateConnectedBank: (id: string, bank: Partial<ConnectedBank>) => Promise<void>;
  deleteConnectedBank: (id: string) => Promise<void>;
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
  // 🎯 Nova ação para definir os bancos conectados
  | { type: 'SET_CONNECTED_BANKS'; payload: ConnectedBank[] }
  | { type: 'SET_SESSION'; payload: any | null } // ✅ Adicionada nova ação
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
  // 🎯 Novas ações para os bancos conectados
  | { type: 'ADD_CONNECTED_BANK'; payload: ConnectedBank }
  | { type: 'UPDATE_CONNECTED_BANK'; payload: ConnectedBank }
  | { type: 'DELETE_CONNECTED_BANK'; payload: string };

// ===================================================
// ESTADO INICIAL E REDUCER
// ===================================================

const initialAppState: AppState = {
  transactions: [],
  categories: [],
  goals: [],
  scheduledTransactions: [],
  // 🎯 Inicializando o novo estado
  connectedBanks: [],
  isLoading: true,
  error: null,
  user: null,
  session: null, // ✅ Inicializamos a sessão como nula
  hideValues: false,
  timeRange: 'last30days',
  customStartDate: null,
  customEndDate: null,
  filteredTransactions: [],
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_SESSION': // ✅ Tratamos a nova ação para a sessão
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
    // 🎯 Novas ações do reducer para os bancos conectados
    case 'SET_CONNECTED_BANKS':
      return { ...state, connectedBanks: action.payload };
    case 'ADD_CONNECTED_BANK':
      return { ...state, connectedBanks: [...state.connectedBanks, action.payload] };
    case 'UPDATE_CONNECTED_BANK':
      return {
        ...state,
        connectedBanks: state.connectedBanks.map(bank =>
          bank.id === action.payload.id ? action.payload : bank
        ),
      };
    case 'DELETE_CONNECTED_BANK':
      return {
        ...state,
        connectedBanks: state.connectedBanks.filter(bank => bank.id !== action.payload),
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
      category_id: dbTransaction.category_id,
      goal_id: dbTransaction.goal_id,
      user_id: dbTransaction.user_id,
      created_at: dbTransaction.created_at,
    };
  };
  const transformCategory = (dbCategory: any): Category => ({
    ...dbCategory,
    type: dbCategory.type as 'income' | 'expense',
  });
  const transformGoal = (dbGoal: any): Goal => ({
    id: dbGoal.id,
    name: dbGoal.name,
    targetAmount: dbGoal.target_amount,
    currentAmount: dbGoal.current_amount || 0,
    startDate: dbGoal.start_date,
    endDate: dbGoal.end_date,
    deadline: dbGoal.end_date,
    color: dbGoal.color || '#3B82F6',
    transactions: [], // Preenchido no componente de metas
    target_amount: dbGoal.target_amount,
    current_amount: dbGoal.current_amount,
    start_date: dbGoal.start_date,
    end_date: dbGoal.end_date,
    user_id: dbGoal.user_id,
    created_at: dbGoal.created_at,
    updated_at: dbGoal.updated_at,
  });
  const transformScheduledTransaction = (dbScheduledTransaction: any): ScheduledTransaction => {
    const categoryName = dbScheduledTransaction.category?.name || 'Outros';
    const categoryIcon = dbScheduledTransaction.category?.icon || 'DollarSign';
    const categoryColor = dbScheduledTransaction.category?.color || '#6B7280';
    return {
      id: dbScheduledTransaction.id,
      type: dbScheduledTransaction.type as 'income' | 'expense',
      amount: dbScheduledTransaction.amount,
      category: categoryName,
      categoryIcon: categoryIcon,
      categoryColor: categoryColor,
      description: dbScheduledTransaction.description || '',
      scheduledDate: dbScheduledTransaction.scheduled_date,
      recurrence: dbScheduledTransaction.recurrence as 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly',
      goalId: dbScheduledTransaction.goal_id,
      status: dbScheduledTransaction.status as 'pending' | 'completed' | 'skipped',
      user_id: dbScheduledTransaction.user_id,
      created_at: dbScheduledTransaction.created_at,
      category_id: dbScheduledTransaction.category_id,
    };
  };
  
  // ===================================================
  // FUNÇÕES DE BUSCA DE DADOS (DATABASE)
  // ===================================================

  const getTransactions = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(name, icon, color)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      const transactions = data.map(transformTransaction);
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao carregar transações.' });
      return [];
    }
  }, []);

  const getGoals = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const goals = data.map(transformGoal);
      dispatch({ type: 'SET_GOALS', payload: goals });
      return goals;
    } catch (error) {
      console.error('Error fetching goals:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao carregar metas.' });
      return [];
    }
  }, []);
  
  // 🎯 Nova função para buscar bancos conectados
  const getConnectedBanks = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }
  
    try {
      const { data, error } = await supabase
        .from('connected_banks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
  
      if (error) throw error;
      dispatch({ type: 'SET_CONNECTED_BANKS', payload: data as ConnectedBank[] });
      return data as ConnectedBank[];
    } catch (error) {
      console.error('Error fetching connected banks:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao carregar bancos conectados.' });
      return [];
    }
  }, []);

  const getCategories = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      const categories = data.map(transformCategory);
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao carregar categorias.' });
      return [];
    }
  }, []);

  const getScheduledTransactions = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('scheduled_transactions')
        .select(`
          *,
          category:categories(name, icon, color)
        `)
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true });
        
      if (error) throw error;
      const scheduledTransactions = data.map(transformScheduledTransaction);
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: scheduledTransactions });
      return scheduledTransactions;
    } catch (error) {
      console.error('Error fetching scheduled transactions:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao carregar agendamentos.' });
      return [];
    }
  }, []);

  // ===================================================
  // FUNÇÕES DE AÇÃO (DATABASE)
  // ===================================================

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    const user = await getCurrentUser();
    if (!user) {
      dispatch({ type: 'SET_ERROR', payload: 'Usuário não autenticado.' });
      return;
    }
    const newTransaction = {
      ...transaction,
      user_id: user.id,
      category_id: transaction.category_id,
      goal_id: transaction.goalId,
    };
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(newTransaction)
        .select(`
          *,
          category:categories(name, icon, color)
        `);

      if (error) throw error;
      dispatch({ type: 'ADD_TRANSACTION', payload: transformTransaction(data[0]) });
    } catch (error) {
      console.error('Error adding transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao adicionar transação.' });
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, transaction: Partial<Transaction>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          ...transaction,
          category_id: transaction.category_id,
          goal_id: transaction.goalId,
        })
        .eq('id', id)
        .select(`
          *,
          category:categories(name, icon, color)
        `);
      
      if (error) throw error;
      dispatch({ type: 'UPDATE_TRANSACTION', payload: transformTransaction(data[0]) });
    } catch (error) {
      console.error('Error updating transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao atualizar transação.' });
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao deletar transação.' });
    }
  }, []);

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'created_at'>) => {
    const user = await getCurrentUser();
    if (!user) {
      dispatch({ type: 'SET_ERROR', payload: 'Usuário não autenticado.' });
      return;
    }
    const newCategory = { ...category, user_id: user.id };
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(newCategory)
        .select();

      if (error) throw error;
      dispatch({ type: 'ADD_CATEGORY', payload: data[0] });
    } catch (error) {
      console.error('Error adding category:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao adicionar categoria.' });
    }
  }, []);

  const updateCategory = useCallback(async (id: string, category: Partial<Category>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id)
        .select();

      if (error) throw error;
      dispatch({ type: 'UPDATE_CATEGORY', payload: data[0] });
    } catch (error) {
      console.error('Error updating category:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao atualizar categoria.' });
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
    } catch (error) {
      console.error('Error deleting category:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao deletar categoria.' });
    }
  }, []);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => {
    const user = await getCurrentUser();
    if (!user) {
      dispatch({ type: 'SET_ERROR', payload: 'Usuário não autenticado.' });
      return;
    }
    const newGoal = {
      ...goal,
      user_id: user.id,
      target_amount: goal.targetAmount,
      start_date: goal.startDate,
      end_date: goal.endDate,
    };
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert(newGoal)
        .select();
      
      if (error) throw error;
      dispatch({ type: 'ADD_GOAL', payload: transformGoal(data[0]) });
    } catch (error) {
      console.error('Error adding goal:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao adicionar meta.' });
    }
  }, []);

  const updateGoal = useCallback(async (id: string, goal: Partial<Goal>) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .update({
          name: goal.name,
          target_amount: goal.targetAmount,
          start_date: goal.startDate,
          end_date: goal.endDate,
          deadline: goal.deadline,
          color: goal.color,
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      dispatch({ type: 'UPDATE_GOAL', payload: transformGoal(data[0]) });
    } catch (error) {
      console.error('Error updating goal:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao atualizar meta.' });
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      dispatch({ type: 'DELETE_GOAL', payload: id });
    } catch (error) {
      console.error('Error deleting goal:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao deletar meta.' });
    }
  }, []);

  const addScheduledTransaction = useCallback(async (transaction: Omit<ScheduledTransaction, 'id' | 'created_at'>) => {
    const user = await getCurrentUser();
    if (!user) {
      dispatch({ type: 'SET_ERROR', payload: 'Usuário não autenticado.' });
      return;
    }
    const newScheduledTransaction = {
      ...transaction,
      user_id: user.id,
      category_id: transaction.category_id,
      goal_id: transaction.goalId,
    };
    try {
      const { data, error } = await supabase
        .from('scheduled_transactions')
        .insert(newScheduledTransaction)
        .select(`
          *,
          category:categories(name, icon, color)
        `);

      if (error) throw error;
      dispatch({ type: 'ADD_SCHEDULED_TRANSACTION', payload: transformScheduledTransaction(data[0]) });
    } catch (error) {
      console.error('Error adding scheduled transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao adicionar agendamento.' });
    }
  }, []);

  const updateScheduledTransaction = useCallback(async (id: string, transaction: Partial<ScheduledTransaction>) => {
    try {
      const { data, error } = await supabase
        .from('scheduled_transactions')
        .update({
          ...transaction,
          category_id: transaction.category_id,
          goal_id: transaction.goalId,
        })
        .eq('id', id)
        .select(`
          *,
          category:categories(name, icon, color)
        `);
      
      if (error) throw error;
      dispatch({ type: 'UPDATE_SCHEDULED_TRANSACTION', payload: transformScheduledTransaction(data[0]) });
    } catch (error) {
      console.error('Error updating scheduled transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao atualizar agendamento.' });
    }
  }, []);

  const deleteScheduledTransaction = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_transactions')
        .delete()
        .eq('id', id);
  
      if (error) throw error;
      dispatch({ type: 'DELETE_SCHEDULED_TRANSACTION', payload: id });
    } catch (error) {
      console.error('Error deleting scheduled transaction:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao deletar agendamento.' });
    }
  }, []);

  // 🎯 Novas funções para adicionar, atualizar e deletar bancos conectados
  const addConnectedBank = useCallback(async (bank: Omit<ConnectedBank, 'id' | 'created_at'>) => {
    const user = await getCurrentUser();
    if (!user) {
      dispatch({ type: 'SET_ERROR', payload: 'Usuário não autenticado.' });
      return;
    }
    const newBank = { ...bank, user_id: user.id };
    try {
      const { data, error } = await supabase
        .from('connected_banks')
        .insert(newBank)
        .select();

      if (error) throw error;
      dispatch({ type: 'ADD_CONNECTED_BANK', payload: data[0] });
    } catch (error) {
      console.error('Error adding connected bank:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao conectar banco.' });
    }
  }, []);

  const updateConnectedBank = useCallback(async (id: string, bank: Partial<ConnectedBank>) => {
    try {
      const { data, error } = await supabase
        .from('connected_banks')
        .update(bank)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      dispatch({ type: 'UPDATE_CONNECTED_BANK', payload: data[0] });
    } catch (error) {
      console.error('Error updating connected bank:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao atualizar banco conectado.' });
    }
  }, []);

  const deleteConnectedBank = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('connected_banks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      dispatch({ type: 'DELETE_CONNECTED_BANK', payload: id });
    } catch (error) {
      console.error('Error deleting connected bank:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao desconectar banco.' });
    }
  }, []);

  // ===================================================
  // OUTRAS FUNÇÕES
  // ===================================================

  const recalculateGoalAmounts = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return false;
      }
      const allTransactions = await getTransactions();
      const allGoals = await getGoals();
      if (!allTransactions || !allGoals) {
        return false;
      }
      recalculateGoalAmountsService(allTransactions, allGoals, supabase);
      return true;
    } catch (error) {
      console.error('Error recalculating goal amounts:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao recalcular o progresso das metas.' });
      return false;
    }
  }, [getTransactions, getGoals]);

  const updateUserProfile = useCallback(async (userData: any) => {
    const user = await getCurrentUser();
    if (!user) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          full_name: userData.full_name,
          theme: userData.theme,
          locale: userData.locale,
        })
        .eq('id', user.id)
        .select();

      if (error) throw error;
      dispatch({ type: 'SET_USER', payload: { ...user, ...data[0] } });
    } catch (error) {
      console.error('Error updating user profile:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao atualizar o perfil do usuário.' });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_SESSION', payload: null });
      // Limpar todos os estados ao deslogar
      dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
      dispatch({ type: 'SET_GOALS', payload: [] });
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
      dispatch({ type: 'SET_CONNECTED_BANKS', payload: [] });
    } catch (error) {
      console.error('Error during logout:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao sair. Tente novamente.' });
    }
  }, []);

  const toggleHideValues = useCallback(() => {
    dispatch({ type: 'TOGGLE_HIDE_VALUES' });
  }, []);

  const setCustomDateRange = useCallback((start: Date | null, end: Date | null) => {
    dispatch({ type: 'SET_CUSTOM_DATE_RANGE', payload: { startDate: start?.toISOString() || null, endDate: end?.toISOString() || null } });
  }, []);

  const setTimeRange = useCallback((range: string) => {
    dispatch({ type: 'SET_TIME_RANGE', payload: range as TimeRange });
  }, []);

  // ===================================================
  // EFFECTS
  // ===================================================

  useEffect(() => {
    const fetchInitialData = async (user: any) => {
      if (user) {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_USER', payload: user });

        try {
          await Promise.all([
            getTransactions(),
            getCategories(),
            getGoals(),
            getScheduledTransactions(),
            getConnectedBanks(), // 🎯 Chamando a nova função para buscar bancos conectados
          ]);
        } catch (error) {
          console.error('Error fetching initial data:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Falha ao carregar dados iniciais.' });
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };
    
    // Configurar o listener de autenticação
    const { data: { subscription } } = setupAuthListener((_event, session) => {
      dispatch({ type: 'SET_SESSION', payload: session });
      if (session) {
        fetchInitialData(session.user);
      } else {
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [getTransactions, getCategories, getGoals, getScheduledTransactions, getConnectedBanks]);

  // UseEffect para filtrar transações com base no intervalo de tempo
  useEffect(() => {
    const filterTransactions = () => {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;
      let tempTransactions = [...state.transactions];

      if (state.timeRange === 'last30days') {
        startDate = new Date(now.setDate(now.getDate() - 30));
      } else if (state.timeRange === 'last90days') {
        startDate = new Date(now.setDate(now.getDate() - 90));
      } else if (state.timeRange === 'currentMonth') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (state.timeRange === 'lastMonth') {
        const lastMonth = now.getMonth() - 1;
        startDate = new Date(now.getFullYear(), lastMonth, 1);
        endDate = new Date(now.getFullYear(), lastMonth + 1, 0);
      } else if (state.timeRange === 'custom' && state.customStartDate && state.customEndDate) {
        startDate = new Date(state.customStartDate);
        endDate = new Date(state.customEndDate);
      } else {
        startDate = new Date(0); // Epoch, para pegar todas as transações
      }

      tempTransactions = tempTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      dispatch({ type: 'SET_FILTERED_TRANSACTIONS', payload: tempTransactions });
    };

    filterTransactions();
  }, [state.timeRange, state.customStartDate, state.customEndDate, state.transactions]);
  
  // UseEffect para recalcular metas quando as transações ou metas mudam
  useEffect(() => {
    if (state.goals.length > 0 && state.transactions.length > 0) {
      recalculateGoalAmounts();
    }
  }, [state.goals.length, state.transactions.length, recalculateGoalAmounts]);

  const value: AppContextType = useMemo(() => ({
    ...state,
    dispatch,
    fetchUserData: () => {}, // placeholder
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
    // Data fetching methods
    getTransactions,
    getGoals,
    getConnectedBanks, // 🎯 Adicionado o método ao contexto
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
    // 🎯 Adicionado os métodos para a API de Bancos
    addConnectedBank,
    updateConnectedBank,
    deleteConnectedBank,
  }), [
    state,
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
    getTransactions,
    getGoals,
    getConnectedBanks,
    recalculateGoalAmounts,
    updateUserProfile,
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
    addConnectedBank,
    updateConnectedBank,
    deleteConnectedBank,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

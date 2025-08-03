import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, Goal, ScheduledTransaction, User, TimeRange } from '@/types';
import { setupAuthListener, getCurrentSession } from '@/services/authService';
import { recalculateGoalAmounts as recalculateGoalAmountsService } from '@/services/goalService';
import { toast } from '@/components/ui/use-toast';
import { calculateDateRange } from '@/lib/utils';
import { isWithinInterval, parseISO } from 'date-fns';

// ===================================================
// TIPOS E INTERFACES
// ===================================================

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

// Novo tipo para Bancos Conectados
interface ConnectedBank {
  id: string;
  created_at: string;
  user_id: string;
  bank_name: string;
  account_number: string;
  balance: number;
  api_key?: string;
  last_sync_at?: string;
}

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  scheduledTransactions: ScheduledTransaction[];
  connectedBanks: ConnectedBank[]; // Adicionado o estado para bancos conectados
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
  fetchUserData: () => void;
  toggleHideValues: () => void;
  logout: () => Promise<void>;
  setCustomDateRange: (start: Date | null, end: Date | null) => void;
  setTimeRange: (range: TimeRange) => void;
  // Data fetching methods
  getTransactions: () => Promise<void>;
  getGoals: () => Promise<void>;
  getCategories: () => Promise<void>;
  getScheduledTransactions: () => Promise<void>;
  getConnectedBanks: () => Promise<void>; // Adicionado o método para buscar bancos
  recalculateGoalAmounts: () => Promise<boolean>;
  updateUserProfile: (data: any) => Promise<void>;
  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Category actions
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // Goal actions
  addGoal: (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  // Scheduled Transaction actions
  addScheduledTransaction: (transaction: Omit<ScheduledTransaction, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateScheduledTransaction: (id: string, transaction: Partial<ScheduledTransaction>) => Promise<void>;
  deleteScheduledTransaction: (id: string) => Promise<void>;
  // Connected Banks actions
  addConnectedBank: (bank: Omit<ConnectedBank, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateConnectedBank: (id: string, bank: Partial<ConnectedBank>) => Promise<void>;
  deleteConnectedBank: (id: string) => Promise<void>;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SESSION'; payload: any | null }
  | { type: 'TOGGLE_HIDE_VALUES' }
  | { type: 'SET_TIME_RANGE'; payload: TimeRange }
  | { type: 'SET_CUSTOM_DATE_RANGE'; payload: { startDate: string | null; endDate: string | null } }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'SET_SCHEDULED_TRANSACTIONS'; payload: ScheduledTransaction[] }
  | { type: 'SET_CONNECTED_BANKS'; payload: ConnectedBank[] } // Novo tipo de ação
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
  | { type: 'ADD_CONNECTED_BANK'; payload: ConnectedBank } // Novo tipo de ação
  | { type: 'UPDATE_CONNECTED_BANK'; payload: ConnectedBank } // Novo tipo de ação
  | { type: 'DELETE_CONNECTED_BANK'; payload: string }; // Novo tipo de ação

// ===================================================
// ESTADO INICIAL E REDUCER
// ===================================================

const initialAppState: AppState = {
  transactions: [],
  categories: [],
  goals: [],
  scheduledTransactions: [],
  connectedBanks: [], // Estado inicial
  isLoading: true,
  error: null,
  user: null,
  session: null,
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
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'TOGGLE_HIDE_VALUES':
      return { ...state, hideValues: !state.hideValues };
    case 'SET_TIME_RANGE':
      return { ...state, timeRange: action.payload, customStartDate: null, customEndDate: null };
    case 'SET_CUSTOM_DATE_RANGE':
      return { ...state, timeRange: 'custom', ...action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    case 'SET_SCHEDULED_TRANSACTIONS':
      return { ...state, scheduledTransactions: action.payload };
    case 'SET_CONNECTED_BANKS':
      return { ...state, connectedBanks: action.payload };
    case 'SET_FILTERED_TRANSACTIONS':
      return { ...state, filteredTransactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'UPDATE_TRANSACTION':
      return { ...state, transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t ) };
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return { ...state, categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c ) };
    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g ) };
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.payload) };
    case 'ADD_SCHEDULED_TRANSACTION':
      return { ...state, scheduledTransactions: [...state.scheduledTransactions, action.payload] };
    case 'UPDATE_SCHEDULED_TRANSACTION':
      return { ...state, scheduledTransactions: state.scheduledTransactions.map(st => st.id === action.payload.id ? action.payload : st ) };
    case 'DELETE_SCHEDULED_TRANSACTION':
      return { ...state, scheduledTransactions: state.scheduledTransactions.filter(st => st.id !== action.payload) };
    case 'ADD_CONNECTED_BANK':
      return { ...state, connectedBanks: [...state.connectedBanks, action.payload] };
    case 'UPDATE_CONNECTED_BANK':
      return { ...state, connectedBanks: state.connectedBanks.map(cb => cb.id === action.payload.id ? action.payload : cb ) };
    case 'DELETE_CONNECTED_BANK':
      return { ...state, connectedBanks: state.connectedBanks.filter(cb => cb.id !== action.payload) };
    default:
      return state;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// ===================================================
// PROVIDER
// ===================================================

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  const { transactions, timeRange, customStartDate, customEndDate, user } = state;

  const fetchUserData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        dispatch({ type: 'SET_USER', payload: user });
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados do usuário:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    // Escuta mudanças na autenticação
    const { data: authListener } = setupAuthListener((_event, session) => {
      dispatch({ type: 'SET_SESSION', payload: session });
      if (session) {
        dispatch({ type: 'SET_USER', payload: session.user });
        fetchUserData();
      } else {
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
        dispatch({ type: 'SET_GOALS', payload: [] });
        dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
        dispatch({ type: 'SET_CONNECTED_BANKS', payload: [] }); // Limpa o estado
      }
    });

    // Filtra as transações sempre que houver mudanças
    const { startDate, endDate } = calculateDateRange(timeRange, customStartDate, customEndDate);
    const filtered = transactions.filter(t => {
      const transactionDate = parseISO(t.transaction_date);
      return isWithinInterval(transactionDate, { start: startDate, end: endDate });
    });
    dispatch({ type: 'SET_FILTERED_TRANSACTIONS', payload: filtered });

    return () => {
      authListener?.unsubscribe();
    };
  }, [transactions, timeRange, customStartDate, customEndDate, fetchUserData]);

  const toggleHideValues = useCallback(() => {
    dispatch({ type: 'TOGGLE_HIDE_VALUES' });
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: 'Erro ao sair',
        description: 'Não foi possível fazer logout. Tente novamente.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Logout realizado com sucesso',
        description: 'Você saiu da sua conta.',
      });
    }
  }, []);

  const setCustomDateRange = useCallback((start: Date | null, end: Date | null) => {
    dispatch({ type: 'SET_CUSTOM_DATE_RANGE', payload: { startDate: start?.toISOString() || null, endDate: end?.toISOString() || null } });
  }, []);

  const setTimeRange = useCallback((range: TimeRange) => {
    dispatch({ type: 'SET_TIME_RANGE', payload: range });
  }, []);

  // ===================================================
  // MÉTODOS DE DADOS
  // ===================================================

  const getTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      dispatch({ type: 'SET_TRANSACTIONS', payload: data });
    } catch (error: any) {
      console.error('Erro ao buscar transações:', error.message);
      toast({
        title: 'Erro ao buscar transações',
        description: 'Ocorreu um erro ao carregar suas transações.',
        variant: 'destructive',
      });
    }
  }, [user]);

  const getCategories = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      dispatch({ type: 'SET_CATEGORIES', payload: data });
    } catch (error: any) {
      console.error('Erro ao buscar categorias:', error.message);
    }
  }, [user]);

  const getGoals = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      dispatch({ type: 'SET_GOALS', payload: data });
    } catch (error: any) {
      console.error('Erro ao buscar metas:', error.message);
      toast({
        title: 'Erro ao buscar metas',
        description: 'Ocorreu um erro ao carregar suas metas.',
        variant: 'destructive',
      });
    }
  }, [user]);

  const getScheduledTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('scheduled_transactions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: data });
    } catch (error: any) {
      console.error('Erro ao buscar agendamentos:', error.message);
      toast({
        title: 'Erro ao buscar agendamentos',
        description: 'Ocorreu um erro ao carregar seus agendamentos.',
        variant: 'destructive',
      });
    }
  }, [user]);
  
  const getConnectedBanks = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('connected_banks')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      dispatch({ type: 'SET_CONNECTED_BANKS', payload: data });
    } catch (error: any) {
      console.error('Erro ao buscar bancos conectados:', error.message);
      toast({
        title: 'Erro ao buscar bancos',
        description: 'Ocorreu um erro ao carregar seus bancos conectados.',
        variant: 'destructive',
      });
    }
  }, [user]);

  const recalculateGoalAmounts = useCallback(async () => {
    if (!user) return false;
    // Lógica para recalcular os valores das metas
    const recalculated = recalculateGoalAmountsService(state.goals, state.transactions);
    dispatch({ type: 'SET_GOALS', payload: recalculated });
    return true;
  }, [state.goals, state.transactions, user]);

  const updateUserProfile = useCallback(async (data: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', user.id);
      
      if (error) throw error;
      // Poderia buscar o usuário atualizado aqui, mas por simplicidade, apenas atualizamos o estado
      dispatch({ type: 'SET_USER', payload: { ...user, ...data } });
      toast({
        title: 'Perfil atualizado',
        description: 'Seu perfil foi atualizado com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar seu perfil.',
        variant: 'destructive',
      });
    }
  }, [user]);

  // ===================================================
  // AÇÕES DE DADOS
  // ===================================================
  
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...transaction, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: 'ADD_TRANSACTION', payload: data });
      toast({
        title: 'Transação adicionada',
        description: `Transação "${data.title}" adicionada com sucesso.`,
      });
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a transação.',
        variant: 'destructive',
      });
    }
  }, [user]);

  const updateTransaction = useCallback(async (id: string, transaction: Partial<Transaction>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      dispatch({ type: 'UPDATE_TRANSACTION', payload: data });
      toast({
        title: 'Transação atualizada',
        description: `Transação "${data.title}" atualizada com sucesso.`,
      });
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a transação.',
        variant: 'destructive',
      });
    }
  }, [user]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      toast({
        title: 'Transação excluída',
        description: 'A transação foi removida com sucesso.',
      });
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a transação.',
        variant: 'destructive',
      });
    }
  }, [user]);

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...category, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      dispatch({ type: 'ADD_CATEGORY', payload: data });
    } catch (error: any) {
      console.error('Error adding category:', error);
    }
  }, [user]);

  const updateCategory = useCallback(async (id: string, category: Partial<Category>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      dispatch({ type: 'UPDATE_CATEGORY', payload: data });
    } catch (error: any) {
      console.error('Error updating category:', error);
    }
  }, [user]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
    } catch (error: any) {
      console.error('Error deleting category:', error);
    }
  }, [user]);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({ ...goal, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: 'ADD_GOAL', payload: data });
    } catch (error: any) {
      console.error('Error adding goal:', error);
    }
  }, [user]);

  const updateGoal = useCallback(async (id: string, goal: Partial<Goal>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('goals')
        .update(goal)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: 'UPDATE_GOAL', payload: data });
    } catch (error: any) {
      console.error('Error updating goal:', error);
    }
  }, [user]);

  const deleteGoal = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      dispatch({ type: 'DELETE_GOAL', payload: id });
    } catch (error: any) {
      console.error('Error deleting goal:', error);
    }
  }, [user]);
  
  const addScheduledTransaction = useCallback(async (transaction: Omit<ScheduledTransaction, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('scheduled_transactions')
        .insert({ ...transaction, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: 'ADD_SCHEDULED_TRANSACTION', payload: data });
    } catch (error: any) {
      console.error('Error adding scheduled transaction:', error);
    }
  }, [user]);

  const updateScheduledTransaction = useCallback(async (id: string, transaction: Partial<ScheduledTransaction>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('scheduled_transactions')
        .update(transaction)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      dispatch({ type: 'UPDATE_SCHEDULED_TRANSACTION', payload: data });
    } catch (error: any) {
      console.error('Error updating scheduled transaction:', error);
    }
  }, [user]);

  const deleteScheduledTransaction = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('scheduled_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
  
      if (error) throw error;
      dispatch({ type: 'DELETE_SCHEDULED_TRANSACTION', payload: id });
    } catch (error: any) {
      console.error('Error deleting scheduled transaction:', error);
    }
  }, [user]);

  const addConnectedBank = useCallback(async (bank: Omit<ConnectedBank, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('connected_banks')
        .insert({ ...bank, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      dispatch({ type: 'ADD_CONNECTED_BANK', payload: data });
      toast({
        title: 'Banco conectado',
        description: `O banco "${data.bank_name}" foi conectado com sucesso.`,
      });
    } catch (error: any) {
      console.error('Error adding connected bank:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível conectar o banco.',
        variant: 'destructive',
      });
    }
  }, [user]);

  const updateConnectedBank = useCallback(async (id: string, bank: Partial<ConnectedBank>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('connected_banks')
        .update(bank)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      dispatch({ type: 'UPDATE_CONNECTED_BANK', payload: data });
      toast({
        title: 'Banco atualizado',
        description: `As informações do banco "${data.bank_name}" foram atualizadas.`,
      });
    } catch (error: any) {
      console.error('Error updating connected bank:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as informações do banco.',
        variant: 'destructive',
      });
    }
  }, [user]);

  const deleteConnectedBank = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('connected_banks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
  
      if (error) throw error;
      dispatch({ type: 'DELETE_CONNECTED_BANK', payload: id });
      toast({
        title: 'Banco desconectado',
        description: 'O banco foi desconectado com sucesso.',
      });
    } catch (error: any) {
      console.error('Error deleting connected bank:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível desconectar o banco.',
        variant: 'destructive',
      });
    }
  }, [user]);


  // Busca dados iniciais após a autenticação do usuário
  useEffect(() => {
    if (user) {
      getTransactions();
      getCategories();
      getGoals();
      getScheduledTransactions();
      getConnectedBanks(); // Chama o novo método de busca
    }
  }, [user, getTransactions, getCategories, getGoals, getScheduledTransactions, getConnectedBanks]);

  const value: AppContextType = useMemo(() => ({
    ...state,
    dispatch,
    fetchUserData,
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
    // Data fetching methods
    getTransactions,
    getCategories,
    getGoals,
    getScheduledTransactions,
    getConnectedBanks,
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
    // Connected Banks actions
    addConnectedBank,
    updateConnectedBank,
    deleteConnectedBank
  }), [
    state,
    fetchUserData,
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
    getTransactions,
    getCategories,
    getGoals,
    getScheduledTransactions,
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
    deleteConnectedBank
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

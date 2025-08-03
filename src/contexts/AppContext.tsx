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

// ✅ Adicionando o tipo para ConnectedBank
interface ConnectedBank {
  id: string;
  user_id: string;
  provider: string; // Ex: 'Plaid', 'Bankin'
  institution_name: string;
  access_token: string;
  expires_at: string;
  created_at: string;
}

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  scheduledTransactions: ScheduledTransaction[];
  // ✅ Estado para os bancos conectados
  connectedBanks: ConnectedBank[];
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

// ✅ Adicionando novas ações para os bancos
type AppAction =
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'SET_SCHEDULED_TRANSACTIONS'; payload: ScheduledTransaction[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
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
  // ✅ Novas ações para bancos conectados
  | { type: 'SET_CONNECTED_BANKS'; payload: ConnectedBank[] }
  | { type: 'ADD_CONNECTED_BANK'; payload: ConnectedBank }
  | { type: 'DELETE_CONNECTED_BANK'; payload: string };

const initialState: AppState = {
  transactions: [],
  categories: [],
  goals: [],
  scheduledTransactions: [],
  // ✅ Inicializando o estado dos bancos
  connectedBanks: [],
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
      return { ...state, timeRange: action.payload };
    case 'SET_CUSTOM_DATE_RANGE':
      return { ...state, customStartDate: action.payload.startDate, customEndDate: action.payload.endDate };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    case 'SET_SCHEDULED_TRANSACTIONS':
      return { ...state, scheduledTransactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'UPDATE_TRANSACTION':
      return { ...state, transactions: state.transactions.map(t => (t.id === action.payload.id ? action.payload : t)) };
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return { ...state, categories: state.categories.map(c => (c.id === action.payload.id ? action.payload : c)) };
    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map(g => (g.id === action.payload.id ? action.payload : g)) };
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.payload) };
    case 'ADD_SCHEDULED_TRANSACTION':
      return { ...state, scheduledTransactions: [...state.scheduledTransactions, action.payload] };
    case 'UPDATE_SCHEDULED_TRANSACTION':
      return { ...state, scheduledTransactions: state.scheduledTransactions.map(s => (s.id === action.payload.id ? action.payload : s)) };
    case 'DELETE_SCHEDULED_TRANSACTION':
      return { ...state, scheduledTransactions: state.scheduledTransactions.filter(s => s.id !== action.payload) };
    // ✅ Novos cases para as ações de bancos conectados
    case 'SET_CONNECTED_BANKS':
      return { ...state, connectedBanks: action.payload };
    case 'ADD_CONNECTED_BANK':
      return { ...state, connectedBanks: [...state.connectedBanks, action.payload] };
    case 'DELETE_CONNECTED_BANK':
      return { ...state, connectedBanks: state.connectedBanks.filter(b => b.id !== action.payload) };
    default:
      return state;
  }
};

interface AppContextType extends AppState {
  // Ações básicas
  dispatch: React.Dispatch<AppAction>;
  fetchUserData: () => Promise<void>;
  toggleHideValues: () => void;
  logout: () => Promise<void>;
  setCustomDateRange: (startDate: string | null, endDate: string | null) => void;
  setTimeRange: (range: TimeRange) => void;
  // Data fetching methods
  getTransactions: () => Promise<void>;
  getGoals: () => Promise<void>;
  recalculateGoalAmounts: (transactions: Transaction[], goals: Goal[]) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  updateTransaction: (transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Category actions
  addCategory: (category: Omit<Category, 'id' | 'created_at'>) => Promise<void>;
  updateCategory: (category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // Goal actions
  addGoal: (goal: Omit<Goal, 'id' | 'created_at'>) => Promise<void>;
  updateGoal: (goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  // Scheduled Transaction actions
  addScheduledTransaction: (scheduledTransaction: Omit<ScheduledTransaction, 'id' | 'created_at'>) => Promise<void>;
  updateScheduledTransaction: (scheduledTransaction: Partial<ScheduledTransaction>) => Promise<void>;
  deleteScheduledTransaction: (id: string) => Promise<void>;
  // ✅ Novas ações para bancos conectados
  getConnectedBanks: () => Promise<void>;
  addConnectedBank: (bank: Omit<ConnectedBank, 'id' | 'created_at'>) => Promise<void>;
  deleteConnectedBank: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // useEffects para inicialização e escuta de dados
  useEffect(() => {
    const initializeApp = async () => {
      // ... (código existente para auth e data fetching)
      dispatch({ type: 'SET_LOADING', payload: false });
    };
    initializeApp();
  }, []);

  // ✅ Adicionando useEffect para buscar os bancos conectados
  useEffect(() => {
    if (state.user) {
      getConnectedBanks();
    }
  }, [state.user]);


  const fetchUserData = useCallback(async () => {
    // ... (código existente para buscar dados do usuário)
  }, []);

  const toggleHideValues = useCallback(() => {
    dispatch({ type: 'TOGGLE_HIDE_VALUES' });
  }, []);

  const logout = useCallback(async () => {
    // ... (código existente para logout)
  }, []);

  const setCustomDateRange = useCallback((startDate: string | null, endDate: string | null) => {
    dispatch({ type: 'SET_CUSTOM_DATE_RANGE', payload: { startDate, endDate } });
  }, []);

  const setTimeRange = useCallback((range: TimeRange) => {
    dispatch({ type: 'SET_TIME_RANGE', payload: range });
  }, []);

  // Métodos de manipulação de dados existentes...
  const getTransactions = useCallback(async () => { /* ... */ }, [state.user]);
  const getGoals = useCallback(async () => { /* ... */ }, [state.user]);
  const recalculateGoalAmounts = useCallback(async (transactions: Transaction[], goals: Goal[]) => { /* ... */ }, []);
  const updateUserProfile = useCallback(async (updates: Partial<User>) => { /* ... */ }, [state.user]);
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'created_at'>) => { /* ... */ }, [state.user]);
  const updateTransaction = useCallback(async (transaction: Partial<Transaction>) => { /* ... */ }, [state.user]);
  const deleteTransaction = useCallback(async (id: string) => { /* ... */ }, [state.user]);
  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'created_at'>) => { /* ... */ }, [state.user]);
  const updateCategory = useCallback(async (category: Partial<Category>) => { /* ... */ }, [state.user]);
  const deleteCategory = useCallback(async (id: string) => { /* ... */ }, [state.user]);
  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'created_at'>) => { /* ... */ }, [state.user]);
  const updateGoal = useCallback(async (goal: Partial<Goal>) => { /* ... */ }, [state.user]);
  const deleteGoal = useCallback(async (id: string) => { /* ... */ }, [state.user]);
  const addScheduledTransaction = useCallback(async (scheduledTransaction: Omit<ScheduledTransaction, 'id' | 'created_at'>) => { /* ... */ }, [state.user]);
  const updateScheduledTransaction = useCallback(async (scheduledTransaction: Partial<ScheduledTransaction>) => { /* ... */ }, [state.user]);
  const deleteScheduledTransaction = useCallback(async (id: string) => { /* ... */ }, [state.user]);


  // ✅ Novos métodos para os bancos conectados
  const getConnectedBanks = useCallback(async () => {
    if (!state.user) return;
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data, error } = await supabase
        .from('connected_banks')
        .select('*')
        .eq('user_id', state.user.id);
      if (error) throw error;
      dispatch({ type: 'SET_CONNECTED_BANKS', payload: data || [] });
    } catch (error) {
      console.error('Error fetching connected banks:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao buscar bancos conectados.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user]);

  const addConnectedBank = useCallback(async (bank: Omit<ConnectedBank, 'id' | 'created_at'>) => {
    if (!state.user) return;
    try {
      const { data, error } = await supabase
        .from('connected_banks')
        .insert({ ...bank, user_id: state.user.id })
        .select()
        .single();
      if (error) throw error;
      dispatch({ type: 'ADD_CONNECTED_BANK', payload: data });
    } catch (error) {
      console.error('Error adding connected bank:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao adicionar o banco.' });
    }
  }, [state.user]);

  const deleteConnectedBank = useCallback(async (id: string) => {
    if (!state.user) return;
    try {
      const { error } = await supabase
        .from('connected_banks')
        .delete()
        .eq('id', id);
      if (error) throw error;
      dispatch({ type: 'DELETE_CONNECTED_BANK', payload: id });
    } catch (error) {
      console.error('Error deleting connected bank:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao excluir o banco.' });
    }
  }, [state.user]);

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
    getGoals,
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
    // ✅ Adicionando as novas funções ao contexto
    getConnectedBanks,
    addConnectedBank,
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
    addConnectedBank,
    deleteConnectedBank,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ✅ Renomeando o hook de useAppContext para useApp para resolver o erro
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

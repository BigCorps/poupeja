import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, Goal, ScheduledTransaction, User, TimeRange } from '@/types';
import { setupAuthListener, getCurrentSession } from '@/services/authService';
import { recalculateGoalAmounts as recalculateGoalAmountsService } from '@/services/goalService';

// ===================================================
// ✅ NOVO: TIPOS E INTERFACES
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

interface PaymentMethod {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'pix' | 'other';
  is_default: boolean;
}

interface Supplier {
  id: string;
  user_id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
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
  isAuthReady: boolean;
  paymentMethods: PaymentMethod[]; // ✅ NOVO
  suppliers: Supplier[]; // ✅ NOVO
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
  parentCategories: Category[];
  subcategories: Category[];
  // ✅ NOVO: Funções para Cadastros
  paymentMethods: PaymentMethod[];
  suppliers: Supplier[];
  getPaymentMethods: () => Promise<void>;
  getSuppliers: () => Promise<void>;
  addPaymentMethod: (method: Omit<PaymentMethod, 'id' | 'user_id'>) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'user_id'>) => Promise<void>;
  updatePaymentMethod: (method: PaymentMethod) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
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
  | { type: 'SET_AUTH_READY'; payload: boolean }
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
  // ✅ NOVO: Ações para Cadastros
  | { type: 'SET_PAYMENT_METHODS'; payload: PaymentMethod[] }
  | { type: 'ADD_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'UPDATE_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'DELETE_PAYMENT_METHOD'; payload: string }
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'DELETE_SUPPLIER'; payload: string };

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
  accountType: 'PF',
  isAuthReady: false,
  paymentMethods: [], // ✅ NOVO
  suppliers: [], // ✅ NOVO
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
    case 'SET_AUTH_READY':
        return { ...state, isAuthReady: action.payload };
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
    // ✅ NOVO: Casos para os Cadastros
    case 'SET_PAYMENT_METHODS':
      return { ...state, paymentMethods: Array.isArray(action.payload) ? action.payload : [] };
    case 'ADD_PAYMENT_METHOD':
      return { ...state, paymentMethods: [...state.paymentMethods, action.payload] };
    case 'UPDATE_PAYMENT_METHOD':
      return { ...state, paymentMethods: state.paymentMethods.map(pm => pm.id === action.payload.id ? action.payload : pm) };
    case 'DELETE_PAYMENT_METHOD':
      return { ...state, paymentMethods: state.paymentMethods.filter(pm => pm.id !== action.payload) };
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: Array.isArray(action.payload) ? action.payload : [] };
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    case 'UPDATE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };
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
    // ... (código existente)
  }, [state.user, state.accountType]);

  const getCategories = useCallback(async () => {
    // ... (código existente)
  }, [state.user]);

  const getGoals = useCallback(async (): Promise<Goal[]> => {
    // ... (código existente)
  }, [state.user]);

  const getScheduledTransactions = useCallback(async (): Promise<void> => {
    // ... (código existente)
  }, [state.user]);

  // ✅ NOVO: Funções de API para Cadastros
  const getPaymentMethods = useCallback(async () => {
    try {
      if (!state.user) return;
      const { data, error } = await supabase.from('poupeja_payment_methods')
        .select('*')
        .eq('user_id', state.user.id);

      if (error) throw error;
      dispatch({ type: 'SET_PAYMENT_METHODS', payload: data || [] });
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao buscar métodos de pagamento.' });
    }
  }, [state.user]);

  const getSuppliers = useCallback(async () => {
    try {
      if (!state.user) return;
      const { data, error } = await supabase.from('poupeja_suppliers')
        .select('*')
        .eq('user_id', state.user.id);

      if (error) throw error;
      dispatch({ type: 'SET_SUPPLIERS', payload: data || [] });
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao buscar fornecedores.' });
    }
  }, [state.user]);
  
  const addTransaction = useCallback(async (transaction: Transaction) => {
    // ... (código existente)
  }, [state.user, state.accountType, getGoals]);

  const updateTransaction = useCallback(async (transaction: Transaction) => {
    // ... (código existente)
  }, [state.user, getGoals]);

  const deleteTransaction = useCallback(async (id: string) => {
    // ... (código existente)
  }, [state.user, state.transactions, getGoals]);

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'created_at' | 'user_id'>) => {
    // ... (código existente)
  }, [state.user]);

  const updateCategory = useCallback(async (category: Category) => {
    // ... (código existente)
  }, [state.user]);

  const deleteCategory = useCallback(async (id: string) => {
    // ... (código existente)
  }, [state.user]);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'created_at' | 'user_id'>) => {
    // ... (código existente)
  }, [state.user]);

  const updateGoal = useCallback(async (goal: Goal) => {
    // ... (código existente)
  }, [state.user]);

  const deleteGoal = useCallback(async (id: string) => {
    // ... (código existente)
  }, [state.user]);

  const addScheduledTransaction = useCallback(async (scheduledTransaction: Omit<ScheduledTransaction, 'id' | 'created_at' | 'user_id'>) => {
    // ... (código existente)
  }, [state.user]);

  const updateScheduledTransaction = useCallback(async (scheduledTransaction: ScheduledTransaction) => {
    // ... (código existente)
  }, [state.user]);

  const deleteScheduledTransaction = useCallback(async (id: string) => {
    // ... (código existente)
  }, [state.user]);
  
  // ✅ NOVO: Funções para adicionar, atualizar e deletar métodos de pagamento e fornecedores
  const addPaymentMethod = useCallback(async (method: Omit<PaymentMethod, 'id' | 'user_id'>) => {
    if (!state.user) return;
    try {
      const { data, error } = await supabase.from('poupeja_payment_methods')
        .insert({ ...method, user_id: state.user.id })
        .select()
        .single();
      if (error) throw error;
      dispatch({ type: 'ADD_PAYMENT_METHOD', payload: data });
    } catch (err) {
      console.error('Error adding payment method:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar método de pagamento.' });
    }
  }, [state.user]);

  const updatePaymentMethod = useCallback(async (method: PaymentMethod) => {
    if (!state.user) return;
    try {
      const { data, error } = await supabase.from('poupeja_payment_methods')
        .update({ ...method })
        .eq('id', method.id)
        .select()
        .single();
      if (error) throw error;
      dispatch({ type: 'UPDATE_PAYMENT_METHOD', payload: data });
    } catch (err) {
      console.error('Error updating payment method:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar método de pagamento.' });
    }
  }, [state.user]);

  const deletePaymentMethod = useCallback(async (id: string) => {
    if (!state.user) return;
    try {
      const { error } = await supabase.from('poupeja_payment_methods')
        .delete()
        .eq('id', id);
      if (error) throw error;
      dispatch({ type: 'DELETE_PAYMENT_METHOD', payload: id });
    } catch (err) {
      console.error('Error deleting payment method:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar método de pagamento.' });
    }
  }, [state.user]);

  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id' | 'user_id'>) => {
    if (!state.user) return;
    try {
      const { data, error } = await supabase.from('poupeja_suppliers')
        .insert({ ...supplier, user_id: state.user.id })
        .select()
        .single();
      if (error) throw error;
      dispatch({ type: 'ADD_SUPPLIER', payload: data });
    } catch (err) {
      console.error('Error adding supplier:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar fornecedor.' });
    }
  }, [state.user]);

  const updateSupplier = useCallback(async (supplier: Supplier) => {
    if (!state.user) return;
    try {
      const { data, error } = await supabase.from('poupeja_suppliers')
        .update({ ...supplier })
        .eq('id', supplier.id)
        .select()
        .single();
      if (error) throw error;
      dispatch({ type: 'UPDATE_SUPPLIER', payload: data });
    } catch (err) {
      console.error('Error updating supplier:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar fornecedor.' });
    }
  }, [state.user]);

  const deleteSupplier = useCallback(async (id: string) => {
    if (!state.user) return;
    try {
      const { error } = await supabase.from('poupeja_suppliers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      dispatch({ type: 'DELETE_SUPPLIER', payload: id });
    } catch (err) {
      console.error('Error deleting supplier:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar fornecedor.' });
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
        dispatch({ type: 'SET_AUTH_READY', payload: true });
      }
    );

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Efeito para buscar os dados quando o usuário muda
  useEffect(() => {
    if (state.user) {
      getTransactions();
      getCategories();
      getGoals();
      getScheduledTransactions();
      // ✅ NOVO: Buscar os dados de cadastros
      getPaymentMethods();
      getSuppliers();
    } else {
      dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
      dispatch({ type: 'SET_GOALS', payload: [] });
      dispatch({ type: 'SET_SCHEDULED_TRANSACTIONS', payload: [] });
      // ✅ NOVO: Limpar o estado de cadastros
      dispatch({ type: 'SET_PAYMENT_METHODS', payload: [] });
      dispatch({ type: 'SET_SUPPLIERS', payload: [] });
    }
  }, [state.user, getTransactions, getCategories, getGoals, getScheduledTransactions, getPaymentMethods, getSuppliers]);
  
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
    getGoals,
    getCategories,
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
    subcategories,
    // ✅ NOVO: Funções e dados para cadastros
    getPaymentMethods,
    getSuppliers,
    addPaymentMethod,
    addSupplier,
    updatePaymentMethod,
    updateSupplier,
    deletePaymentMethod,
    deleteSupplier,
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
    subcategories,
    // ✅ NOVO: Dependências para cadastros
    getPaymentMethods,
    getSuppliers,
    addPaymentMethod,
    addSupplier,
    updatePaymentMethod,
    updateSupplier,
    deletePaymentMethod,
    deleteSupplier
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

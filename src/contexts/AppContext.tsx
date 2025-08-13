import React, { createContext, useContext, useReducer, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, TimeRange } from '@/types';

// ===================================================
// ✅ INTERFACES E TIPOS ATUALIZADOS
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

// ✅ NOVA INTERFACE: Lançamento
interface Lancamento {
  id: string;
  created_at: string;
  user_id: string;
  data_referencia: string;
  classificacao: 'receita' | 'despesa';
  valor_original?: number;
  juros_atraso?: number;
  valor_pago: number;
  categoria_id: string;
  subcategoria_id?: string;
  fornecedor_id?: string;
  forma_pagamento_id: string;
  descricao?: string;
  tipo_lancamento: 'projecao' | 'efetivo';
  data_vencimento: string;
  data_pagamento?: string;
  status_pagamento: 'pago' | 'a_pagar' | 'atrasado';
  account_type: 'PF' | 'PJ';
  updated_at: string;
  // Campos relacionados (joins)
  categoria?: Category;
  subcategoria?: Category;
  fornecedor?: Supplier;
  forma_pagamento?: PaymentMethod;
}

interface AppState {
  // ✅ REMOVIDO: transactions, goals, scheduledTransactions
  // ✅ MANTIDO: categories, paymentMethods, suppliers
  categories: Category[];
  paymentMethods: PaymentMethod[];
  suppliers: Supplier[];
  
  // ✅ NOVO: lançamentos
  lancamentos: Lancamento[];
  
  // Estados gerais
  isLoading: boolean;
  error: string | null;
  user: User | null;
  session: any | null;
  hideValues: boolean;
  timeRange: TimeRange;
  customStartDate: string | null;
  customEndDate: string | null;
  accountType: 'PF' | 'PJ';
  isAuthReady: boolean;
}

interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  toggleHideValues: () => void;
  logout: () => void;
  setTimeRange: (timeRange: TimeRange) => void;
  setCustomDateRange: (startDate: string, endDate: string) => void;
  setAccountType: (accountType: 'PF' | 'PJ') => void;
  
  // ✅ MANTIDAS: Funções de categorias, fornecedores e métodos de pagamento
  getCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  getPaymentMethods: () => Promise<void>;
  addPaymentMethod: (method: Omit<PaymentMethod, 'id' | 'user_id'>) => Promise<void>;
  updatePaymentMethod: (method: PaymentMethod) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  
  getSuppliers: () => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'user_id'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  // ✅ NOVAS: Funções de lançamentos
  getLancamentos: () => Promise<void>;
  addLancamento: (lancamento: Omit<Lancamento, 'id' | 'created_at' | 'user_id' | 'updated_at'>) => Promise<void>;
  updateLancamento: (lancamento: Lancamento) => Promise<void>;
  deleteLancamento: (id: string) => Promise<void>;
  
  // Computed values
  parentCategories: Category[];
  subcategories: Category[];
}

// ✅ AÇÕES ATUALIZADAS - Removidas as antigas, adicionadas as de lançamentos
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SESSION'; payload: any | null }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'TOGGLE_HIDE_VALUES' }
  | { type: 'SET_TIME_RANGE'; payload: TimeRange }
  | { type: 'SET_CUSTOM_DATE_RANGE'; payload: { startDate: string; endDate: string } }
  | { type: 'SET_ACCOUNT_TYPE'; payload: 'PF' | 'PJ' }
  | { type: 'SET_AUTH_READY'; payload: boolean }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_PAYMENT_METHODS'; payload: PaymentMethod[] }
  | { type: 'ADD_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'UPDATE_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'DELETE_PAYMENT_METHOD'; payload: string }
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'DELETE_SUPPLIER'; payload: string }
  // ✅ NOVAS AÇÕES: Lançamentos
  | { type: 'SET_LANCAMENTOS'; payload: Lancamento[] }
  | { type: 'ADD_LANCAMENTO'; payload: Lancamento }
  | { type: 'UPDATE_LANCAMENTO'; payload: Lancamento }
  | { type: 'DELETE_LANCAMENTO'; payload: string };

// ✅ ESTADO INICIAL ATUALIZADO
const initialAppState: AppState = {
  categories: [],
  paymentMethods: [],
  suppliers: [],
  lancamentos: [], // ✅ NOVO
  isLoading: true,
  error: null,
  user: null,
  session: null,
  hideValues: false,
  timeRange: 'last_30_days',
  customStartDate: null,
  customEndDate: null,
  accountType: 'PF',
  isAuthReady: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// ===================================================
// ✅ REDUTOR ATUALIZADO
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
    case 'SET_CATEGORIES':
      return { ...state, categories: Array.isArray(action.payload) ? action.payload : [] };
    case 'TOGGLE_HIDE_VALUES':
      return { ...state, hideValues: !state.hideValues };
    case 'SET_TIME_RANGE':
      return { ...state, timeRange: action.payload, customStartDate: null, customEndDate: null };
    case 'SET_CUSTOM_DATE_RANGE':
      return { ...state, timeRange: 'custom', customStartDate: action.payload.startDate, customEndDate: action.payload.endDate };
    case 'SET_ACCOUNT_TYPE':
      return { ...state, accountType: action.payload };
    case 'SET_AUTH_READY':
      return { ...state, isAuthReady: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return { ...state, categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };
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
    // ✅ NOVOS CASES: Lançamentos
    case 'SET_LANCAMENTOS':
      return { ...state, lancamentos: Array.isArray(action.payload) ? action.payload : [] };
    case 'ADD_LANCAMENTO':
      return { ...state, lancamentos: [action.payload, ...state.lancamentos] };
    case 'UPDATE_LANCAMENTO':
      return { ...state, lancamentos: state.lancamentos.map(l => l.id === action.payload.id ? action.payload : l) };
    case 'DELETE_LANCAMENTO':
      return { ...state, lancamentos: state.lancamentos.filter(l => l.id !== action.payload) };
    default:
      return state;
  }
};

const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  // ===================================================
  // ✅ FUNÇÕES BÁSICAS MANTIDAS
  // ===================================================

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

  // ===================================================
  // ✅ FUNÇÕES DE CATEGORIAS (MANTIDAS E CORRIGIDAS)
  // ===================================================

  const getCategories = useCallback(async () => {
    try {
      if (!state.user) return;
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data, error } = await supabase.from('poupeja_categories')
        .select('*')
        .or(`user_id.eq.${state.user.id},is_default.eq.true`);

      if (error) {
        console.error("Erro ao buscar categorias:", error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        dispatch({ type: 'SET_CATEGORIES', payload: [] });
      } else {
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

  // ===================================================
  // ✅ FUNÇÕES DE MÉTODOS DE PAGAMENTO (MANTIDAS)
  // ===================================================

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

  // ===================================================
  // ✅ FUNÇÕES DE FORNECEDORES (MANTIDAS)
  // ===================================================

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

  // ===================================================
  // ✅ NOVAS FUNÇÕES: LANÇAMENTOS
  // ===================================================

  const getLancamentos = useCallback(async () => {
    try {
      if (!state.user) return;
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data, error } = await supabase.from('poupeja_lancamentos')
        .select(`
          *,
          categoria:poupeja_categories!categoria_id(id, name, color, type),
          subcategoria:poupeja_categories!subcategoria_id(id, name, color, type),
          fornecedor:poupeja_suppliers(id, name),
          forma_pagamento:poupeja_payment_methods(id, name)
        `)
        .eq('user_id', state.user.id)
        .eq('account_type', state.accountType)
        .order('data_referencia', { ascending: false });

      if (error) {
        console.error("Erro ao buscar lançamentos:", error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        dispatch({ type: 'SET_LANCAMENTOS', payload: [] });
      } else {
        dispatch({ type: 'SET_LANCAMENTOS', payload: data || [] });
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar lançamentos:", err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro inesperado ao buscar lançamentos.' });
      dispatch({ type: 'SET_LANCAMENTOS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user, state.accountType]);

  const addLancamento = useCallback(async (lancamento: Omit<Lancamento, 'id' | 'created_at' | 'user_id' | 'updated_at'>) => {
    if (!state.user) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_lancamentos')
        .insert({ 
          ...lancamento, 
          user_id: state.user.id, 
          account_type: state.accountType 
        })
        .select(`
          *,
          categoria:poupeja_categories!categoria_id(id, name, color, type),
          subcategoria:poupeja_categories!subcategoria_id(id, name, color, type),
          fornecedor:poupeja_suppliers(id, name),
          forma_pagamento:poupeja_payment_methods(id, name)
        `)
        .single();
      
      if (error) throw error;
      dispatch({ type: 'ADD_LANCAMENTO', payload: data });
    } catch (err) {
      console.error('Error adding lançamento:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar lançamento.' });
      throw err;
    }
  }, [state.user, state.accountType]);

  const updateLancamento = useCallback(async (lancamento: Lancamento) => {
    if (!state.user) return;
    try {
      const { data, error } = await supabase
        .from('poupeja_lancamentos')
        .update({ ...lancamento, user_id: state.user.id })
        .eq('id', lancamento.id)
        .select(`
          *,
          categoria:poupeja_categories!categoria_id(id, name, color, type),
          subcategoria:poupeja_categories!subcategoria_id(id, name, color, type),
          fornecedor:poupeja_suppliers(id, name),
          forma_pagamento:poupeja_payment_methods(id, name)
        `)
        .single();

      if (error) throw error;
      dispatch({ type: 'UPDATE_LANCAMENTO', payload: data });
    } catch (err) {
      console.error('Error updating lançamento:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar lançamento.' });
      throw err;
    }
  }, [state.user]);

  const deleteLancamento = useCallback(async (id: string) => {
    if (!state.user) return;
    try {
      const { error } = await supabase
        .from('poupeja_lancamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      dispatch({ type: 'DELETE_LANCAMENTO', payload: id });
    } catch (err) {
      console.error('Error deleting lançamento:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar lançamento.' });
      throw err;
    }
  }, [state.user]);

  // ===================================================
  // ✅ EFEITOS
  // ===================================================

  // ✅ CORRIGIDO: Efeito para o listener de autenticação
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(
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

    // Cleanup function corrigida
    return () => {
      if (data && data.subscription && typeof data.subscription.unsubscribe === 'function') {
        data.subscription.unsubscribe();
      }
    };
  }, []);

  // ✅ EFEITO ATUALIZADO: Buscar dados quando usuário muda
  useEffect(() => {
    if (state.user) {
      getCategories();
      getPaymentMethods();
      getSuppliers();
      getLancamentos(); // ✅ NOVO
    } else {
      // Limpar estados quando não há usuário
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
      dispatch({ type: 'SET_PAYMENT_METHODS', payload: [] });
      dispatch({ type: 'SET_SUPPLIERS', payload: [] });
      dispatch({ type: 'SET_LANCAMENTOS', payload: [] }); // ✅ NOVO
    }
  }, [state.user, state.accountType, getCategories, getPaymentMethods, getSuppliers, getLancamentos]);
  
  // ===================================================
  // ✅ VALORES COMPUTADOS
  // ===================================================
  
  const parentCategories = useMemo(() => {
    return state.categories.filter(cat => !cat.parent_id);
  }, [state.categories]);

  const subcategories = useMemo(() => {
    return state.categories.filter(cat => cat.parent_id);
  }, [state.categories]);
  
  // ===================================================
  // ✅ CONTEXTO VALUE
  // ===================================================
  
  const value = useMemo(() => ({
    ...state,
    dispatch,
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
    setAccountType,
    
    // Categorias
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    
    // Métodos de Pagamento
    getPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    
    // Fornecedores
    getSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    
    // ✅ LANÇAMENTOS (NOVO)
    getLancamentos,
    addLancamento,
    updateLancamento,
    deleteLancamento,
    
    // Computed values
    parentCategories,
    subcategories,
  }), [
    state,
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
    setAccountType,
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getLancamentos,
    addLancamento,
    updateLancamento,
    deleteLancamento,
    parentCategories,
    subcategories,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ===================================================
// ✅ HOOKS CUSTOMIZADOS (MANTIDOS)
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

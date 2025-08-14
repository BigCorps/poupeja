// src/contexts/AppContext.tsx - VERSÃO COMPLETA E CORRIGIDA
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, TimeRange } from '@/types';

// ===================================================
// ✅ INTERFACES E TIPOS COMPLETOS
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
  is_default: boolean;
}

interface DefaultPaymentMethod {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface Supplier {
  id: string;
  user_id: string;
  name: string;
  type: 'supplier' | 'customer' | 'client' | 'both';
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  document: string | null;
  address: string | null;
}

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

interface CashFlowData {
  id: string;
  user_id: string;
  account_type: 'PF' | 'PJ';
  date: string;
  entradas: number;
  saidas: number;
  saldo_dia: number;
  saldo_acumulado: number;
  created_at: string;
  updated_at: string;
}

interface DREData {
  user_id: string;
  account_type: 'PF' | 'PJ';
  ano: number;
  mes: number;
  categoria_nome: string;
  categoria_tipo: string;
  parent_id: string | null;
  receitas: number;
  despesas: number;
  total_lancamentos: number;
}

interface AppState {
  // Dados principais
  categories: Category[];
  paymentMethods: PaymentMethod[];
  defaultPaymentMethods: DefaultPaymentMethod[];
  suppliers: Supplier[];
  lancamentos: Lancamento[];
  cashFlowData: CashFlowData[];
  dreData: DREData[];
  
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

// ===================================================
// ✅ ACTIONS COMPLETAS
// ===================================================

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SESSION'; payload: any }
  | { type: 'TOGGLE_HIDE_VALUES' }
  | { type: 'SET_TIME_RANGE'; payload: TimeRange }
  | { type: 'SET_CUSTOM_DATE_RANGE'; payload: { startDate: string; endDate: string } }
  | { type: 'SET_ACCOUNT_TYPE'; payload: 'PF' | 'PJ' }
  | { type: 'SET_AUTH_READY'; payload: boolean }
  // Categories
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  // Payment Methods
  | { type: 'SET_PAYMENT_METHODS'; payload: PaymentMethod[] }
  | { type: 'SET_DEFAULT_PAYMENT_METHODS'; payload: DefaultPaymentMethod[] }
  | { type: 'ADD_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'UPDATE_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'DELETE_PAYMENT_METHOD'; payload: string }
  // Suppliers
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'DELETE_SUPPLIER'; payload: string }
  // Lançamentos
  | { type: 'SET_LANCAMENTOS'; payload: Lancamento[] }
  | { type: 'ADD_LANCAMENTO'; payload: Lancamento }
  | { type: 'UPDATE_LANCAMENTO'; payload: Lancamento }
  | { type: 'DELETE_LANCAMENTO'; payload: string }
  // Cash Flow
  | { type: 'SET_CASH_FLOW_DATA'; payload: CashFlowData[] }
  | { type: 'ADD_CASH_FLOW_DATA'; payload: CashFlowData }
  | { type: 'UPDATE_CASH_FLOW_DATA'; payload: CashFlowData }
  // DRE
  | { type: 'SET_DRE_DATA'; payload: DREData[] };

// ===================================================
// ✅ ESTADO INICIAL
// ===================================================

const initialAppState: AppState = {
  categories: [],
  paymentMethods: [],
  defaultPaymentMethods: [],
  suppliers: [],
  lancamentos: [],
  cashFlowData: [],
  dreData: [],
  isLoading: false,
  error: null,
  user: null,
  session: null,
  hideValues: false,
  timeRange: 'month',
  customStartDate: null,
  customEndDate: null,
  accountType: 'PF',
  isAuthReady: false,
};

// ===================================================
// ✅ REDUCER COMPLETO
// ===================================================

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
    case 'SET_ACCOUNT_TYPE':
      return { ...state, accountType: action.payload };
    case 'SET_AUTH_READY':
      return { ...state, isAuthReady: action.payload };
    // Categories
    case 'SET_CATEGORIES':
      return { ...state, categories: Array.isArray(action.payload) ? action.payload : [] };
    case 'ADD_CATEGORY':
      return { ...state, categories: [action.payload, ...state.categories] };
    case 'UPDATE_CATEGORY':
      return { ...state, categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };
    // Payment Methods
    case 'SET_PAYMENT_METHODS':
      return { ...state, paymentMethods: Array.isArray(action.payload) ? action.payload : [] };
    case 'SET_DEFAULT_PAYMENT_METHODS':
      return { ...state, defaultPaymentMethods: Array.isArray(action.payload) ? action.payload : [] };
    case 'ADD_PAYMENT_METHOD':
      return { ...state, paymentMethods: [action.payload, ...state.paymentMethods] };
    case 'UPDATE_PAYMENT_METHOD':
      return { ...state, paymentMethods: state.paymentMethods.map(pm => pm.id === action.payload.id ? action.payload : pm) };
    case 'DELETE_PAYMENT_METHOD':
      return { ...state, paymentMethods: state.paymentMethods.filter(pm => pm.id !== action.payload) };
    // Suppliers
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: Array.isArray(action.payload) ? action.payload : [] };
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [action.payload, ...state.suppliers] };
    case 'UPDATE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };
    // Lançamentos
    case 'SET_LANCAMENTOS':
      return { ...state, lancamentos: Array.isArray(action.payload) ? action.payload : [] };
    case 'ADD_LANCAMENTO':
      return { ...state, lancamentos: [action.payload, ...state.lancamentos] };
    case 'UPDATE_LANCAMENTO':
      return { ...state, lancamentos: state.lancamentos.map(l => l.id === action.payload.id ? action.payload : l) };
    case 'DELETE_LANCAMENTO':
      return { ...state, lancamentos: state.lancamentos.filter(l => l.id !== action.payload) };
    // Cash Flow
    case 'SET_CASH_FLOW_DATA':
      return { ...state, cashFlowData: Array.isArray(action.payload) ? action.payload : [] };
    case 'ADD_CASH_FLOW_DATA':
      return { ...state, cashFlowData: [action.payload, ...state.cashFlowData] };
    case 'UPDATE_CASH_FLOW_DATA':
      return { ...state, cashFlowData: state.cashFlowData.map(cf => cf.id === action.payload.id ? action.payload : cf) };
    // DRE
    case 'SET_DRE_DATA':
      return { ...state, dreData: Array.isArray(action.payload) ? action.payload : [] };
    default:
      return state;
  }
};

// ===================================================
// ✅ INTERFACE DO CONTEXTO
// ===================================================

interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  toggleHideValues: () => void;
  logout: () => void;
  setTimeRange: (timeRange: TimeRange) => void;
  setCustomDateRange: (startDate: string, endDate: string) => void;
  setAccountType: (accountType: 'PF' | 'PJ') => void;
  
  // Categories
  getCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Payment Methods
  getPaymentMethods: () => Promise<void>;
  getDefaultPaymentMethods: () => Promise<void>;
  addPaymentMethod: (paymentMethod: Omit<PaymentMethod, 'id' | 'user_id'>) => Promise<void>;
  updatePaymentMethod: (paymentMethod: PaymentMethod) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  
  // Suppliers
  getSuppliers: () => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'user_id'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  // Lançamentos
  getLancamentos: () => Promise<void>;
  addLancamento: (lancamento: Omit<Lancamento, 'id' | 'created_at' | 'user_id' | 'updated_at'>) => Promise<void>;
  updateLancamento: (lancamento: Lancamento) => Promise<void>;
  deleteLancamento: (id: string) => Promise<void>;
  
  // Cash Flow
  getCashFlowData: (startDate?: string, endDate?: string) => Promise<void>;
  generateCashFlowData: (startDate: string, endDate: string) => Promise<void>;
  
  // DRE
  getDREData: (year: number) => Promise<void>;
  
  // Computed values
  parentCategories: Category[];
  subcategories: Category[];
  allPaymentMethods: (PaymentMethod | DefaultPaymentMethod)[];
}

// ===================================================
// ✅ CONTEXTO
// ===================================================

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// ✅ CORREÇÃO: Exportar também como useApp para compatibilidade
export const useApp = useAppContext;

// ===================================================
// ✅ PROVIDER COMPLETO
// ===================================================

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  // ===================================================
  // ✅ FUNÇÕES BÁSICAS
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
    try {
      await supabase.auth.signOut();
      dispatch({ type: 'SET_USER', payload: null });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }, []);

  // ===================================================
  // ✅ FUNÇÕES DE CATEGORIAS
  // ===================================================

  const getCategories = useCallback(async () => {
    try {
      if (!state.user) return;
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const { data, error } = await supabase
        .from('poupeja_categories')
        .select('*')
        .or(`user_id.eq.${state.user.id},is_default.eq.true`)
        .order('name');

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
    if (!state.user) throw new Error('Usuário não autenticado');
    
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .insert({ 
          ...category, 
          user_id: state.user.id,
          is_default: false 
        })
        .select()
        .single();
      
      if (error) throw error;
      dispatch({ type: 'ADD_CATEGORY', payload: data });
    } catch (err) {
      console.error('Erro ao adicionar categoria:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar categoria.' });
      throw err;
    }
  }, [state.user]);

  const updateCategory = useCallback(async (category: Category) => {
    if (!state.user) throw new Error('Usuário não autenticado');
    
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .update({
          name: category.name,
          type: category.type,
          color: category.color,
          parent_id: category.parent_id
        })
        .eq('id', category.id)
        .eq('user_id', state.user.id)
        .select()
        .single();
      
      if (error) throw error;
      dispatch({ type: 'UPDATE_CATEGORY', payload: data });
    } catch (err) {
      console.error('Erro ao atualizar categoria:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar categoria.' });
      throw err;
    }
  }, [state.user]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!state.user) throw new Error('Usuário não autenticado');
    
    try {
      const { error } = await supabase
        .from('poupeja_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', state.user.id);
      
      if (error) throw error;
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
    } catch (err) {
      console.error('Erro ao deletar categoria:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar categoria.' });
      throw err;
    }
  }, [state.user]);

  // ===================================================
  // ✅ FUNÇÕES DE MÉTODOS DE PAGAMENTO
  // ===================================================

  const getDefaultPaymentMethods = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('poupeja_default_payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error("Erro ao buscar métodos de pagamento padrão:", error);
        dispatch({ type: 'SET_DEFAULT_PAYMENT_METHODS', payload: [] });
      } else {
        dispatch({ type: 'SET_DEFAULT_PAYMENT_METHODS', payload: data || [] });
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar métodos de pagamento padrão:", err);
      dispatch({ type: 'SET_DEFAULT_PAYMENT_METHODS', payload: [] });
    }
  }, []);

  const getPaymentMethods = useCallback(async () => {
    try {
      if (!state.user) return;
      
      const { data, error } = await supabase
        .from('poupeja_payment_methods')
        .select('*')
        .eq('user_id', state.user.id)
        .order('name');

      if (error) {
        console.error("Erro ao buscar métodos de pagamento:", error);
        dispatch({ type: 'SET_PAYMENT_METHODS', payload: [] });
      } else {
        dispatch({ type: 'SET_PAYMENT_METHODS', payload: data || [] });
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar métodos de pagamento:", err);
      dispatch({ type: 'SET_PAYMENT_METHODS', payload: [] });
    }
  }, [state.user]);

  const addPaymentMethod = useCallback(async (paymentMethod: Omit<PaymentMethod, 'id' | 'user_id'>) => {
    if (!state.user) throw new Error('Usuário não autenticado');
    
    try {
      const { data, error } = await supabase
        .from('poupeja_payment_methods')
        .insert({
          name: paymentMethod.name,
          user_id: state.user.id,
          is_default: paymentMethod.is_default
        })
        .select()
        .single();
      
      if (error) throw error;
      dispatch({ type: 'ADD_PAYMENT_METHOD', payload: data });
    } catch (err) {
      console.error('Erro ao adicionar método de pagamento:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar método de pagamento.' });
      throw err;
    }
  }, [state.user]  const updatePaymentMethod = useCallback(async (paymentMethod: PaymentMethod) => {
    if (!state.user) throw new Error("Usuário não autenticado");
    
    try {
      const { data, error } = await supabase
        .from("poupeja_payment_methods")
        .update({
          name: paymentMethod.name,
          is_default: paymentMethod.is_default
        })
        .eq("id", paymentMethod.id)
        .eq("user_id", state.user.id)
        .select()
        .single();
      
      if (error) throw error;
      dispatch({ type: "UPDATE_PAYMENT_METHOD", payload: data });
    } catch (err) {
      console.error("Erro ao atualizar método de pagamento:", err);
      dispatch({ type: "SET_ERROR", payload: "Erro ao atualizar método de pagamento." });
      throw err;
    }
  }, [state.user]); useCallback(async (id: string) => {
    if (!state.user) throw new Error('Usuário não autenticado');
    
    try {
      const { error } = await supabase
        .from('poupeja_payment_methods')
        .delete()
        .eq('id', id)
        .eq('user_id', state.user.id);
      
      if (error) throw error;
      dispatch({ type: 'DELETE_PAYMENT_METHOD', payload: id });
    } catch (err) {
      console.error('Erro ao deletar método de pagamento:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar método de pagamento.' });
      throw err;
    }
  }, [state.user]);

  // ===================================================
  // ✅ FUNÇÕES DE FORNECEDORES
  // ===================================================

  const getSuppliers = useCallback(async () => {
    try {
      if (!state.user) return;
      
      const { data, error } = await supabase
        .from('poupeja_suppliers')
        .select('*')
        .eq('user_id', state.user.id)
        .order('name');

      if (error) {
        console.error("Erro ao buscar fornecedores:", error);
        dispatch({ type: 'SET_SUPPLIERS', payload: [] });
      } else {
        dispatch({ type: 'SET_SUPPLIERS', payload: data || [] });
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar fornecedores:", err);
      dispatch({ type: 'SET_SUPPLIERS', payload: [] });
    }
  }, [state.user]);

  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id' | 'user_id'>) => {
    if (!state.user) throw new Error('Usuário não autenticado');
    
    try {
      const { data, error } = await supabase
        .from('poupeja_suppliers')
        .insert({ ...supplier, user_id: state.user.id })
        .select()
        .single();
      
      if (error) throw error;
      dispatch({ type: 'ADD_SUPPLIER', payload: data });
    } catch (err) {
      console.error('Erro ao adicionar fornecedor:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar fornecedor.' });
      throw err;
    }
  }, [state.user]);

  const updateSupplier = useCallback(async (supplier: Supplier) => {
    if (!state.user) throw new Error('Usuário não autenticado');
    
    try {
      const { data, error } = await supabase
        .from('poupeja_suppliers')
        .update(supplier)
        .eq('id', supplier.id)
        .eq('user_id', state.user.id)
        .select()
        .single();
      
      if (error) throw error;
      dispatch({ type: 'UPDATE_SUPPLIER', payload: data });
    } catch (err) {
      console.error('Erro ao atualizar fornecedor:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar fornecedor.' });
      throw err;
    }
  }, [state.user]);

  const deleteSupplier = useCallback(async (id: string) => {
    if (!state.user) throw new Error('Usuário não autenticado');
    
    try {
      const { error } = await supabase
        .from('poupeja_suppliers')
        .delete()
        .eq('id', id)
        .eq('user_id', state.user.id);
      
      if (error) throw error;
      dispatch({ type: 'DELETE_SUPPLIER', payload: id });
    } catch (err) {
      console.error('Erro ao deletar fornecedor:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar fornecedor.' });
      throw err;
    }
  }, [state.user]);

  // ===================================================
  // ✅ FUNÇÕES DE LANÇAMENTOS
  // ===================================================

  const getLancamentos = useCallback(async () => {
    try {
      if (!state.user) return;
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const { data, error } = await supabase
        .from('poupeja_lancamentos')
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
    if (!state.user) throw new Error('Usuário não autenticado');
    
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
      console.error('Erro ao adicionar lançamento:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao adicionar lançamento.' });
      throw err;
    }
  }, [state.user, state.accountType]);

  const updateLancamento = useCallback(async (lancamento: Lancamento) => {
    if (!state.user) throw new Error('Usuário não autenticado');
    
    try {
      const { data, error } = await supabase
        .from('poupeja_lancamentos')
        .update(lancamento)
        .eq('id', lancamento.id)
        .eq('user_id', state.user.id)
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
      console.error('Erro ao atualizar lançamento:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar lançamento.' });
      throw err;
    }
  }, [state.user]);

  const deleteLancamento = useCallback(async (id: string) => {
    if (!state.user) throw new Error('Usuário não autenticado');
    
    try {
      const { error } = await supabase
        .from('poupeja_lancamentos')
        .delete()
        .eq('id', id)
        .eq('user_id', state.user.id);

      if (error) throw error;
      dispatch({ type: 'DELETE_LANCAMENTO', payload: id });
    } catch (err) {
      console.error('Erro ao deletar lançamento:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao deletar lançamento.' });
      throw err;
    }
  }, [state.user]);

  // ===================================================
  // ✅ FUNÇÕES DE FLUXO DE CAIXA
  // ===================================================

  const getCashFlowData = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      if (!state.user) return;
      
      let query = supabase
        .from('poupeja_cash_flow')
        .select('*')
        .eq('user_id', state.user.id)
        .eq('account_type', state.accountType)
        .order('date', { ascending: true });

      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar dados do fluxo de caixa:", error);
        dispatch({ type: 'SET_CASH_FLOW_DATA', payload: [] });
      } else {
        dispatch({ type: 'SET_CASH_FLOW_DATA', payload: data || [] });
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar dados do fluxo de caixa:", err);
      dispatch({ type: 'SET_CASH_FLOW_DATA', payload: [] });
    }
  }, [state.user, state.accountType]);

  const generateCashFlowData = useCallback(async (startDate: string, endDate: string) => {
    if (!state.user) throw new Error('Usuário não autenticado');
    
    try {
      // Buscar lançamentos no período
      const { data: lancamentos, error: lancamentosError } = await supabase
        .from('poupeja_lancamentos')
        .select('data_referencia, classificacao, valor_pago, status_pagamento')
        .eq('user_id', state.user.id)
        .eq('account_type', state.accountType)
        .gte('data_referencia', startDate)
        .lte('data_referencia', endDate)
        .eq('status_pagamento', 'pago');

      if (lancamentosError) throw lancamentosError;

      // Agrupar por data
      const cashFlowByDate = new Map();
      let saldoAcumulado = 0;

      lancamentos?.forEach(lancamento => {
        const date = lancamento.data_referencia;
        if (!cashFlowByDate.has(date)) {
          cashFlowByDate.set(date, { entradas: 0, saidas: 0 });
        }
        
        const dayData = cashFlowByDate.get(date);
        if (lancamento.classificacao === 'receita') {
          dayData.entradas += lancamento.valor_pago;
        } else {
          dayData.saidas += lancamento.valor_pago;
        }
      });

      // Preparar dados para inserção
      const cashFlowData = Array.from(cashFlowByDate.entries()).map(([date, data]) => {
        const saldoDia = data.entradas - data.saidas;
        saldoAcumulado += saldoDia;
        
        return {
          user_id: state.user!.id,
          account_type: state.accountType,
          date,
          entradas: data.entradas,
          saidas: data.saidas,
          saldo_dia: saldoDia,
          saldo_acumulado: saldoAcumulado
        };
      });

      // Inserir ou atualizar dados
      const { error: upsertError } = await supabase
        .from('poupeja_cash_flow')
        .upsert(cashFlowData, { 
          onConflict: 'user_id,account_type,date' 
        });

      if (upsertError) throw upsertError;

      // Recarregar dados
      await getCashFlowData(startDate, endDate);
    } catch (err) {
      console.error('Erro ao gerar dados do fluxo de caixa:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao gerar dados do fluxo de caixa.' });
      throw err;
    }
  }, [state.user, state.accountType, getCashFlowData]);

  // ===================================================
  // ✅ FUNÇÕES DE DRE
  // ===================================================

  const getDREData = useCallback(async (year: number) => {
    try {
      if (!state.user) return;
      
      const { data, error } = await supabase
        .from('poupeja_dre_data')
        .select('*')
        .eq('user_id', state.user.id)
        .eq('account_type', state.accountType)
        .eq('ano', year);

      if (error) {
        console.error("Erro ao buscar dados do DRE:", error);
        dispatch({ type: 'SET_DRE_DATA', payload: [] });
      } else {
        dispatch({ type: 'SET_DRE_DATA', payload: data || [] });
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar dados do DRE:", err);
      dispatch({ type: 'SET_DRE_DATA', payload: [] });
    }
  }, [state.user, state.accountType]);

  // ===================================================
  // ✅ EFEITOS
  // ===================================================

  // Listener de autenticação corrigido
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

    // Cleanup corrigido
    return () => {
      if (data?.subscription?.unsubscribe) {
        data.subscription.unsubscribe();
      }
    };
  }, []);

  // Carregar dados quando usuário muda
  useEffect(() => {
    if (state.user) {
      Promise.all([
        getCategories(),
        getPaymentMethods(),
        getDefaultPaymentMethods(),
        getSuppliers(),
        getLancamentos()
      ]).catch(error => {
        console.error('Erro ao carregar dados iniciais:', error);
      });
    } else {
      // Limpar estados quando não há usuário
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
      dispatch({ type: 'SET_PAYMENT_METHODS', payload: [] });
      dispatch({ type: 'SET_DEFAULT_PAYMENT_METHODS', payload: [] });
      dispatch({ type: 'SET_SUPPLIERS', payload: [] });
      dispatch({ type: 'SET_LANCAMENTOS', payload: [] });
      dispatch({ type: 'SET_CASH_FLOW_DATA', payload: [] });
      dispatch({ type: 'SET_DRE_DATA', payload: [] });
    }
  }, [state.user, state.accountType, getCategories, getPaymentMethods, getDefaultPaymentMethods, getSuppliers, getLancamentos]);
  
  // ===================================================
  // ✅ VALORES COMPUTADOS
  // ===================================================
  
  const parentCategories = useMemo(() => {
    return state.categories.filter(cat => !cat.parent_id);
  }, [state.categories]);

  const subcategories = useMemo(() => {
    return state.categories.filter(cat => cat.parent_id);
  }, [state.categories]);

  const allPaymentMethods = useMemo(() => {
    // Combinar métodos padrão e personalizados
    const defaultMethods = state.defaultPaymentMethods.map(method => ({
      ...method,
      user_id: 'default',
      type: 'other' as const,
      is_default: true
    }));
    
    return [...defaultMethods, ...state.paymentMethods];
  }, [state.defaultPaymentMethods, state.paymentMethods]);
  
  // ===================================================
  // ✅ VALOR DO CONTEXTO
  // ===================================================
  
  const value = useMemo(() => ({
    ...state,
    dispatch,
    toggleHideValues,
    logout,
    setCustomDateRange,
    setTimeRange,
    setAccountType,
    
    // Categories
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    
    // Payment Methods
    getPaymentMethods,
    getDefaultPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    
    // Suppliers
    getSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    
    // Lançamentos
    getLancamentos,
    addLancamento,
    updateLancamento,
    deleteLancamento,
    
    // Cash Flow
    getCashFlowData,
    generateCashFlowData,
    
    // DRE
    getDREData,
    
    // Computed values
    parentCategories,
    subcategories,
    allPaymentMethods,
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
    getDefaultPaymentMethods,
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
    getCashFlowData,
    generateCashFlowData,
    getDREData,
    parentCategories,
    subcategories,
    allPaymentMethods,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppProvider;

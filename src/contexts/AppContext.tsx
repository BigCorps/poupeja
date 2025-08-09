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
  // Novo estado para o tipo de conta (PF ou PJ)
  accountType: 'PF' | 'PJ';
}

interface AppContextType extends AppState {
  // Ações básicas
  dispatch: React.Dispatch<AppAction>;
  toggleHideValues: () => void;
  logout: () => Promise<void>;
  setTimeRange: (range: TimeRange) => void;
  setCustomDateRange: (start: string | null, end: string | null) => void;
  recalculateGoalAmounts: (transactions: Transaction[]) => void;
  getTransactions: () => Promise<void>;
  getCategories: () => Promise<void>;
  getGoals: () => Promise<Goal[]>;
  getScheduledTransactions: () => Promise<void>;
  
  // Transações
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Categorias
  addCategory: (category: Partial<Category>) => Promise<void>;
  updateCategory: (category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Metas
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Transações Agendadas
  addScheduledTransaction: (scheduledTransaction: ScheduledTransaction) => Promise<void>;
  updateScheduledTransaction: (scheduledTransaction: ScheduledTransaction) => Promise<void>;
  deleteScheduledTransaction: (id: string) => Promise<void>;
}

// ===================================================
// ESTADO E ACTIONS
// ===================================================

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
  | { type: 'SET_CUSTOM_DATE_RANGE'; payload: { customStartDate: string | null; customEndDate: string | null } }
  | { type: 'SET_FILTERED_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_ACCOUNT_TYPE'; payload: 'PF' | 'PJ' };


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
  timeRange: 'all',
  customStartDate: null,
  customEndDate: null,
  filteredTransactions: [],
  accountType: 'PF', // Valor inicial
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isLoading: false };
    case 'SET_SESSION':
      return { ...state, session: action.payload, isLoading: false };
    case 'TOGGLE_HIDE_VALUES':
      return { ...state, hideValues: !state.hideValues };
    case 'SET_TIME_RANGE':
      return { ...state, timeRange: action.payload };
    case 'SET_CUSTOM_DATE_RANGE':
      return { ...state, customStartDate: action.payload.customStartDate, customEndDate: action.payload.customEndDate };
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
        goals: state.goals.map((g) => (g.id === action.payload.id ? action.payload : g)),
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
    case 'SET_FILTERED_TRANSACTIONS':
      return { ...state, filteredTransactions: action.payload };
    case 'SET_ACCOUNT_TYPE':
      return { ...state, accountType: action.payload };
    default:
      return state;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// ===================================================
// PROVIDER
// ===================================================

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // TRANSFORMAÇÕES DE DADOS PARA CATEGORIAS
  const transformCategory = (data: any): Category => {
    return {
      id: data.id,
      created_at: data.created_at,
      user_id: data.user_id,
      name: data.name,
      type: data.type,
      color: data.color,
      icon: data.icon,
      is_default: data.is_default,
      parent_id: data.parent_id,
    };
  };

  // ✅ NOVO: useEffect para lidar com a autenticação e carregar a sessão inicial
  useEffect(() => {
    const checkSession = async () => {
      const session = await getCurrentSession();
      if (session) {
        const { user } = session;
        dispatch({ type: 'SET_SESSION', payload: session });
        dispatch({ type: 'SET_USER', payload: user });
      }
      setIsAuthReady(true);
    };

    checkSession();
    
    // ✅ NOVO: Listener de autenticação para manter a sessão atualizada
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      dispatch({ type: 'SET_SESSION', payload: session });
      dispatch({ type: 'SET_USER', payload: session?.user || null });
    });

    return () => {
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  // ✅ NOVO: useEffect para obter dados em tempo real, evitando a função `getCategories`
  useEffect(() => {
    // ⚠️ Importante: Só se inscreve se o usuário estiver autenticado
    if (!state.user) return;
    
    // Define a função de limpeza do listener
    let categoriesSubscription: any;
    
    const setupCategoriesSubscription = async () => {
      console.log('AppContext: Setting up real-time categories subscription...');
      
      const subscription = supabase
        .channel('public:poupeja_categories')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'poupeja_categories', filter: `user_id=eq.${state.user.id}` },
          (payload) => {
            // Lógica para lidar com os eventos em tempo real
            console.log('Real-time change received for categories:', payload);
            
            // Recarrega as categorias em cada alteração para manter o estado sincronizado
            const fetchCategories = async () => {
              const { data, error } = await supabase
                .from('poupeja_categories')
                .select('*')
                .eq('user_id', state.user.id);
      
              if (error) {
                console.error("Erro ao recarregar categorias:", error);
                dispatch({ type: 'SET_ERROR', payload: 'Erro ao sincronizar categorias.' });
                return;
              }
              const transformedCategories = (data || []).map(transformCategory);
              dispatch({ type: 'SET_CATEGORIES', payload: transformedCategories });
            };
            fetchCategories();
          }
        )
        .subscribe();
        
        categoriesSubscription = subscription;
    };
    
    setupCategoriesSubscription();

    // Função de limpeza do useEffect que desinscreve o listener
    return () => {
      if (categoriesSubscription) {
        console.log('AppContext: Unsubscribing from categories...');
        categoriesSubscription.unsubscribe();
      }
    };

  }, [state.user]); // ⚠️ O listener é recriado sempre que o usuário muda

  // ⚠️ A função getCategories foi movida para dentro do useEffect,
  // pois a abordagem de tempo real é mais robusta.
  const getCategories = useCallback(async (): Promise<void> => {
    // Esta função agora está vazia ou pode ser usada para um fetch manual se necessário.
    console.log('getCategories: usando o listener de tempo real...');
    // A lógica real agora está no useEffect
  }, []);

  // Outras funções (getGoals, getScheduledTransactions, etc)
  const getGoals = useCallback(async (): Promise<Goal[]> => {
    try {
      if (!state.user) {
        console.log('AppContext: User not authenticated, skipping goal fetch.');
        return [];
      }
      const { data, error } = await supabase
        .from('poupeja_goals')
        .select('*')
        .eq('user_id', state.user.id);

      if (error) throw error;
      
      const goals = (data || []).map(transformGoal);
      dispatch({ type: 'SET_GOALS', payload: goals });
      return goals;
    } catch (error) {
      console.error('Error fetching goals:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao buscar metas' });
      dispatch({ type: 'SET_GOALS', payload: [] });
      throw error;
    }
  }, [state.user]);

  // Outras funções de ação para goals
  const addGoal = async (goal: Goal) => { /* ... */ };
  const updateGoal = async (goal: Goal) => { /* ... */ };
  const deleteGoal = async (id: string) => { /* ... */ };

  // Funções de ação para categorias
  const addCategory = async (category: Partial<Category>) => {
    if (!state.user) throw new Error("Usuário não autenticado.");
    // Lógica para adicionar categoria no Supabase
    const { data, error } = await supabase
      .from('poupeja_categories')
      .insert([{ ...category, user_id: state.user.id }])
      .select()
      .single();
    if (error) throw error;
    dispatch({ type: 'ADD_CATEGORY', payload: transformCategory(data) });
  };
  const updateCategory = async (category: Partial<Category>) => {
    if (!state.user || !category.id) throw new Error("Usuário não autenticado ou ID da categoria ausente.");
    const { data, error } = await supabase
      .from('poupeja_categories')
      .update(category)
      .eq('id', category.id)
      .select()
      .single();
    if (error) throw error;
    dispatch({ type: 'UPDATE_CATEGORY', payload: transformCategory(data) });
  };
  const deleteCategory = async (id: string) => {
    if (!state.user) throw new Error("Usuário não autenticado.");
    const { error } = await supabase
      .from('poupeja_categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
  };

  // Implementação das outras ações...
  const toggleHideValues = () => dispatch({ type: 'TOGGLE_HIDE_VALUES' });
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'SET_USER', payload: null });
    dispatch({ type: 'SET_SESSION', payload: null });
    // Limpar outros estados se necessário
  }, []);
  const setTimeRange = (range: TimeRange) => dispatch({ type: 'SET_TIME_RANGE', payload: range });
  const setCustomDateRange = (start: string | null, end: string | null) => dispatch({ type: 'SET_CUSTOM_DATE_RANGE', payload: { customStartDate: start, customEndDate: end } });
  
  // Funções de ação para transações
  const getTransactions = useCallback(async () => { /* ... */ }, [state.user, state.timeRange, state.customStartDate, state.customEndDate]);
  const addTransaction = async (transaction: Transaction) => { /* ... */ };
  const updateTransaction = async (transaction: Transaction) => { /* ... */ };
  const deleteTransaction = async (id: string) => { /* ... */ };
  
  // Funções de ação para transações agendadas
  const getScheduledTransactions = useCallback(async (): Promise<void> => { /* ... */ }, [state.user]);
  const addScheduledTransaction = async (scheduledTransaction: ScheduledTransaction) => { /* ... */ };
  const updateScheduledTransaction = async (scheduledTransaction: ScheduledTransaction) => { /* ... */ };
  const deleteScheduledTransaction = async (id: string) => { /* ... */ };

  // Funções auxiliares (recalculateGoalAmounts)
  const recalculateGoalAmounts = (transactions: Transaction[]) => {
    const goals = recalculateGoalAmountsService(state.goals, transactions);
    dispatch({ type: 'SET_GOALS', payload: goals });
  };

  const value = useMemo(() => ({
    ...state,
    // Ações básicas
    dispatch,
    toggleHideValues,
    logout,
    setTimeRange,
    setCustomDateRange,
    recalculateGoalAmounts,
    // Funções de busca (agora chamam os listeners de tempo real)
    getTransactions,
    getCategories,
    getGoals,
    getScheduledTransactions,
    // Ações de CRUD para Transações
    addTransaction,
    updateTransaction,
    deleteTransaction,
    // Ações de CRUD para Categorias
    addCategory,
    updateCategory,
    deleteCategory,
    // Ações de CRUD para Metas
    addGoal,
    updateGoal,
    deleteGoal,
    // Ações de CRUD para Transações Agendadas
    addScheduledTransaction,
    updateScheduledTransaction,
    deleteScheduledTransaction,
  }), [
    state,
    toggleHideValues,
    logout,
    setTimeRange,
    setCustomDateRange,
    getTransactions,
    getCategories,
    getGoals,
    getScheduledTransactions,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
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

export { useApp, useAppContext };

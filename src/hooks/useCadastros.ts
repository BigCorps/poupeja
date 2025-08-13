// hooks/useCadastros.ts
import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'payment' | 'receipt' | 'both';
  is_default: boolean;
  is_active: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  type: 'supplier' | 'client' | 'both';
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  parent_id?: string;
  sort_order: number;
  children?: Category[];
}

// Hook para Formas de Pagamento
export const usePaymentMethods = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentMethods = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('poupeja_payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (supabaseError) throw supabaseError;
      setPaymentMethods(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar formas de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const createPaymentMethod = async (data: Omit<PaymentMethod, 'id' | 'is_default' | 'is_active'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data: newMethod, error } = await supabase
      .from('poupeja_payment_methods')
      .insert([{
        ...data,
        user_id: user.id,
        is_default: false,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    
    await loadPaymentMethods();
    return newMethod;
  };

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethod>) => {
    const { error } = await supabase
      .from('poupeja_payment_methods')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    await loadPaymentMethods();
  };

  const deletePaymentMethod = async (id: string) => {
    const { error } = await supabase
      .from('poupeja_payment_methods')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await loadPaymentMethods();
  };

  useEffect(() => {
    loadPaymentMethods();
  }, [user]);

  return {
    paymentMethods,
    loading,
    error,
    refresh: loadPaymentMethods,
    create: createPaymentMethod,
    update: updatePaymentMethod,
    delete: deletePaymentMethod
  };
};

// Hook para Fornecedores/Clientes
export const useSuppliers = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuppliers = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('poupeja_suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (supabaseError) throw supabaseError;
      setSuppliers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async (data: Omit<Supplier, 'id' | 'is_active'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data: newSupplier, error } = await supabase
      .from('poupeja_suppliers')
      .insert([{
        ...data,
        user_id: user.id,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    
    await loadSuppliers();
    return newSupplier;
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const { error } = await supabase
      .from('poupeja_suppliers')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    await loadSuppliers();
  };

  const deleteSupplier = async (id: string) => {
    const { error } = await supabase
      .from('poupeja_suppliers')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    await loadSuppliers();
  };

  useEffect(() => {
    loadSuppliers();
  }, [user]);

  return {
    suppliers,
    loading,
    error,
    refresh: loadSuppliers,
    create: createSupplier,
    update: updateSupplier,
    delete: deleteSupplier
  };
};

// Hook para Categorias com hierarquia
export const useCategories = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const organizeCategories = (cats: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    cats.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    cats.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children!.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  };

  const loadCategories = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('poupeja_categories')
        .select('*')
        .order('sort_order');
      
      if (supabaseError) throw supabaseError;
      
      const organized = organizeCategories(data || []);
      setCategories(organized);
      setFlatCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (data: Omit<Category, 'id' | 'children'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data: newCategory, error } = await supabase
      .from('poupeja_categories')
      .insert([{
        ...data,
        user_id: user.id,
        parent_id: data.parent_id || null
      }])
      .select()
      .single();

    if (error) throw error;
    
    await loadCategories();
    return newCategory;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const { error } = await supabase
      .from('poupeja_categories')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    await loadCategories();
  };

  const deleteCategory = async (id: string) => {
    // Verificar se há subcategorias
    const hasChildren = flatCategories.some(cat => cat.parent_id === id);
    if (hasChildren) {
      throw new Error('Não é possível excluir categoria com subcategorias');
    }

    // Verificar se há transações usando esta categoria
    const { data: transactions } = await supabase
      .from('poupeja_transactions')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (transactions && transactions.length > 0) {
      throw new Error('Não é possível excluir categoria com transações vinculadas');
    }

    const { error } = await supabase
      .from('poupeja_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await loadCategories();
  };

  const getCategoriesByType = (type: 'income' | 'expense') => {
    return categories.filter(cat => cat.type === type);
  };

  const getParentCategories = (type?: 'income' | 'expense') => {
    const parents = categories.filter(cat => !cat.parent_id);
    return type ? parents.filter(cat => cat.type === type) : parents;
  };

  const getSubCategories = (parentId: string) => {
    const parent = flatCategories.find(cat => cat.id === parentId);
    return parent?.children || [];
  };

  useEffect(() => {
    loadCategories();
  }, [user]);

  return {
    categories,
    flatCategories,
    loading,
    error,
    refresh: loadCategories,
    create: createCategory,
    update: updateCategory,
    delete: deleteCategory,
    getCategoriesByType,
    getParentCategories,
    getSubCategories
  };
};

// Hook combinado para usar todos os cadastros
export const useCadastros = () => {
  const paymentMethods = usePaymentMethods();
  const suppliers = useSuppliers();
  const categories = useCategories();

  const loading = paymentMethods.loading || suppliers.loading || categories.loading;
  const errors = [paymentMethods.error, suppliers.error, categories.error].filter(Boolean);

  const refreshAll = async () => {
    await Promise.all([
      paymentMethods.refresh(),
      suppliers.refresh(),
      categories.refresh()
    ]);
  };

  return {
    paymentMethods,
    suppliers,
    categories,
    loading,
    errors,
    refreshAll
  };
};

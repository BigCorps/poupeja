import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { PaymentMethod, Supplier, Category } from '@/types/cadastros';

export function useCadastros() {
  const supabase = useSupabaseClient();
  const { user } = useApp();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (user) {
      loadPaymentMethods();
      loadSuppliers();
      loadCategories();
    }
  }, [user]);

  const loadPaymentMethods = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('poupeja_payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (data && !error) {
      setPaymentMethods(data);
    }
  };

  const loadSuppliers = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('poupeja_suppliers')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (data && !error) {
      setSuppliers(data);
    }
  };

  const loadCategories = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('poupeja_categories')
      .select('*')
      .or(`user_id.eq.${user.id},is_default.eq.true`)
      .order('sort_order');
    
    if (data && !error) {
      setCategories(data);
    }
  };

  const addPaymentMethod = async (method: Omit<PaymentMethod, 'id' | 'user_id'>) => {
    if (!user) return;
    const { error } = await supabase
      .from('poupeja_payment_methods')
      .insert([{ ...method, user_id: user.id }]);
    
    if (!error) {
      loadPaymentMethods();
    }
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'user_id'>) => {
    if (!user) return;
    const { error } = await supabase
      .from('poupeja_suppliers')
      .insert([{ ...supplier, user_id: user.id }]);
    
    if (!error) {
      loadSuppliers();
    }
  };

  const addCategory = async (category: Omit<Category, 'id' | 'user_id'>) => {
    if (!user) return;
    const { error } = await supabase
      .from('poupeja_categories')
      .insert([{ ...category, user_id: user.id }]);
    
    if (!error) {
      loadCategories();
    }
  };

  const deletePaymentMethod = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('poupeja_payment_methods')
      .delete()
      .match({ id });
    
    if (!error) {
      loadPaymentMethods();
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('poupeja_suppliers')
      .delete()
      .match({ id });
    
    if (!error) {
      loadSuppliers();
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('poupeja_categories')
      .delete()
      .match({ id });
    
    if (!error) {
      loadCategories();
    }
  };

  return {
    paymentMethods,
    suppliers,
    categories,
    addPaymentMethod,
    addSupplier,
    addCategory,
    deletePaymentMethod,
    deleteSupplier,
    deleteCategory
  };
}

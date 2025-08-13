import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export function useCategories() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar categorias
  const loadCategories = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Criar categoria
  const createCategory = async (categoryData) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .insert([
          {
            ...categoryData,
            user_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => [...prev, data]);
      return { data, error: null };
    } catch (err) {
      console.error('Erro ao criar categoria:', err);
      return { data: null, error: err.message };
    }
  };

  // Atualizar categoria
  const updateCategory = async (id, categoryData) => {
    try {
      const { data, error } = await supabase
        .from('poupeja_categories')
        .update(categoryData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => prev.map(cat => 
        cat.id === id ? { ...cat, ...data } : cat
      ));
      return { data, error: null };
    } catch (err) {
      console.error('Erro ao atualizar categoria:', err);
      return { data: null, error: err.message };
    }
  };

  // Deletar categoria
  const deleteCategory = async (id) => {
    try {
      const { error } = await supabase
        .from('poupeja_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setCategories(prev => prev.filter(cat => cat.id !== id));
      return { error: null };
    } catch (err) {
      console.error('Erro ao deletar categoria:', err);
      return { error: err.message };
    }
  };

  useEffect(() => {
    loadCategories();
  }, [user]);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: loadCategories
  };
}

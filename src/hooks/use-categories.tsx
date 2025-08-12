import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Assumindo que o cliente Supabase está configurado aqui
import { Category } from '@/types'; // Assumindo que o tipo 'Category' está em '@/types'

// Defina a interface para a categoria, caso ainda não exista
// Se você já tiver em '@/types', pode remover esta definição.
export interface Category {
  id?: string;
  user_id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string; // Adicionado ícone, pois é comum para categorias
  description?: string;
}

/**
 * Custom hook para gerenciar categorias com o Supabase.
 * Fornece dados em tempo real e funções para adicionar, atualizar e excluir.
 */
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // A função de busca inicial de categorias e assinatura para atualizações em tempo real
  useEffect(() => {
    // Busca inicial de dados
    const fetchAndSubscribeCategories = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (fetchError) {
        console.error('Error fetching categories:', fetchError);
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setCategories(data || []);
      setLoading(false);
    };

    fetchAndSubscribeCategories();

    // Assinatura para atualizações em tempo real.
    // 'on' é o equivalente do 'onSnapshot' do Firebase para o Supabase.
    const subscription = supabase
      .channel('public:categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
        console.log('Change received!', payload);
        // Atualiza a lista de categorias com base no evento
        setCategories(prevCategories => {
          if (payload.eventType === 'INSERT') {
            return [...prevCategories, payload.new as Category];
          }
          if (payload.eventType === 'UPDATE') {
            return prevCategories.map(cat => cat.id === payload.new.id ? payload.new as Category : cat);
          }
          if (payload.eventType === 'DELETE') {
            return prevCategories.filter(cat => cat.id !== payload.old.id);
          }
          return prevCategories;
        });
      })
      .subscribe();
      
    // Limpeza da subscrição quando o componente é desmontado
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const addCategory = useCallback(async (newCategory: Omit<Category, 'id'>) => {
    const { error: insertError } = await supabase
      .from('categories')
      .insert(newCategory);
    
    if (insertError) {
      console.error('Error adding category:', insertError);
      setError(insertError.message);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, updatedData: Partial<Category>) => {
    const { error: updateError } = await supabase
      .from('categories')
      .update(updatedData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating category:', updateError);
      setError(updateError.message);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting category:', deleteError);
      setError(deleteError.message);
    }
  }, []);

  return { categories, loading, error, addCategory, updateCategory, deleteCategory };
};

export default useCategories;


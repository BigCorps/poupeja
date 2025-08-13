import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export function useSuppliers() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar fornecedores
  const loadSuppliers = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('poupeja_suppliers')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Erro ao carregar fornecedores:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Criar fornecedor
  const createSupplier = async (supplierData) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      const { data, error } = await supabase
        .from('poupeja_suppliers')
        .insert([
          {
            ...supplierData,
            user_id: user.id,
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      setSuppliers(prev => [...prev, data]);
      return { data, error: null };
    } catch (err) {
      console.error('Erro ao criar fornecedor:', err);
      return { data: null, error: err.message };
    }
  };

  // Atualizar fornecedor
  const updateSupplier = async (id, supplierData) => {
    try {
      const { data, error } = await supabase
        .from('poupeja_suppliers')
        .update(supplierData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setSuppliers(prev => prev.map(sup => 
        sup.id === id ? { ...sup, ...data } : sup
      ));
      return { data, error: null };
    } catch (err) {
      console.error('Erro ao atualizar fornecedor:', err);
      return { data: null, error: err.message };
    }
  };

  // Deletar fornecedor (soft delete)
  const deleteSupplier = async (id) => {
    try {
      const { error } = await supabase
        .from('poupeja_suppliers')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setSuppliers(prev => prev.filter(sup => sup.id !== id));
      return { error: null };
    } catch (err) {
      console.error('Erro ao deletar fornecedor:', err);
      return { error: err.message };
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [user]);

  return {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    refetch: loadSuppliers
  };
}

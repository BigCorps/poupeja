import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export function usePaymentMethods() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar métodos de pagamento
  const loadPaymentMethods = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('poupeja_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (err) {
      console.error('Erro ao carregar métodos de pagamento:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Criar método de pagamento
  const createPaymentMethod = async (paymentData) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      // Se for marcado como padrão, desmarcar outros
      if (paymentData.is_default) {
        await supabase
          .from('poupeja_payment_methods')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('poupeja_payment_methods')
        .insert([
          {
            ...paymentData,
            user_id: user.id,
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      setPaymentMethods(prev => 
        paymentData.is_default 
          ? [data, ...prev.map(p => ({ ...p, is_default: false }))]
          : [...prev, data]
      );
      return { data, error: null };
    } catch (err) {
      console.error('Erro ao criar método de pagamento:', err);
      return { data: null, error: err.message };
    }
  };

  // Atualizar método de pagamento
  const updatePaymentMethod = async (id, paymentData) => {
    try {
      // Se for marcado como padrão, desmarcar outros
      if (paymentData.is_default) {
        await supabase
          .from('poupeja_payment_methods')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', id);
      }

      const { data, error } = await supabase
        .from('poupeja_payment_methods')
        .update(paymentData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setPaymentMethods(prev => prev.map(payment => 
        payment.id === id 
          ? { ...payment, ...data } 
          : paymentData.is_default 
            ? { ...payment, is_default: false }
            : payment
      ));
      return { data, error: null };
    } catch (err) {
      console.error('Erro ao atualizar método de pagamento:', err);
      return { data: null, error: err.message };
    }
  };

  // Deletar método de pagamento (soft delete)
  const deletePaymentMethod = async (id) => {
    try {
      const { error } = await supabase
        .from('poupeja_payment_methods')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setPaymentMethods(prev => prev.filter(payment => payment.id !== id));
      return { error: null };
    } catch (err) {
      console.error('Erro ao deletar método de pagamento:', err);
      return { error: err.message };
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, [user]);

  return {
    paymentMethods,
    loading,
    error,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    refetch: loadPaymentMethods
  };
}

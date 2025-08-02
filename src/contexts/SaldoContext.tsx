// src/contexts/SaldoContext.tsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Substitua pela URL e pela sua chave anon pública do seu projeto Supabase
const supabaseUrl = 'https://duchahfvhvhbyagdslbz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Y2hhaGZ2aHZoYnlhZ2RzbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMDA1ODYsImV4cCI6MjA2OTU3NjU4Nn0.gVCDSD3Ml8kOGCoeRNnDqOaA-cJdfw7dl-j-p6boBrs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SaldoContext = createContext(null);

export const SaldoProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [newAccount, setNewAccount] = useState({ name: '', type: 'Conta Corrente', value: '' });

  // Autenticação e busca de dados
  // ... (O código aqui permanece o mesmo da versão anterior)
  useEffect(() => {
    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUserId(session.user.id);
        fetchAccounts(session.user.id);
      } else {
        setUserId(null);
        setAccounts([]);
        setLoading(false);
      }
    });
    const authenticate = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!data.session) {
        await supabase.auth.signInAnonymously();
      }
    };
    authenticate();
    return () => authListener.data.unsubscribe();
  }, []);

  const fetchAccounts = async (currentUserId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('poupeja_accounts')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error("Erro ao buscar contas:", error);
    } else {
      setAccounts(data);
    }
    setLoading(false);
  };
  
  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (newAccount.name && newAccount.value && userId) {
      setLoading(true);
      const { data, error } = await supabase
        .from('poupeja_accounts')
        .insert([{ ...newAccount, user_id: userId, value: parseFloat(newAccount.value) }])
        .select();
      if (error) {
        console.error("Erro ao adicionar conta:", error);
      } else {
        setAccounts(prev => [...prev, data[0]]);
        setNewAccount({ name: '', type: 'Conta Corrente', value: '' });
      }
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAccount(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setNewAccount(prev => ({ ...prev, type: value }));
  };

  // NOVA FUNÇÃO PARA ATUALIZAR O SALDO
  const updateAccountBalance = useCallback(async (accountId, amount) => {
    if (!accountId || amount === 0) return;
    try {
      const { data: currentAccountData, error: fetchError } = await supabase
        .from('poupeja_accounts')
        .select('value')
        .eq('id', accountId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const newValue = currentAccountData.value + amount;

      const { data, error } = await supabase
        .from('poupeja_accounts')
        .update({ value: newValue })
        .eq('id', accountId)
        .select();

      if (error) {
        throw error;
      }

      // Atualiza o estado local
      setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, value: newValue } : acc));
    } catch (error) {
      console.error("Erro ao atualizar o saldo da conta:", error);
    }
  }, []);


  const totals = useMemo(() => {
    // ... (A lógica de cálculo de totais permanece a mesma)
    const totalWorkingCapital = accounts.filter(acc => acc.type === 'Conta Corrente').reduce((sum, acc) => sum + acc.value, 0);
    const totalInvestments = accounts.filter(acc => acc.type === 'Investimento').reduce((sum, acc) => sum + acc.value, 0);
    const totalCards = accounts.filter(acc => acc.type === 'Cartão de Crédito').reduce((sum, acc) => sum + acc.value, 0);
    const grandTotal = totalWorkingCapital + totalInvestments + totalCards;
    return { totalWorkingCapital, totalInvestments, totalCards, grandTotal };
  }, [accounts]);

  const value = {
    accounts,
    loading,
    newAccount,
    handleInputChange,
    handleSelectChange,
    handleAddAccount,
    updateAccountBalance, // Adicione a nova função ao contexto
    totals,
  };

  return <SaldoContext.Provider value={value}>{children}</SaldoContext.Provider>;
};

export const useSaldoContext = () => {
  const context = useContext(SaldoContext);
  if (context === null) {
    throw new Error('useSaldoContext must be used within a SaldoProvider');
  }
  return context;
};

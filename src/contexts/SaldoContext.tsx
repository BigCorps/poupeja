// src/contexts/SaldoContext.tsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// Substitua pela URL e pela sua chave anon pública do seu projeto Supabase
const supabaseUrl = 'https://duchahfvhvhbyagdslbz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Y2hhaGZ2aHZoYnlhZ2RzbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMDA1ODYsImV4cCI6MjA2OTU3NjU4Nn0.gVCDSD3Ml8kOGCoeRNnDqOaA-cJdfw7dl-j-p6boBrs';

// Inicializa o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SaldoContext = createContext(null);

export const SaldoProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [newAccount, setNewAccount] = useState({ name: '', type: 'Conta Corrente', value: '' });

  // Autenticação e busca de dados
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
    // Tenta autenticar anonimamente se não houver sessão
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

  const totals = useMemo(() => {
    // Lógica de cálculo de totais
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
    totals,
    // Outras funções como updateAccount e deleteAccount podem ser adicionadas aqui
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

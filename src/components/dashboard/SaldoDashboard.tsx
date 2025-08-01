import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, CreditCard, Banknote, Landmark } from 'lucide-react';

// Variáveis globais fornecidas pelo ambiente
const __app_id = typeof window !== 'undefined' && window.__app_id;
const __firebase_config = typeof window !== 'undefined' && window.__firebase_config;
const __initial_auth_token = typeof window !== 'undefined' && window.__initial_auth_token;

// Inicializa o cliente Supabase
const supabase = createClient(
  'https://duchahfvhvhbyagdslbz.supabase.co', // Substitua pela URL do seu projeto Supabase
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Y2hhaGZ2aHZoYnlhZ2RzbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMDA1ODYsImV4cCI6MjA2OTU3NjU4Nn0.gVCDSD3Ml8kOGCoeRNnDqOaA-cJdfw7dl-j-p6boBrs' // Substitua pela sua chave anon pública
);

// O componente principal do dashboard de saldo
const SaldoDashboard = () => {
  // Estado para armazenar a lista de contas financeiras
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  
  // Estado para o formulário de nova conta
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'Conta Corrente',
    value: ''
  });

  // Efeito para autenticar e buscar os dados iniciais
  useEffect(() => {
    const authenticate = async () => {
      try {
        if (__initial_auth_token) {
          const { error: signInError } = await supabase.auth.signInWithCustomToken(__initial_auth_token);
          if (signInError) {
            console.error("Erro ao autenticar com token:", signInError);
            throw signInError;
          }
        } else {
          const { error: anonymousError } = await supabase.auth.signInAnonymously();
          if (anonymousError) {
            console.error("Erro ao autenticar anonimamente:", anonymousError);
            throw anonymousError;
          }
        }
      } catch (error) {
        console.error("Falha na autenticação:", error);
      }
    };

    const fetchAccounts = async (user) => {
      setLoading(true);
      const { data, error } = await supabase
        .from('poupeja_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao buscar contas:", error);
      } else {
        setAccounts(data);
      }
      setLoading(false);
    };

    const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUserId(session.user.id);
        fetchAccounts(session.user);
      } else {
        setUserId(null);
        setAccounts([]);
      }
    });

    authenticate();

    return () => {
      authListener.data.unsubscribe();
    };
  }, []);

  // Função para lidar com a mudança nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAccount(prev => ({ ...prev, [name]: value }));
  };

  // Função para adicionar uma nova conta no banco de dados
  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (newAccount.name && newAccount.value && userId) {
      setLoading(true);
      const { data, error } = await supabase
        .from('poupeja_accounts')
        .insert([{
          user_id: userId,
          name: newAccount.name,
          type: newAccount.type,
          value: parseFloat(newAccount.value)
        }])
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

  // Memoização dos cálculos para evitar re-renderizações desnecessárias
  const totals = useMemo(() => {
    const totalWorkingCapital = accounts
      .filter(acc => acc.type === 'Conta Corrente')
      .reduce((sum, acc) => sum + acc.value, 0);

    const totalInvestments = accounts
      .filter(acc => acc.type === 'Investimento')
      .reduce((sum, acc) => sum + acc.value, 0);

    const totalCards = accounts
      .filter(acc => acc.type === 'Cartão de Crédito')
      .reduce((sum, acc) => sum + acc.value, 0);
      
    const grandTotal = totalWorkingCapital + totalInvestments + totalCards;

    return {
      totalWorkingCapital,
      totalInvestments,
      totalCards,
      grandTotal
    };
  }, [accounts]);

  // Formatação do valor para moeda brasileira
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Componente para um cartão de resumo
  const SummaryCard = ({ title, value, icon, bgColor, textColor }) => (
    <div className={`p-6 rounded-2xl shadow-lg flex items-center justify-between transform transition-transform duration-300 hover:scale-105 ${bgColor} ${textColor}`}>
      <div>
        <h3 className="text-xl font-semibold mb-1">{title}</h3>
        <p className="text-3xl font-bold">{formatCurrency(value)}</p>
      </div>
      <div className={`p-3 rounded-full ${bgColor} shadow-md`}>
        {icon}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen p-6 md:p-10 font-sans">
      <div className="container mx-auto max-w-7xl">
        {/* Título da seção */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">Seu Saldo</h1>
          <p className="text-lg text-gray-600">Visão geral e cadastro das suas finanças.</p>
        </div>

        {/* Seção de Resumo */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <SummaryCard 
            title="Capital de Giro" 
            value={totals.totalWorkingCapital} 
            icon={<Landmark size={36} className="text-green-500" />} 
            bgColor="bg-white"
            textColor="text-gray-800"
          />
          <SummaryCard 
            title="Aplicações" 
            value={totals.totalInvestments} 
            icon={<Banknote size={36} className="text-indigo-500" />} 
            bgColor="bg-white"
            textColor="text-gray-800"
          />
          <SummaryCard 
            title="Cartões" 
            value={totals.totalCards} 
            icon={<CreditCard size={36} className="text-rose-500" />} 
            bgColor="bg-white"
            textColor="text-gray-800"
          />
          <SummaryCard 
            title="Total Geral" 
            value={totals.grandTotal} 
            icon={<Plus size={36} className="text-white" />} 
            bgColor="bg-purple-600"
            textColor="text-white"
          />
        </section>

        {/* Seção de Cadastro de Contas */}
        <section className="bg-white p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Cadastrar Nova Conta</h2>
          <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newAccount.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="Ex: Nubank, PicPay"
                required
              />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                id="type"
                name="type"
                value={newAccount.type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 transition-all"
              >
                <option value="Conta Corrente">Conta Corrente</option>
                <option value="Investimento">Investimento</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
              <input
                type="number"
                id="value"
                name="value"
                value={newAccount.value}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="Ex: 1500.50"
                step="0.01"
                required
              />
            </div>
            <div className="md:col-span-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:bg-purple-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Adicionando...' : 'Adicionar Conta'}
              </button>
            </div>
          </form>
        </section>

        {/* Seção de Lista de Contas */}
        <section className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Minhas Contas</h2>
          {loading ? (
            <p className="text-center text-gray-500 py-4">Carregando contas...</p>
          ) : accounts.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Nenhuma conta cadastrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.map((account) => (
                    <tr key={account.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {account.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {account.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(account.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SaldoDashboard;

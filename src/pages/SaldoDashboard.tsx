import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, CreditCard, Banknote, Landmark, Wallet } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePreferences } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';

// Variáveis globais fornecidas pelo ambiente
const __app_id = typeof window !== 'undefined' && window.__app_id;
const __firebase_config = typeof window !== 'undefined' && window.__firebase_config;
const __initial_auth_token = typeof window !== 'undefined' && window.__initial_auth_token;

// Inicializa o cliente Supabase
const supabase = createClient(
  'https://duchahfvhvhbyagdslbz.supabase.co', // Substitua pela URL do seu projeto Supabase
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Y2hhaGZ2aHZoYnlhZ2RzbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMDA1ODYsImV4cCI6MjA2OTU3NjU4Nn0.gVCDSD3Ml8kOGCoeRNnDqOaA-cJdfw7dl-j-p6boBrs' // Substitua pela sua chave anon pública
);

// O componente principal da página de saldo
const SaldoDashboard = () => {
  const { t } = usePreferences();

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

  const handleSelectChange = (value) => {
    setNewAccount(prev => ({ ...prev, type: value }));
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
  
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Seu Saldo</h1>
          <p className="text-muted-foreground mt-1">Visão geral e cadastro das suas finanças.</p>
        </div>
      </div>
      
      {/* Seção de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Capital de Giro</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">{formatCurrency(totals.totalWorkingCapital)}</div>
            <div className="p-2 rounded-full bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300">
              <Landmark className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aplicações</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">{formatCurrency(totals.totalInvestments)}</div>
            <div className="p-2 rounded-full bg-purple-100 text-purple-500 dark:bg-purple-900 dark:text-purple-300">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cartões</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">{formatCurrency(totals.totalCards)}</div>
            <div className="p-2 rounded-full bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-300">
              <CreditCard className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card Total Geral */}
        <Card className="flex-1 bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">Total Geral</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">{formatCurrency(totals.grandTotal)}</div>
            <div className="p-2 rounded-full bg-primary-foreground text-primary">
              <Plus className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Cadastro de Contas */}
      <Card className="p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Cadastrar Nova Conta</h2>
        <form onSubmit={handleAddAccount} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div className="col-span-1 sm:col-span-1 md:col-span-1">
            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1 block">Nome</label>
            <Input
              type="text"
              id="name"
              name="name"
              value={newAccount.name}
              onChange={handleInputChange}
              placeholder="Ex: Nubank, PicPay"
              required
            />
          </div>
          <div className="col-span-1 sm:col-span-1 md:col-span-1">
            <label htmlFor="type" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1 block">Tipo</label>
            <Select value={newAccount.type} onValueChange={handleSelectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Conta Corrente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Conta Corrente">Conta Corrente</SelectItem>
                <SelectItem value="Investimento">Investimento</SelectItem>
                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1 sm:col-span-1 md:col-span-1">
            <label htmlFor="value" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1 block">Valor</label>
            <Input
              type="number"
              id="value"
              name="value"
              value={newAccount.value}
              onChange={handleInputChange}
              placeholder="Ex: 1500.50"
              step="0.01"
              required
            />
          </div>
          <div className="col-span-1 sm:col-span-1 md:col-span-1">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Adicionando...' : 'Adicionar Conta'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Seção de Lista de Contas */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Minhas Contas</h2>
        {loading ? (
          <p className="text-center text-muted-foreground py-4">Carregando contas...</p>
        ) : accounts.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Nenhuma conta cadastrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Nome
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {account.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {account.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatCurrency(account.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SaldoDashboard;

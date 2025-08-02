// Variáveis globais fornecidas pelo ambiente
const __app_id = typeof window !== 'undefined' && window.__app_id;
const __firebase_config = typeof window !== 'undefined' && window.__firebase_config;
const __initial_auth_token = typeof window !== 'undefined' && window.__initial_auth_token;

// Inicializa o cliente Supabase
const supabase = createClient(
  'https://duchahfvhvhbyagdslbz.supabase.co', // Substitua pela URL do seu projeto Supabase
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Y2hhaGZ2aHZoYnlhZ2RzbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMDA1ODYsImV4cCI6MjA2OTU3NjU4Nn0.gVCDSD3Ml8kOGCoeRNnDqOaA-cJdfw7dl-j-p6boBrs' // Substitua pela sua chave anon pública
);

// O componente principal da página de saldoimport React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
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
    <MainLayout title={t('nav.balance') || 'Saldo'}>
      <SubscriptionGuard feature="o painel de saldo">
        <motion.div 
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {t('nav.balance') || 'Saldo'}
                </h1>
                <p className="text-muted-foreground">
                  Acompanhe seu saldo e evolução financeira
                </p>
              </div>
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </motion.div>

          {/* Cards de Saldo */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={itemVariants}
          >
            {/* Saldo Atual */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Saldo Atual
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalBalance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Saldo consolidado de todas as contas
                </p>
              </CardContent>
            </Card>

            {/* Variação do Mês */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Variação do Mês
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(0)} {/* Calcular variação mensal */}
                </div>
                <p className="text-xs text-muted-foreground">
                  Comparado ao mês anterior
                </p>
              </CardContent>
            </Card>

            {/* Projeção */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Projeção Final do Mês
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(0)} {/* Calcular projeção */}
                </div>
                <p className="text-xs text-muted-foreground">
                  Baseado nas transações agendadas
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gráfico ou Conteúdo Principal */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
};

export default SaldoDashboard;

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, CreditCard, Banknote, Landmark, Wallet, Edit, Trash2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Variáveis globais fornecidas pelo ambiente
const __app_id = typeof window !== 'undefined' && window.__app_id;
const __firebase_config = typeof window !== 'undefined' && window.__firebase_config;
const __initial_auth_token = typeof window !== 'undefined' && window.__initial_auth_token;

// Interface para tipagem das contas
interface Account {
  id: string;
  user_id: string;
  name: string;
  type: string;
  value: number;
  created_at: string;
}

// O componente principal da página de saldo
const SaldoDashboard = () => {
  const { t } = usePreferences();
  const isMobile = useIsMobile();

  // Estados
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  
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

    const fetchAccounts = async (user: any) => {
      setLoading(true);
      const { data, error } = await supabase
        .from('poupeja_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao buscar contas:", error);
      } else {
        setAccounts(data || []);
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAccount(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setNewAccount(prev => ({ ...prev, type: value }));
  };

  // Função para abrir o formulário de nova conta
  const handleAddAccount = () => {
    setEditingAccount(null);
    setNewAccount({ name: '', type: 'Conta Corrente', value: '' });
    setFormOpen(true);
  };

  // Função para abrir o formulário de edição
  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setNewAccount({
      name: account.name,
      type: account.type,
      value: account.value.toString()
    });
    setFormOpen(true);
  };

  // Função para salvar conta (criar ou editar)
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccount.name && newAccount.value && userId) {
      setLoading(true);
      
      if (editingAccount) {
        // Editando conta existente
        const { data, error } = await supabase
          .from('poupeja_accounts')
          .update({
            name: newAccount.name,
            type: newAccount.type,
            value: parseFloat(newAccount.value)
          })
          .eq('id', editingAccount.id)
          .select();

        if (error) {
          console.error("Erro ao editar conta:", error);
        } else {
          setAccounts(prev => prev.map(acc => 
            acc.id === editingAccount.id ? data[0] : acc
          ));
          setFormOpen(false);
        }
      } else {
        // Criando nova conta
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
          setAccounts(prev => [data[0], ...prev]);
          setFormOpen(false);
        }
      }
      
      setLoading(false);
      setNewAccount({ name: '', type: 'Conta Corrente', value: '' });
    }
  };

  // Função para deletar conta
  const handleDeleteAccount = async (accountId: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      setLoading(true);
      const { error } = await supabase
        .from('poupeja_accounts')
        .delete()
        .eq('id', accountId);

      if (error) {
        console.error("Erro ao deletar conta:", error);
      } else {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId));
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
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Componente do formulário de conta
  const AccountForm = () => (
    <form onSubmit={handleSaveAccount} className="space-y-4">
      <div>
        <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1 block">
          Nome
        </label>
        <Input
          type="text"
          id="name"
          name="name"
          value={newAccount.name}
          onChange={handleInputChange}
          placeholder="Ex: Itaú, Inter"
          required
        />
      </div>
      
      <div>
        <label htmlFor="type" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1 block">
          Tipo
        </label>
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
      
      <div>
        <label htmlFor="value" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1 block">
          Valor
        </label>
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
      
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Salvando...' : editingAccount ? 'Atualizar Conta' : 'Adicionar Conta'}
        </Button>
        <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
  
  return (
    <MainLayout>
      <SubscriptionGuard feature="gestão de saldo">
        <div className="w-full px-4 py-4 md:py-8 pb-20 md:pb-8">
          {/* Desktop Add Button */}
          {!isMobile && (
            <div className="mb-6">
              <Button onClick={handleAddAccount} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Conta
              </Button>
            </div>
          )}

          {/* Content Container */}
          <div className={cn(
            isMobile ? "space-y-4" : "space-y-6"
          )}>
            {/* Header for Mobile */}
            {isMobile && (
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Seu Saldo</h1>
              </div>
            )}

            {/* Desktop Header */}
            {!isMobile && (
              <div>
                <h2 className="text-2xl font-bold text-foreground">Seu Saldo</h2>
                <p className="text-muted-foreground mt-1">Visão geral e cadastro das suas finanças.</p>
              </div>
            )}
            
            {/* Seção de Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Capital de Giro</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-xl md:text-2xl font-bold">{formatCurrency(totals.totalWorkingCapital)}</div>
                  <div className="p-2 rounded-full bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300">
                    <Landmark className="w-4 h-4 md:w-6 md:h-6" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Aplicações</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-xl md:text-2xl font-bold">{formatCurrency(totals.totalInvestments)}</div>
                  <div className="p-2 rounded-full bg-purple-100 text-purple-500 dark:bg-purple-900 dark:text-purple-300">
                    <Wallet className="w-4 h-4 md:w-6 md:h-6" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Cartões</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-xl md:text-2xl font-bold">{formatCurrency(totals.totalCards)}</div>
                  <div className="p-2 rounded-full bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-300">
                    <CreditCard className="w-4 h-4 md:w-6 md:h-6" />
                  </div>
                </CardContent>
              </Card>

              {/* Card Total Geral */}
              <Card className="flex-1 bg-primary text-primary-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-primary-foreground">Total Geral</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-xl md:text-2xl font-bold">{formatCurrency(totals.grandTotal)}</div>
                  <div className="p-2 rounded-full bg-primary-foreground text-primary">
                    <Banknote className="w-4 h-4 md:w-6 md:h-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seção de Lista de Contas */}
            <Card className={cn(isMobile ? "" : "")}>
              <CardHeader>
                <CardTitle className={cn(isMobile ? "text-lg" : "text-xl")}>
                  Minhas Contas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Carregando contas...</p>
                ) : accounts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Nenhuma conta cadastrada ainda.</p>
                    <Button onClick={handleAddAccount} variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar primeira conta
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {accounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{account.name}</div>
                          <div className="text-sm text-muted-foreground">{account.type}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{formatCurrency(account.value)}</div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditAccount(account)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAccount(account.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Floating Action Button */}
        {isMobile && (
          <div className="fixed bottom-20 right-4 z-50">
            <Button 
              onClick={handleAddAccount}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">Adicionar Conta</span>
            </Button>
          </div>
        )}

        {/* Dialog para formulário */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Editar Conta' : 'Adicionar Nova Conta'}
              </DialogTitle>
            </DialogHeader>
            <AccountForm />
          </DialogContent>
        </Dialog>
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default SaldoDashboard;

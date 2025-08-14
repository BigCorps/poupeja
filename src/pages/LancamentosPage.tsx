import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, X, Calendar, DollarSign, Filter, Search } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Lancamento {
  id?: string;
  data_referencia: string;
  classificacao: 'receita' | 'despesa';
  valor_original?: number;
  juros_atraso?: number;
  valor_pago: number;
  categoria_id: string;
  subcategoria_id?: string;
  fornecedor_id?: string;
  forma_pagamento_id: string;
  descricao?: string;
  tipo_lancamento: 'projecao' | 'efetivo';
  data_vencimento: string;
  data_pagamento?: string;
  status_pagamento: 'pago' | 'a_pagar' | 'atrasado';
}

export default function LancamentosPage() {
  const { toast } = useToast();
  const { 
    categories, 
    suppliers, 
    paymentMethods,
    isLoading,
    user
  } = useAppContext();

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Lancamento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClassificacao, setFilterClassificacao] = useState('all');

  const [form, setForm] = useState<Lancamento>({
    data_referencia: format(new Date(), 'yyyy-MM-dd'),
    classificacao: 'despesa',
    valor_original: undefined,
    juros_atraso: undefined,
    valor_pago: 0,
    categoria_id: '',
    subcategoria_id: '',
    fornecedor_id: '',
    forma_pagamento_id: '',
    descricao: '',
    tipo_lancamento: 'efetivo',
    data_vencimento: format(new Date(), 'yyyy-MM-dd'),
    data_pagamento: '',
    status_pagamento: 'a_pagar'
  });

  // Buscar lançamentos do Supabase
  const fetchLancamentos = useCallback(async () => {
    if (!user) return;
    
    try {
      // Aqui você implementaria a busca no Supabase
      // const { data, error } = await supabase.from('poupeja_lancamentos')...
      // Por enquanto, vamos usar um array vazio
      setLancamentos([]);
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error);
      toast({ title: "Erro", description: "Erro ao buscar lançamentos", variant: "destructive" });
    }
  }, [user, toast]);

  useEffect(() => {
    fetchLancamentos();
  }, [fetchLancamentos]);

  // Filtrar categorias principais e subcategorias
  const categoriasPrincipais = categories?.filter(cat => !cat.parent_id && cat.type === form.classificacao) || [];
  const subcategorias = categories?.filter(cat => cat.parent_id === form.categoria_id) || [];

  // Resetar formulário
  const resetForm = useCallback(() => {
    setForm({
      data_referencia: format(new Date(), 'yyyy-MM-dd'),
      classificacao: 'despesa',
      valor_original: undefined,
      juros_atraso: undefined,
      valor_pago: 0,
      categoria_id: '',
      subcategoria_id: '',
      fornecedor_id: '',
      forma_pagamento_id: '',
      descricao: '',
      tipo_lancamento: 'efetivo',
      data_vencimento: format(new Date(), 'yyyy-MM-dd'),
      data_pagamento: '',
      status_pagamento: 'a_pagar'
    });
    setShowForm(false);
    setEditingItem(null);
  }, []);

  // Salvar lançamento
  const handleSave = useCallback(async () => {
    if (!form.categoria_id || !form.forma_pagamento_id || form.valor_pago <= 0) {
      toast({ 
        title: "Erro", 
        description: "Preencha todos os campos obrigatórios", 
        variant: "destructive" 
      });
      return;
    }

    try {
      if (editingItem) {
        // Atualizar lançamento existente
        // await updateLancamento({ ...form, id: editingItem.id });
        toast({ title: "Sucesso", description: "Lançamento atualizado com sucesso" });
      } else {
        // Criar novo lançamento
        // await addLancamento(form);
        toast({ title: "Sucesso", description: "Lançamento criado com sucesso" });
      }
      resetForm();
      fetchLancamentos();
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao salvar lançamento", variant: "destructive" });
    }
  }, [form, editingItem, toast, resetForm, fetchLancamentos]);

  // Editar lançamento
  const handleEdit = useCallback((lancamento: Lancamento) => {
    setForm(lancamento);
    setEditingItem(lancamento);
    setShowForm(true);
  }, []);

  // Deletar lançamento
  const handleDelete = useCallback(async (id: string) => {
    try {
      // await deleteLancamento(id);
      toast({ title: "Sucesso", description: "Lançamento excluído com sucesso" });
      fetchLancamentos();
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao excluir lançamento", variant: "destructive" });
    }
  }, [toast, fetchLancamentos]);

  // Filtrar lançamentos
  const filteredLancamentos = lancamentos.filter(lancamento => {
    const matchesSearch = !searchTerm || 
      lancamento.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suppliers.find(s => s.id === lancamento.fornecedor_id)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || lancamento.status_pagamento === filterStatus;
    const matchesClassificacao = filterClassificacao === 'all' || lancamento.classificacao === filterClassificacao;
    
    return matchesSearch && matchesStatus && matchesClassificacao;
  });

  // Calcular totais
  const totalReceitas = filteredLancamentos
    .filter(l => l.classificacao === 'receita')
    .reduce((sum, l) => sum + l.valor_pago, 0);
  
  const totalDespesas = filteredLancamentos
    .filter(l => l.classificacao === 'despesa')
    .reduce((sum, l) => sum + l.valor_pago, 0);

  const saldoLiquido = totalReceitas - totalDespesas;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lançamentos</h1>
        <p className="text-muted-foreground">
          Gerencie seus lançamentos financeiros
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Receitas</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">Despesas</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Saldo Líquido</span>
            </div>
            <div className={`text-2xl font-bold ${saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lançamentos Financeiros</CardTitle>
              <CardDescription>
                Registre e acompanhe seus lançamentos financeiros
              </CardDescription>
            </div>
            <Button onClick={() => {
              resetForm();
              setShowForm(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Lançamento
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição ou fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="a_pagar">A Pagar</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterClassificacao} onValueChange={setFilterClassificacao}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Classificação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="receita">Receitas</SelectItem>
                <SelectItem value="despesa">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Formulário */}
          {showForm && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data-referencia">Data de Referência *</Label>
                    <Input
                      id="data-referencia"
                      type="date"
                      value={form.data_referencia}
                      onChange={(e) => setForm({ ...form, data_referencia: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="classificacao">Classificação *</Label>
                    <Select
                      value={form.classificacao}
                      onValueChange={(value: 'receita' | 'despesa') => setForm({ 
                        ...form, 
                        classificacao: value,
                        categoria_id: '',
                        subcategoria_id: ''
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor-original">Valor Original</Label>
                    <Input
                      id="valor-original"
                      type="number"
                      step="0.01"
                      value={form.valor_original || ''}
                      onChange={(e) => setForm({ ...form, valor_original: parseFloat(e.target.value) || undefined })}
                      placeholder="0,00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="juros-atraso">Juros em Atraso</Label>
                    <Input
                      id="juros-atraso"
                      type="number"
                      step="0.01"
                      value={form.juros_atraso || ''}
                      onChange={(e) => setForm({ ...form, juros_atraso: parseFloat(e.target.value) || undefined })}
                      placeholder="0,00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor-pago">Valor Pago *</Label>
                    <Input
                      id="valor-pago"
                      type="number"
                      step="0.01"
                      value={form.valor_pago}
                      onChange={(e) => setForm({ ...form, valor_pago: parseFloat(e.target.value) || 0 })}
                      placeholder="0,00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select
                      value={form.categoria_id}
                      onValueChange={(value) => setForm({ ...form, categoria_id: value, subcategoria_id: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasPrincipais.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {subcategorias.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="subcategoria">Subcategoria</Label>
                      <Select
                        value={form.subcategoria_id || ''}
                        onValueChange={(value) => setForm({ ...form, subcategoria_id: value || undefined })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a subcategoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhuma</SelectItem>
                          {subcategorias.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="fornecedor">Fornecedor/Cliente</Label>
                    <Select
                      value={form.fornecedor_id || ''}
                      onValueChange={(value) => setForm({ ...form, fornecedor_id: value || undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {suppliers?.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="forma-pagamento">Forma de Pagamento *</Label>
                    <Select
                      value={form.forma_pagamento_id}
                      onValueChange={(value) => setForm({ ...form, forma_pagamento_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods?.map(method => (
                          <SelectItem key={method.id} value={method.id}>{method.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo-lancamento">Tipo de Lançamento</Label>
                    <Select
                      value={form.tipo_lancamento}
                      onValueChange={(value: 'projecao' | 'efetivo') => setForm({ ...form, tipo_lancamento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efetivo">Efetivo</SelectItem>
                        <SelectItem value="projecao">Projeção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data-vencimento">Data de Vencimento *</Label>
                    <Input
                      id="data-vencimento"
                      type="date"
                      value={form.data_vencimento}
                      onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data-pagamento">Data do Pagamento/Projeção</Label>
                    <Input
                      id="data-pagamento"
                      type="date"
                      value={form.data_pagamento || ''}
                      onChange={(e) => setForm({ ...form, data_pagamento: e.target.value || undefined })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status-pagamento">Status do Pagamento</Label>
                    <Select
                      value={form.status_pagamento}
                      onValueChange={(value: 'pago' | 'a_pagar' | 'atrasado') => setForm({ ...form, status_pagamento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a_pagar">A Pagar</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={form.descricao || ''}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      placeholder="Descrição opcional do lançamento"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={resetForm}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de lançamentos */}
          <div className="space-y-2">
            {filteredLancamentos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum lançamento encontrado
              </div>
            ) : (
              filteredLancamentos.map(lancamento => {
                const categoria = categories?.find(c => c.id === lancamento.categoria_id);
                const subcategoria = categories?.find(c => c.id === lancamento.subcategoria_id);
                const fornecedor = suppliers?.find(s => s.id === lancamento.fornecedor_id);
                const formaPagamento = paymentMethods?.find(p => p.id === lancamento.forma_pagamento_id);

                return (
                  <Card key={lancamento.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant={lancamento.classificacao === 'receita' ? 'default' : 'secondary'}>
                              {lancamento.classificacao === 'receita' ? 'Receita' : 'Despesa'}
                            </Badge>
                            <Badge variant={
                              lancamento.status_pagamento === 'pago' ? 'default' :
                              lancamento.status_pagamento === 'atrasado' ? 'destructive' : 'secondary'
                            }>
                              {lancamento.status_pagamento === 'pago' ? 'Pago' :
                               lancamento.status_pagamento === 'atrasado' ? 'Atrasado' : 'A Pagar'}
                            </Badge>
                            <Badge variant="outline">
                              {lancamento.tipo_lancamento === 'efetivo' ? 'Efetivo' : 'Projeção'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {categoria?.name} {subcategoria && `> ${subcategoria.name}`}
                            {fornecedor && ` • ${fornecedor.name}`}
                            {formaPagamento && ` • ${formaPagamento.name}`}
                          </div>
                          {lancamento.descricao && (
                            <div className="text-sm">{lancamento.descricao}</div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Venc: {format(new Date(lancamento.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                            {lancamento.data_pagamento && (
                              ` • Pago: ${format(new Date(lancamento.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })}`
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className={`font-semibold ${
                              lancamento.classificacao === 'receita' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              R$ {lancamento.valor_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            {(lancamento.valor_original || lancamento.juros_atraso) && (
                              <div className="text-xs text-muted-foreground">
                                {lancamento.valor_original && `Orig: R$ ${lancamento.valor_original.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                {lancamento.juros_atraso && ` Juros: R$ ${lancamento.juros_atraso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(lancamento)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(lancamento.id!)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


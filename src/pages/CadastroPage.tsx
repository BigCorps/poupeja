import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag, User, CreditCard } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
];

export default function CadastroPage() {
  const { toast } = useToast();
  const { 
    categories, 
    suppliers, 
    paymentMethods, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    addSupplier, 
    updateSupplier, 
    deleteSupplier, 
    addPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod,
    isLoading // ✅ Adicionado para exibir um estado de carregamento
  } = useAppContext();

  const [activeTab, setActiveTab] = useState('categorias');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '', type: 'expense', color: '#3B82F6', parent_id: null
  });
  const [supplierForm, setSupplierForm] = useState({
    name: '', type: 'supplier', document: '', email: '', phone: '', address: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    name: '', type: 'both', is_default: false
  });

  // Funções para Categorias
  const handleSaveCategory = useCallback(async () => {
    if (!categoryForm.name.trim()) {
      toast({ title: "Erro", description: "Nome da categoria é obrigatório", variant: "destructive" });
      return;
    }
    
    try {
      if (editingItem) {
        await updateCategory({ ...categoryForm, id: editingItem.id });
        toast({ title: "Sucesso", description: "Categoria atualizada com sucesso" });
      } else {
        await addCategory(categoryForm);
        toast({ title: "Sucesso", description: "Categoria criada com sucesso" });
      }
      resetCategoryForm();
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [categoryForm, editingItem, updateCategory, addCategory, toast]);

  const handleDeleteCategory = useCallback(async (id) => {
    try {
      await deleteCategory(id);
      toast({ title: "Sucesso", description: "Categoria excluída com sucesso" });
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [deleteCategory, toast]);
  
  // Funções para Fornecedores/Clientes
  const handleSaveSupplier = useCallback(async () => {
    if (!supplierForm.name.trim()) {
      toast({ title: "Erro", description: "Nome do fornecedor/cliente é obrigatório", variant: "destructive" });
      return;
    }
    
    try {
      if (editingItem) {
        await updateSupplier({ ...supplierForm, id: editingItem.id });
        toast({ title: "Sucesso", description: "Fornecedor/Cliente atualizado com sucesso" });
      } else {
        await addSupplier(supplierForm);
        toast({ title: "Sucesso", description: "Fornecedor/Cliente criado com sucesso" });
      }
      resetSupplierForm();
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [supplierForm, editingItem, updateSupplier, addSupplier, toast]);

  const handleDeleteSupplier = useCallback(async (id) => {
    try {
      await deleteSupplier(id);
      toast({ title: "Sucesso", description: "Fornecedor/Cliente excluído com sucesso" });
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [deleteSupplier, toast]);
  
  // Funções para Métodos de Pagamento
  // ✅ CORREÇÃO 1: `handleSavePayment` ajustado para usar valores de banco de dados
  const handleSavePayment = useCallback(async () => {
    if (!paymentForm.name.trim()) {
      toast({ title: "Erro", description: "Nome do método de pagamento é obrigatório", variant: "destructive" });
      return;
    }
    
    try {
      // Converte 'income'/'expense' para 'receipt'/'payment' se o seu schema usar esses nomes
      const typeMap = {
        'income': 'receipt',
        'expense': 'payment',
        'both': 'both',
      };
      const dbType = typeMap[paymentForm.type] || 'both'; // Valor padrão para 'both'

      if (editingItem) {
        await updatePaymentMethod({ ...paymentForm, type: dbType, id: editingItem.id });
        toast({ title: "Sucesso", description: "Método de pagamento atualizado com sucesso" });
      } else {
        await addPaymentMethod({ ...paymentForm, type: dbType });
        toast({ title: "Sucesso", description: "Método de pagamento criado com sucesso" });
      }
      resetPaymentForm();
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [paymentForm, editingItem, updatePaymentMethod, addPaymentMethod, toast]);

  const handleDeletePayment = useCallback(async (id) => {
    try {
      await deletePaymentMethod(id);
      toast({ title: "Sucesso", description: "Método de pagamento excluído com sucesso" });
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [deletePaymentMethod, toast]);

  // Funções de reset e edição (não alteradas, apenas convertidas para useCallback)
  const resetCategoryForm = useCallback(() => {
    setCategoryForm({ name: '', type: 'expense', color: '#3B82F6', parent_id: null });
    setShowCategoryForm(false);
    setEditingItem(null);
  }, []);

  const handleEditCategory = useCallback((category) => {
    setCategoryForm(category);
    setEditingItem(category);
    setShowCategoryForm(true);
  }, []);

  const resetSupplierForm = useCallback(() => {
    setSupplierForm({ name: '', type: 'supplier', document: '', email: '', phone: '', address: '' });
    setShowSupplierForm(false);
    setEditingItem(null);
  }, []);

  const handleEditSupplier = useCallback((supplier) => {
    setSupplierForm(supplier);
    setEditingItem(supplier);
    setShowSupplierForm(true);
  }, []);

  const resetPaymentForm = useCallback(() => {
    setPaymentForm({ name: '', type: 'both', is_default: false });
    setShowPaymentForm(false);
    setEditingItem(null);
  }, []);

  const handleEditPayment = useCallback((payment) => {
    setPaymentForm(payment);
    setEditingItem(payment);
    setShowPaymentForm(true);
  }, []);

  // Renderizar categorias com hierarquia
  const renderCategoryTree = (parentId = null, level = 0) => {
    // ✅ CORREÇÃO 2: Verificação para evitar erro com `categories` nulo ou vazio
    if (!categories || categories.length === 0) return null;

    return categories
      .filter(cat => cat.parent_id === parentId)
      .map(category => (
        <div key={category.id} className={`pl-${level * 6} space-y-2`}>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium">{category.name}</span>
                <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>
                  {category.type === 'income' ? 'Receita' : 'Despesa'}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditCategory(category)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          {renderCategoryTree(category.id, level + 1)}
        </div>
      ));
  };
  
  // ✅ Adicionado: Componente de loading, para uma melhor UX enquanto os dados carregam
  if (isLoading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cadastros</h1>
        <p className="text-muted-foreground">
          Gerencie categorias, fornecedores e métodos de pagamento
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categorias" className="flex items-center space-x-2">
            <Tag className="w-4 h-4" />
            <span>Plano de Contas</span>
          </TabsTrigger>
          <TabsTrigger value="fornecedores" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Fornecedores/Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="pagamentos" className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Formas de Pagamento</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Categorias */}
        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plano de Contas</CardTitle>
                  <CardDescription>
                    Organize suas receitas e despesas em categorias
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingItem(null);
                  setCategoryForm({ name: '', type: 'expense', color: '#3B82F6', parent_id: null });
                  setShowCategoryForm(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showCategoryForm && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category-name">Nome</Label>
                        <Input
                          id="category-name"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                          placeholder="Nome da categoria"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category-type">Tipo</Label>
                        <Select
                          value={categoryForm.type}
                          onValueChange={(value) => setCategoryForm({ ...categoryForm, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">Despesa</SelectItem>
                            <SelectItem value="income">Receita</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category-parent">Categoria Pai</Label>
                        <Select
                          value={categoryForm.parent_id || ''}
                          onValueChange={(value) => setCategoryForm({ ...categoryForm, parent_id: value || null })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Categoria Principal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhuma (Principal)</SelectItem>
                             {/* ✅ CORREÇÃO 3: Verificação antes de mapear */}
                            {categories && categories.filter(cat => !cat.parent_id).map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Cor</Label>
                        <div className="flex flex-wrap gap-2">
                          {CATEGORY_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setCategoryForm({ ...categoryForm, color })}
                              className={`w-8 h-8 rounded-full border-2 ${
                                categoryForm.color === color ? 'border-primary' : 'border-border'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={resetCategoryForm}>
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveCategory}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {renderCategoryTree()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Fornecedores */}
        <TabsContent value="fornecedores" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fornecedores e Clientes</CardTitle>
                  <CardDescription>
                    Gerencie seus fornecedores e clientes
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingItem(null);
                  setSupplierForm({ name: '', type: 'supplier', document: '', email: '', phone: '', address: '' });
                  setShowSupplierForm(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Fornecedor/Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showSupplierForm && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="supplier-name">Nome</Label>
                        <Input
                          id="supplier-name"
                          value={supplierForm.name}
                          onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                          placeholder="Nome do fornecedor/cliente"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier-type">Tipo</Label>
                        <Select
                          value={supplierForm.type}
                          onValueChange={(value) => setSupplierForm({ ...supplierForm, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="supplier">Fornecedor</SelectItem>
                            <SelectItem value="client">Cliente</SelectItem>
                            <SelectItem value="both">Ambos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier-document">Documento</Label>
                        <Input
                          id="supplier-document"
                          value={supplierForm.document}
                          onChange={(e) => setSupplierForm({ ...supplierForm, document: e.target.value })}
                          placeholder="CPF/CNPJ"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier-email">Email</Label>
                        <Input
                          id="supplier-email"
                          type="email"
                          value={supplierForm.email}
                          onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier-phone">Telefone</Label>
                        <Input
                          id="supplier-phone"
                          value={supplierForm.phone}
                          onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier-address">Endereço</Label>
                        <Input
                          id="supplier-address"
                          value={supplierForm.address}
                          onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                          placeholder="Endereço completo"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={resetSupplierForm}>
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveSupplier}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {suppliers.map(supplier => (
                  <Card key={supplier.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{supplier.name}</span>
                        <Badge variant="outline">
                          {supplier.type === 'supplier' ? 'Fornecedor' :
                            supplier.type === 'client' ? 'Cliente' : 'Ambos'}
                        </Badge>
                        {supplier.document && (
                          <span className="text-sm text-muted-foreground">{supplier.document}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSupplier(supplier)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Métodos de Pagamento */}
        <TabsContent value="pagamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Formas de Pagamento</CardTitle>
                  <CardDescription>
                    Configure os métodos de pagamento disponíveis
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingItem(null);
                  setPaymentForm({ name: '', type: 'both', is_default: false });
                  setShowPaymentForm(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Forma de Pagamento
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showPaymentForm && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="payment-name">Nome</Label>
                        <Input
                          id="payment-name"
                          value={paymentForm.name}
                          onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
                          placeholder="Nome do método de pagamento"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment-type">Tipo</Label>
                        <Select
                          value={paymentForm.type}
                          onValueChange={(value) => setPaymentForm({ ...paymentForm, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Apenas Receitas</SelectItem>
                            <SelectItem value="expense">Apenas Despesas</SelectItem>
                            <SelectItem value="both">Ambos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={resetPaymentForm}>
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button onClick={handleSavePayment}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {paymentMethods.map(payment => (
                  <Card key={payment.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{payment.name}</span>
                        <Badge variant={payment.is_default ? 'default' : 'secondary'}>
                          {payment.is_default ? 'Padrão' : 'Normal'}
                        </Badge>
                        <Badge variant="outline">
                          {payment.type === 'receipt' ? 'Receitas' :
                            payment.type === 'payment' ? 'Despesas' : 'Ambos'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPayment(payment)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePayment(payment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React, { useState, useCallback } from 'react';
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
    allPaymentMethods,
    addCategory,
    updateCategory,
    deleteCategory,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    isLoading
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
    name: '', is_default: false
  });

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
  
  const handleSavePayment = useCallback(async () => {
    if (!paymentForm.name.trim()) {
      toast({ title: "Erro", description: "Nome do método de pagamento é obrigatório", variant: "destructive" });
      return;
    }
    
    try {
      if (editingItem) {
        await updatePaymentMethod({ ...paymentForm, id: editingItem.id });
        toast({ title: "Sucesso", description: "Método de pagamento atualizado com sucesso" });
      } else {
        await addPaymentMethod(paymentForm);
        toast({ title: "Sucesso", description: "Método de pagamento criado com sucesso" });
      }
      resetPaymentForm();
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [paymentForm, editingItem, updatePaymentMethod, addPaymentMethod, toast]);

  const handleDeletePayment = useCallback(async (id) => {
    // Não permitir deletar métodos padrão
    const method = allPaymentMethods.find(pm => pm.id === id);
    if (method && method.user_id === 'default') {
      toast({ title: "Erro", description: "Não é possível deletar métodos de pagamento padrão", variant: "destructive" });
      return;
    }

    try {
      await deletePaymentMethod(id);
      toast({ title: "Sucesso", description: "Método de pagamento excluído com sucesso" });
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [deletePaymentMethod, toast, allPaymentMethods]);

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
    setPaymentForm({ name: '', is_default: false });
    setShowPaymentForm(false);
    setEditingItem(null);
  }, []);

  const handleEditPayment = useCallback((payment) => {
    // Não permitir editar métodos padrão
    if (payment.user_id === 'default') {
      toast({ title: "Aviso", description: "Métodos de pagamento padrão não podem ser editados", variant: "default" });
      return;
    }
    
    setPaymentForm(payment);
    setEditingItem(payment);
    setShowPaymentForm(true);
  }, [toast]);

  const renderCategoryTree = (parentId = null, level = 0) => {
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return null;
    }

    const filteredCategories = categories.filter(cat => cat.parent_id === parentId);

    return filteredCategories.map(category => (
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
              {category.is_default && (
                <Badge variant="outline" className="text-xs">Padrão</Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!category.is_default && (
                <>
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
                </>
              )}
            </div>
          </CardContent>
        </Card>
        {renderCategoryTree(category.id, level + 1)}
      </div>
    ));
  };
  
  if (isLoading && (!categories || categories.length === 0)) {
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
                    Organize suas receitas e despesas em categorias. As categorias padrão não podem ser editadas.
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
                            {categories && Array.isArray(categories) && categories
                              .filter(cat => !cat.parent_id && cat.type === categoryForm.type)
                              .map(cat => (
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
                              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                                categoryForm.color === color ? 'border-primary ring-2 ring-primary/20' : 'border-border'
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
                        {editingItem ? 'Atualizar' : 'Salvar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {renderCategoryTree()}
                {(!categories || categories.length === 0) && !showCategoryForm && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma categoria cadastrada. Clique em "Nova Categoria" para começar.
                  </div>
                )}
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
                  <CardTitle>Fornecedores / Clientes</CardTitle>
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
                            <SelectItem value="customer">Cliente</SelectItem>
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
                          placeholder="(XX) XXXXX-XXXX"
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
                        {editingItem ? 'Atualizar' : 'Salvar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {suppliers.length === 0 && !showSupplierForm ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum fornecedor/cliente cadastrado. Clique em "Novo Fornecedor/Cliente" para começar.
                  </div>
                ) : (
                  suppliers.map(supplier => (
                    <Card key={supplier.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{supplier.name}</span>
                            {supplier.document && (
                              <p className="text-sm text-muted-foreground">{supplier.document}</p>
                            )}
                          </div>
                          <Badge variant="outline">
                            {supplier.type === 'supplier' && 'Fornecedor'}
                            {supplier.type === 'customer' && 'Cliente'}
                            {supplier.type === 'both' && 'Ambos'}
                          </Badge>
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
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Formas de Pagamento */}
        <TabsContent value="pagamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Formas de Pagamento</CardTitle>
                  <CardDescription>
                    Gerencie suas formas de pagamento. Métodos padrão não podem ser editados ou removidos.
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingItem(null);
                  setPaymentForm({ name: '', is_default: false });
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
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="payment-name">Nome</Label>
                        <Input
                          id="payment-name"
                          value={paymentForm.name}
                          onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
                          placeholder="Nome da forma de pagamento"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={resetPaymentForm}>
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button onClick={handleSavePayment}>
                        <Save className="w-4 h-4 mr-2" />
                        {editingItem ? 'Atualizar' : 'Salvar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                {allPaymentMethods.length === 0 && !showPaymentForm ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma forma de pagamento cadastrada. Clique em "Nova Forma de Pagamento" para começar.
                  </div>
                ) : (
                  allPaymentMethods.map(payment => (
                    <Card key={payment.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{payment.name}</span>
                          {(payment.is_default || payment.user_id === 'default') && (
                            <Badge variant="outline">Padrão</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPayment(payment)}
                            disabled={payment.user_id === 'default'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePayment(payment.id)}
                            disabled={payment.user_id === 'default'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
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

// Simulando dados do Supabase - você substituirá pelas chamadas reais
const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000' };

const PAYMENT_METHODS_OPTIONS = [
  'PIX', 'BOLETO', 'CARTÃO DE CRÉDITO', 'CARTÃO DE DÉBITO', 'DINHEIRO',
  'TRANSFERÊNCIA', 'CHEQUE', 'REDE CARD', 'SITE', 'SHOPEE', 'MERCADOPAGO', 'DÉBITO EM CONTA'
];

const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
];

const CATEGORY_ICONS = [
  'circle', 'home', 'car', 'shopping-cart', 'utensils', 'gamepad-2',
  'heart', 'briefcase', 'graduation-cap', 'plane', 'gift', 'music'
];

export default function CadastroPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('categorias');
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para formulários
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Estados dos formulários
  const [categoryForm, setCategoryForm] = useState({
    name: '', type: 'expense', color: '#3B82F6', icon: 'circle', parent_id: null
  });
  const [supplierForm, setSupplierForm] = useState({
    name: '', type: 'supplier', document: '', email: '', phone: '', address: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    name: '', type: 'both', is_default: false
  });

  // Simular carregamento inicial
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    // Simular dados - substitua pelas chamadas reais do Supabase
    setTimeout(() => {
      setCategories([
        { id: '1', name: 'Alimentação', type: 'expense', color: '#10B981', icon: 'utensils', parent_id: null },
        { id: '2', name: 'Restaurantes', type: 'expense', color: '#10B981', icon: 'utensils', parent_id: '1' },
        { id: '3', name: 'Salário', type: 'income', color: '#3B82F6', icon: 'briefcase', parent_id: null },
      ]);
      setSuppliers([
        { id: '1', name: 'Supermercado ABC', type: 'supplier', document: '12.345.678/0001-90' },
      ]);
      setPaymentMethods([
        { id: '1', name: 'PIX', type: 'both', is_default: true },
      ]);
      setLoading(false);
    }, 1000);
  };

  // Funções para Categorias
  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    const newCategory = {
      id: Date.now().toString(),
      ...categoryForm,
      user_id: mockUser.id,
      created_at: new Date().toISOString()
    };

    if (editingItem) {
      setCategories(prev => prev.map(cat => 
        cat.id === editingItem.id ? { ...cat, ...categoryForm } : cat
      ));
      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso",
      });
    } else {
      setCategories(prev => [...prev, newCategory]);
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso",
      });
    }

    resetCategoryForm();
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', type: 'expense', color: '#3B82F6', icon: 'circle', parent_id: null });
    setShowCategoryForm(false);
    setEditingItem(null);
  };

  const handleEditCategory = (category) => {
    setCategoryForm(category);
    setEditingItem(category);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = (id) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
    toast({
      title: "Sucesso",
      description: "Categoria excluída com sucesso",
    });
  };

  // Funções para Fornecedores/Clientes
  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do fornecedor/cliente é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    const newSupplier = {
      id: Date.now().toString(),
      ...supplierForm,
      user_id: mockUser.id,
      created_at: new Date().toISOString()
    };

    if (editingItem) {
      setSuppliers(prev => prev.map(sup => 
        sup.id === editingItem.id ? { ...sup, ...supplierForm } : sup
      ));
      toast({
        title: "Sucesso",
        description: "Fornecedor/Cliente atualizado com sucesso",
      });
    } else {
      setSuppliers(prev => [...prev, newSupplier]);
      toast({
        title: "Sucesso",
        description: "Fornecedor/Cliente criado com sucesso",
      });
    }

    resetSupplierForm();
  };

  const resetSupplierForm = () => {
    setSupplierForm({ name: '', type: 'supplier', document: '', email: '', phone: '', address: '' });
    setShowSupplierForm(false);
    setEditingItem(null);
  };

  const handleEditSupplier = (supplier) => {
    setSupplierForm(supplier);
    setEditingItem(supplier);
    setShowSupplierForm(true);
  };

  const handleDeleteSupplier = (id) => {
    setSuppliers(prev => prev.filter(sup => sup.id !== id));
    toast({
      title: "Sucesso",
      description: "Fornecedor/Cliente excluído com sucesso",
    });
  };

  // Funções para Métodos de Pagamento
  const handleSavePayment = async () => {
    if (!paymentForm.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do método de pagamento é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    const newPayment = {
      id: Date.now().toString(),
      ...paymentForm,
      user_id: mockUser.id,
      created_at: new Date().toISOString()
    };

    if (editingItem) {
      setPaymentMethods(prev => prev.map(pay => 
        pay.id === editingItem.id ? { ...pay, ...paymentForm } : pay
      ));
      toast({
        title: "Sucesso",
        description: "Método de pagamento atualizado com sucesso",
      });
    } else {
      setPaymentMethods(prev => [...prev, newPayment]);
      toast({
        title: "Sucesso",
        description: "Método de pagamento criado com sucesso",
      });
    }

    resetPaymentForm();
  };

  const resetPaymentForm = () => {
    setPaymentForm({ name: '', type: 'both', is_default: false });
    setShowPaymentForm(false);
    setEditingItem(null);
  };

  const handleEditPayment = (payment) => {
    setPaymentForm(payment);
    setEditingItem(payment);
    setShowPaymentForm(true);
  };

  const handleDeletePayment = (id) => {
    setPaymentMethods(prev => prev.filter(pay => pay.id !== id));
    toast({
      title: "Sucesso",
      description: "Método de pagamento excluído com sucesso",
    });
  };

  // Renderizar categorias com hierarquia
  const renderCategoryTree = (parentId = null, level = 0) => {
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

  if (loading) {
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
                  setCategoryForm({ name: '', type: 'expense', color: '#3B82F6', icon: 'circle', parent_id: null });
                  setShowCategoryForm(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulário de Categoria */}
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
                            <SelectItem value="">Categoria Principal</SelectItem>
                            {categories.filter(cat => !cat.parent_id).map(cat => (
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

              {/* Lista de Categorias */}
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
              {/* Formulário de Fornecedor */}
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

              {/* Lista de Fornecedores */}
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
              {/* Formulário de Método de Pagamento */}
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

              {/* Lista de Métodos de Pagamento */}
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
                          {payment.type === 'income' ? 'Receitas' : 
                           payment.type === 'expense' ? 'Despesas' : 'Ambos'}
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

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, MoreVertical, Trash2, Tag, User, CreditCard, ChevronDown, ChevronRight, Save, X } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import CategoryForm from '@/components/categories/CategoryForm';
import CategoryIcon from '@/components/categories/CategoryIcon';

import { Category } from '@/types/categories';
import { PaymentMethod, DefaultPaymentMethod, Supplier } from '@/types';

const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
];

export default function CadastroPage() {
  const { toast } = useToast();
  const {
    categories,
    paymentMethods,
    defaultPaymentMethods,
    suppliers,
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getPaymentMethods,
    getDefaultPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    getSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    isLoading
  } = useAppContext();

  const [activeTab, setActiveTab] = useState('categorias');

  // ===================================================
  // ✅ ESTADO E FUNÇÕES PARA CATEGORIAS
  // ===================================================
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log('🔄 Carregando categorias...');
    getCategories();
  }, [getCategories]);

  // Debug: Log das categorias quando mudarem
  useEffect(() => {
    console.log('📊 Categorias carregadas:', categories);
    console.log('📊 Total de categorias:', categories.length);
    
    const mainCategories = categories.filter(cat => !cat.parent_id);
    const subCategories = categories.filter(cat => cat.parent_id);
    
    console.log('📊 Categorias principais:', mainCategories.length);
    console.log('📊 Subcategorias:', subCategories.length);
    
    categories.forEach(cat => {
      console.log(`📋 Categoria: ${cat.name} | Tipo: ${cat.type} | Parent: ${cat.parent_id || 'null'} | Default: ${cat.is_default}`);
    });
  }, [categories]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormOpen(true);
  };

  const handleAddSubcategory = (parentCategory: Category) => {
    setEditingCategory({
      id: '',
      name: '',
      type: parentCategory.type,
      color: parentCategory.color,
      icon: parentCategory.icon,
      parent_id: parentCategory.id,
      is_default: false,
      created_at: '',
      user_id: ''
    } as Category);
    setCategoryFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormOpen(true);
  };

  const handleSaveCategory = useCallback(async (category: Omit<Category, 'id'> | Category) => {
    try {
      console.log('💾 Salvando categoria:', category);
      
      if ((category as Category).id && (category as Category).id !== '') {
        await updateCategory(category as Category);
        toast({ title: 'Sucesso', description: 'Categoria atualizada com sucesso' });
      } else {
        await addCategory(category as Omit<Category, 'id' | 'created_at' | 'user_id'>);
        toast({ title: 'Sucesso', description: 'Categoria criada com sucesso' });
      }
      setCategoryFormOpen(false);
      setEditingCategory(null);
      
      // Re-fetch para atualizar a lista
      setTimeout(() => {
        getCategories();
      }, 500);
    } catch (error: any) {
      console.error('❌ Erro ao salvar categoria:', error);
      toast({ title: 'Erro', description: error.message || 'Erro ao salvar categoria', variant: 'destructive' });
    }
  }, [addCategory, updateCategory, getCategories, toast]);

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteCategoryDialogOpen(true);
  };

  const confirmDeleteCategory = useCallback(async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory(categoryToDelete.id);
        toast({
          title: 'Sucesso',
          description: `${categoryToDelete.name} excluída com sucesso`,
        });
        getCategories(); // Re-fetch para atualizar a lista
      } catch (error: any) {
        console.error('Erro ao deletar categoria:', error);
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao deletar categoria',
          variant: 'destructive',
        });
      } finally {
        setDeleteCategoryDialogOpen(false);
        setCategoryToDelete(null);
      }
    }
  }, [categoryToDelete, deleteCategory, getCategories, toast]);

  const toggleExpandCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // ✅ CORRIGIDO: Função para renderizar categorias em grade
  const renderCategoriesGrid = useCallback(() => {
    console.log('🎨 Renderizando grid de categorias...');
    console.log('🎨 Todas as categorias disponíveis:', categories.length);
    console.log('🎨 Tipo selecionado:', categoryType);
    
    // ✅ CORREÇÃO: Filtrar categorias principais (sem parent_id) do tipo selecionado
    const mainCategories = categories.filter(cat => {
      const isMainCategory = !cat.parent_id || cat.parent_id === null;
      const isCorrectType = cat.type === categoryType;
      
      console.log(`🔍 Categoria: ${cat.name} | É principal: ${isMainCategory} | Tipo correto: ${isCorrectType} | Tipo: ${cat.type}`);
      
      return isMainCategory && isCorrectType;
    });

    console.log('🎨 Categorias principais filtradas:', mainCategories.length);
    mainCategories.forEach(cat => console.log(`✅ ${cat.name} (${cat.type})`));

    // Função para obter subcategorias
    const getSubcategories = (parentId: string) => {
      const subs = categories.filter(cat => cat.parent_id === parentId);
      console.log(`🔗 Subcategorias para ${parentId}:`, subs.length);
      return subs;
    };

    if (mainCategories.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma categoria {categoryType === 'income' ? 'de receita' : 'de despesa'} encontrada
            </h3>
            <p className="text-muted-foreground mb-6">
              Comece criando sua primeira categoria para organizar suas {categoryType === 'income' ? 'receitas' : 'despesas'}.
            </p>
            <Button onClick={handleAddCategory} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Criar Primeira Categoria
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {mainCategories.map(category => {
          const subcategories = getSubcategories(category.id);
          const isExpanded = expandedCategories.has(category.id);

          return (
            <Card key={category.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {/* Categoria Principal */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {subcategories.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpandCategory(category.id)}
                        className="p-1 h-auto w-auto shrink-0"
                      >
                        {isExpanded ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                      </Button>
                    )}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: category.color + '20', border: `2px solid ${category.color}` }}
                      >
                        <CategoryIcon icon={category.icon} color={category.color} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate" title={category.name}>
                          {category.name}
                        </h3>
                        {subcategories.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {subcategories.length} subcategoria{subcategories.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {category.is_default && (
                      <Badge variant="secondary" className="text-xs">Padrão</Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddSubcategory(category)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Subcategoria
                        </DropdownMenuItem>
                        {!category.is_default && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Subcategorias */}
                {isExpanded && subcategories.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    {subcategories.map(subcat => (
                      <div key={subcat.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors group/sub">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <CategoryIcon icon={subcat.icon} color={subcat.color} className="w-4 h-4 shrink-0" />
                          <span className="text-sm truncate" title={subcat.name}>
                            {subcat.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {subcat.is_default && (
                            <Badge variant="outline" className="text-xs scale-90">Padrão</Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditCategory(subcat)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {!subcat.is_default && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteCategory(subcat)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }, [categories, categoryType, expandedCategories, handleEditCategory, handleDeleteCategory, handleAddSubcategory, handleAddCategory]);

  // ===================================================
  // ✅ ESTADO E FUNÇÕES PARA FORMAS DE PAGAMENTO
  // ===================================================
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<PaymentMethod | null>(null);
  const [deletePaymentMethodDialogOpen, setDeletePaymentMethodDialogOpen] = useState(false);
  const [newPaymentMethodName, setNewPaymentMethodName] = useState('');

  useEffect(() => {
    getPaymentMethods();
    getDefaultPaymentMethods();
  }, [getPaymentMethods, getDefaultPaymentMethods]);

  const handleAddPaymentMethod = () => {
    setEditingPaymentMethod(null);
    setNewPaymentMethodName('');
    setPaymentFormOpen(true);
  };

  const handleEditPaymentMethod = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setNewPaymentMethodName(paymentMethod.name);
    setPaymentFormOpen(true);
  };

  const handleSavePaymentMethod = useCallback(async () => {
    if (!newPaymentMethodName.trim()) {
      toast({ title: 'Erro', description: 'Nome do método de pagamento é obrigatório', variant: 'destructive' });
      return;
    }

    try {
      if (editingPaymentMethod) {
        await updatePaymentMethod({ ...editingPaymentMethod, name: newPaymentMethodName });
        toast({ title: 'Sucesso', description: 'Método de pagamento atualizado com sucesso' });
      } else {
        await addPaymentMethod({ name: newPaymentMethodName, is_default: false });
        toast({ title: 'Sucesso', description: 'Método de pagamento criado com sucesso' });
      }
      setPaymentFormOpen(false);
      setEditingPaymentMethod(null);
      setNewPaymentMethodName('');
      getPaymentMethods(); // Re-fetch para atualizar a lista
    } catch (error: any) {
      console.error('Erro ao salvar método de pagamento:', error);
      toast({ title: 'Erro', description: error.message || 'Erro ao salvar método de pagamento', variant: 'destructive' });
    }
  }, [newPaymentMethodName, editingPaymentMethod, addPaymentMethod, updatePaymentMethod, getPaymentMethods, toast]);

  const handleDeletePaymentMethod = (paymentMethod: PaymentMethod) => {
    setPaymentMethodToDelete(paymentMethod);
    setDeletePaymentMethodDialogOpen(true);
  };

  const confirmDeletePaymentMethod = useCallback(async () => {
    if (paymentMethodToDelete) {
      try {
        await deletePaymentMethod(paymentMethodToDelete.id);
        toast({
          title: 'Sucesso',
          description: `${paymentMethodToDelete.name} excluído com sucesso`,
        });
        getPaymentMethods(); // Re-fetch para atualizar a lista
      } catch (error: any) {
        console.error('Erro ao deletar método de pagamento:', error);
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao deletar método de pagamento',
          variant: 'destructive',
        });
      } finally {
        setDeletePaymentMethodDialogOpen(false);
        setPaymentMethodToDelete(null);
      }
    }
  }, [paymentMethodToDelete, deletePaymentMethod, getPaymentMethods, toast]);

  const allPaymentMethods = useMemo(() => {
    const userMethods = paymentMethods.map(pm => ({ ...pm, is_user_defined: true }));
    const defaultMethods = defaultPaymentMethods.map(dpm => ({ ...dpm, is_user_defined: false }));
    return [...userMethods, ...defaultMethods].sort((a, b) => a.name.localeCompare(b.name));
  }, [paymentMethods, defaultPaymentMethods]);

  // ===================================================
  // ✅ ESTADO E FUNÇÕES PARA FORNECEDORES/CLIENTES
  // ===================================================
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [deleteSupplierDialogOpen, setDeleteSupplierDialogOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');

  useEffect(() => {
    getSuppliers();
  }, [getSuppliers]);

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setNewSupplierName('');
    setSupplierFormOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setNewSupplierName(supplier.name);
    setSupplierFormOpen(true);
  };

  const handleSaveSupplier = useCallback(async () => {
    if (!newSupplierName.trim()) {
      toast({ title: 'Erro', description: 'Nome do fornecedor/cliente é obrigatório', variant: 'destructive' });
      return;
    }

    try {
      if (editingSupplier) {
        await updateSupplier({ ...editingSupplier, name: newSupplierName });
        toast({ title: 'Sucesso', description: 'Fornecedor/Cliente atualizado com sucesso' });
      } else {
        await addSupplier({ name: newSupplierName });
        toast({ title: 'Sucesso', description: 'Fornecedor/Cliente criado com sucesso' });
      }
      setSupplierFormOpen(false);
      setEditingSupplier(null);
      setNewSupplierName('');
      getSuppliers(); // Re-fetch para atualizar a lista
    } catch (error: any) {
      console.error('Erro ao salvar fornecedor/cliente:', error);
      toast({ title: 'Erro', description: error.message || 'Erro ao salvar fornecedor/cliente', variant: 'destructive' });
    }
  }, [newSupplierName, editingSupplier, addSupplier, updateSupplier, getSuppliers, toast]);

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteSupplierDialogOpen(true);
  };

  const confirmDeleteSupplier = useCallback(async () => {
    if (supplierToDelete) {
      try {
        await deleteSupplier(supplierToDelete.id);
        toast({
          title: 'Sucesso',
          description: `${supplierToDelete.name} excluído com sucesso`,
        });
        getSuppliers(); // Re-fetch para atualizar a lista
      } catch (error: any) {
        console.error('Erro ao deletar fornecedor/cliente:', error);
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao deletar fornecedor/cliente',
          variant: 'destructive',
        });
      } finally {
        setDeleteSupplierDialogOpen(false);
        setSupplierToDelete(null);
      }
    }
  }, [supplierToDelete, deleteSupplier, getSuppliers, toast]);

  return (
    <div className="flex flex-col flex-1 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Cadastros</h1>
        <p className="text-muted-foreground">Gerencie suas categorias, fornecedores e métodos de pagamento</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categorias">Plano de Contas</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores/Clientes</TabsTrigger>
          <TabsTrigger value="pagamentos">Formas de Pagamento</TabsTrigger>
        </TabsList>

        <TabsContent value="categorias" className="flex-1 flex flex-col p-0">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col">
                <CardTitle>Plano de Contas</CardTitle>
                <CardDescription>Organize seus recebimentos e despesas em categorias e subcategorias</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="category-type-select" className="sr-only">Visualizar</Label>
                  <Select value={categoryType} onValueChange={(value: 'expense' | 'income') => setCategoryType(value)}>
                    <SelectTrigger id="category-type-select" className="w-[120px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Despesas</SelectItem>
                      <SelectItem value="income">Receitas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddCategory}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Categoria
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Carregando categorias...</p>
                </div>
              ) : (
                renderCategoriesGrid()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fornecedores" className="flex-1 flex flex-col p-0">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col">
                <CardTitle>Fornecedores e Clientes</CardTitle>
                <CardDescription>Gerencie seus fornecedores e clientes</CardDescription>
              </div>
              <Button onClick={handleAddSupplier}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Fornecedor/Cliente
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Carregando fornecedores/clientes...</p>
                </div>
              ) : suppliers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum fornecedor/cliente cadastrado. Clique em "Novo Fornecedor/Cliente" para começar.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={handleAddSupplier}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Fornecedor/Cliente
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {suppliers.map(supplier => (
                    <div key={supplier.id} className="border rounded-lg p-4 bg-card flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{supplier.name}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditSupplier(supplier)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteSupplier(supplier)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos" className="flex-1 flex flex-col p-0">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col">
                <CardTitle>Formas de Pagamento</CardTitle>
                <CardDescription>Gerencie suas formas de pagamento</CardDescription>
              </div>
              <Button onClick={handleAddPaymentMethod}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Forma de Pagamento
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Carregando formas de pagamento...</p>
                </div>
              ) : allPaymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhuma forma de pagamento cadastrada. Clique em "Nova Forma de Pagamento" para começar.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={handleAddPaymentMethod}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Forma de Pagamento
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {allPaymentMethods.map(method => (
                    <div key={method.id} className="border rounded-lg p-4 bg-card flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{method.name}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditPaymentMethod(method)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {method.is_user_defined && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeletePaymentMethod(method)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CategoryForm
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        initialData={editingCategory}
        onSave={handleSaveCategory}
        categoryType={categoryType}
        parentId={editingCategory?.parent_id}
        parentName={categories.find(cat => cat.id === editingCategory?.parent_id)?.name}
      />

      {/* Diálogo de Confirmação de Exclusão de Categoria */}
      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{categoryToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Confirmação de Exclusão de Forma de Pagamento */}
      <AlertDialog open={deletePaymentMethodDialogOpen} onOpenChange={setDeletePaymentMethodDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a forma de pagamento "{paymentMethodToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePaymentMethod}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Confirmação de Exclusão de Fornecedor/Cliente */}
      <AlertDialog open={deleteSupplierDialogOpen} onOpenChange={setDeleteSupplierDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor/cliente "{supplierToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSupplier}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Formulário de Fornecedor/Cliente */}
      <Dialog open={supplierFormOpen} onOpenChange={setSupplierFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Editar Fornecedor/Cliente' : 'Novo Fornecedor/Cliente'}</DialogTitle>
            <DialogDescription>
              {editingSupplier ? 'Edite os detalhes do fornecedor/cliente.' : 'Adicione um novo fornecedor ou cliente.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier-name" className="text-right">Nome</Label>
              <Input
                id="supplier-name"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveSupplier}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulário de Forma de Pagamento */}
      <Dialog open={paymentFormOpen} onOpenChange={setPaymentFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingPaymentMethod ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}</DialogTitle>
            <DialogDescription>
              {editingPaymentMethod ? 'Edite os detalhes da forma de pagamento.' : 'Adicione uma nova forma de pagamento.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment-name" className="text-right">Nome</Label>
              <Input
                id="payment-name"
                value={newPaymentMethodName}
                onChange={(e) => setNewPaymentMethodName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSavePaymentMethod}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

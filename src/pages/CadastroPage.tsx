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
    getCategories();
  }, [getCategories]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormOpen(true);
  };

  const handleSaveCategory = useCallback(async (category: Omit<Category, 'id'> | Category) => {
    try {
      if ((category as Category).id) {
        await updateCategory(category as Category);
        toast({ title: 'Sucesso', description: 'Categoria atualizada com sucesso' });
      } else {
        await addCategory(category as Omit<Category, 'id' | 'created_at' | 'user_id'>);
        toast({ title: 'Sucesso', description: 'Categoria criada com sucesso' });
      }
      setCategoryFormOpen(false);
      setEditingCategory(null);
      getCategories(); // Re-fetch para atualizar a lista
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
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
    // Filtrar categorias principais (sem parent_id) do tipo selecionado
    const mainCategories = categories.filter(cat => 
      cat.parent_id === null && cat.type === categoryType
    );

    // Função para obter subcategorias
    const getSubcategories = (parentId: string) => {
      return categories.filter(cat => cat.parent_id === parentId);
    };

    if (mainCategories.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhuma categoria {categoryType === 'income' ? 'de receita' : 'de despesa'} cadastrada. 
            Clique em "Nova Categoria" para começar.
          </p>
          <Button variant="outline" className="mt-4" onClick={handleAddCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Categoria
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mainCategories.map(category => {
          const subcategories = getSubcategories(category.id);
          const isExpanded = expandedCategories.has(category.id);

          return (
            <div key={category.id} className="border rounded-lg p-4 bg-card">
              {/* Categoria Principal */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  {subcategories.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpandCategory(category.id)}
                      className="p-0 h-auto w-auto"
                    >
                      {isExpanded ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </Button>
                  )}
                  <CategoryIcon icon={category.icon} color={category.color} />
                  <span className="font-medium text-sm truncate" title={category.name}>
                    {category.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {category.is_default && (
                    <Badge variant="outline" className="text-xs">Padrão</Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
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
                <div className="space-y-2 mt-3 pt-3 border-t">
                  {subcategories.map(subcat => (
                    <div key={subcat.id} className="flex items-center justify-between py-1 px-2 rounded bg-muted/50">
                      <div className="flex items-center gap-2 flex-1">
                        <CategoryIcon icon={subcat.icon} color={subcat.color} className="w-3 h-3" />
                        <span className="text-xs truncate" title={subcat.name}>
                          {subcat.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {subcat.is_default && (
                          <Badge variant="outline" className="text-xs scale-75">Padrão</Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
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

              {/* Indicador de subcategorias */}
              {!isExpanded && subcategories.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {subcategories.length} subcategoria{subcategories.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }, [categories, categoryType, expandedCategories, handleEditCategory, handleDeleteCategory]);

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
      toast({ title: "Erro", description: "Nome do método de pagamento é obrigatório", variant: "destructive" });
      return;
    }

    try {
      if (editingPaymentMethod) {
        await updatePaymentMethod({ ...editingPaymentMethod, name: newPaymentMethodName });
        toast({ title: "Sucesso", description: "Método de pagamento atualizado com sucesso" });
      } else {
        await addPaymentMethod({ name: newPaymentMethodName, is_default: false });
        toast({ title: "Sucesso", description: "Método de pagamento criado com sucesso" });
      }
      setPaymentFormOpen(false);
      setEditingPaymentMethod(null);
      setNewPaymentMethodName('');
      getPaymentMethods(); // Re-fetch para atualizar a lista
    } catch (error: any) {
      console.error("Erro ao salvar método de pagamento:", error);
      toast({ title: "Erro", description: error.message || "Erro ao salvar método de pagamento", variant: "destructive" });
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
  const [newSupplierType, setNewSupplierType] = useState<'supplier' | 'customer' | 'client' | 'both'>('supplier');
  const [newSupplierDocument, setNewSupplierDocument] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');

  useEffect(() => {
    getSuppliers();
  }, [getSuppliers]);

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setNewSupplierName('');
    setNewSupplierType('supplier');
    setNewSupplierDocument('');
    setNewSupplierEmail('');
    setNewSupplierPhone('');
    setNewSupplierAddress('');
    setSupplierFormOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setNewSupplierName(supplier.name);
    setNewSupplierType(supplier.type);
    setNewSupplierDocument(supplier.document || '');
    setNewSupplierEmail(supplier.email || '');
    setNewSupplierPhone(supplier.phone || '');
    setNewSupplierAddress(supplier.address || '');
    setSupplierFormOpen(true);
  };

  const handleSaveSupplier = useCallback(async () => {
    if (!newSupplierName.trim()) {
      toast({ title: "Erro", description: "Nome do fornecedor/cliente é obrigatório", variant: "destructive" });
      return;
    }

    try {
      const supplierData = {
        name: newSupplierName,
        type: newSupplierType,
        document: newSupplierDocument.trim() || null,
        email: newSupplierEmail.trim() || null,
        phone: newSupplierPhone.trim() || null,
        address: newSupplierAddress.trim() || null,
        contact_person: null
      };

      if (editingSupplier) {
        await updateSupplier({ ...editingSupplier, ...supplierData });
        toast({ title: "Sucesso", description: "Fornecedor/Cliente atualizado com sucesso" });
      } else {
        await addSupplier(supplierData);
        toast({ title: "Sucesso", description: "Fornecedor/Cliente criado com sucesso" });
      }
      setSupplierFormOpen(false);
      setEditingSupplier(null);
      setNewSupplierName('');
      setNewSupplierType('supplier');
      setNewSupplierDocument('');
      setNewSupplierEmail('');
      setNewSupplierPhone('');
      setNewSupplierAddress('');
      getSuppliers(); // Re-fetch para atualizar a lista
    } catch (error: any) {
      console.error("Erro ao salvar fornecedor/cliente:", error);
      toast({ title: "Erro", description: error.message || "Erro ao salvar fornecedor/cliente", variant: "destructive" });
    }
  }, [newSupplierName, newSupplierType, newSupplierDocument, newSupplierEmail, newSupplierPhone, newSupplierAddress, editingSupplier, addSupplier, updateSupplier, getSuppliers, toast]);

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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Plano de Contas</CardTitle>
                <CardDescription>
                  Organize suas receitas e despesas em categorias
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={categoryType} onValueChange={(value: 'expense' | 'income') => setCategoryType(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Despesas</SelectItem>
                    <SelectItem value="income">Receitas</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddCategory}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Categoria
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                renderCategoriesGrid()
              )}
            </CardContent>
          </Card>

          <CategoryForm
            open={categoryFormOpen}
            onOpenChange={setCategoryFormOpen}
            initialData={editingCategory}
            onSave={handleSaveCategory}
            categoryType={categoryType}
          />

          <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmação de Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a categoria "{categoryToDelete?.name}"? Esta ação não pode ser desfeita.
                  {categoryToDelete?.is_default && (
                    <p className="mt-2 text-destructive font-medium">
                      Esta é uma categoria padrão e não pode ser excluída.
                    </p>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteCategory}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={categoryToDelete?.is_default}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
                <Button onClick={handleAddSupplier}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Fornecedor/Cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : suppliers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum fornecedor/cliente cadastrado. Clique em "Novo Fornecedor/Cliente" para começar.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleAddSupplier}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Fornecedor/Cliente
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {suppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="bg-card p-3 rounded-lg flex items-center justify-between border"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="truncate">{supplier.name}</span>
                        <Badge variant="outline" className="shrink-0">
                          {supplier.type === 'supplier' ? 'Fornecedor' : supplier.type === 'customer' ? 'Cliente' : 'Ambos'}
                        </Badge>
                      </div>
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <AlertDialog open={supplierFormOpen} onOpenChange={setSupplierFormOpen}>
            <AlertDialogContent className="sm:max-w-[600px]">
              <AlertDialogHeader>
                <AlertDialogTitle>{editingSupplier ? 'Editar Fornecedor/Cliente' : 'Adicionar Fornecedor/Cliente'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {editingSupplier ? 'Edite os detalhes do fornecedor/cliente.' : 'Preencha os detalhes para adicionar um novo fornecedor/cliente.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplier-document" className="text-right">
                    Documento
                  </Label>
                  <Input
                    id="supplier-document"
                    value={newSupplierDocument}
                    onChange={(e) => setNewSupplierDocument(e.target.value)}
                    className="col-span-3"
                    placeholder="CPF/CNPJ"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplier-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="supplier-email"
                    value={newSupplierEmail}
                    onChange={(e) => setNewSupplierEmail(e.target.value)}
                    className="col-span-3"
                    type="email"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplier-phone" className="text-right">
                    Telefone
                  </Label>
                  <Input
                    id="supplier-phone"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    className="col-span-3"
                    type="tel"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplier-address" className="text-right">
                    Endereço
                  </Label>
                  <Input
                    id="supplier-address"
                    value={newSupplierAddress}
                    onChange={(e) => setNewSupplierAddress(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSupplierFormOpen(false)}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleSaveSupplier}>
                  {editingSupplier ? 'Salvar Alterações' : 'Adicionar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={deleteSupplierDialogOpen} onOpenChange={setDeleteSupplierDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmação de Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o fornecedor/cliente "{supplierToDelete?.name}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteSupplier}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* Tab Formas de Pagamento */}
        <TabsContent value="pagamentos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Formas de Pagamento</CardTitle>
                <CardDescription>Gerencie suas formas de pagamento</CardDescription>
              </div>
              <Button onClick={handleAddPaymentMethod}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Forma de Pagamento
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : allPaymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma forma de pagamento cadastrada. Clique em "Nova Forma de Pagamento" para começar.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleAddPaymentMethod}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Forma de Pagamento
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {allPaymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="bg-card p-3 rounded-lg flex items-center justify-between border"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="truncate">{method.name}</span>
                        {method.is_default && (
                          <Badge variant="outline" className="shrink-0">Padrão</Badge>
                        )}
                      </div>
                      <div>
                        {method.is_user_defined ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditPaymentMethod(method as PaymentMethod)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeletePaymentMethod(method as PaymentMethod)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button variant="ghost" size="sm" disabled>
                            {/* Método Padrão */}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <AlertDialog open={paymentFormOpen} onOpenChange={setPaymentFormOpen}>
            <AlertDialogContent className="sm:max-w-[425px]">
              <AlertDialogHeader>
                <AlertDialogTitle>{editingPaymentMethod ? 'Editar Forma de Pagamento' : 'Adicionar Forma de Pagamento'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {editingPaymentMethod ? 'Edite os detalhes da forma de pagamento.' : 'Preencha os detalhes para adicionar uma nova forma de pagamento.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={newPaymentMethodName}
                    onChange={(e) => setNewPaymentMethodName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPaymentFormOpen(false)}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleSavePaymentMethod}>
                  {editingPaymentMethod ? 'Salvar Alterações' : 'Adicionar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={deletePaymentMethodDialogOpen} onOpenChange={setDeletePaymentMethodDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmação de Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a forma de pagamento "{paymentMethodToDelete?.name}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeletePaymentMethod}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
                  <Label htmlFor="supplier-name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="supplier-name"
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplier-type" className="text-right">
                    Tipo
                  </Label>
                  <Select
                    value={newSupplierType}
                    onValueChange={(value: 'supplier' | 'customer' | 'client' | 'both') => setNewSupplierType(value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">Fornecedor</SelectItem>
                      <SelectItem value="customer">Cliente</SelectItem>
                      <SelectItem value="both">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplier-document" className="text-right">
                    Documento
                  </Label>
                  <Input
                    id="supplier-document"
                    value={newSupplierDocument}
                    onChange={(e) => setNewSupplierDocument(e.target.value)}
                    className="col-span-3"
                    placeholder="CPF/CNPJ"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplier-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="supplier-email"
                    value={newSupplierEmail}
                    onChange={(e) => setNewSupplierEmail(e.target.value)}
                    className="col-span-3"
                    type="email"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplier-phone" className="text-right">
                    Telefone
                  </Label>
                  <Input
                    id="supplier-phone"
                    value={newSupplierPhone}
                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                    className="col-span-3"
                    type="tel"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplier-address" className="text-right">
                    Endereço
                  </Label>
                  <Input
                    id="supplier-address"
                    value={newSupplierAddress}
                    onChange={(e) => setNewSupplierAddress(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSupplierFormOpen(false)}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleSaveSupplier}>
                  {editingSupplier ? 'Salvar Alterações' : 'Adicionar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={deleteSupplierDialogOpen} onOpenChange={setDeleteSupplierDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmação de Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o fornecedor/cliente "{supplierToDelete?.name}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteSupplier}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* Tab Formas de Pagamento */}
        <TabsContent value="pagamentos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Formas de Pagamento</CardTitle>
                <CardDescription>Gerencie suas formas de pagamento</CardDescription>
              </div>
              <Button onClick={handleAddPaymentMethod}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Forma de Pagamento
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : allPaymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma forma de pagamento cadastrada. Clique em "Nova Forma de Pagamento" para começar.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleAddPaymentMethod}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Forma de Pagamento
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {allPaymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="bg-card p-3 rounded-lg flex items-center justify-between border"
                    >
                      <div className="flex items-center gap-3">
                        <span>{method.name}</span>
                        {method.is_default && (
                          <Badge variant="outline" className="ml-2">Padrão</Badge>
                        )}
                      </div>
                      <div>
                        {method.is_user_defined ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditPaymentMethod(method as PaymentMethod)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeletePaymentMethod(method as PaymentMethod)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button variant="ghost" size="sm" disabled>
                            {/* Método Padrão */}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <AlertDialog open={paymentFormOpen} onOpenChange={setPaymentFormOpen}>
            <AlertDialogContent className="sm:max-w-[425px]">
              <AlertDialogHeader>
                <AlertDialogTitle>{editingPaymentMethod ? 'Editar Forma de Pagamento' : 'Adicionar Forma de Pagamento'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {editingPaymentMethod ? 'Edite os detalhes da forma de pagamento.' : 'Preencha os detalhes para adicionar uma nova forma de pagamento.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={newPaymentMethodName}
                    onChange={(e) => setNewPaymentMethodName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPaymentFormOpen(false)}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleSavePaymentMethod}>
                  {editingPaymentMethod ? 'Salvar Alterações' : 'Adicionar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={deletePaymentMethodDialogOpen} onOpenChange={setDeletePaymentMethodDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmação de Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a forma de pagamento "{paymentMethodToDelete?.name}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeletePaymentMethod}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

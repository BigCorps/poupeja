import React, { useState, useMemo, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAppContext } from '@/contexts/AppContext';
import CategoryForm from '@/components/categories/CategoryForm';
import CategoryIcon from '@/components/categories/CategoryIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit, MoreVertical, ArrowLeft } from 'lucide-react';
import { Category, TransactionType, PaymentMethod, Supplier } from '@/types';

// Tipos auxiliares para gerenciar o estado da página
type ViewMode = 'mainCategories' | 'subcategories';

const CadastrosPage: React.FC = () => {
  const { t } = usePreferences();
  const {
    categories,
    paymentMethods,
    suppliers,
    addCategory,
    updateCategory,
    deleteCategory,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    isLoading
  } = useAppContext();

  // Estados locais para a gestão da interface
  const [activeTab, setActiveTab] = useState<'categories' | 'paymentMethods' | 'suppliers'>('categories');
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState<Partial<Category> | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [selectedParentCategory, setSelectedParentCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('mainCategories');
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');

  // Mapeamento e filtragem de categorias
  const parentCategories = useMemo(() => {
    return categories.filter(cat => !cat.parent_id);
  }, [categories]);
  
  const subCategories = useMemo(() => {
    return categories.filter(cat => cat.parent_id);
  }, [categories]);

  const mainCategories = useMemo(() => {
    return parentCategories.filter(cat => cat.type === categoryType);
  }, [parentCategories, categoryType]);

  const subCategoriesForSelectedParent = useMemo(() => {
    if (!selectedParentCategory) return [];
    return subCategories.filter(subcat => subcat.parent_id === selectedParentCategory.id);
  }, [subCategories, selectedParentCategory]);

  // Funções de CRUD para Categorias
  const handleAddCategory = useCallback(() => {
    setInitialFormData({
      name: '',
      type: categoryType,
      color: '#000000',
      icon: 'LayoutList',
      is_default: false,
      parent_id: viewMode === 'subcategories' ? selectedParentCategory?.id : null,
    });
    setCategoryFormOpen(true);
  }, [categoryType, viewMode, selectedParentCategory]);

  const handleEditCategory = useCallback((category: Category) => {
    setInitialFormData(category);
    setCategoryFormOpen(true);
  }, []);

  const handleDeleteCategory = useCallback((category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDeleteCategory = useCallback(async () => {
    if (categoryToDelete) {
      await deleteCategory(categoryToDelete.id);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  }, [categoryToDelete, deleteCategory]);

  const handleSaveCategory = useCallback(async (categoryData: Partial<Category>) => {
    try {
      if (categoryData.id) {
        await updateCategory(categoryData as Category);
      } else {
        const dataToSave = { ...categoryData, type: categoryData.type || categoryType };
        await addCategory(dataToSave as Omit<Category, 'id' | 'created_at' | 'user_id'>);
      }
    } finally {
      setCategoryFormOpen(false);
      setInitialFormData(null);
    }
  }, [addCategory, updateCategory, categoryType]);

  // Adicionando um estado e formulário para Métodos de Pagamento e Fornecedores
  // ... (Você pode implementar formulários similares aqui)
  const handleAddPaymentMethod = () => {
    // Implemente a lógica para abrir um formulário de método de pagamento
    // addPaymentMethod({ name: 'Novo Método', type: 'both', is_default: false });
  };
  const handleDeletePaymentMethod = (id: string) => deletePaymentMethod(id);

  const handleAddSupplier = () => {
    // Implemente a lógica para abrir um formulário de fornecedor
    // addSupplier({ name: 'Novo Fornecedor', type: 'supplier' });
  };
  const handleDeleteSupplier = (id: string) => deleteSupplier(id);

  if (isLoading) {
    return (
      <MainLayout title={t('dashboard.menu.registers')}>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={t('dashboard.menu.registers')}>
      <SubscriptionGuard feature="cadastros">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{t('dashboard.menu.registers')}</h1>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'categories' | 'paymentMethods' | 'suppliers')}>
            <div className="flex justify-between items-center">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="categories">{t('common.categories')}</TabsTrigger>
                <TabsTrigger value="paymentMethods">Métodos de Pagamento</TabsTrigger>
                <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
              </TabsList>
              <Button onClick={() => {
                if (activeTab === 'categories') handleAddCategory();
                // Adicione a lógica para outros botões aqui
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
            
            <Separator />
            
            <TabsContent value="categories">
              {/* Conteúdo da seção de Categorias, adaptado do seu código antigo */}
              <Card>
                <CardHeader>
                  <CardTitle>Categorias</CardTitle>
                  <CardDescription>Gerencie as categorias de transações.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    defaultValue="expense"
                    value={categoryType}
                    onValueChange={(value) => setCategoryType(value as 'expense' | 'income')}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <TabsList className="grid grid-cols-2 w-72">
                        <TabsTrigger value="expense" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                          {t('common.expense')}
                        </TabsTrigger>
                        <TabsTrigger value="income" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                          {t('common.income')}
                        </TabsTrigger>
                      </TabsList>
                      {viewMode === 'subcategories' && selectedParentCategory && (
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedParentCategory(null)}>
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <h2 className="text-xl font-semibold">Subcategorias de {selectedParentCategory.name}</h2>
                        </div>
                      )}
                    </div>
                    <TabsContent value="expense">
                      <ul className="space-y-2">
                        {mainCategories.filter(c => c.type === 'expense').map(category => (
                          <li
                            key={category.id}
                            className="bg-muted p-3 rounded-lg flex items-center justify-between hover:bg-muted/80 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedParentCategory(category);
                              setViewMode('subcategories');
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <CategoryIcon icon={category.icon} color={category.color} />
                              <span className="font-semibold">{category.name}</span>
                            </div>
                            <div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                    <Edit className="mr-2 h-4 w-4" /> {t('common.edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategory(category)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="income">
                      <ul className="space-y-2">
                        {mainCategories.filter(c => c.type === 'income').map(category => (
                          <li
                            key={category.id}
                            className="bg-muted p-3 rounded-lg flex items-center justify-between hover:bg-muted/80 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedParentCategory(category);
                              setViewMode('subcategories');
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <CategoryIcon icon={category.icon} color={category.color} />
                              <span className="font-semibold">{category.name}</span>
                            </div>
                            <div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                    <Edit className="mr-2 h-4 w-4" /> {t('common.edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategory(category)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              {/* O CategoryForm e AlertDialog são mantidos, pois são globais */}
            </TabsContent>
            
            <TabsContent value="paymentMethods">
              <Card>
                <CardHeader>
                  <CardTitle>Métodos de Pagamento</CardTitle>
                  <CardDescription>Gerencie as formas de pagamento disponíveis.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {paymentMethods.length > 0 ? (
                      paymentMethods.map(method => (
                        <li key={method.id} className="bg-muted p-3 rounded-lg flex items-center justify-between">
                          <span className="font-semibold">{method.name}</span>
                          <div>
                            {/* Adicionar DropdownMenu para Editar/Deletar */}
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePaymentMethod(method.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))
                    ) : (
                      <p>Nenhum método de pagamento cadastrado.</p>
                    )}
                  </ul>
                  <Button className="mt-4" onClick={handleAddPaymentMethod}>Adicionar Método</Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="suppliers">
              <Card>
                <CardHeader>
                  <CardTitle>Fornecedores e Clientes</CardTitle>
                  <CardDescription>Gerencie seus fornecedores e clientes.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {suppliers.length > 0 ? (
                      suppliers.map(supplier => (
                        <li key={supplier.id} className="bg-muted p-3 rounded-lg flex items-center justify-between">
                          <span className="font-semibold">{supplier.name}</span>
                          <div>
                            {/* Adicionar DropdownMenu para Editar/Deletar */}
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteSupplier(supplier.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))
                    ) : (
                      <p>Nenhum fornecedor/cliente cadastrado.</p>
                    )}
                  </ul>
                  <Button className="mt-4" onClick={handleAddSupplier}>Adicionar Fornecedor</Button>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>

        {/* Formulário de Categoria (mantido) */}
        <CategoryForm
          open={categoryFormOpen}
          onOpenChange={setCategoryFormOpen}
          initialData={initialFormData}
          onSave={handleSaveCategory}
          categoryType={initialFormData?.type || categoryType}
          parentId={initialFormData?.parent_id || selectedParentCategory?.id || null}
          parentName={initialFormData?.parent_id
            ? categories.find(cat => cat.id === initialFormData.parent_id)?.name || null
            : selectedParentCategory?.name}
          saveButtonText={t('common.saveChanges')}
        />

        {/* Modal de confirmação de exclusão (mantido) */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('categories.deleteConfirmation')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('categories.deleteWarning')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteCategory}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </SubscriptionGuard>
    </MainLayout>
  );
};

export default CadastrosPage;

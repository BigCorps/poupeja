import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit, MoreVertical, ArrowLeft } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useApp } from '@/contexts/AppContext';
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
import { Category, TransactionType } from '@/types/categories';
import { Separator } from '@/components/ui/separator';

type ViewMode = 'mainCategories' | 'subcategories';

const CategoriesPage: React.FC = () => {
  const { t } = usePreferences();
  const { categories, isLoading, addCategory, updateCategory, deleteCategory } = useApp();

  // Estados para controlar a visualização e o formulário
  const [viewMode, setViewMode] = useState<ViewMode>('mainCategories');
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [initialFormData, setInitialFormData] = useState<Partial<Category> | null>(null);
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [selectedParentCategory, setSelectedParentCategory] = useState<Category | null>(null);

  // Filtra as categorias principais (sem parent_id)
  const mainCategories = useMemo(() => {
    return categories.filter(cat => !cat.parent_id);
  }, [categories]);

  // Filtra as subcategorias para a categoria principal selecionada
  const subCategoriesForSelectedParent = useMemo(() => {
    if (!selectedParentCategory) return [];
    return categories.filter(cat => cat.parent_id === selectedParentCategory.id);
  }, [categories, selectedParentCategory]);

  // Função para abrir o formulário para adicionar uma nova categoria principal
  const handleAddCategory = () => {
    // Inicializamos o formulário com dados padrão para uma nova categoria
    setInitialFormData({
      name: '',
      type: categoryType,
      color: '#000000',
      icon: 'LayoutList',
      is_default: false,
      parent_id: null,
    });
    setCategoryFormOpen(true);
  };

  // Função para abrir o formulário para adicionar uma nova subcategoria
  const handleAddSubcategory = () => {
    // Inicializamos o formulário herdando os dados do pai
    if (!selectedParentCategory) return;
    setInitialFormData({
      name: '',
      type: selectedParentCategory.type,
      color: '#000000',
      icon: 'LayoutList',
      is_default: false,
      parent_id: selectedParentCategory.id,
    });
    setCategoryFormOpen(true);
  };

  // Função para abrir o formulário para editar uma categoria existente
  const handleEditCategory = (category: Category) => {
    setInitialFormData(category);
    setCategoryFormOpen(true);
  };

  // Função para confirmar a exclusão de uma categoria
  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory(categoryToDelete.id);
      } catch (error) {
        console.error("Erro ao deletar categoria:", error);
      } finally {
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
      }
    }
  };

  // Função para salvar uma categoria (adição ou edição)
  const handleSaveCategory = async (categoryData: Partial<Category>) => {
    try {
      // Verifica se a categoria já tem um ID, indicando que é uma edição
      if (categoryData.id) {
        // Separa o ID dos demais dados para a requisição de PATCH
        const { id, ...dataToUpdate } = categoryData;
        await updateCategory(id, dataToUpdate);
      } else {
        // Se não tem ID, é uma nova categoria. Removemos o ID nulo/vazio
        // para a requisição de POST.
        const dataToSave = { ...categoryData };
        delete dataToSave.id;
        await addCategory(dataToSave);
      }
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
    } finally {
      setCategoryFormOpen(false);
      setInitialFormData(null); // Limpa o estado do formulário após a operação
    }
  };

  if (isLoading) {
    return (
      <MainLayout title={t('categories.title')}>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={t('categories.title')}>
      <SubscriptionGuard feature="categorias personalizadas">
        <div className="space-y-4">
          {/* Cabeçalho da página: Título e botões de navegação */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'mainCategories' ? 'default' : 'outline'}
                onClick={() => {
                  setViewMode('mainCategories');
                  setSelectedParentCategory(null);
                }}
              >
                Categorias
              </Button>
              <Button
                variant={viewMode === 'subcategories' ? 'default' : 'outline'}
                onClick={() => setViewMode('subcategories')}
              >
                Subcategorias
              </Button>
            </div>
          </div>

          <Separator />

          {/* Controles de filtro e botão de ação */}
          <div className="flex justify-between items-center">
            {viewMode === 'subcategories' && selectedParentCategory ? (
              // Exibe o título da subcategoria e o botão de voltar
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedParentCategory(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">Subcategorias de {selectedParentCategory.name}</h2>
              </div>
            ) : (
              // Exibe as abas de Despesa/Receita
              <Tabs
                defaultValue="expense"
                value={categoryType}
                onValueChange={(value) => setCategoryType(value as 'expense' | 'income')}
              >
                <TabsList className="grid grid-cols-2 w-72">
                  <TabsTrigger value="expense" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                    {t('common.expense')}
                  </TabsTrigger>
                  <TabsTrigger value="income" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                    {t('common.income')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            <Button
              onClick={viewMode === 'mainCategories' ? handleAddCategory : handleAddSubcategory}
              disabled={viewMode === 'subcategories' && !selectedParentCategory}
            >
              <Plus className="mr-2 h-4 w-4" />
              {viewMode === 'mainCategories' ? 'Adicionar Categoria' : 'Adicionar Subcategoria'}
            </Button>
          </div>

          {/* Seção principal de conteúdo (lista de categorias) */}
          <div className="mt-4">
            {viewMode === 'mainCategories' ? (
              <ul className="space-y-4">
                {mainCategories
                  .filter(cat => cat.type === categoryType)
                  .map((category) => (
                    <li key={category.id} className="bg-card p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CategoryIcon icon={category.icon} color={category.color} />
                        <span className="font-semibold">{category.name}</span>
                      </div>
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteCategory(category)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </li>
                  ))}
              </ul>
            ) : (
              <div>
                {!selectedParentCategory ? (
                  <div className="space-y-4">
                    <h2 className="text-lg font-medium">Selecione uma categoria principal:</h2>
                    <ul className="space-y-2">
                      {mainCategories.map(category => (
                        <li key={category.id} className="bg-card p-3 rounded-lg cursor-pointer hover:bg-accent" onClick={() => setSelectedParentCategory(category)}>
                          <div className="flex items-center gap-3">
                            <CategoryIcon icon={category.icon} color={category.color} />
                            <span className="font-semibold">{category.name}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ul className="space-y-4">
                      {subCategoriesForSelectedParent.map(subcat => (
                        <li key={subcat.id} className="bg-card p-3 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CategoryIcon icon={subcat.icon} color={subcat.color} />
                            <span className="font-semibold">{subcat.name}</span>
                          </div>
                          <div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditCategory(subcat)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  {t('common.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteCategory(subcat)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <CategoryForm
          open={categoryFormOpen}
          onOpenChange={setCategoryFormOpen}
          initialData={initialFormData}
          onSave={handleSaveCategory}
          // Essas props agora são determinadas diretamente pelo initialFormData ou pela navegação
          categoryType={initialFormData?.type || categoryType}
          parentId={initialFormData?.parent_id || selectedParentCategory?.id || null}
          parentName={initialFormData?.parent_id
            ? categories.find(cat => cat.id === initialFormData.parent_id)?.name || null
            : selectedParentCategory?.name}
          // Adicionamos um novo prop para passar o texto traduzido do botão
          saveButtonText={t('common.saveChanges')}
        />

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

export default CategoriesPage;

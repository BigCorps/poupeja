import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit, MoreVertical } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useApp } from '@/contexts/AppContext'; // Importando o hook principal do contexto
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

const CategoriesPage: React.FC = () => {
  const { t } = usePreferences();
  const { 
    categories, 
    isLoading, 
    addCategory, 
    updateCategory, 
    deleteCategory 
  } = useApp(); // Usando o hook useApp para acessar o estado e as ações
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryType, setCategoryType] = useState<TransactionType>('expense');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Filtra as categorias com base no tipo selecionado na aba
  const filteredCategories = useMemo(() => {
    return categories.filter(category => category.type === categoryType);
  }, [categories, categoryType]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (categoryToDelete) {
      // Use a ação deleteCategory do AppContext
      await deleteCategory(categoryToDelete.id);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleSaveCategory = async (category: Omit<Category, 'id'> | Category) => {
    // Use as ações do AppContext para adicionar ou atualizar
    if ('id' in category) {
      await updateCategory(category as Category);
    } else {
      await addCategory({
        ...category,
        type: categoryType, // Garantir que o tipo está correto
      });
    }
    setCategoryFormOpen(false);
  };
  
  // Função para renderizar as categorias, tratando subcategorias
  const renderCategoriesList = (categoriesToRender: Category[]) => {
    const categoriesByParent = categoriesToRender.reduce((acc, cat) => {
      const parts = cat.name.split(' - ');
      const mainCategoryName = parts[0];
      if (!acc[mainCategoryName]) {
        acc[mainCategoryName] = [];
      }
      acc[mainCategoryName].push(cat);
      return acc;
    }, {} as Record<string, Category[]>);

    return (
      <ul className="space-y-2">
        {Object.entries(categoriesByParent).map(([mainCategoryName, subcategories]) => (
          <React.Fragment key={mainCategoryName}>
            {subcategories.length === 1 && !subcategories[0].name.includes(' - ') ? (
              // Categoria sem subcategoria
              <li key={subcategories[0].id} className="bg-card p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CategoryIcon icon={subcategories[0].icon} color={subcategories[0].color} />
                  <span>{subcategories[0].name}</span>
                </div>
                <div>
                  {subcategories[0].is_default ? (
                    <Button variant="ghost" size="sm" onClick={() => handleEditCategory(subcategories[0])}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCategory(subcategories[0])}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteCategory(subcategories[0])}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </li>
            ) : (
              // Categoria com subcategorias
              <li key={mainCategoryName} className="bg-card p-3 rounded-lg space-y-2">
                <h3 className="font-semibold text-lg">{mainCategoryName}</h3>
                <ul className="pl-6 space-y-2">
                  {subcategories.map(subcat => (
                    <li key={subcat.id} className="bg-muted p-2 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CategoryIcon icon={subcat.icon} color={subcat.color} />
                        <span>{subcat.name.split(' - ')[1] || subcat.name}</span>
                      </div>
                      <div>
                        {subcat.is_default ? (
                          <Button variant="ghost" size="sm" onClick={() => handleEditCategory(subcat)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        ) : (
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
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </React.Fragment>
        ))}
      </ul>
    );
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
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
            <Button onClick={handleAddCategory}>
              <Plus className="mr-2 h-4 w-4" />
              {t('categories.add')}
            </Button>
          </div>
          
          <Tabs 
            defaultValue="expense" 
            value={categoryType}
            onValueChange={(value) => setCategoryType(value as TransactionType)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 lg:grid-cols-4 mb-4">
              <TabsTrigger value="expense" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                {t('common.expense')}
              </TabsTrigger>
              <TabsTrigger value="income" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                {t('common.income')}
              </TabsTrigger>
              <TabsTrigger value="operational" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                Fluxo Operacional
              </TabsTrigger>
              <TabsTrigger value="investment" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Fluxo de Investimento
              </TabsTrigger>
              <TabsTrigger value="financing" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                Fluxo de Financiamento
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="expense" className="mt-0">
              {renderCategoriesList(filteredCategories.filter(cat => cat.type === 'expense'))}
            </TabsContent>
            
            <TabsContent value="income" className="mt-0">
              {renderCategoriesList(filteredCategories.filter(cat => cat.type === 'income'))}
            </TabsContent>

            <TabsContent value="operational" className="mt-0">
              {renderCategoriesList(filteredCategories.filter(cat => cat.type.includes('operational')))}
            </TabsContent>
            
            <TabsContent value="investment" className="mt-0">
              {renderCategoriesList(filteredCategories.filter(cat => cat.type.includes('investment')))}
            </TabsContent>

            <TabsContent value="financing" className="mt-0">
              {renderCategoriesList(filteredCategories.filter(cat => cat.type.includes('financing')))}
            </TabsContent>
          </Tabs>
        </div>

        <CategoryForm
          open={categoryFormOpen}
          onOpenChange={setCategoryFormOpen}
          initialData={editingCategory}
          onSave={handleSaveCategory}
          categoryType={categoryType}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('categories.deleteConfirmation')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('categories.deleteWarning')}
                {categoryToDelete?.is_default && (
                  <p className="mt-2 text-destructive font-medium">
                    {t('categories.defaultWarning')}
                  </p>
                )}
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

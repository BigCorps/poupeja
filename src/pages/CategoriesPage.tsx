import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit, MoreVertical } from 'lucide-react';
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

const CategoriesPage: React.FC = () => {
  const { t } = usePreferences();
  const { 
    categories, 
    isLoading, 
    addCategory, 
    updateCategory, 
    deleteCategory 
  } = useApp();
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');
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
      await deleteCategory(categoryToDelete.id);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleSaveCategory = async (category: Omit<Category, 'id'> | Category) => {
    if ('id' in category) {
      await updateCategory(category as Category);
    } else {
      await addCategory({
        ...category,
        type: categoryType,
      });
    }
    setCategoryFormOpen(false);
  };

  // Agrupa as categorias por parent_id para criar a visualização hierárquica
  const categoriesByParent = useMemo(() => {
    const parentCategories = filteredCategories.filter(cat => !cat.parent_id);
    const subCategories = filteredCategories.filter(cat => cat.parent_id);

    return parentCategories.map(parent => ({
      ...parent,
      subcategories: subCategories.filter(sub => sub.parent_id === parent.id),
    }));
  }, [filteredCategories]);
  
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
            onValueChange={(value) => setCategoryType(value as 'expense' | 'income')}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="expense" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                {t('common.expense')}
              </TabsTrigger>
              <TabsTrigger value="income" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                {t('common.income')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="expense" className="mt-0">
              <ul className="space-y-4">
                {categoriesByParent.filter(cat => cat.type === 'expense').map((category) => (
                  <li key={category.id} className="bg-card p-3 rounded-lg flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CategoryIcon icon={category.icon} color={category.color} />
                        <span className="font-semibold">{category.name}</span>
                      </div>
                      <div>
                        {category.is_default ? (
                          <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
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
                        )}
                      </div>
                    </div>
                    {/* Renderiza subcategorias */}
                    {category.subcategories.length > 0 && (
                      <ul className="mt-2 pl-8 space-y-2">
                        {category.subcategories.map(subcat => (
                          <li key={subcat.id} className="bg-muted p-2 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CategoryIcon icon={subcat.icon} color={subcat.color} />
                              <span>{subcat.name}</span>
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
                    )}
                  </li>
                ))}
              </ul>
            </TabsContent>
            
            <TabsContent value="income" className="mt-0">
              <ul className="space-y-4">
                {categoriesByParent.filter(cat => cat.type === 'income').map((category) => (
                  <li key={category.id} className="bg-card p-3 rounded-lg flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CategoryIcon icon={category.icon} color={category.color} />
                        <span className="font-semibold">{category.name}</span>
                      </div>
                      <div>
                        {category.is_default ? (
                          <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
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
                        )}
                      </div>
                    </div>
                    {/* Renderiza subcategorias */}
                    {category.subcategories.length > 0 && (
                      <ul className="mt-2 pl-8 space-y-2">
                        {category.subcategories.map(subcat => (
                          <li key={subcat.id} className="bg-muted p-2 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CategoryIcon icon={subcat.icon} color={subcat.color} />
                              <span>{subcat.name}</span>
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
                    )}
                  </li>
                ))}
              </ul>
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

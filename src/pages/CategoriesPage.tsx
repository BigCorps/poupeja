import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit, MoreVertical, ChevronRight, Folder } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useApp } from '@/contexts/AppContext'; // Usando o AppContext
import { Category } from '@/types/categories';
import { addCategory, updateCategory, deleteCategory } from '@/services/categoryService';
import { useToast } from "@/hooks/use-toast";
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
import { cn } from "@/lib/utils";

// Interface para a categoria aninhada
interface NestedCategory extends Category {
  children: NestedCategory[];
}

// Componente para renderizar a árvore de categorias recursivamente na lista
const CategoryHierarchyList = ({ categories, handleEdit, handleDelete }) => {
  if (!categories || categories.length === 0) {
    return <p className="text-center text-muted-foreground">{t('categories.noCategories')}</p>;
  }
  
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  const toggleOpen = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNestedCategories = (categoryList: NestedCategory[], level = 0) => {
    return categoryList.map(category => (
      <React.Fragment key={category.id}>
        <li 
          className={cn(
            "bg-card p-3 rounded-lg flex items-center justify-between transition-colors",
            level > 0 && "pl-8" // Aplica padding para subcategorias
          )}
        >
          <div className="flex items-center gap-3">
            {category.children.length > 0 && (
              <ChevronRight
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200 cursor-pointer",
                  openItems[category.id] && "rotate-90"
                )}
                onClick={() => toggleOpen(category.id)}
              />
            )}
            <CategoryIcon icon={category.icon} color={category.color} />
            <span>{category.name}</span>
          </div>
          <div>
            {category.is_default ? (
              <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
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
                  <DropdownMenuItem onClick={() => handleEdit(category)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('common.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(category)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </li>
        {openItems[category.id] && (
          <ul className="space-y-2 mt-2">
            {renderNestedCategories(category.children, level + 1)}
          </ul>
        )}
      </React.Fragment>
    ));
  };

  return (
    <ul className="space-y-2">
      {renderNestedCategories(categories)}
    </ul>
  );
};


const CategoriesPage: React.FC = () => {
  const { t } = usePreferences();
  const { toast } = useToast();
  const { categories, isLoading } = useApp();
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [tabType, setTabType] = useState<'inflow' | 'outflow'>('inflow');

  // Função para construir a árvore hierárquica de categorias
  const buildCategoryTree = (categoryList: Category[]): NestedCategory[] => {
    const categoriesById = new Map<string, NestedCategory>(
      categoryList.map(cat => [cat.id, { ...cat, children: [] }])
    );
    const rootCategories: NestedCategory[] = [];
  
    categoryList.forEach(cat => {
      const nestedCat = categoriesById.get(cat.id)!;
      if (cat.parent_id) {
        const parent = categoriesById.get(cat.parent_id);
        if (parent) {
          parent.children.push(nestedCat);
        } else {
          rootCategories.push(nestedCat);
        }
      } else {
        rootCategories.push(nestedCat);
      }
    });
  
    return rootCategories;
  };
  
  const inflowTypes = ['operational_inflow', 'investment_inflow', 'financing_inflow'];
  const outflowTypes = ['operational_outflow', 'investment_outflow', 'financing_outflow'];
  
  const filteredCategories = useMemo(() => {
    if (isLoading) return [];
    
    let filteredList = [];
    if (tabType === 'inflow') {
      filteredList = categories.filter(cat => inflowTypes.includes(cat.type));
    } else {
      filteredList = categories.filter(cat => outflowTypes.includes(cat.type));
    }
  
    return buildCategoryTree(filteredList);
  }, [categories, isLoading, tabType]);

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
      try {
        const success = await deleteCategory(categoryToDelete.id);
        if (success) {
          // A categoria foi deletada, o useApp hook já irá atualizar
          toast({
            title: t('categories.deleted'),
            description: `${categoryToDelete.name} ${t('categories.wasDeleted')}`,
          });
        } else {
          toast({
            title: t('common.error'),
            description: t('categories.defaultCantDelete'),
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        toast({
          title: t('common.error'),
          description: t('common.somethingWentWrong'),
          variant: "destructive",
        });
      } finally {
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
      }
    }
  };

  const handleSaveCategory = async (category: Omit<Category, 'id'> | Category) => {
    try {
      if ('id' in category) {
        // Update existing category
        await updateCategory(category as Category);
        toast({
          title: "Categoria atualizada",
          description: `A categoria ${category.name} foi atualizada com sucesso.`,
        });
      } else {
        // Add new category
        await addCategory(category as Omit<Category, 'id'>);
        toast({
          title: "Categoria adicionada",
          description: `A categoria ${category.name} foi adicionada com sucesso.`,
        });
      }
      
      setCategoryFormOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: t('common.error'),
        description: t('common.somethingWentWrong'),
        variant: "destructive",
      });
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
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
            <Button onClick={handleAddCategory}>
              <Plus className="mr-2 h-4 w-4" />
              {t('categories.add')}
            </Button>
          </div>
          
          <Tabs 
            defaultValue="inflow" 
            value={tabType}
            onValueChange={(value) => setTabType(value as 'inflow' | 'outflow')}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="inflow" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                Entradas
              </TabsTrigger>
              <TabsTrigger value="outflow" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                Saídas
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="inflow" className="mt-0">
              <CategoryHierarchyList 
                categories={filteredCategories} 
                handleEdit={handleEditCategory} 
                handleDelete={handleDeleteCategory}
              />
            </TabsContent>
            
            <TabsContent value="outflow" className="mt-0">
              <CategoryHierarchyList 
                categories={filteredCategories} 
                handleEdit={handleEditCategory} 
                handleDelete={handleDeleteCategory}
              />
            </TabsContent>
          </Tabs>
        </div>

        <CategoryForm
          open={categoryFormOpen}
          onOpenChange={setCategoryFormOpen}
          initialData={editingCategory}
          onSave={handleSaveCategory}
          categoryType={tabType === 'inflow' ? 'operational_inflow' : 'operational_outflow'}
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

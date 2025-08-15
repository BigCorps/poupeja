import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Category, TransactionType } from '@/types/categories';
import ColorPicker from './ColorPicker';
import IconSelector from './IconSelector';
import { useAppContext } from '@/contexts/AppContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

// Schema de validação com Zod
const categorySchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  type: z.enum(['income', 'expense'], { required_error: 'O tipo é obrigatório.' }),
  color: z.string().optional(),
  icon: z.string().optional(),
  is_default: z.boolean().default(false),
  parent_id: z.string().optional().nullable(),
});

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Category | null;
  onSave: (category: Omit<Category, 'id'> | Category) => void;
  categoryType: TransactionType;
  parentId?: string | null;
  parentName?: string | null;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  open,
  onOpenChange,
  initialData,
  onSave,
  categoryType,
  parentId,
  parentName,
}) => {
  const { t } = usePreferences();
  const { categories } = useAppContext();
  
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: categoryType,
      color: '#3B82F6',
      icon: 'circle',
      is_default: false,
      parent_id: parentId || null,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name || '',
          type: initialData.type || categoryType,
          color: initialData.color || '#3B82F6',
          icon: initialData.icon || 'circle',
          is_default: initialData.is_default || false,
          parent_id: initialData.parent_id || null,
        });
      } else {
        form.reset({
          name: '',
          type: categoryType,
          color: '#3B82F6',
          icon: 'circle',
          is_default: false,
          parent_id: parentId || null,
        });
      }
    }
  }, [open, initialData, form, categoryType, parentId]);

  const onSubmit = (data: any) => {
    if (initialData && initialData.id) {
      onSave({ ...data, id: initialData.id });
    } else {
      onSave(data);
    }
    onOpenChange(false);
  };

  // Filtrar categorias principais para seleção de parent
  const parentCategories = categories.filter(cat => 
    cat.parent_id === null && 
    cat.type === categoryType &&
    (!initialData || cat.id !== initialData.id) // Evitar que uma categoria seja pai de si mesma
  );

  const isSubcategory = parentId || initialData?.parent_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="category-dialog-description">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar categoria' : isSubcategory ? 'Adicionar subcategoria' : 'Adicionar categoria'}
          </DialogTitle>
          <DialogDescription id="category-dialog-description">
            {initialData 
              ? 'Edite os detalhes da categoria.' 
              : isSubcategory 
                ? 'Preencha os detalhes para adicionar uma nova subcategoria.'
                : 'Preencha os detalhes para adicionar uma nova categoria.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            {parentName && (
              <div className="bg-muted p-2 rounded-lg text-sm text-center">
                Adicionando subcategoria para: <span className="font-semibold">{parentName}</span>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <FormLabel htmlFor="name" className="text-right">Nome</FormLabel>
                    <FormControl>
                      <Input id="name" {...field} className="col-span-3" placeholder="Nome da categoria" />
                    </FormControl>
                  </div>
                  <FormMessage className="col-start-2 col-span-3" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <FormLabel htmlFor="type" className="text-right">Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubcategory}>
                      <FormControl className="col-span-3">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="expense">Despesa</SelectItem>
                        <SelectItem value="income">Receita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage className="col-start-2 col-span-3" />
                </FormItem>
              )}
            />

            {!isSubcategory && (
              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <FormLabel htmlFor="parent_id" className="text-right">Categoria Pai</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl className="col-span-3">
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria pai (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhuma (categoria principal)</SelectItem>
                          {parentCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage className="col-start-2 col-span-3" />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <FormLabel htmlFor="color" className="text-right">Cor</FormLabel>
                    <FormControl>
                      <div className="col-span-3">
                        <ColorPicker selectedColor={field.value} onSelectColor={field.onChange} />
                      </div>
                    </FormControl>
                  </div>
                  <FormMessage className="col-start-2 col-span-3" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <FormLabel htmlFor="icon" className="text-right">Ícone</FormLabel>
                    <FormControl>
                      <div className="col-span-3">
                        <IconSelector selectedIcon={field.value} onSelectIcon={field.onChange} />
                      </div>
                    </FormControl>
                  </div>
                  <FormMessage className="col-start-2 col-span-3" />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-4">
              <Button type="submit">
                {initialData ? 'Salvar alterações' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;

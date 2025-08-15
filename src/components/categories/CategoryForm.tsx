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
    console.log('📝 Dados do formulário:', data);
    
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
  const isEditing = initialData && initialData.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="category-dialog-description">
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? 'Editar categoria' 
              : isSubcategory 
                ? 'Adicionar subcategoria' 
                : 'Adicionar categoria'
            }
          </DialogTitle>
          <DialogDescription id="category-dialog-description">
            {isEditing 
              ? 'Edite os detalhes da categoria.' 
              : isSubcategory 
                ? 'Preencha os detalhes para adicionar uma nova subcategoria.'
                : 'Preencha os detalhes para adicionar uma nova categoria.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {parentName && (
              <div className="bg-muted p-3 rounded-lg text-sm text-center">
                Adicionando subcategoria para: <span className="font-semibold">{parentName}</span>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da categoria</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite o nome da categoria" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Seleção de tipo - apenas para categorias principais ou ao editar */}
            {!isSubcategory && (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo da categoria</FormLabel>
                    <FormControl>
                      <div className="flex rounded-lg border p-1">
                        <Button
                          type="button"
                          variant={field.value === 'expense' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => field.onChange('expense')}
                          className="flex-1 rounded-md"
                        >
                          Despesa
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === 'income' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => field.onChange('income')}
                          className="flex-1 rounded-md"
                        >
                          Receita
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Seleção de categoria pai - apenas para categorias principais */}
            {!isSubcategory && !isEditing && parentCategories.length > 0 && (
              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria pai (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'none'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria pai (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma (categoria principal)</SelectItem>
                        {parentCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor da categoria</FormLabel>
                  <FormControl>
                    <ColorPicker selectedColor={field.value} onSelectColor={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ícone da categoria</FormLabel>
                  <FormControl>
                    <IconSelector selectedIcon={field.value} onSelectIcon={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? 'Salvar alterações' : 'Adicionar categoria'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;

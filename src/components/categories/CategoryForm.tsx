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
import { useApp } from '@/contexts/AppContext';
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
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: categoryType,
      color: '#000000',
      icon: 'LayoutList',
      is_default: false,
      parent_id: parentId || null,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          ...initialData,
          parent_id: initialData.parent_id || null, // Garante que é null, não undefined
        });
      } else {
        form.reset({
          name: '',
          type: categoryType,
          color: '#000000',
          icon: 'LayoutList',
          is_default: false,
          parent_id: parentId || null,
        });
      }
    }
  }, [open, initialData, form, categoryType, parentId]);

  const onSubmit = (data) => {
    if (initialData) {
      onSave({ ...data, id: initialData.id });
    } else {
      onSave(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="category-dialog-description">
        <DialogHeader>
          <DialogTitle>{initialData ? t('categories.edit') : t('categories.add')}</DialogTitle>
          <DialogDescription id="category-dialog-description">
            {initialData ? 'Edite os detalhes da categoria.' : 'Preencha os detalhes para adicionar uma nova categoria.'}
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
                    <FormLabel htmlFor="name" className="text-right">{t('common.name')}</FormLabel>
                    <FormControl>
                      <Input id="name" {...field} className="col-span-3" />
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
                    <FormLabel htmlFor="type" className="text-right">{t('common.type')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl className="col-span-3">
                        <SelectTrigger>
                          <SelectValue placeholder={t('common.selectType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="expense">{t('common.expense')}</SelectItem>
                        <SelectItem value="income">{t('common.income')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage className="col-start-2 col-span-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <FormLabel htmlFor="color" className="text-right">Cor</FormLabel>
                    <FormControl>
                      <div className="col-span-3">
                        <ColorPicker value={field.value} onChange={field.onChange} />
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
                        <IconSelector value={field.value} onChange={field.onChange} />
                      </div>
                    </FormControl>
                  </div>
                  <FormMessage className="col-start-2 col-span-3" />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit">
                {initialData ? t('common.saveChanges') : t('common.add')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;

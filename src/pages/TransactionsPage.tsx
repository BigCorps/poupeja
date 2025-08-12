import React, { useEffect } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/use-categories'; // Importa o novo hook de categorias
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

// Defina o tipo de dados da transação com base no seu esquema
// ou no que você já usa no app.
type TransactionData = {
  type: 'expense' | 'income';
  value: number;
  categoryId?: string;
  subcategoryId?: string;
  date: string;
  description: string;
};

// Schema de validação usando Zod
const formSchema = z.object({
  type: z.enum(['expense', 'income']),
  value: z.number().positive('O valor deve ser maior que zero.'),
  // A categoria é obrigatória se o tipo for despesa ou receita
  categoryId: z.string().uuid().optional(),
  // A subcategoria é obrigatória se a categoria principal for selecionada
  subcategoryId: z.string().uuid().optional(),
  date: z.string().min(1, 'A data é obrigatória.'),
  description: z.string().optional(),
}).refine(data => {
  // Validação personalizada para garantir que categoria e subcategoria
  // são selecionadas quando necessário
  if (data.type === 'expense' || data.type === 'income') {
    return data.categoryId !== undefined;
  }
  return true;
}, {
  message: 'A categoria é obrigatória.',
  path: ['categoryId'],
});


export default function TransactionForm({ open, onOpenChange, initialData, mode, personType }) {
  const { categories, loading, error } = useCategories();
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      type: 'expense',
      value: 0,
      categoryId: undefined,
      subcategoryId: undefined,
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
    },
  });

  const selectedCategoryId = watch('categoryId');

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        date: format(parseISO(initialData.date), 'yyyy-MM-dd')
      });
    } else {
      reset({
        type: 'expense',
        value: 0,
        categoryId: undefined,
        subcategoryId: undefined,
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
      });
    }
  }, [initialData, reset]);

  const onSubmit = (data: TransactionData) => {
    console.log(data);
    // Aqui você faria a lógica de adicionar/editar a transação
    // usando o Supabase.
    onOpenChange(false);
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    // Encontra a subcategoria para determinar a categoria pai
    const subcategory = categories.flatMap(c => c.subcategories || []).find(s => s.id === subcategoryId);
    if (subcategory) {
      // Define a categoria principal com base na subcategoria
      setValue('categoryId', subcategory.parent_id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar Transação' : 'Adicionar Transação (PF)'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-center space-x-2 p-1 bg-gray-100 rounded-md">
            <Button
              type="button"
              variant={watch('type') === 'income' ? 'default' : 'ghost'}
              onClick={() => setValue('type', 'income')}
              className={cn("w-1/2 rounded-md transition-colors", watch('type') === 'income' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-200')}
            >
              Receita
            </Button>
            <Button
              type="button"
              variant={watch('type') === 'expense' ? 'default' : 'ghost'}
              onClick={() => setValue('type', 'expense')}
              className={cn("w-1/2 rounded-md transition-colors", watch('type') === 'expense' ? 'bg-destructive text-destructive-foreground' : 'hover:bg-gray-200')}
            >
              Despesa
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              {...register('value', { valueAsNumber: true })}
            />
            {errors.value && <p className="text-red-500 text-sm">{errors.value.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Categoria Principal</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue('subcategoryId', undefined); // Limpa a subcategoria ao mudar a categoria principal
                  }}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && <p className="text-red-500 text-sm">{errors.categoryId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Subcategoria</Label>
            <Controller
              name="subcategoryId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleSubcategoryChange(value);
                  }}
                  value={field.value}
                  disabled={!selectedCategoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a subcategoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .find(c => c.id === selectedCategoryId)
                      ?.subcategories?.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
            />
            {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Input
              id="description"
              type="text"
              {...register('description')}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit">Salvar Transação</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

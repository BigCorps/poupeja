import React, { useEffect } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Transaction, TransactionType } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import HierarchicalCategorySelector from '../categories/HierarchicalCategorySelector';
import Select, { components, SingleValueProps } from 'react-select';
import { Category } from '@/types';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Transaction | null;
}

// ** CORREÇÃO AQUI: A subcategoria agora é opcional de verdade **
const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  date: z.date({
    required_error: 'A data é obrigatória.',
  }),
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que 0.'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'A categoria é obrigatória.'),
  subcategoryId: z.string().optional(), // Alterado para opcional
  supplier: z.string().optional(),
  original_amount: z.coerce.number().optional(),
  due_date: z.date().optional(),
  payment_status: z.enum(['pending', 'paid', 'overdue', 'projected']).optional(),
  goalId: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof formSchema>;

const TransactionForm: React.FC<TransactionFormProps> = ({ open, onOpenChange, initialData }) => {
  const { categories, addTransaction, updateTransaction } = useAppContext();
  const { t, currency } = usePreferences();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'expense',
      date: new Date(),
      amount: 0,
      description: '',
      categoryId: '',
      subcategoryId: undefined, // Garantindo que o valor padrão seja undefined
      supplier: '',
      original_amount: undefined,
      due_date: undefined,
      payment_status: 'pending',
      goalId: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        date: initialData.date ? new Date(initialData.date) : new Date(),
        due_date: initialData.due_date ? new Date(initialData.due_date) : undefined,
        amount: initialData.amount,
        original_amount: initialData.original_amount,
        categoryId: initialData.categoryId || '',
        subcategoryId: initialData.subcategoryId || undefined,
        description: initialData.description || '',
        supplier: initialData.supplier || '',
        payment_status: initialData.payment_status || 'pending',
        goalId: initialData.goalId || '',
      });
    } else {
      form.reset();
    }
  }, [initialData, form]);

  const onSubmit = (values: TransactionFormValues) => {
    const transactionToSave = {
      ...values,
      date: values.date.toISOString(),
      due_date: values.due_date ? values.due_date.toISOString() : undefined,
      // Garante que subcategoryId seja null se não for selecionado
      subcategoryId: values.subcategoryId || undefined,
    };

    if (initialData) {
      updateTransaction(initialData.id, transactionToSave as Transaction);
    } else {
      addTransaction(transactionToSave as Transaction);
    }
    onOpenChange(false);
    form.reset();
  };

  const getCategoryOptions = (
    categories: Category[],
    level: number = 0
  ): { value: string; label: string; isDisabled?: boolean }[] => {
    return categories.flatMap(cat => [
      {
        value: cat.id,
        label: `${'-- '.repeat(level)}${cat.name}`,
        isDisabled: level === 0 && cat.subcategories.length > 0,
      },
      ...getCategoryOptions(cat.subcategories, level + 1),
    ]);
  };

  const allCategories = form.watch('type') === 'income'
    ? categories.filter(c => c.type === 'income')
    : categories.filter(c => c.type === 'expense');
  
  const categoryOptions = allCategories.flatMap(c => [
    { value: c.id, label: c.name, type: c.type },
    ...c.subcategories.map(sc => ({ value: sc.id, label: `↳ ${sc.name}`, type: sc.type })),
  ]);

  const subcategoryOptions = categories
    .flatMap(c => c.subcategories)
    .map(sc => ({ value: sc.id, label: sc.name }));
  
  const selectedCategory = form.watch('categoryId');
  const availableSubcategories = categories
    .find(c => c.id === selectedCategory)?.subcategories
    .map(sc => ({ value: sc.id, label: sc.name })) || [];


  const CustomSingleValue = (props: SingleValueProps<{ value: string; label: string }>) => (
    <components.SingleValue {...props}>
      <div className="flex items-center gap-2">
        {props.data.label}
      </div>
    </components.SingleValue>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{initialData ? t('transactions.edit') : t('transactions.new')}</SheetTitle>
          <SheetDescription>
            {t('transactions.formDescription')}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.type')}</FormLabel>
                  <FormControl>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant={field.value === 'income' ? 'default' : 'outline'}
                        onClick={() => field.onChange('income')}
                        className="w-full"
                      >
                        {t('income.title')}
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'expense' ? 'destructive' : 'outline'}
                        onClick={() => field.onChange('expense')}
                        className="w-full"
                      >
                        {t('expense.title')}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.category')}</FormLabel>
                  <FormControl>
                    <HierarchicalCategorySelector
                      value={field.value}
                      onChange={field.onChange}
                      categories={allCategories}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subcategoria agora só aparece se a categoria principal tiver subcategorias */}
            {availableSubcategories.length > 0 && (
              <FormField
                control={form.control}
                name="subcategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.subcategory')} ({t('common.optional')})</FormLabel>
                    <FormControl>
                      <Select
                        {...field}
                        options={availableSubcategories}
                        value={availableSubcategories.find(option => option.value === field.value)}
                        onChange={(option) => field.onChange(option?.value)}
                        isClearable
                        placeholder={t('form.selectSubcategory')}
                        components={{ SingleValue: CustomSingleValue }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.amount')}</FormLabel>
                  <FormControl>
                    <Input placeholder="0.00" {...field} type="number" step="0.01" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.description')} ({t('common.optional')})</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('form.descriptionPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.supplier')} ({t('common.optional')})</FormLabel>
                  <FormControl>
                    <Input placeholder={t('form.supplierPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.date')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: ptBR })
                          ) : (
                            <span>{t('form.selectDate')}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {initialData ? t('common.save') : t('common.add')}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default TransactionForm;

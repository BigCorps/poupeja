import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Transaction } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import TransactionTypeSelector from './TransactionTypeSelector';
import AmountInput from './AmountInput';
import CategoryDateFields from './CategoryDateFields';
import DescriptionField from './DescriptionField';
import GoalSelector from './GoalSelector';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Transaction | null;
  mode: 'create' | 'edit';
  viewMode: 'PF' | 'PJ';
  defaultType?: 'income' | 'expense';
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  open,
  onOpenChange,
  initialData,
  mode,
  viewMode,
  defaultType = 'expense',
}) => {
  const { t } = usePreferences();
  const { addTransaction, updateTransaction } = useAppContext();
  const { toast } = useToast();
  
  // Schema para PF
  const transactionSchemaPF = z.object({
    type: z.enum(['income', 'expense']),
    amount: z.number({ required_error: t('forms.transaction.validation.amountRequired') }).min(0.01, t('forms.transaction.validation.amountMinimum')),
    categoryId: z.string({ required_error: t('forms.transaction.validation.categoryRequired') }).min(1),
    transactionDate: z.date({ required_error: t('forms.transaction.validation.dateRequired') }),
    description: z.string().optional(),
    goalId: z.string().optional(),
  });

  // Schema para PJ - apenas campos essenciais obrigatórios
  const transactionSchemaPJ = z.object({
    type: z.enum(['operational_inflow', 'operational_outflow', 'investment_inflow', 'investment_outflow', 'financing_inflow', 'financing_outflow']),
    paidAmount: z.number().min(0.01, t('forms.transaction.validation.paidAmountRequired')),
    originalAmount: z.number().min(0).optional(),
    lateInterestAmount: z.number().min(0).optional(),
    categoryId: z.string().min(1, t('forms.transaction.validation.categoryRequired')),
    description: z.string().min(1, t('forms.transaction.validation.descriptionRequired')),
    referenceDate: z.date(),
    supplier: z.string().optional(),
    paymentMethod: z.string().optional(),
    dueDate: z.date().optional(),
    paymentDate: z.date().optional(),
    paymentStatus: z.enum(['pending', 'paid', 'overdue', 'projected']).default('pending'),
  });

  const schema = viewMode === 'PF' ? transactionSchemaPF : transactionSchemaPJ;

  const getDefaultValues = () => {
    if (viewMode === 'PF') {
      return {
        type: defaultType,
        amount: 0,
        categoryId: '',
        transactionDate: new Date(),
        description: '',
        goalId: '',
      };
    } else {
      return {
        type: 'operational_outflow',
        paidAmount: 0,
        originalAmount: 0,
        lateInterestAmount: 0,
        categoryId: '',
        description: '',
        referenceDate: new Date(),
        supplier: '',
        paymentMethod: '',
        dueDate: new Date(),
        paymentDate: new Date(),
        paymentStatus: 'pending' as const,
      };
    }
  };

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || getDefaultValues(),
  });

  // Componente para seletor de categorias PJ
  const CategorySelectorPJ = ({ form }: { form: any }) => {
    return (
      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('forms.transaction.fields.classification')} *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('forms.transaction.placeholders.selectCategory')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="operational_revenue">{t('transactionTypes.operational_inflow')}</SelectItem>
                <SelectItem value="operational_expense">{t('transactionTypes.operational_outflow')}</SelectItem>
                <SelectItem value="investment_income">{t('transactionTypes.investment_inflow')}</SelectItem>
                <SelectItem value="investment_expense">{t('transactionTypes.investment_outflow')}</SelectItem>
                <SelectItem value="financing_income">{t('transactionTypes.financing_inflow')}</SelectItem>
                <SelectItem value="financing_expense">{t('transactionTypes.financing_outflow')}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  // Componente para seletor de tipo PJ
  const TransactionTypeSelectorPJ = ({ form }: { form: any }) => {
    return (
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('forms.transaction.fields.movementType')} *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('forms.transaction.placeholders.selectType')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="operational_inflow">{t('transactionTypes.operational_inflow')}</SelectItem>
                <SelectItem value="operational_outflow">{t('transactionTypes.operational_outflow')}</SelectItem>
                <SelectItem value="investment_inflow">{t('transactionTypes.investment_inflow')}</SelectItem>
                <SelectItem value="investment_outflow">{t('transactionTypes.investment_outflow')}</SelectItem>
                <SelectItem value="financing_inflow">{t('transactionTypes.financing_inflow')}</SelectItem>
                <SelectItem value="financing_outflow">{t('transactionTypes.financing_outflow')}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const onSubmit = async (data: any) => {
    try {
      console.log("Dados do formulário:", data);
      
      if (mode === 'create') {
        // await addTransaction(data);
        toast({
          title: t('messages.success.transactionAdded'),
          description: t('messages.success.transactionAdded'),
        });
      } else {
        // await updateTransaction(initialData.id, data);
        toast({
          title: t('messages.success.transactionUpdated'),
          description: t('messages.success.transactionUpdated'),
        });
      }
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      toast({
        title: t('common.error'),
        description: t('messages.error.savingTransaction'),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (open) {
      const defaultValues = initialData || getDefaultValues();
      form.reset(defaultValues);
    }
  }, [open, initialData, viewMode, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="bg-background p-6 border-b">
          <DialogTitle className="text-xl">
            {mode === 'create' 
              ? (viewMode === 'PF' ? t('forms.transaction.addTitlePF') : t('forms.transaction.addTitlePJ'))
              : (viewMode === 'PF' ? t('forms.transaction.editTitlePF') : t('forms.transaction.editTitlePJ'))
            }
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {viewMode === 'PF' && (
                <>
                  <TransactionTypeSelector 
                    form={form} 
                    onTypeChange={(type) => form.setValue('type', type as any)} 
                  />
                  <AmountInput form={form} />
                  <CategoryDateFields 
                    form={form} 
                    transactionType={form.watch('type')} 
                  />
                  <DescriptionField form={form} />
                  {form.watch('type') === 'income' && <GoalSelector form={form} />}
                </>
              )}

              {viewMode === 'PJ' && (
                <>
                  <TransactionTypeSelectorPJ form={form} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="paidAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('forms.transaction.fields.paidAmount')} *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder={t('forms.transaction.placeholders.amountPlaceholder')}
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="originalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('forms.transaction.fields.originalAmount')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder={t('forms.transaction.placeholders.amountPlaceholder')}
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lateInterestAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('forms.transaction.fields.lateInterestAmount')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder={t('forms.transaction.placeholders.amountPlaceholder')}
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('forms.transaction.fields.supplier')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('forms.transaction.placeholders.supplierName')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('forms.transaction.fields.paymentMethod')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('forms.transaction.placeholders.paymentMethodExample')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <CategorySelectorPJ form={form} />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('forms.transaction.fields.description')} *</FormLabel>
                        <FormControl>
                          <textarea 
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder={t('forms.transaction.placeholders.describeTransaction')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="referenceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('forms.transaction.fields.referenceDate')} *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('forms.transaction.fields.dueDate')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('forms.transaction.fields.paymentDate')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="paymentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('forms.transaction.fields.paymentStatus')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('forms.transaction.placeholders.selectStatus')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">{t('paymentStatus.pending')}</SelectItem>
                            <SelectItem value="paid">{t('paymentStatus.paid')}</SelectItem>
                            <SelectItem value="overdue">{t('paymentStatus.overdue')}</SelectItem>
                            <SelectItem value="projected">{t('paymentStatus.projected')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <DialogFooter className="pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                  className={cn(
                    viewMode === 'PF' && form.watch('type') === 'income' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : ''
                  )}
                >
                  {form.formState.isSubmitting 
                    ? t('messages.loading.saving')
                    : mode === 'create' 
                      ? t('common.add') 
                      : t('common.save')
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;

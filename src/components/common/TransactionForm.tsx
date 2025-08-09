import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
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
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

// Zod schemas para os dois tipos de formulário
const transactionSchemaPF = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number({ required_error: "O valor é obrigatório." }).min(0.01, "O valor deve ser maior que zero."),
  categoryId: z.string({ required_error: "A categoria é obrigatória." }).min(1),
  transactionDate: z.date({ required_error: "A data é obrigatória." }),
  description: z.string().optional(),
  goalId: z.string().optional(),
});

const transactionSchemaPJ = z.object({
  type: z.enum(['income', 'expense', 'operational_inflow', 'operational_outflow', 'investment_inflow', 'investment_outflow', 'financing_inflow', 'financing_outflow']),
  originalAmount: z.number().min(0),
  lateInterestAmount: z.number().min(0).optional(),
  paidAmount: z.number().min(0.01),
  categoryId: z.string().min(1, "A categoria é obrigatória."),
  supplier: z.string().min(1, "O fornecedor é obrigatório."),
  description: z.string().min(1, "A descrição é obrigatória."),
  paymentMethod: z.string().min(1, "A forma de pagamento é obrigatória."),
  referenceDate: z.date(),
  dueDate: z.date(),
  paymentDate: z.date(),
  paymentStatus: z.enum(['pending', 'paid', 'overdue', 'projected']),
});

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Transaction | null;
  mode: 'create' | 'edit';
  viewMode: 'PF' | 'PJ'; // Novo campo
  defaultType?: 'income' | 'expense';
}

// Placeholder para o seletor de categorias hierárquico
const CategorySelectorPJ = ({ form }) => {
  // Implemente o seletor de categorias PJ aqui, que irá exibir a hierarquia
  return (
    <div>
      <Label>Classificação</Label>
      <Input placeholder="Selecione a categoria..." {...form.register('categoryId')} />
    </div>
  );
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
  const { setCustomDateRange, getTransactions, getGoals } = useAppContext();
  const { toast } = useToast();
  
  // Conditionally select the schema based on viewMode
  const schema = viewMode === 'PF' ? transactionSchemaPF : transactionSchemaPJ;

  // Initialize form with react-hook-form and zod
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      // Default values for PF
      type: defaultType,
      amount: 0,
      categoryId: '',
      transactionDate: new Date(),
      description: '',
      goalId: '',
      // Default values for PJ
      originalAmount: 0,
      lateInterestAmount: 0,
      paidAmount: 0,
      supplier: '',
      paymentMethod: '',
      referenceDate: new Date(),
      dueDate: new Date(),
      paymentDate: new Date(),
      paymentStatus: 'pending',
    },
  });

  const onSubmit = async (data) => {
    console.log("Form submitted with data:", data);
    // Aqui você faria a lógica para salvar a transação no Supabase
    // A lógica deve ser adaptada para incluir os novos campos
    // ...
    toast({
      title: mode === 'create' ? t('transactions.added') : t('transactions.updated'),
      description: mode === 'create' ? t('transactions.addSuccess') : t('transactions.updateSuccess'),
    });
    onOpenChange(false);
  };

  useEffect(() => {
    // Reset o formulário quando o modal é aberto ou o viewMode muda
    if (open) {
      form.reset(initialData || form.getValues());
      console.log(`TransactionForm opened in ${viewMode} mode.`);
    }
  }, [open, initialData, form, viewMode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="bg-background p-6 border-b">
          <DialogTitle className="text-xl">
            {mode === 'create' ? `Adicionar Transação (${viewMode})` : `Editar Transação (${viewMode})`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {viewMode === 'PF' && (
                <>
                  <TransactionTypeSelector form={form} onTypeChange={(type) => form.setValue('type', type as any)} />
                  <AmountInput form={form} />
                  <CategoryDateFields form={form} transactionType={form.getValues('type')} />
                  <DescriptionField form={form} />
                  {form.getValues('type') === 'income' && <GoalSelector form={form} />}
                </>
              )}

              {viewMode === 'PJ' && (
                <>
                  {/* Campos do formulário PJ */}
                  <TransactionTypeSelector form={form} onTypeChange={(type) => form.setValue('type', type as any)} />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="originalAmount">Valor Original</Label>
                      <Input id="originalAmount" type="number" step="0.01" {...form.register('originalAmount', { valueAsNumber: true })} />
                    </div>
                    <div>
                      <Label htmlFor="lateInterestAmount">Juros em Atraso</Label>
                      <Input id="lateInterestAmount" type="number" step="0.01" {...form.register('lateInterestAmount', { valueAsNumber: true })} />
                    </div>
                    <div>
                      <Label htmlFor="paidAmount">Valor Pago</Label>
                      <Input id="paidAmount" type="number" step="0.01" {...form.register('paidAmount', { valueAsNumber: true })} />
                    </div>
                    <div>
                      <Label htmlFor="supplier">Fornecedor</Label>
                      <Input id="supplier" {...form.register('supplier')} />
                    </div>
                  </div>
                  <CategorySelectorPJ form={form} />
                  <DescriptionField form={form} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="referenceDate">Data de Referência</Label>
                      <Input id="referenceDate" type="date" {...form.register('referenceDate', { valueAsDate: true })} />
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Data de Vencimento</Label>
                      <Input id="dueDate" type="date" {...form.register('dueDate', { valueAsDate: true })} />
                    </div>
                    <div>
                      <Label htmlFor="paymentDate">Data Pagamento / Projeção</Label>
                      <Input id="paymentDate" type="date" {...form.register('paymentDate', { valueAsDate: true })} />
                    </div>
                    <div>
                      <Label htmlFor="paymentStatus">Status Pagamento</Label>
                      <select id="paymentStatus" {...form.register('paymentStatus')}>
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                        <option value="overdue">Atrasado</option>
                        <option value="projected">Projetado</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                      <Input id="paymentMethod" {...form.register('paymentMethod')} />
                    </div>
                  </div>
                </>
              )}

              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  className={cn(form.getValues('type') === 'income' ? 'bg-green-600 hover:bg-green-700' : '')}
                >
                  {mode === 'create' ? t('common.add') : t('common.save')}
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

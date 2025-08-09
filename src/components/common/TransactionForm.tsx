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
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";

// Zod schemas para os dois tipos de formulário
const transactionSchemaPF = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number({ required_error: "O valor é obrigatório." }).min(0.01, "O valor deve ser maior que zero."),
  categoryId: z.string({ required_error: "A categoria é obrigatória." }).min(1),
  transactionDate: z.date({ required_error: "A data é obrigatória." }),
  description: z.string().optional(),
  goalId: z.string().optional(),
});

// ** SCHEMA PJ CORRIGIDO **
const transactionSchemaPJ = z.object({
  type: z.enum(['income', 'expense', 'operational_inflow', 'operational_outflow', 'investment_inflow', 'investment_outflow', 'financing_inflow', 'financing_outflow']).optional(), // Tipos PJ podem ser derivados da categoria
  originalAmount: z.number().min(0, "O valor deve ser maior ou igual a zero.").optional(),
  lateInterestAmount: z.number().min(0, "O valor deve ser maior ou igual a zero.").optional(),
  paidAmount: z.number().min(0.01, "O valor pago é obrigatório e deve ser maior que zero.").optional(),
  categoryId: z.string({ required_error: "A categoria é obrigatória." }).min(1),
  supplier: z.string().optional(),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceDate: z.date().optional(),
  dueDate: z.date().optional(),
  paymentDate: z.date().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'overdue', 'projected']).optional(),
});

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Transaction | null;
  mode?: 'create' | 'edit';
  personType: 'PF' | 'PJ';
  defaultType?: 'income' | 'expense';
}

// Placeholder para o seletor de categorias hierárquico
// Implementei uma versão de mock para visualização, pois não temos o componente completo.
const CategorySelectorPJ = ({ form, t }) => {
  return (
    <FormField
      control={form.control}
      name="categoryId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Classificação (Categoria)</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria..." />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {/* Exemplo de categorias PJ. Você deve popular isso com seus dados. */}
              <SelectItem value="operational-inflow">Operational - Inflow</SelectItem>
              <SelectItem value="operational-outflow">Operational - Outflow</SelectItem>
              <SelectItem value="financing-inflow">Financing - Inflow</SelectItem>
              <SelectItem value="financing-outflow">Financing - Outflow</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  open,
  onOpenChange,
  initialData,
  mode = 'create',
  personType,
  defaultType = 'expense',
}) => {
  const { t } = usePreferences();
  const { setCustomDateRange, getTransactions, getGoals } = useAppContext();
  const { toast } = useToast();
  
  // Conditionally select the schema based on personType
  const schema = personType === 'PF' ? transactionSchemaPF : transactionSchemaPJ;

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
      categoryId: '',
      supplier: '',
      description: '',
      paymentMethod: '',
      referenceDate: new Date(),
      dueDate: new Date(),
      paymentDate: new Date(),
      paymentStatus: 'pending',
    },
  });

  const onSubmit = async (data: any) => {
    console.log("Form submitted with data:", data);
    // Aqui você faria a lógica para salvar a transação no Supabase
    // A lógica deve ser adaptada para incluir os novos campos
    toast({
      title: mode === 'create' ? t('transactions.added') : t('transactions.updated'),
      description: mode === 'create' ? t('transactions.addSuccess') : t('transactions.updateSuccess'),
    });
    onOpenChange(false);
  };

  useEffect(() => {
    // Reset o formulário quando o modal é aberto ou o personType muda
    if (open) {
      form.reset(initialData || form.getValues());
      console.log(`TransactionForm opened in ${personType} mode.`);
    }
  }, [open, initialData, form, personType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="bg-background p-6 border-b">
          <DialogTitle className="text-xl">
            {mode === 'create' ? `Adicionar Transação (${personType})` : `Editar Transação (${personType})`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {personType === 'PF' && (
                <>
                  <TransactionTypeSelector form={form} onTypeChange={(type) => form.setValue('type', type as any)} />
                  <AmountInput form={form} />
                  <CategoryDateFields form={form} transactionType={form.getValues('type')} />
                  <DescriptionField form={form} />
                  {form.getValues('type') === 'income' && <GoalSelector form={form} />}
                </>
              )}

              {personType === 'PJ' && (
                <>
                  {/* **Campos do formulário PJ CORRIGIDOS e ajustados para zod/react-hook-form** */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="originalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Original (Opcional)</FormLabel>
                          <FormControl>
                            <Input id="originalAmount" type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paidAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Pago (Opcional)</FormLabel>
                          <FormControl>
                            <Input id="paidAmount" type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
                          <FormLabel>Juros em Atraso (Opcional)</FormLabel>
                          <FormControl>
                            <Input id="lateInterestAmount" type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
                          <FormLabel>Fornecedor (Opcional)</FormLabel>
                          <FormControl>
                            <Input id="supplier" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <CategorySelectorPJ form={form} t={t} />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl>
                          <Input id="description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="referenceDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Referência (Opcional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Selecione uma data</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Vencimento (Opcional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Selecione uma data</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data Pagamento / Projeção (Opcional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Selecione uma data</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status Pagamento (Opcional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um status..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="paid">Pago</SelectItem>
                              <SelectItem value="overdue">Atrasado</SelectItem>
                              <SelectItem value="projected">Projetado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Forma de Pagamento (Opcional)</FormLabel>
                          <FormControl>
                            <Input id="paymentMethod" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                  className={cn(personType === 'PF' && form.getValues('type') === 'income' ? 'bg-green-600 hover:bg-green-700' : '')}
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

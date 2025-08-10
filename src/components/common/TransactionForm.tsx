import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Transaction } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
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
import TransactionTypeSelector from './TransactionTypeSelector';
import AmountInput from './AmountInput';
import DescriptionField from './DescriptionField';

// Zod schemas para os dois tipos de formulário
const transactionSchemaPF = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number({ required_error: "O valor é obrigatório." }).min(0.01, "O valor deve ser maior que zero."),
  categoryId: z.string({ required_error: "A categoria é obrigatória." }).min(1),
  transactionDate: z.date({ required_error: "A data é obrigatória." }),
  description: z.string().optional(),
  goalId: z.string().optional(),
});

// O campo `originalAmount` foi alterado para ser obrigatório
const transactionSchemaPJ = z.object({
  dfcType: z.enum(['operational', 'investment', 'financing']), // Tipo de Fluxo de Caixa
  flowType: z.enum(['inflow', 'outflow']), // Entrada ou Saída
  originalAmount: z.number({ required_error: "O valor original é obrigatório." }).min(0, "O valor deve ser maior ou igual a zero."),
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

// Componente para selecionar metas (mantido para a lógica PF)
const GoalSelector = ({ form }) => {
  const mockGoals = [{ id: 'goal-1', name: 'Viagem para o Caribe' }];
  return (
    <FormField
      control={form.control}
      name="goalId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Meta (Opcional)</FormLabel>
          <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma meta..." />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {mockGoals.map(goal => (
                <SelectItem key={goal.id} value={goal.id}>{goal.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// Seletor de Categoria Hierárquico - Agora usado para PF e PJ
const HierarchicalCategorySelector = ({ form, allCategories }) => {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // Filtra categorias pai (sem parentId)
  const parentCategories = allCategories.filter(c => !c.parentId);
  // Filtra subcategorias com base no pai selecionado
  const subcategories = allCategories.filter(c => c.parentId === selectedParentId);

  // Limpa o campo de subcategoria quando a categoria pai muda
  useEffect(() => {
    form.setValue('categoryId', '');
  }, [selectedParentId, form]);

  // Se a categoria inicial for uma subcategoria, pré-seleciona o pai
  useEffect(() => {
    const initialCategory = allCategories.find(c => c.id === form.getValues('categoryId'));
    if (initialCategory && initialCategory.parentId) {
      setSelectedParentId(initialCategory.parentId);
    }
  }, [allCategories, form]);

  return (
    <>
      <FormField
        control={form.control}
        name="parentCategoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoria Principal</FormLabel>
            <Select 
              onValueChange={(value) => {
                setSelectedParentId(value);
                const hasSubcategories = allCategories.some(c => c.parentId === value);
                if (!hasSubcategories) {
                  form.setValue('categoryId', value);
                } else {
                  form.setValue('categoryId', '');
                }
              }} 
              value={selectedParentId || ''}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria principal" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {parentCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subcategoria</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value}
              disabled={!selectedParentId || subcategories.length === 0}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a subcategoria" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {subcategories.map(subcat => (
                  <SelectItem key={subcat.id} value={subcat.id}>{subcat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
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
  const { categories, addTransaction, updateTransaction } = useAppContext();
  const { t } = usePreferences();
  const { toast } = useToast();
  
  const schema = personType === 'PF' ? transactionSchemaPF : transactionSchemaPJ;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      // Default values for PF
      type: defaultType,
      amount: 0,
      categoryId: '',
      // Adicionando o campo pai para o seletor hierárquico
      parentCategoryId: '',
      transactionDate: new Date(),
      description: '',
      goalId: '',
      // Default values for PJ
      dfcType: 'operational',
      flowType: 'outflow',
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
    const finalData = {
      ...initialData,
      ...data,
    };
    if (personType === 'PJ') {
      finalData.type = `${data.dfcType}_${data.flowType}`;
      delete finalData.dfcType;
      delete finalData.flowType;
    }
    
    if (mode === 'create') {
      addTransaction(finalData);
      toast({
        title: t('transactions.added'),
        description: t('transactions.addSuccess'),
      });
    } else {
      updateTransaction(finalData);
      toast({
        title: t('transactions.updated'),
        description: t('transactions.updateSuccess'),
      });
    }
    onOpenChange(false);
  };

  useEffect(() => {
    if (open) {
      const defaultValues = {
        ...initialData,
        dfcType: initialData?.type?.split('_')[0] || 'operational',
        flowType: initialData?.type?.split('_')[1] || 'outflow',
        transactionDate: initialData?.transactionDate ? new Date(initialData.transactionDate) : new Date(),
        referenceDate: initialData?.referenceDate ? new Date(initialData.referenceDate) : new Date(),
        dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : new Date(),
        paymentDate: initialData?.paymentDate ? new Date(initialData.paymentDate) : new Date(),
        paymentStatus: initialData?.paymentStatus || 'pending',
      };
      
      form.reset(defaultValues);
    }
  }, [open, initialData, form]);

  const availableCategories = categories.filter(c => {
    if (personType === 'PF') {
      return form.watch('type') === 'income' ? c.type === 'income' : c.type === 'expense';
    } else {
      const dfcType = form.watch('dfcType');
      const flowType = form.watch('flowType');
      return c.type.startsWith(`${dfcType}_${flowType}`);
    }
  });

  const dialogTitle = mode === 'create' 
    ? `Adicionar Transação (${personType})` 
    : `Editar Transação (${personType})`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
        <DialogHeader className="bg-background p-6 border-b">
          <DialogTitle className="text-xl">{dialogTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {personType === 'PF' && (
                <>
                  <TransactionTypeSelector form={form} onTypeChange={(type) => form.setValue('type', type as any)} />
                  <AmountInput form={form} />
                  
                  {/* Seletor de categorias para PF agora usa a versão hierárquica */}
                  <HierarchicalCategorySelector form={form} allCategories={availableCategories} />

                  <FormField
                    control={form.control}
                    name="transactionDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data</FormLabel>
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
                                {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione uma data</span>}
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
                  
                  <DescriptionField form={form} />
                  {form.getValues('type') === 'income' && <GoalSelector form={form} />}
                </>
              )}

              {personType === 'PJ' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dfcType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Fluxo de Caixa</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="operational">Operacional</SelectItem>
                              <SelectItem value="investment">Investimento</SelectItem>
                              <SelectItem value="financing">Financiamento</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="flowType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fluxo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o fluxo..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="inflow">Entrada</SelectItem>
                              <SelectItem value="outflow">Saída</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="originalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Original</FormLabel>
                          <FormControl>
                            <Input 
                              id="originalAmount" 
                              type="number" 
                              step="0.01" 
                              {...field} 
                              value={field.value ?? ''} 
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                            />
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
                          <FormLabel className="flex items-center space-x-1">
                            <span>Valor Pago</span>
                            <span className="text-muted-foreground text-sm font-normal">(Opcional)</span>
                          </FormLabel>
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
                          <FormLabel className="flex items-center space-x-1">
                            <span>Juros em Atraso</span>
                            <span className="text-muted-foreground text-sm font-normal">(Opcional)</span>
                          </FormLabel>
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
                          <FormLabel className="flex items-center space-x-1">
                            <span>Fornecedor</span>
                            <span className="text-muted-foreground text-sm font-normal">(Opcional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input id="supplier" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <HierarchicalCategorySelector form={form} allCategories={availableCategories} />

                  <DescriptionField form={form} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="referenceDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex items-center space-x-1">
                            <span>Data de Referência</span>
                            <span className="text-muted-foreground text-sm font-normal">(Opcional)</span>
                          </FormLabel>
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
                                  {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione uma data</span>}
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
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex items-center space-x-1">
                            <span>Data de Vencimento</span>
                            <span className="text-muted-foreground text-sm font-normal">(Opcional)</span>
                          </FormLabel>
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
                                  {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione uma data</span>}
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
                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex items-center space-x-1">
                            <span>Data Pagamento / Projeção</span>
                            <span className="text-muted-foreground text-sm font-normal">(Opcional)</span>
                          </FormLabel>
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
                                  {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione uma data</span>}
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
                          <FormLabel className="flex items-center space-x-1">
                            <span>Forma de Pagamento</span>
                            <span className="text-muted-foreground text-sm font-normal">(Opcional)</span>
                          </FormLabel>
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
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className={cn(personType === 'PF' && form.getValues('type') === 'income' ? 'bg-green-600 hover:bg-green-700' : '')}
                >
                  {mode === 'create' ? 'Adicionar' : 'Salvar'}
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

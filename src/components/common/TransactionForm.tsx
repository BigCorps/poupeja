import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { ptBR } from 'date-fns/locale';
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

const transactionSchemaPJ = z.object({
  type: z.enum(['income', 'expense']),
  originalAmount: z.number().min(0, "O valor deve ser maior ou igual a zero.").optional(),
  lateInterestAmount: z.number().min(0, "O valor deve ser maior ou igual a zero.").optional(),
  // Corrigido para ser obrigatório com base na mensagem de erro original
  paidAmount: z.number({ required_error: "O valor pago é obrigatório e deve ser maior que zero." }).min(0.01, "O valor pago deve ser maior que zero."),
  categoryId: z.string({ required_error: "A categoria é obrigatória." }).min(1),
  supplier: z.string().optional(),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceDate: z.date().optional(),
  dueDate: z.date().optional(),
  paymentDate: z.date().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'overdue', 'projected']).default('pending').optional(),
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
  // Mock de metas, idealmente viriam de um contexto ou hook de dados
  const mockGoals = [{ id: 'goal-1', name: 'Viagem para o Caribe' }];
  return (
    <FormField
      control={form.control}
      name="goalId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Meta</FormLabel>
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

// Seletor de Categoria Unificado
const HierarchicalCategorySelector = ({ form, allCategories, initialData }) => {
  const selectedCategoryId = form.watch('categoryId');
  const [selectedParentName, setSelectedParentName] = useState('');

  // Efeito para sincronizar o estado local com os dados iniciais do formulário
  useEffect(() => {
    if (initialData && initialData.categoryId) {
      const selectedCat = allCategories.find(c => c.id === initialData.categoryId);
      if (selectedCat) {
        form.setValue('categoryId', selectedCat.id);
        if (selectedCat.parentId) {
          const parentCat = allCategories.find(c => c.id === selectedCat.parentId);
          setSelectedParentName(parentCat?.name || '');
        } else {
          setSelectedParentName(selectedCat.name);
        }
      }
    } else {
      form.setValue('categoryId', '');
      setSelectedParentName('');
    }
  }, [initialData, allCategories, form.setValue]);

  // Manipulador de mudança para o seletor unificado
  const handleCategoryChange = (value) => {
    form.setValue('categoryId', value);
    const selectedCat = allCategories.find(c => c.id === value);
    if (selectedCat?.parentId) {
      const parentCat = allCategories.find(c => c.id === selectedCat.parentId);
      setSelectedParentName(parentCat?.name || '');
    } else if (selectedCat) {
      setSelectedParentName(selectedCat.name);
    } else {
      setSelectedParentName('');
    }
  };
  
  // Lista de categorias e subcategorias para o seletor
  const flattenedCategories = allCategories.map(cat => {
    if (cat.parentId) {
      const parentName = allCategories.find(p => p.id === cat.parentId)?.name;
      return { ...cat, displayName: `${parentName} > ${cat.name}` };
    }
    return { ...cat, displayName: cat.name };
  });

  return (
    <>
      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoria</FormLabel>
            <Select onValueChange={handleCategoryChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {flattenedCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      {selectedParentName && (
        <div className="mt-2 text-sm text-muted-foreground">
          Categoria Principal: {selectedParentName}
        </div>
      )}
    </>
  );
};


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
      transactionDate: new Date(),
      description: '',
      goalId: '',
      // Default values for PJ
      originalAmount: 0,
      lateInterestAmount: 0,
      paidAmount: 0,
      supplier: '',
      description: '',
      paymentMethod: '',
      referenceDate: undefined,
      dueDate: undefined,
      paymentDate: undefined,
      paymentStatus: 'pending',
    },
  });

  const onSubmit = async (data: any) => {
    const finalData = {
      ...initialData,
      ...data,
      transactionDate: data.transactionDate instanceof Date ? data.transactionDate.toISOString() : data.transactionDate,
      referenceDate: data.referenceDate instanceof Date ? data.referenceDate.toISOString() : data.referenceDate,
      dueDate: data.dueDate instanceof Date ? data.dueDate.toISOString() : data.dueDate,
      paymentDate: data.paymentDate instanceof Date ? data.paymentDate.toISOString() : data.paymentDate,
    };
    
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
      const determineType = (transactionType) => {
        if (transactionType?.includes('inflow')) return 'income';
        if (transactionType?.includes('outflow')) return 'expense';
        return defaultType;
      };

      const defaultValues = {
        ...initialData,
        type: personType === 'PF' 
          ? initialData?.type || defaultType
          : determineType(initialData?.type),
        transactionDate: initialData?.transactionDate ? new Date(initialData.transactionDate) : new Date(),
        referenceDate: initialData?.referenceDate ? new Date(initialData.referenceDate) : undefined,
        dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : undefined,
        paymentDate: initialData?.paymentDate ? new Date(initialData.paymentDate) : undefined,
        paymentStatus: initialData?.paymentStatus || 'pending',
      };
      
      form.reset(defaultValues);
    }
  }, [open, initialData, form, personType, defaultType]);

  const availableCategories = categories.filter(c => {
    const selectedType = form.watch('type');
    return selectedType ? c.type.includes(selectedType) : true;
  });

  const dialogTitle = mode === 'create'
    ? `Adicionar Transação (${personType})`
    : `Editar Transação (${personType})`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
        <DialogHeader className="bg-background p-6 border-b">
          <DialogTitle className="text-xl">{dialogTitle}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Preencha os detalhes para adicionar uma nova transação.' : 'Edite os detalhes da transação selecionada.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Seção PF */}
              {personType === 'PF' && (
                <>
                  <TransactionTypeSelector form={form} onTypeChange={(type) => form.setValue('type', type as any)} />
                  <AmountInput form={form} />
                  
                  {/* Seletor de categorias hierárquico para PF */}
                  <HierarchicalCategorySelector form={form} allCategories={availableCategories} initialData={initialData} />

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
                                {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
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
                              locale={ptBR}
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

              {/* Seção PJ */}
              {personType === 'PJ' && (
                <>
                  <TransactionTypeSelector form={form} onTypeChange={(type) => form.setValue('type', type as any)} />

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
                          <FormLabel>Valor Pago</FormLabel>
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
                          <FormLabel>Juros em Atraso</FormLabel>
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
                          <FormLabel>Fornecedor</FormLabel>
                          <FormControl>
                            <Input id="supplier" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <HierarchicalCategorySelector form={form} allCategories={availableCategories} initialData={initialData} />

                  <DescriptionField form={form} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="referenceDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Referência</FormLabel>
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
                                  {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
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
                                locale={ptBR}
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
                          <FormLabel>Data de Vencimento</FormLabel>
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
                                  {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
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
                                locale={ptBR}
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
                          <FormLabel>Data Pagamento</FormLabel>
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
                                  {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
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
                                locale={ptBR}
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
                          <FormLabel>Status Pagamento</FormLabel>
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
                          <FormLabel>Forma de Pagamento</FormLabel>
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
                  className={cn(form.getValues('type') === 'income' ? 'bg-green-600 hover:bg-green-700' : '')}
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

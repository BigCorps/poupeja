import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';
import { ConnectedBank } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Esquema de validação com Zod
const formSchema = z.object({
  bank_name: z.enum(['ITAU', 'INTER', 'INFINITEPAY'], {
    required_error: "Selecione um banco para continuar."
  }),
  api_key: z.string().min(1, {
    message: "O token é obrigatório para conectar o banco."
  }),
});

interface ConnectedBankFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: ConnectedBank | null;
  mode: 'create' | 'edit';
}

const ConnectedBankForm: React.FC<ConnectedBankFormProps> = ({ open, onOpenChange, initialData, mode }) => {
  const { addConnectedBank, updateConnectedBank } = useAppContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bank_name: initialData?.bank_name || 'ITAU',
      api_key: initialData?.api_key || '',
    },
  });

  // Resetar o formulário com dados iniciais quando o modal abrir ou os dados mudarem
  useEffect(() => {
    if (initialData) {
      form.reset({
        bank_name: initialData.bank_name,
        api_key: initialData.api_key,
      });
    } else {
      form.reset({
        bank_name: 'ITAU',
        api_key: '',
      });
    }
  }, [initialData, form, open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (mode === 'edit' && initialData) {
        await updateConnectedBank(initialData.id, {
          ...values,
          // A API fornecerá o saldo e a conta, então os campos não são mais necessários
          account_number: initialData.account_number,
          balance: initialData.balance
        });
        toast({
          title: 'Banco atualizado',
          description: `O banco ${values.bank_name} foi atualizado com sucesso.`,
        });
      } else {
        // A API fornecerá o saldo e a conta ao conectar o banco
        await addConnectedBank({
          ...values,
          account_number: '', // Placeholder, será preenchido pela API
          balance: 0,        // Placeholder, será preenchido pela API
        });
        toast({
          title: 'Banco conectado',
          description: `O banco ${values.bank_name} foi conectado com sucesso.`,
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o banco. Tente novamente.',
        variant: 'destructive',
      });
      console.error(error);
    }
  };

  const title = mode === 'create' ? 'Conectar Novo Banco' : 'Editar Banco';
  const description = mode === 'create' ? 'Preencha os dados do seu banco para começar a sincronizar.' : 'Atualize as informações do seu banco conectado.';
  const submitText = mode === 'create' ? 'Conectar' : 'Salvar alterações';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banco</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um banco" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ITAU">Itaú</SelectItem>
                      <SelectItem value="INTER">Inter</SelectItem>
                      <SelectItem value="INFINITEPAY">InfinitePay</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token de Acesso</FormLabel>
                  <FormControl>
                    <Input placeholder="Insira o seu token de acesso" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Atualmente, oferecemos suporte apenas para Itaú, Inter e InfinitePay. Estamos trabalhando para expandir a compatibilidade com outros bancos em breve.
            </p>
            <Button type="submit" className="w-full">{submitText}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectedBankForm;

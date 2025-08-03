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

// Esquema de validação com Zod
const formSchema = z.object({
  bank_name: z.string().min(2, {
    message: "O nome do banco deve ter pelo menos 2 caracteres.",
  }),
  account_number: z.string().min(1, {
    message: "O número da conta é obrigatório.",
  }),
  balance: z.string().transform((val) => Number(val)).refine((val) => !isNaN(val) && val >= 0, {
    message: "O saldo deve ser um número positivo.",
  }),
  api_key: z.string().optional(),
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
      bank_name: initialData?.bank_name || '',
      account_number: initialData?.account_number || '',
      balance: initialData?.balance.toString() || '0',
      api_key: initialData?.api_key || '',
    },
  });

  // Resetar o formulário com dados iniciais quando o modal abrir ou os dados mudarem
  useEffect(() => {
    if (initialData) {
      form.reset({
        bank_name: initialData.bank_name,
        account_number: initialData.account_number,
        balance: initialData.balance.toString(),
        api_key: initialData.api_key,
      });
    } else {
      form.reset({
        bank_name: '',
        account_number: '',
        balance: '0',
        api_key: '',
      });
    }
  }, [initialData, form, open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (mode === 'edit' && initialData) {
        await updateConnectedBank(initialData.id, {
          ...values,
          balance: Number(values.balance),
        });
        toast({
          title: 'Banco atualizado',
          description: `O banco ${values.bank_name} foi atualizado com sucesso.`,
        });
      } else {
        await addConnectedBank({
          ...values,
          balance: Number(values.balance),
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
                  <FormLabel>Nome do Banco</FormLabel>
                  <FormControl>
                    <Input placeholder="Nubank, Inter, Itaú..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="account_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Conta</FormLabel>
                  <FormControl>
                    <Input placeholder="123456-7" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Atual</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1500.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave de API (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="api_key_12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">{submitText}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectedBankForm;

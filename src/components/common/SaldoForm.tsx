// src/components/common/SaldoForm.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface SaldoFormProps {
  newAccount: {
    name: string;
    type: string;
    value: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (value: string) => void;
  onAddAccount: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
}

const SaldoForm = ({ newAccount, onInputChange, onSelectChange, onAddAccount, loading }: SaldoFormProps) => {
  const isMobile = useIsMobile();

  return (
    <Card className={cn(isMobile ? "p-4" : "p-6")}>
      <h3 className={cn("font-semibold mb-4 text-foreground", isMobile ? "text-lg" : "text-xl")}>
        Cadastrar Nova Conta
      </h3>
      <form onSubmit={onAddAccount} className={cn(
        "gap-4 items-end",
        isMobile ? "flex flex-col space-y-4" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
      )}>
        <div className="w-full">
          <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1 block">Nome</label>
          <Input
            type="text"
            id="name"
            name="name"
            value={newAccount.name}
            onChange={onInputChange}
            placeholder="Ex: Nubank, PicPay"
            required
          />
        </div>
        <div className="w-full">
          <label htmlFor="type" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1 block">Tipo</label>
          <Select value={newAccount.type} onValueChange={onSelectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Conta Corrente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Conta Corrente">Conta Corrente</SelectItem>
              <SelectItem value="Investimento">Investimento</SelectItem>
              <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full">
          <label htmlFor="value" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1 block">Valor</label>
          <Input
            type="number"
            id="value"
            name="value"
            value={newAccount.value}
            onChange={onInputChange}
            placeholder="Ex: 1500.50"
            step="0.01"
            required
          />
        </div>
        <div className="w-full">
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Adicionando...' : 'Adicionar Conta'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default SaldoForm;

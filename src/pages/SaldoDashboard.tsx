import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useSaldoContext } from '@/contexts/SaldoContext';
import SaldoSummary from '@/components/common/SaldoSummary';
import SaldoAccountList from '@/components/common/SaldoAccountList';
import SaldoForm from '@/components/common/SaldoForm';

const SaldoDashboard = () => {
  const { t } = usePreferences();
  const isMobile = useIsMobile();
  const {
    accounts,
    loading,
    newAccount,
    handleInputChange,
    handleSelectChange,
    handleAddAccount,
    totals,
  } = useSaldoContext();

  return (
    <MainLayout>
      <SubscriptionGuard feature="gestão de saldo">
        <div className="w-full px-4 py-4 md:py-8 pb-20 md:pb-8">
          {/* Content Container */}
          <div className={cn(
            isMobile ? "space-y-4" : "space-y-6"
          )}>
            {/* Headers */}
            {isMobile ? (
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Seu Saldo</h1>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-foreground">Seu Saldo</h2>
                <p className="text-muted-foreground mt-1">Visão geral e cadastro das suas finanças.</p>
              </div>
            )}
            
            {/* Seção de Resumo - Componente reutilizável */}
            <SaldoSummary totals={totals} />

            {/* Seção de Cadastro de Contas - Componente reutilizável */}
            <SaldoForm
              newAccount={newAccount}
              onInputChange={handleInputChange}
              onSelectChange={handleSelectChange}
              onAddAccount={handleAddAccount}
              loading={loading}
            />

            {/* Seção de Lista de Contas - Componente reutilizável */}
            <SaldoAccountList accounts={accounts} loading={loading} />
          </div>
        </div>
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default SaldoDashboard;

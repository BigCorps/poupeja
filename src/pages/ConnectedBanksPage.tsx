import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, Landmark, Wallet } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import ConnectedBankList from '@/components/common/ConnectedBankList';
import ConnectedBankForm from '@/components/common/ConnectedBankForm';
import { ConnectedBank } from '@/types';

const BancosConectados = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<ConnectedBank | null>(null);
  const { connectedBanks, deleteConnectedBank } = useAppContext();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleAddBank = () => {
    setEditingBank(null);
    setFormOpen(true);
  };

  const handleEditBank = (bank: ConnectedBank) => {
    setEditingBank(bank);
    setFormOpen(true);
  };

  const handleDeleteBank = (id: string) => {
    deleteConnectedBank(id);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <MainLayout>
      <SubscriptionGuard feature="conexão de bancos">
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Bancos Conectados</h1>
            {!isMobile && (
              <Button onClick={handleAddBank}>
                <Plus className="mr-2 h-4 w-4" /> Conectar Banco
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavClick('/dashboard')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Visão Geral
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Saldo Consolidado</div>
                <p className="text-xs text-muted-foreground">
                  Veja o saldo de todas as suas contas.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleNavClick('/transactions')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Transações
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Sincronização Automática</div>
                <p className="text-xs text-muted-foreground">
                  Transações importadas do seu banco.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Segurança
                </CardTitle>
                <Landmark className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Conexão Segura</div>
                <p className="text-xs text-muted-foreground">
                  Gerencie o acesso dos seus dados bancários.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="hidden md:block">
              <Card>
                <CardHeader>
                  <CardTitle>Seus Bancos Conectados</CardTitle>
                </CardHeader>
                <CardContent>
                  <ConnectedBankList
                    banks={connectedBanks}
                    onEdit={handleEditBank}
                    onDelete={handleDeleteBank}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Versão mobile */}
            {isMobile && (
              <ConnectedBankList
                banks={connectedBanks}
                onEdit={handleEditBank}
                onDelete={handleDeleteBank}
              />
            )}
          </div>
        </div>

        {/* Mobile Floating Action Button */}
        {isMobile && (
          <div className="fixed bottom-20 right-4 z-50">
            <Button 
              onClick={handleAddBank}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">Conectar Banco</span>
            </Button>
          </div>
        )}

        <ConnectedBankForm
          open={formOpen}
          onOpenChange={setFormOpen}
          initialData={editingBank}
          mode={editingBank ? 'edit' : 'create'}
        />
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default BancosConectados;

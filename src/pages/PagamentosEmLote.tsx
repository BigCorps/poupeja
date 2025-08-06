import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';

const PagamentosEmLote: React.FC = () => {
  return (
    <MainLayout>
      <div className="flex flex-col h-full p-2 lg:p-4 pb-6">
        <div className="text-center mb-4 text-xl font-medium">
          Pagamentos em Lote: Em Breve!
        </div>
        
        <Card className="flex-1 overflow-hidden border border-[#A7CF17] rounded-xl mb-6">
          <CardContent className="h-full w-full p-0 flex items-center justify-center">
            <p className="text-2xl font-semibold text-muted-foreground">EM BREVE</p>
          </CardContent>
        </Card>

        <div style={{ height: '20px' }} />
      </div>
    </MainLayout>
  );
};

export default PagamentosEmLote;

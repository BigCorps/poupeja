import React from 'react';
import { useAuth } from '@supabase/auth-helpers-react';

import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';

export const AgenteIA: React.FC = () => {
  const { session } = useAuth();

  // Obtém o email do usuário da sessão, se disponível.
  const userEmail = session?.user?.email || '';

  // URL do seu Typebot. A variável 'email' é adicionada automaticamente se existir um email.
  const typebotUrl = userEmail ? `https://typebot.co/bot-vixus?email=${userEmail}` : 'about:blank';

  return (
    <MainLayout>
      <div className="flex flex-col h-full p-4">
        {/* Saudação estática */}
        <div className="text-center mb-4 text-2xl font-bold">
          Olá!
        </div>
        <Card className="flex-1 overflow-hidden border-2 border-green-300 rounded-xl">
          <CardContent className="h-full w-full p-0">
            {userEmail ? (
              <iframe
                src={typebotUrl}
                title="Assistente Vixus"
                className="w-full h-full border-none"
                style={{ minHeight: 'calc(100vh - 150px)' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full p-4">
                <p>Por favor, faça o login para usar o assistente.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

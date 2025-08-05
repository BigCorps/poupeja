import React, { useEffect, useState } from 'react';
import { useAuth } from '@supabase/auth-helpers-react';

import { MainLayout } from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const AgentPage: React.FC = () => {
  const { session } = useAuth();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      setUserEmail(session.user.email);
      // Simula um carregamento rápido
      setTimeout(() => setIsLoading(false), 500); 
    } else {
      setIsLoading(false);
    }
  }, [session]);

  // URL do seu Typebot, já com a variável de e-mail pronta
  const typebotUrl = userEmail ? `https://typebot.co/bot-vixus?email=${userEmail}` : '';

  return (
    <MainLayout>
      <div className="flex flex-col h-full p-4">
        {/* A saudação estática, já que o nome do cliente não será buscado aqui */}
        <div className="text-center mb-4 text-2xl font-bold">
          {isLoading ? (
            <Skeleton className="h-8 w-48 mx-auto" />
          ) : (
            `Olá!`
          )}
        </div>
        <Card className="flex-1 overflow-hidden border-2 border-green-300 rounded-xl">
          <CardContent className="h-full w-full p-0">
            {isLoading || !userEmail ? (
              <div className="flex items-center justify-center h-full p-4">
                <p>Carregando assistente...</p>
              </div>
            ) : (
              <iframe
                src={typebotUrl}
                title="Assistente Vixus"
                className="w-full h-full border-none"
                style={{ minHeight: 'calc(100vh - 150px)' }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

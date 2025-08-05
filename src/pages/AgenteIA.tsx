import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

import MainLayout from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

// Inicializa o cliente Supabase fora do componente para evitar recriação
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AgenteIA: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        } else if (error) {
          console.error('Erro ao obter a sessão:', error);
        }
      } catch (e) {
        console.error('Erro inesperado:', e);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();
  }, []);

  const typebotUrl = userEmail ? `https://typebot.co/bot-vixus?email=${userEmail}` : 'about:blank';

  return (
    <MainLayout>
      <div className="flex flex-col h-full p-4">
        <div className="text-center mb-4 text-2xl font-bold">
          {isLoading ? (
            <Skeleton className="h-8 w-48 mx-auto" />
          ) : (
            'Olá!'
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

export default AgenteIA; // Alterado para exportação padrão (default export)

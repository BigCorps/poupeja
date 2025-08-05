import React, { useEffect, useState } from 'react';
import { useAuth } from '@supabase/auth-helpers-react';
import { createClient } from '@supabase/supabase-js';

import { MainLayout } from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const AgentPage: React.FC = () => {
  const { session } = useAuth();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializa o cliente Supabase dentro do componente
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchUserData = async () => {
      // Verifica se a sessão e o usuário existem antes de fazer a busca
      if (session?.user?.email && session?.user?.id) {
        setUserEmail(session.user.email);

        // Busca o nome do usuário na tabela poupeja_users
        const { data, error } = await supabase
          .from('poupeja_users')
          .select('name')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar o nome do usuário:', error);
          setUserName('Usuário'); // Nome padrão em caso de erro
        } else {
          setUserName(data?.name || 'Usuário');
        }
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, [session]);

  const typebotUrl = userEmail ? `https://typebot.co/bot-vixus?email=${userEmail}` : '';

  return (
    <MainLayout>
      <div className="flex flex-col h-full p-4">
        <div className="text-center mb-4 text-2xl font-bold">
          {isLoading ? (
            <Skeleton className="h-8 w-48 mx-auto" />
          ) : (
            `Olá, ${userName || 'Usuário'}`
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

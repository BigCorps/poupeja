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
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSessionAndUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session?.user?.email && session?.user?.id) {
          setUserEmail(session.user.email);

          // Busca o nome do usuário na tabela poupeja_users
          const { data, error: userError } = await supabase
            .from('poupeja_users')
            .select('name')
            .eq('user_id', session.user.id)
            .single();

          if (userError) {
            console.error('Erro ao buscar o nome do usuário:', userError);
            // Fallback para o email se a busca falhar
            setUserName(session.user.email); 
          } else {
            // Usa o nome da tabela ou o email como fallback
            setUserName(data?.name || session.user.email); 
          }
        } else if (sessionError) {
          console.error('Erro ao obter a sessão:', sessionError);
        }
      } catch (e) {
        console.error('Erro inesperado:', e);
      } finally {
        setIsLoading(false);
      }
    };

    getSessionAndUserData();
  }, []);

  // URL do seu Typebot corrigida
  const typebotUrl = userEmail ? `https://typebot.co/bot-app?email=${userEmail}` : 'about:blank';

  return (
    <MainLayout>
      <div className="flex flex-col h-full p-2 lg:p-4">
        <div className="text-center mb-4 text-2xl font-bold">
          {isLoading ? (
            <Skeleton className="h-8 w-48 mx-auto" />
          ) : (
            `Olá, ${userName || 'Usuário'}!` // Saudação com o nome do cliente
          )}
        </div>
        {/* Borda ajustada para combinar com o layout. */}
        <Card className="flex-1 overflow-hidden border-2 border-green-700 rounded-xl">
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
                style={{ minHeight: 'calc(100vh - 100px)' }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AgenteIA;

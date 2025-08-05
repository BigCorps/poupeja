import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

import MainLayout from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile'; // Importa o hook useIsMobile (assumindo que ele existe)

// Inicializa o cliente Supabase fora do componente para evitar recriação
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AgenteIA: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true); // Indica se os dados do usuário estão carregando
  const [iframeLoaded, setIframeLoaded] = useState(false); // Indica se o iframe do Typebot carregou seu conteúdo
  // 'showTypebot' não é mais necessário, o iframe carrega automaticamente

  const isMobile = useIsMobile(); // Detecta se o dispositivo é mobile

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
            .eq('user_id', session.user.id) // Usa 'user_id' para buscar na tabela poupeja_users
            .single();

          if (userError) {
            console.error('Erro ao buscar o nome do usuário:', userError);
            setUserName(session.user.email); // Fallback para o email se a busca falhar
          } else {
            setUserName(data?.name || session.user.email); // Usa o nome da tabela ou o email como fallback
          }
        } else if (sessionError) {
          console.error('Erro ao obter a sessão:', sessionError);
        }
      } catch (e) {
        console.error('Erro inesperado:', e);
      } finally {
        setIsLoadingUserData(false); // Carregamento dos dados do usuário finalizado
      }
    };

    getSessionAndUserData();
  }, []);

  // Reseta o estado de carregamento do iframe quando o email do usuário muda
  useEffect(() => {
    if (userEmail) {
      setIframeLoaded(false); // Reseta o estado para mostrar a mensagem de carregamento do iframe
    }
  }, [userEmail]);

  const typebotUrl = userEmail ? `https://typebot.co/bot-app?email=${userEmail}` : 'about:blank';

  // Calcula a altura mínima do iframe dinamicamente
  // Ajustado para mobile para considerar a barra de navegação inferior
  const iframeMinHeight = isMobile ? 'calc(100vh - 200px)' : 'calc(100vh - 100px)'; 

  return (
    <MainLayout>
      <div className="flex flex-col h-full p-2 lg:p-4">
        <div className="text-center mb-4 text-2xl font-bold">
          {isLoadingUserData ? (
            <Skeleton className="h-8 w-48 mx-auto" />
          ) : (
            `Olá, ${userName || 'Usuário'}!` // Saudação com o nome do cliente
          )}
        </div>
        
        <Card className="flex-1 overflow-hidden border border-[#A7CF17] rounded-xl">
          <CardContent className="h-full w-full p-0">
            {/* Mensagem de carregamento:
                - Se os dados do usuário ainda estão carregando, OU
                - Se o email do usuário não está disponível, OU
                - Se o iframe ainda não carregou seu conteúdo
            */}
            {(isLoadingUserData || !userEmail || !iframeLoaded) ? (
              <div className="flex items-center justify-center h-full p-4">
                <p>Carregando assistente...</p>
              </div>
            ) : null}
            
            {/* O iframe é renderizado assim que o email do usuário estiver disponível.
                Ele é inicialmente oculto e se torna visível apenas quando iframeLoaded é verdadeiro. */}
            {userEmail && (
              <iframe
                src={typebotUrl}
                title="Assistente Vixus"
                className={`w-full h-full border-none ${iframeLoaded ? 'block' : 'hidden'}`}
                style={{ minHeight: iframeMinHeight }}
                onLoad={() => setIframeLoaded(true)} // Define iframeLoaded como true quando o iframe termina de carregar
              />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AgenteIA;

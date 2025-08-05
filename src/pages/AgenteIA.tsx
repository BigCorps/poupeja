import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

import MainLayout from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile'; // Importa o hook useIsMobile

// Inicializa o cliente Supabase fora do componente para evitar recriação
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AgenteIA: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null); // Mantido para a saudação
  const [isLoadingUserData, setIsLoadingUserData] = useState(true); // Indica se os dados do usuário estão carregando
  const [iframeLoaded, setIframeLoaded] = useState(false); // Indica se o iframe do Typebot carregou seu conteúdo
  const [showForcedLoading, setShowForcedLoading] = useState(true); // NOVO estado para o loader temporizado
  const [iframeMinHeight, setIframeMinHeight] = useState('calc(100vh - 100px)'); // Mantido do seu código

  const isMobile = useIsMobile(); // Usa o hook useIsMobile

  useEffect(() => {
    // Detecta se é mobile e ajusta altura do iframe
    // Mantido o cálculo original do seu código para iframeMinHeight
    const height = isMobile ? 'calc(100vh - 245px)' : 'calc(100vh - 100px)';
    setIframeMinHeight(height);
  }, [isMobile]); // Adicionado isMobile como dependência

  // NOVO useEffect para o temporizador de 8 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowForcedLoading(false);
    }, 8000); // 8 segundos

    // Limpa o temporizador se o componente for desmontado
    return () => clearTimeout(timer);
  }, []); // Executa apenas na montagem inicial

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

  useEffect(() => {
    // Reseta o estado de carregamento do iframe se o email mudar
    if (userEmail) {
      setIframeLoaded(false);
      // Reinicia o loader forçado ao mudar o email, se necessário
      setShowForcedLoading(true);
      const timer = setTimeout(() => {
        setShowForcedLoading(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [userEmail]);

  const typebotUrl = userEmail ? `https://typebot.co/bot-app?email=${userEmail}` : 'about:blank';

  return (
    <MainLayout>
      <div className="flex flex-col h-full p-2 lg:p-4 pb-6">
        <div className="text-center mb-4 text-xl font-medium">
          {/* Saudação com o nome do cliente ou Skeleton */}
          {isLoadingUserData ? (
            <Skeleton className="h-6 w-40 mx-auto" />
          ) : (
            `Olá, ${userName || 'Usuário'}!`
          )}
        </div>
        
        <Card className="flex-1 overflow-hidden border border-[#A7CF17] rounded-xl mb-6"> {/* Borda mantida como no seu código */}
          <CardContent className="h-full w-full p-0">
            {/* O conteúdo "Carregando assistente..." é exibido se:
                - Os dados do usuário ainda estão carregando, OU
                - O email do usuário não está disponível, OU
                - O iframe ainda não carregou seu conteúdo, OU
                - O loader forçado de 8 segundos ainda está ativo. */}
            {(isLoadingUserData || !userEmail || !iframeLoaded || showForcedLoading) ? (
              <div className="flex items-center justify-center h-full p-4">
                <p>Carregando assistente...</p>
              </div>
            ) : null}
            
            {/* O iframe é renderizado apenas se o email do usuário estiver disponível.
                Ele é oculto se qualquer uma das condições de carregamento for verdadeira. */}
            {userEmail && (
              <iframe
                src={typebotUrl}
                title="Assistente Vixus"
                className={`w-full border-none ${(!isLoadingUserData && userEmail && iframeLoaded && !showForcedLoading) ? 'block' : 'hidden'}`}
                style={{ minHeight: iframeMinHeight }}
                onLoad={() => setIframeLoaded(true)} // Define iframeLoaded como true quando o iframe termina de carregar
              />
            )}
          </CardContent>
        </Card>

        {/* Espaço forçado no final da página (mantido do seu código original) */}
        <div style={{ height: '20px' }} />
      </div>
    </MainLayout>
  );
};

export default AgenteIA;


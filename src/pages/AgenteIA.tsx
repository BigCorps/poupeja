import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

import MainLayout from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile'; // Importa o hook useIsMobile
import TypebotIframeLoader from '@/components/agente-ia/TypebotIframeLoader'; // Importa o novo componente

// Inicializa o cliente Supabase fora do componente para evitar recriação
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AgenteIA: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // Removi o userName e isLoadingUserData para manter o código mais próximo do seu original
  const [isLoading, setIsLoading] = useState(true); // Mantido o isLoading original
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeMinHeight, setIframeMinHeight] = useState('calc(100vh - 100px)');

  // Usa o hook useIsMobile para determinar se é mobile
  const isMobile = useIsMobile();

  useEffect(() => {
    // Detecta se é mobile e ajusta altura do iframe
    // Mantido o cálculo original do seu código para iframeMinHeight
    const height = isMobile ? 'calc(100vh - 245px)' : 'calc(100vh - 100px)';
    setIframeMinHeight(height);
  }, [isMobile]); // Adicionado isMobile como dependência

  useEffect(() => {
    const getSessionAndUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (session?.user?.email && session?.user?.id) {
          setUserEmail(session.user.email);
          // Removida a busca por userName para manter o código como o seu original
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

  useEffect(() => {
    if (userEmail) {
      setIframeLoaded(false);
    }
  }, [userEmail]);

  // Função para ser chamada quando o iframe dentro de TypebotIframeLoader carregar
  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full p-2 lg:p-4 pb-6">
        <div className="text-center mb-4 text-xl font-medium">
          Aguarde enquanto o Agente IA carrega suas informações... {/* Mantido o texto original */}
        </div>
        
        <Card className="flex-1 overflow-hidden border border-[#A7CF17] rounded-xl mb-6"> {/* Mantida a borda original */}
          <CardContent className="h-full w-full p-0">
            {/* Mensagem de carregamento:
                - Se os dados do usuário ainda estão carregando, OU
                - Se o email do usuário não está disponível, OU
                - Se o iframe ainda não carregou seu conteúdo
            */}
            {(isLoading || !userEmail || !iframeLoaded) ? (
              <div className="flex items-center justify-center h-full p-4">
                <p>Carregando assistente...</p>
              </div>
            ) : null}
            
            {/* Renderiza o TypebotIframeLoader, tornando-o visível apenas quando tudo estiver pronto */}
            {userEmail && (
              <TypebotIframeLoader
                userEmail={userEmail}
                isVisible={!isLoading && userEmail && iframeLoaded} // Visível apenas quando tudo carregou
                onIframeLoad={handleIframeLoad}
                isMobile={isMobile}
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


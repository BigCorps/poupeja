import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';

// Inicializa o cliente Supabase fora do componente para evitar recriação
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AgenteIA: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Novo estado para controlar se o iframe do Typebot já carregou
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    const getSessionAndUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session?.user?.email && session?.user?.id) {
          setUserEmail(session.user.email);
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

  // UseEffect para resetar o estado de carregamento do iframe se o email mudar
  useEffect(() => {
    if (userEmail) {
      setIframeLoaded(false);
    }
  }, [userEmail]);

  // URL do seu Typebot corrigida
  const typebotUrl = userEmail ? `https://typebot.co/bot-app?email=${userEmail}` : 'about:blank';

  return (
    <MainLayout>
      <div className="flex flex-col h-full p-2 lg:p-4">
        <div className="text-center mb-4 text-2xl font-bold">
          Aguarde enquanto o Agente IA carrega suas informações...
        </div>
        
        <Card className="flex-1 overflow-hidden border border-[#A7CF17] rounded-xl">
          <CardContent className="h-full w-full p-0">
            {/* O conteúdo é exibido apenas se os dados do usuário e o iframe do Typebot tiverem carregado */}
            {(isLoading || !userEmail || !iframeLoaded) ? (
              <div className="flex items-center justify-center h-full p-4">
                <p>Carregando assistente...</p>
              </div>
            ) : null}
            
            {/* O iframe é renderizado de forma invisível até carregar, para que a mensagem de loading seja mostrada */}
            <iframe
              src={typebotUrl}
              title="Assistente Vixus"
              className={`w-full h-full border-none ${(!isLoading && userEmail && iframeLoaded) ? 'block' : 'hidden'}`}
              const iframeMinHeight = isMobile ? 'calc(100vh - 195px)' : 'calc(100vh - 100px)'; 
              onLoad={() => setIframeLoaded(true)}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AgenteIA;

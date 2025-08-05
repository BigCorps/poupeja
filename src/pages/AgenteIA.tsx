import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AgenteIA: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    if (userEmail) {
      setIframeLoaded(false);
    }
  }, [userEmail]);

  const typebotUrl = userEmail ? `https://typebot.co/bot-app?email=${userEmail}` : 'about:blank';

  return (
    <MainLayout>
      <div className="flex flex-col h-full p-2 lg:p-4 pb-6"> {/* <- espaço extra no final */}
        <div className="text-center mb-4 text-xl font-medium">
          Aguarde enquanto o Agente IA carrega suas informações...
        </div>

        <Card className="flex-1 overflow-hidden border border-[#A7CF17] rounded-xl mb-6"> {/* <- margem inferior aqui também */}
          <CardContent className="h-full w-full p-0">
            {(isLoading || !userEmail || !iframeLoaded) ? (
              <div className="flex items-center justify-center h-full p-4">
                <p>Carregando assistente...</p>
              </div>
            ) : null}

            <iframe
              src={typebotUrl}
              title="Assistente Vixus"
              className={`w-full h-full border-none ${(!isLoading && userEmail && iframeLoaded) ? 'block' : 'hidden'}`}
              style={{ minHeight: 'calc(100vh - 100px)' }} // padrão restaurado
              onLoad={() => setIframeLoaded(true)}
            />
          </CardContent>
        </Card>

        {/* Div fantasma para garantir espaçamento no final */}
        <div style={{ height: '20px' }} />
      </div>
    </MainLayout>
  );
};

export default AgenteIA;
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile'; // Importa o hook useIsMobile

// Inicializa o cliente Supabase fora do componente para evitar recriação
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const Pagamentos: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeMinHeight, setIframeMinHeight] = useState('calc(100vh - 100px)');

  const isMobile = useIsMobile(); // Usa o hook useIsMobile

  useEffect(() => {
    // Detecta se é mobile e ajusta altura do iframe
    const height = isMobile ? 'calc(100vh - 243px)' : 'calc(100vh - 100px)';
    setIframeMinHeight(height);
  }, [isMobile]); // Adicionado isMobile como dependência

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

  // URL do Typebot para Pagamentos
  const typebotUrl = userEmail ? `https://typebot.co/pagar-vixus?email=${userEmail}` : 'about:blank';

  return (
    <MainLayout>
      <div className="flex flex-col h-full p-2 lg:p-4 pb-6">
        <div className="text-center mb-4 text-xl font-medium">
          Faça Pagamentos de Boletos e PIX em segundos. {/* Texto fixo */}
        </div>
        
        <Card className="flex-1 overflow-hidden border border-[#A7CF17] rounded-xl mb-6">
          <CardContent className="h-full w-full p-0">
            {(isLoading || !userEmail || !iframeLoaded) ? (
              <div className="flex items-center justify-center h-full p-4">
                <p>Carregando pagamentos...</p>
              </div>
            ) : null}
            
            {userEmail && (
              <iframe
                src={typebotUrl}
                title="Assistente de Pagamentos Vixus"
                className={`w-full border-none ${(!isLoading && userEmail && iframeLoaded) ? 'block' : 'hidden'}`}
                style={{ minHeight: iframeMinHeight }}
                onLoad={() => setIframeLoaded(true)}
              />
            )}
          </CardContent>
        </Card>

        <div style={{ height: '20px' }} />
      </div>
    </MainLayout>
  );
};

export default Pagamentos;

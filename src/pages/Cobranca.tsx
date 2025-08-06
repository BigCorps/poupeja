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

const Cobranca: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showForcedLoading, setShowForcedLoading] = useState(true);

  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowForcedLoading(false);
    }, 8000); // 8 segundos de loader forçado

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const getSessionAndUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session?.user?.email && session?.user?.id) {
          setUserEmail(session.user.email);
          const { data, error: userError } = await supabase
            .from('poupeja_users')
            .select('name')
            .eq('user_id', session.user.id)
            .single();

          if (userError) {
            console.error('Erro ao buscar o nome do usuário:', userError);
            setUserName(session.user.email);
          } else {
            setUserName(data?.name || session.user.email);
          }
        } else if (sessionError) {
          console.error('Erro ao obter a sessão:', sessionError);
        }
      } catch (e) {
        console.error('Erro inesperado:', e);
      } finally {
        setIsLoadingUserData(false);
      }
    };

    getSessionAndUserData();
  }, []);

  useEffect(() => {
    if (userEmail) {
      setIframeLoaded(false);
      setShowForcedLoading(true);
      const timer = setTimeout(() => {
        setShowForcedLoading(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [userEmail]);

  // URL do Typebot para Cobrança
  const typebotUrl = userEmail ? `https://typebot.co/pix-vixus?email=${userEmail}` : 'about:blank';

  // Calcula a altura mínima do iframe dinamicamente
  const iframeMinHeight = isMobile ? 'calc(100vh - 270px)' : 'calc(100vh - 100px)';

  return (
    <MainLayout>
      <div className="flex flex-col h-full p-2 lg:p-4 pb-6">
        <div className="text-center mb-4 text-xl font-medium">
          {isLoadingUserData ? (
            <Skeleton className="h-6 w-80 mx-auto" />
          ) : (
            `Olá, ${userName || 'Usuário'}! Gere Cobranças PIX, Boleto e Link de Pagamento em segundos.`
          )}
        </div>
        
        <Card className="flex-1 overflow-hidden border border-[#A7CF17] rounded-xl mb-6">
          <CardContent className="h-full w-full p-0">
            {(isLoadingUserData || !userEmail || !iframeLoaded || showForcedLoading) ? (
              <div className="flex items-center justify-center h-full p-4">
                <p>Carregando assistente...</p>
              </div>
            ) : null}
            
            {userEmail && (
              <iframe
                src={typebotUrl}
                title="Assistente de Cobrança Vixus"
                className={`w-full border-none ${(!isLoadingUserData && userEmail && iframeLoaded && !showForcedLoading) ? 'block' : 'hidden'}`}
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

export default Cobranca;

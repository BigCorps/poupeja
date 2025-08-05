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
  const [userName, setUserName] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentUserData, setCurrentUserData] = useState<{
    name: string | null;
    email: string | null;
    phone: string | null;
    profileImage: string | null;
    isAdmin: boolean;
  }>({
    name: null,
    email: null,
    phone: null,
    profileImage: null,
    isAdmin: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    const getSessionAndUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session?.user?.email && session?.user?.id) {
          setUserEmail(session.user.email);
          
          // Busca os dados do usuário na tabela poupeja_users igual ao ProfilePage
          const { data, error: userError } = await supabase
            .from('poupeja_users')
            .select('name, phone, profile_image, is_admin')
            .eq('id', session.user.id) // Usa 'id' igual ao ProfilePage
            .single();
          
          if (userError) {
            console.error('Erro ao buscar dados do usuário:', userError);
            // Fallback: tenta buscar por user_id se 'id' não funcionar
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('poupeja_users')
              .select('name, phone, profile_image, is_admin')
              .eq('user_id', session.user.id)
              .single();
              
            if (fallbackError) {
              console.error('Erro no fallback:', fallbackError);
              setUserName('Usuário');
              setCurrentUserData({
                name: null,
                email: session.user.email,
                phone: null,
                profileImage: null,
                isAdmin: false
              });
            } else {
              const displayName = fallbackData?.name || 'Usuário';
              setUserName(displayName);
              setIsAdmin(fallbackData?.is_admin || false);
              setCurrentUserData({
                name: fallbackData?.name || null,
                email: session.user.email,
                phone: fallbackData?.phone || null,
                profileImage: fallbackData?.profile_image || null,
                isAdmin: fallbackData?.is_admin || false
              });
            }
          } else {
            const displayName = data?.name || 'Usuário';
            setUserName(displayName);
            setIsAdmin(data?.is_admin || false);
            setCurrentUserData({
              name: data?.name || null,
              email: session.user.email,
              phone: data?.phone || null,
              profileImage: data?.profile_image || null,
              isAdmin: data?.is_admin || false
            });
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

  // UseEffect para carregar o iframe assim que os dados estiverem prontos
  useEffect(() => {
    if (userEmail && !isLoading) {
      // Pequeno delay para garantir que a UI está estável
      const timer = setTimeout(() => {
        setIframeLoaded(false); // Reset para mostrar loading se necessário
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [userEmail, isLoading]);

  // Função para atualizar dados do usuário após salvamento do perfil (para integração futura)
  const updateCurrentUserData = (newData: { name?: string; email?: string; phone?: string; profileImage?: string }) => {
    setCurrentUserData(prev => ({
      ...prev,
      ...newData
    }));
    
    // Também atualiza o userName para reflexo imediato na interface
    if (newData.name !== undefined) {
      setUserName(newData.name || 'Usuário');
    }
  };

  // Função para determinar o nome de exibição
  const getDisplayName = () => {
    // Para administradores, mantém o comportamento atual (pode mostrar email)
    if (isAdmin) {
      return userName || userEmail || 'Administrador';
    }
    
    // Para usuários normais, prioriza o nome sobre o email
    if (currentUserData.name && currentUserData.name.trim() !== '' && currentUserData.name !== currentUserData.email) {
      return currentUserData.name;
    }
    
    // Se não tem nome cadastrado, usa "Usuário" em vez do email
    return 'Usuário';
  };

  // URL do seu Typebot corrigida
  const typebotUrl = userEmail ? `https://typebot.co/bot-app?email=${userEmail}` : 'about:blank';

  return (
    <MainLayout>
      <div className="flex flex-col h-full p-2 lg:p-4">
        <div className="text-center mb-4 text-2xl font-bold">
          Aguarde enquanto o Agente IA carrega suas informações...
        </div>
        
        {/* Card com fundo transparente e altura ajustada para mobile */}
        <Card className="flex-1 overflow-hidden border border-[#A7CF17] rounded-xl bg-transparent backdrop-blur-none shadow-none">
          <CardContent className="h-full w-full p-0 bg-transparent">
            {/* Botão para abrir o chat ou loading */}
            {!showChat ? (
              <div className="flex items-center justify-center h-full p-4">
                {isLoading ? (
                  <p>Carregando assistente...</p>
                ) : (
                  <button
                    onClick={handleShowChat}
                    className="px-6 py-3 bg-[#A7CF17] text-white rounded-lg font-semibold hover:bg-[#95BC15] transition-colors"
                  >
                    Abrir Chat com Agente IA
                  </button>
                )}
              </div>
            ) : null}
            
            {/* Iframe pré-carregado (oculto até ser necessário) */}
            {iframePreloaded && (
              <iframe
                src={typebotUrl}
                title="Assistente Vixus"
                className={`w-full h-full border-none ${showChat ? 'block' : 'hidden'}`}
                style={{ 
                  minHeight: 'calc(100vh - 100px)', // Altura reduzida para mostrar melhor o quadro de resposta
                  height: 'calc(100vh - 100px)' // Altura ajustada para desktop e mobile
                }}
                onLoad={() => setIframeLoaded(true)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AgenteIA;

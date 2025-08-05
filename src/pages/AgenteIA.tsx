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
  const [isAdmin, setIsAdmin] = useState(false);
  // Novo estado para controlar se o iframe do Typebot já carregou
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  // Estado local para dados atuais do usuário que armazena os dados atuais do usuário
  const [currentUserData, setCurrentUserData] = useState<{
    name: string | null;
    email: string | null;
    phone: string | null;
    profileImage: string | null;
    isAdmin?: boolean;
  }>({
    name: null,
    email: null,
    phone: null,
    profileImage: null,
    isAdmin: false
  });

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

  // UseEffect para resetar o estado de carregamento do iframe se o email mudar
  useEffect(() => {
    if (userEmail) {
      setIframeLoaded(false);
    }
  }, [userEmail]);

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
          {isLoading ? (
            <Skeleton className="h-8 w-48 mx-auto" />
          ) : (
            `Olá, ${getDisplayName()}!`
          )}
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
              style={{ minHeight: 'calc(100vh - 100px)' }}
              onLoad={() => setIframeLoaded(true)}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AgenteIA;

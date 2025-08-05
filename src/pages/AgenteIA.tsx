import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import MainLayout from '@/components/layout/MainLayout';
import { useAppContext } from '@/contexts/AppContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

// Inicializa o cliente Supabase fora do componente para evitar recriação
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AgenteIA: React.FC = () => {
  const { user } = useAppContext(); // Usa o contexto para acessar dados do usuário
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Novo estado para controlar se o iframe do Typebot já carregou
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  // Estado local para dados atuais do usuário (sincronizado com o contexto)
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

  // Efeito para sincronizar com dados do contexto quando mudarem
  useEffect(() => {
    if (user) {
      setCurrentUserData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        isAdmin: user.isAdmin || false
      });
      setUserEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const getSessionAndUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session?.user?.email && session?.user?.id) {
          setUserEmail(session.user.email);
          
          // Se não temos dados do usuário no contexto, busca no banco
          if (!user || !user.name) {
            const { data, error: userError } = await supabase
              .from('poupeja_users')
              .select('name, phone, profile_image, is_admin')
              .eq('user_id', session.user.id)
              .single();
              
            if (userError) {
              console.error('Erro ao buscar o nome do usuário:', userError);
              setCurrentUserData({
                name: null,
                email: session.user.email,
                phone: null,
                profileImage: null,
                isAdmin: false
              });
            } else {
              setCurrentUserData({
                name: data?.name || null,
                email: session.user.email,
                phone: data?.phone || null,
                profileImage: data?.profile_image || null,
                isAdmin: data?.is_admin || false
              });
            }
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

    // Se não temos dados do usuário no contexto, busca no banco
    if (!user) {
      getSessionAndUserData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // UseEffect para resetar o estado de carregamento do iframe se o email mudar
  useEffect(() => {
    if (userEmail) {
      setIframeLoaded(false);
    }
  }, [userEmail]);

  // Função para determinar o nome de exibição
  const getDisplayName = () => {
    // Para administradores, mantém o comportamento atual (mostra nome ou email)
    if (currentUserData.isAdmin) {
      return currentUserData.name || currentUserData.email || 'Administrador';
    }
    
    // Para usuários normais, prioriza o nome sobre o email
    if (currentUserData.name && currentUserData.name.trim() !== '' && currentUserData.name !== currentUserData.email) {
      return currentUserData.name;
    }
    
    // Se não tem nome cadastrado ou o nome é igual ao email, usa "Usuário"
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

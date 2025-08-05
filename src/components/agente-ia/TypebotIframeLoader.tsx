import React from 'react';

interface TypebotIframeLoaderProps {
  userEmail: string | null;
  isVisible: boolean; // Controla se o iframe deve ser visível ou apenas pré-carregado
  onIframeLoad: () => void; // Callback para informar quando o iframe carregou
  isMobile: boolean; // Para ajustar a altura mínima
}

const TypebotIframeLoader: React.FC<TypebotIframeLoaderProps> = ({
  userEmail,
  isVisible,
  onIframeLoad,
  isMobile,
}) => {
  const typebotUrl = userEmail ? `https://typebot.co/bot-app?email=${userEmail}` : 'about:blank';

  // Calcula a altura mínima do iframe dinamicamente
  // Ajustado para mobile para considerar a barra de navegação inferior (aprox. 60px) e o padding
  const iframeMinHeight = isMobile ? 'calc(100vh - 270px)' : 'calc(100vh - 100px)';

  // Renderiza o iframe apenas se houver um email de usuário para evitar carregamentos desnecessários
  if (!userEmail) {
    return null;
  }

  return (
    <iframe
      src={typebotUrl}
      title="Assistente Vixus"
      // O iframe é sempre montado, mas sua visibilidade é controlada pela prop isVisible
      // e pela classe 'hidden' se não estiver visível
      className={`w-full h-full border-none ${isVisible ? 'block' : 'hidden'}`}
      style={{ minHeight: iframeMinHeight }}
      onLoad={onIframeLoad} // Dispara o callback quando o iframe termina de carregar
    />
  );
};

export default TypebotIframeLoader;


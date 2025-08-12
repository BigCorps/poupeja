import React, { useState, useCallback, useEffect } from 'react';
import HtmlJsSection from './HtmlJsSection';
import { useApp } from '@/contexts/AppContext';

interface SectionDefinition {
  id: string;
  title: string;
  htmlContent: string;
  jsContent?: string;
  supabaseAccess?: boolean;
}

interface HtmlJsSectionManagerProps {
  sections: SectionDefinition[];
  className?: string;
  onSectionMessage?: (sectionId: string, message: any) => void;
}

const HtmlJsSectionManager: React.FC<HtmlJsSectionManagerProps> = ({
  sections,
  className,
  onSectionMessage
}) => {
  const [loading, setLoading] = useState(true);
  const appContext = useApp();

  const handleMessageFromSection = useCallback((message: any) => {
    // Reenvia a mensagem para o componente pai (se a função onSectionMessage existir)
    if (onSectionMessage) {
      onSectionMessage(message.sectionId, message);
    }

    // Também encaminha a mensagem para outras seções, se necessário
    sections.forEach(section => {
      if (section.id !== message.sectionId) {
        // Envia mensagem para a outra seção via evento global
        const event = new CustomEvent(`htmljs-message-to-${section.id}`, {
          detail: message
        });
        window.dispatchEvent(event);
      }
    });
  }, [onSectionMessage, sections]);

  useEffect(() => {
    // Global API para que as seções HTML/JS possam enviar mensagens para o manager
    (window as any).HtmlJsSectionManager = {
      sendMessageToSection: (sectionId: string, message: any) => {
        const event = new CustomEvent(`htmljs-message-to-${sectionId}`, {
          detail: message
        });
        window.dispatchEvent(event);
      },
      // Este método não é estritamente necessário para o fluxo principal,
      // mas pode ser útil para debug e testes
      postMessage: (message: any) => {
        handleMessageFromSection(message);
      }
    };
    
    setLoading(false);
  }, [handleMessageFromSection]);

  if (loading || !appContext.isAuthReady) {
    return <div className="text-center py-10 text-gray-500">Carregando dashboard...</div>;
  }
  
  if (!sections || sections.length === 0) {
    return <div className="text-center py-10 text-gray-500">Nenhuma seção para exibir.</div>;
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {sections.map(section => (
        <div key={section.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
          <div className="p-4 bg-gray-100 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
          </div>
          <div className="p-6 flex-grow">
            <HtmlJsSection
              sectionId={section.id}
              htmlContent={section.htmlContent}
              jsContent={section.jsContent}
              supabaseAccess={section.supabaseAccess}
              onMessage={handleMessageFromSection}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default HtmlJsSectionManager;

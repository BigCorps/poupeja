import React, { useState, useCallback, useEffect } from 'react';
import HtmlJsSection from './HtmlJsSection';

interface SectionConfig {
  id: string;
  title: string;
  htmlContent: string;
  jsContent?: string;
  supabaseAccess?: boolean;
  enabled?: boolean;
  order?: number;
}

interface HtmlJsSectionManagerProps {
  sections: SectionConfig[];
  onSectionMessage?: (sectionId: string, message: any) => void;
  className?: string;
}

const HtmlJsSectionManager: React.FC<HtmlJsSectionManagerProps> = ({
  sections,
  onSectionMessage,
  className = ''
}) => {
  const [activeSections, setActiveSections] = useState<SectionConfig[]>([]);
  const [messages, setMessages] = useState<{ [sectionId: string]: any[] }>({});

  // Filtrar e ordenar seções ativas
  useEffect(() => {
    const active = sections
      .filter(section => section.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    setActiveSections(active);
  }, [sections]);

  // Gerenciar mensagens das seções
  const handleSectionMessage = useCallback((message: any) => {
    const { sectionId, ...messageData } = message;
    
    // Armazenar mensagem no histórico
    setMessages(prev => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] || []), messageData]
    }));

    // Chamar callback externo se fornecido
    if (onSectionMessage) {
      onSectionMessage(sectionId, messageData);
    }

    // Log para debug
    console.log(`Mensagem da seção ${sectionId}:`, messageData);
  }, [onSectionMessage]);

  // Enviar mensagem para uma seção específica
  const sendMessageToSection = useCallback((sectionId: string, message: any) => {
    const event = new CustomEvent(`htmljs-message-to-${sectionId}`, {
      detail: message
    });
    window.dispatchEvent(event);
  }, []);

  // Broadcast para todas as seções
  const broadcastMessage = useCallback((message: any) => {
    activeSections.forEach(section => {
      sendMessageToSection(section.id, message);
    });
  }, [activeSections, sendMessageToSection]);

  // Expor métodos globalmente para facilitar o uso
  useEffect(() => {
    (window as any).HtmlJsSectionManager = {
      sendMessageToSection,
      broadcastMessage,
      getMessages: (sectionId?: string) => {
        return sectionId ? messages[sectionId] || [] : messages;
      },
      getActiveSections: () => activeSections.map(s => ({ id: s.id, title: s.title }))
    };

    return () => {
      delete (window as any).HtmlJsSectionManager;
    };
  }, [sendMessageToSection, broadcastMessage, messages, activeSections]);

  if (activeSections.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <p>Nenhuma seção HTML/JS ativa encontrada.</p>
      </div>
    );
  }

  return (
    <div className={`html-js-section-manager space-y-4 ${className}`}>
      {activeSections.map((section) => (
        <div key={section.id} className="section-container">
          {section.title && (
            <h3 className="text-lg font-semibold mb-2 text-gray-800">
              {section.title}
            </h3>
          )}
          
          <HtmlJsSection
            sectionId={section.id}
            htmlContent={section.htmlContent}
            jsContent={section.jsContent}
            supabaseAccess={section.supabaseAccess}
            onMessage={handleSectionMessage}
            className="border rounded-lg p-4 bg-white shadow-sm"
          />
          
          {/* Debug info (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && messages[section.id] && (
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer">
                Debug: {messages[section.id].length} mensagens
              </summary>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                {JSON.stringify(messages[section.id], null, 2)}
              </pre>
            </details>
          )}
        </div>
      ))}
    </div>
  );
};

export default HtmlJsSectionManager;

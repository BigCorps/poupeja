import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';

interface HtmlJsSectionProps {
  htmlContent: string;
  jsContent?: string;
  sectionId: string;
  supabaseAccess?: boolean;
  onMessage?: (message: any) => void;
  className?: string;
  style?: React.CSSProperties;
}

interface SupabaseBridge {
  // Métodos seguros para acesso ao Supabase
  getCurrentUser: () => Promise<any>;
  getSession: () => Promise<any>;
  executeQuery: (table: string, query: any) => Promise<any>;
  insertData: (table: string, data: any) => Promise<any>;
  updateData: (table: string, id: string, data: any) => Promise<any>;
  deleteData: (table: string, id: string) => Promise<any>;
  // Métodos do contexto da aplicação
  getTransactions: () => Promise<any>;
  getCategories: () => Promise<any>;
  getGoals: () => Promise<any>;
  addTransaction: (transaction: any) => Promise<void>;
  updateTransaction: (transaction: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const HtmlJsSection: React.FC<HtmlJsSectionProps> = ({
  htmlContent,
  jsContent,
  sectionId,
  supabaseAccess = false,
  onMessage,
  className = '',
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appContext = useApp();

  // Criar bridge do Supabase se necessário
  const createSupabaseBridge = useCallback((): SupabaseBridge => {
    return {
      getCurrentUser: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
      },
      getSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
      },
      executeQuery: async (table: string, query: any) => {
        const { data, error } = await supabase.from(table).select(query);
        if (error) throw error;
        return data;
      },
      insertData: async (table: string, data: any) => {
        const { data: result, error } = await supabase.from(table).insert(data).select();
        if (error) throw error;
        return result;
      },
      updateData: async (table: string, id: string, data: any) => {
        const { data: result, error } = await supabase.from(table).update(data).eq('id', id).select();
        if (error) throw error;
        return result;
      },
      deleteData: async (table: string, id: string) => {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        return true;
      },
      // Métodos do contexto da aplicação
      getTransactions: appContext.getTransactions,
      getCategories: appContext.getCategories,
      getGoals: appContext.getGoals,
      addTransaction: appContext.addTransaction,
      updateTransaction: appContext.updateTransaction,
      deleteTransaction: appContext.deleteTransaction,
    };
  }, [appContext]);

  // Sistema de mensagens
  const sendMessage = useCallback((message: any) => {
    if (onMessage) {
      onMessage({ sectionId, ...message });
    }
    
    // Também enviar para o contexto global da seção
    const event = new CustomEvent(`htmljs-message-${sectionId}`, {
      detail: message
    });
    window.dispatchEvent(event);
  }, [sectionId, onMessage]);

  const receiveMessage = useCallback((callback: (message: any) => void) => {
    const handleMessage = (event: CustomEvent) => {
      callback(event.detail);
    };

    window.addEventListener(`htmljs-message-to-${sectionId}`, handleMessage as EventListener);
    
    return () => {
      window.removeEventListener(`htmljs-message-to-${sectionId}`, handleMessage as EventListener);
    };
  }, [sectionId]);

  // Carregar e executar o conteúdo HTML/JS
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Sanitizar o HTML
      const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
        ADD_TAGS: ['script'],
        ADD_ATTR: ['onclick', 'onload', 'onerror']
      });

      // Inserir HTML sanitizado
      containerRef.current.innerHTML = sanitizedHtml;

      // Criar namespace para a seção
      const sectionNamespace = `HtmlJsSection_${sectionId}`;
      
      // Expor APIs para a seção HTML/JS
      (window as any)[sectionNamespace] = {
        // Bridge do Supabase (se habilitado)
        ...(supabaseAccess ? { supabase: createSupabaseBridge() } : {}),
        
        // Sistema de mensagens
        sendMessage,
        receiveMessage,
        
        // Dados do contexto da aplicação
        appData: {
          user: appContext.user,
          transactions: appContext.transactions,
          categories: appContext.categories,
          goals: appContext.goals,
          hideValues: appContext.hideValues,
          accountType: appContext.accountType,
        },
        
        // Utilitários
        utils: {
          formatCurrency: (value: number) => {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(value);
          },
          formatDate: (date: string) => {
            return new Date(date).toLocaleDateString('pt-BR');
          }
        }
      };

      // Executar JavaScript se fornecido
      if (jsContent) {
        // Criar um script element para execução
        const script = document.createElement('script');
        script.textContent = `
          (function() {
            // Disponibilizar o namespace da seção
            const section = window.${sectionNamespace};
            
            // Código do usuário
            ${jsContent}
          })();
        `;
        
        // Adicionar script ao container
        containerRef.current.appendChild(script);
      }

      // Executar scripts inline no HTML
      const scripts = containerRef.current.querySelectorAll('script');
      scripts.forEach((script) => {
        if (script.textContent) {
          const newScript = document.createElement('script');
          newScript.textContent = `
            (function() {
              const section = window.${sectionNamespace};
              ${script.textContent}
            })();
          `;
          script.parentNode?.replaceChild(newScript, script);
        }
      });

      setIsLoaded(true);
      setError(null);

    } catch (err) {
      console.error(`Erro ao carregar seção ${sectionId}:`, err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setIsLoaded(false);
    }

    // Cleanup
    return () => {
      const sectionNamespace = `HtmlJsSection_${sectionId}`;
      delete (window as any)[sectionNamespace];
    };
  }, [htmlContent, jsContent, sectionId, supabaseAccess, createSupabaseBridge, sendMessage, receiveMessage, appContext]);

  if (error) {
    return (
      <div className={`p-4 border border-red-300 rounded-lg bg-red-50 ${className}`} style={style}>
        <h3 className="text-red-800 font-semibold">Erro ao carregar seção</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <p className="text-red-500 text-xs mt-2">Seção ID: {sectionId}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`html-js-section ${className}`}
      style={style}
      data-section-id={sectionId}
      data-loaded={isLoaded}
    />
  );
};

export default HtmlJsSection;


import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BrandingData {
  companyName: string;
  logoUrl: string;
  faviconUrl: string;
  logoAltText: string;
}

interface BrandingContextType {
  branding: BrandingData;
  isLoading: boolean;
  error: string | null;
  refreshBranding: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  lastUpdated: number;
}

const defaultBranding: BrandingData = {
  companyName: 'PoupeJá!',
  logoUrl: '/lovable-uploads/87f23d85-2d95-44c2-af4e-c39a251cceff.png',
  faviconUrl: '/favicon.ico',
  logoAltText: 'PoupeJá Logo'
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingData>(defaultBranding);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const loadBranding = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Carregando configurações de branding...', forceRefresh ? '(forçado)' : '');
      
      // Usar a nova função pública que não requer autenticação
      const { data, error: brandingError } = await supabase.functions.invoke('get-public-settings', {
        body: { cacheBuster: forceRefresh ? Date.now() : undefined }
      });
      
      if (brandingError) {
        console.error('Erro ao carregar configurações de branding:', brandingError);
        console.log('Usando valores padrão devido ao erro');
        // Manter valores padrão em caso de erro
        setError(null); // Não mostrar erro para o usuário, apenas usar valores padrão
        return;
      }
      
      if (data?.success && data?.settings) {
        console.log('Configurações de branding carregadas:', data);
        
        const brandingSettings = data.settings.branding || {};
        
        // Extrair valores das configurações de branding
        const brandingData: any = {};
        Object.keys(brandingSettings).forEach(key => {
          brandingData[key] = brandingSettings[key].value;
        });
        
        const newBranding: BrandingData = {
          companyName: brandingData.company_name || defaultBranding.companyName,
          logoUrl: brandingData.logo_url || defaultBranding.logoUrl,
          faviconUrl: brandingData.favicon_url || defaultBranding.faviconUrl,
          logoAltText: brandingData.logo_alt_text || defaultBranding.logoAltText,
        };
        
        console.log('Configurações de branding carregadas com sucesso:', newBranding);
        setBranding(newBranding);
        setLastUpdated(Date.now());
        
        // Atualizar favicon no documento se foi configurado
        if (newBranding.faviconUrl !== defaultBranding.faviconUrl) {
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (link) {
            link.href = newBranding.faviconUrl + `?v=${Date.now()}`;
          }
        }
        
        // Atualizar título da página com o nome da empresa
        document.title = `${newBranding.companyName} - Controle Financeiro`;
      } else {
        console.log('Resposta da função de branding não contém dados válidos, usando valores padrão');
      }
    } catch (err) {
      console.error('Erro ao carregar branding:', err);
      console.log('Usando valores padrão devido à exceção');
      setError(null); // Não mostrar erro, usar valores padrão
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBranding = async () => {
    await loadBranding();
  };

  const forceRefresh = async () => {
    console.log('Forçando refresh completo do branding...');
    await loadBranding(true);
  };

  useEffect(() => {
    loadBranding();
    
    // Configurar listener para mudanças de configuração (via localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'branding-refresh') {
        const timestamp = e.newValue;
        console.log('Storage event - atualizando branding (timestamp:', timestamp, ')');
        loadBranding(true);
        localStorage.removeItem('branding-refresh'); // Limpar após processar
      }
    };
    
    // Listener para eventos customizados (mesma aba)
    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail?.refresh === 'branding') {
        const timestamp = e.detail?.timestamp;
        console.log('Custom event - atualizando branding (timestamp:', timestamp, ')');
        loadBranding(true);
      }
    };
    
    // Listener para visibilidade da página (detecta quando volta de outra aba)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Verifica se precisa atualizar quando volta para a aba
        const lastRefresh = localStorage.getItem('branding-refresh');
        if (lastRefresh && parseInt(lastRefresh) > lastUpdated) {
          console.log('Visibilidade: atualizando branding por timestamp local');
          loadBranding(true);
          localStorage.removeItem('branding-refresh');
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('brandingRefresh', handleCustomEvent as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('brandingRefresh', handleCustomEvent as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const value = {
    branding,
    isLoading,
    error,
    refreshBranding,
    forceRefresh,
    lastUpdated
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
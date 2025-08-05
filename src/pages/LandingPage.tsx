import React, { useEffect, useState } from 'react';
import LandingHero from '@/components/landing/LandingHero';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingPricing from '@/components/landing/LandingPricing';
import LandingBenefits from '@/components/landing/LandingBenefits';
import LandingCTA from '@/components/landing/LandingCTA';
import LandingHeader from '@/components/landing/LandingHeader';
import { motion } from 'framer-motion';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { useBranding } from '@/contexts/BrandingContext';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom'; // Importa o hook useLocation

// Declaração global para o objeto Typebot, para que o TypeScript o reconheça
declare global {
  interface Window {
    Typebot: any;
  }
}

const LandingPage = () => {
  const { companyName } = useBrandingConfig();
  const { isLoading: brandingLoading, lastUpdated } = useBranding();
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [forcedTheme, setForcedTheme] = useState<string | null>(null);
  const location = useLocation(); // Obtém o objeto de localização atual

  // Estado para controlar se o script do Typebot deve ser montado
  const [shouldMountTypebotScript, setShouldMountTypebotScript] = useState(false);

  // Aplicar tema antes mesmo do primeiro render
  useEffect(() => {
    const loadAndApplyLandingTheme = async () => {
      try {
        console.log('Carregando tema da landing page...');
        const { data, error } = await supabase.functions.invoke('get-public-settings', {
          body: { cacheBuster: Date.now() } // Cache-busting para o tema
        });
        
        if (!error && data?.success && data?.settings?.branding?.landing_theme) {
          const theme = data.settings.branding.landing_theme.value;
          setForcedTheme(theme);
          
          if (theme && theme !== 'system') {
            // Aplicar o tema imediatamente
            const root = document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(theme);
            console.log('Tema aplicado:', theme);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar tema da landing:', err);
      } finally {
        setIsThemeLoaded(true);
      }
    };

    loadAndApplyLandingTheme();
    
    // Cleanup: restaurar tema do sistema quando sair da landing
    return () => {
      if (forcedTheme && forcedTheme !== 'system') {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        
        // Detectar preferência do sistema e aplicar
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        const savedTheme = localStorage.getItem("metacash-ui-theme");
        
        if (savedTheme === "system" || !savedTheme) {
          root.classList.add(systemTheme);
        } else {
          root.classList.add(savedTheme);
        }
      }
    };
  }, [lastUpdated, forcedTheme]);

  // --- useEffect para controlar a montagem/desmontagem do script do Typebot ---
  useEffect(() => {
    // Apenas monta o script se a rota atual for a da landing page ('/')
    if (location.pathname === '/') {
      setShouldMountTypebotScript(true);
    } else {
      setShouldMountTypebotScript(false);
      // Garante que qualquer bubble existente seja removido ao navegar para fora da landing
      const typebotBubble = document.querySelector('.typebot-bubble');
      if (typebotBubble) {
        typebotBubble.remove();
      }
    }
  }, [location.pathname]); // Este efeito roda sempre que a rota muda

  // --- useEffect para carregar e inicializar o Typebot Bubble ---
  // Este efeito só será executado se shouldMountTypebotScript for verdadeiro
  useEffect(() => {
    if (!shouldMountTypebotScript) return; // Não faz nada se o script não deve ser montado

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0/dist/web.js';
    script.type = 'module';
    script.async = true;

    script.onload = () => {
      if (window.Typebot) {
        window.Typebot.initBubble({
          typebot: "vixus-ia", // ID do seu Typebot
          previewMessage: {
            message: "Tire suas dúvidas comigo!",
            autoShowDelay: 5000,
          },
          theme: {
            button: {
              backgroundColor: "#A7CF17",
              customIconSrc: "https://s3.typebot.io/public/workspaces/cmd0ug4ib0000l1049mwbs6ls/typebots/z3p568fijv5oygp8xkzf931d/hostAvatar?v=1754418298531",
            },
          },
          keepUrlQueryParams: true
        });
      }
    };

    document.body.appendChild(script);

    // Função de limpeza: remove o script e o bubble do Typebot quando o componente é desmontado
    // ou quando shouldMountTypebotScript se torna falso
    return () => {
      document.body.removeChild(script);
      const typebotBubble = document.querySelector('.typebot-bubble');
      if (typebotBubble) {
        typebotBubble.remove();
      }
    };
  }, [shouldMountTypebotScript]); // Este efeito roda apenas quando shouldMountTypebotScript muda

  // Mostrar um loading mínimo enquanto carrega o tema para evitar flash
  if (!isThemeLoaded || brandingLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-muted/20 to-background">
      <LandingHeader />
      <motion.main
        className="w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <LandingHero />
        <LandingFeatures />
        <LandingPricing />
        <LandingBenefits />
        <LandingCTA />
      </motion.main>
      
      {/* Footer */}
      <footer className="bg-card/50 border-t py-8 w-full">
        <div className="w-full px-4 text-center text-muted-foreground">
          <p className="max-w-6xl mx-auto">&copy; 2025 {companyName} - Transforme sua vida financeira</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

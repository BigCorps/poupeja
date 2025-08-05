import React, { useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

// Declaração global para o objeto Typebot, para que o TypeScript o reconheça
declare global {
  interface Window {
    Typebot: any;
  }
}

const LandingHero = () => {
  const { companyName } = useBrandingConfig();
  
  const scrollToPlans = useCallback(() => {
    const section = document.getElementById('planos');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // --- useEffect para o Typebot Bubble ---
  useEffect(() => {
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
              backgroundColor: "#A7CF17", // Cor do botão
              customIconSrc: "https://s3.typebot.io/public/workspaces/cmd0ug4ib0000l1049mwbs6ls/typebots/z3p568fijv5oygp8xkzf931d/hostAvatar?v=1754418298531", // Ícone personalizado
            },
          },
          keepUrlQueryParams: true
        });
      }
    };

    document.body.appendChild(script);

    // Função de limpeza: remove o script e o bubble do Typebot quando o componente é desmontado
    return () => {
      document.body.removeChild(script);
      // Tenta remover o elemento do bubble do Typebot se ele foi adicionado
      const typebotBubble = document.querySelector('.typebot-bubble');
      if (typebotBubble) {
        typebotBubble.remove();
      }
      // Tenta fechar o Typebot via API, caso ainda esteja ativo
      if (window.Typebot && typeof window.Typebot.close === 'function') {
        window.Typebot.close();
      }
    };
  }, []); // O array de dependências vazio garante que este efeito rode apenas uma vez, na montagem do componente

  return (
    <section className="py-20 md:py-32 w-full relative">
      <div className="w-full px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Transforme sua vida financeira com a Vixus!
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            A ferramenta completa para controlar suas finanças, definir metas e 
            alcançar a liberdade financeira que você sempre sonhou.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="text-xs sm:text-sm md:text-base px-4 py-3 sm:px-6 sm:py-5 md:px-8 md:py-6" 
              onClick={scrollToPlans}
            >
              Estou pronto para economizar
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-xs sm:text-sm md:text-base px-4 py-3 sm:px-6 sm:py-5 md:px-8 md:py-6" 
              asChild
            >
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex flex-col items-center text-center p-6">
            <TrendingUp className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Controle Total</h3>
            <p className="text-muted-foreground">Acompanhe cada centavo e veja seu dinheiro crescer</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6">
            <Shield className="h-12 w-12 text-secondary mb-4" />
            <h3 className="text-lg font-semibold mb-2">100% Seguro</h3>
            <p className="text-muted-foreground">Seus dados protegidos com a melhor tecnologia</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6">
            <Smartphone className="h-12 w-12 text-accent mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sempre Disponível</h3>
            <p className="text-muted-foreground">Acesse de qualquer lugar, a qualquer momento</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingHero;


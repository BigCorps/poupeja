import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

const LandingHeader = () => {
  const { companyName, logoUrl, logoAltText } = useBrandingConfig();
  
  const scrollToPlans = useCallback(() => {
    const section = document.getElementById('planos');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <motion.header 
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b w-full"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full px-4 py-4 flex items-center justify-between max-w-none">
        <div className="flex items-center space-x-2">
          <img 
            src={logoUrl} 
            alt={logoAltText}
            className="h-10 object-contain" // Aumentado o tamanho e removido o container
            onError={(e) => {
              // Fallback para primeira letra do nome da empresa
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              const nextSibling = target.nextElementSibling as HTMLElement;
              if (nextSibling) {
                nextSibling.style.display = 'block';
              }
            }}
          />
          <span className="text-xl font-bold text-primary">{companyName}</span>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Novo botão de Contato */}
          <Button variant="ghost" asChild>
            <a 
              href="https://vixusbr.com.br/#contato"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-muted-foreground hover:text-accent-foreground"
            >
              Contato
            </a>
          </Button>

          {/* Botão Entrar existente */}
          <Button variant="ghost" asChild>
            <Link to="/login">Entrar</Link>
          </Button>
          
          {/* Botões de planos existentes */}
          <Button 
            asChild={false} 
            onClick={scrollToPlans}
            className="hidden sm:inline-flex text-xs sm:text-sm md:text-base"
            size="sm"
          >
            Estou pronto para economizar
          </Button>
          <Button 
            asChild={false} 
            onClick={scrollToPlans}
            className="inline-flex sm:hidden"
            size="sm"
          >
            Economizar
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default LandingHeader;

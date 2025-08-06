import React from 'react';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { companyName, logoUrl, logoAltText } = useBrandingConfig();
  const location = useLocation();

  // A cor de fundo será verde, a mesma cor que vemos na tela de login
  const isLoginPage = location.pathname === '/login' || location.pathname === '/register';
  const backgroundColor = isLoginPage ? 'bg-green-700' : 'bg-background';

  return (
    <div className={cn("min-h-screen flex flex-col", backgroundColor)}>
      {/* Header com Logo e ThemeToggle, visível apenas fora da tela de login */}
      {!isLoginPage && (
        <header className="py-4 px-6 flex justify-between items-center bg-card shadow-sm">
          <div className="flex items-center space-x-2">
            <img 
              src={logoUrl} 
              alt={logoAltText}
              className="h-8"
            />
            <span className="text-xl font-bold">{companyName}</span>
          </div>
          <ThemeToggle />
        </header>
      )}

      {/* Conteúdo principal */}
      <main className="flex-grow flex items-center justify-center">
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;


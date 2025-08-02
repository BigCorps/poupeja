import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Eye, EyeOff, LogOut, Crown, Settings } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  hideValues: boolean;
  toggleHideValues: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  hideValues,
  toggleHideValues
}) => {
  const { t } = usePreferences();
  const { logout } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 p-4 bg-background/95 backdrop-blur-sm border-b md:hidden">
      {/* Container do lado esquerdo para manter o alinhamento 'space-between' */}
      <div className="flex items-center gap-2">
        {/* Adicione outros botões aqui se necessário */}
      </div>

      {/* Botões e links do lado direito na nova ordem */}
      <div className="flex items-center gap-2">
        {/* 1. Botão Ocultar Valores */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleHideValues}
          aria-label={hideValues ? t('common.show') : t('common.hide')}
        >
          {hideValues ? <EyeOff className="h-5 w-5 text-foreground" /> : <Eye className="h-5 w-5 text-foreground" />} 
        </Button>
        
        {/* 2. Botão Alternar Tema */}
        <ThemeToggle variant="ghost" size="icon" />
        
        {/* 3. Link para a página de Planos */}
        <NavLink
          to="/plans"
          className={({ isActive }) =>
            cn(
              "p-2 rounded-md transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              isActive ? "text-primary bg-primary/10" : "text-foreground"
            )
          }
        >
          <Crown className="h-5 w-5" />
        </NavLink>

        {/* 4. Link para a página de Configurações */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "p-2 rounded-md transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              isActive ? "text-primary bg-primary/10" : "text-foreground"
            )
          }
        >
          <Settings className="h-5 w-5" />
        </NavLink>
        
        {/* 5. Botão de Sair */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label={t('settings.logout')}
        >
          <LogOut className="h-5 w-5 text-foreground" /> 
        </Button>
      </div>
    </div>
  );
};

export default MobileHeader;

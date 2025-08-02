import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom'; // 👈 Adicionado 'NavLink' e 'useLocation'
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Eye, EyeOff, LogOut, Crown, Settings } from 'lucide-react'; // 👈 Adicionado 'Crown' e 'Settings'
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils'; // 👈 Adicionado 'cn' para classes condicionais

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
  const location = useLocation(); // 👈 Hook para verificar a rota ativa

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
      {/* Container para os botões do lado esquerdo.
        Ainda que não tenhamos nada aqui, é bom ter para manter o layout 'space-between'
      */}
      <div className="flex items-center gap-2">
        {/* Adicione outros botões aqui se necessário no futuro */}
      </div>

      {/* Botões do lado direito */}
      <div className="flex items-center gap-2">
        {/* Link para a página de Planos */}
        <NavLink
          to="/plans"
          className={({ isActive }) =>
            cn(
              "p-2 rounded-md transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
            )
          }
        >
          <Crown className="h-5 w-5" />
        </NavLink>

        {/* Link para a página de Configurações */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "p-2 rounded-md transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
            )
          }
        >
          <Settings className="h-5 w-5" />
        </NavLink>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleHideValues}
          aria-label={hideValues ? t('common.show') : t('common.hide')}
        >
          {hideValues ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </Button>
        
        <ThemeToggle variant="ghost" size="icon" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label={t('settings.logout')}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default MobileHeader;

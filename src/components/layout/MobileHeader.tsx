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
      {/* Container da esquerda com o logo */}
      <div className="flex items-center gap-2">
        <img
          src="/lovable-uploads/logo-footer.png" // 👈 Caminho do seu logo
          alt="Poupeja Logo"
          className="h-6 object-contain" // 👈 Definindo a altura para não quebrar o layout
        />
      </div>

      {/* Botões e links do lado direito na nova ordem */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleHideValues}
          aria-label={hideValues ? t('common.show') : t('common.hide')}
        >
          {hideValues ? <EyeOff className="h-5 w-5 text-foreground" /> : <Eye className="h-5 w-5 text-foreground" />} 
        </Button>
        
        <ThemeToggle variant="ghost" size="icon" />
        
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

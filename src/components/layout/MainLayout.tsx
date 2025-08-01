import React from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, LayoutDashboard, Wallet, PiggyBank, Landmark } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Button } from '@/components/ui/button';

interface MobileNavBarProps {
  onAddTransaction: (type: 'income' | 'expense') => void;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({ onAddTransaction }) => {
  const { t } = usePreferences();

  const navLinks = [
    { to: '/dashboard', label: t('sidebar.dashboard'), icon: <LayoutDashboard size={24} /> },
    { to: '/dashboard/saldo', label: 'Saldo', icon: <Landmark size={24} /> }, // NOVO: Link para o Saldo
    { to: '/transactions', label: t('sidebar.transactions'), icon: <Wallet size={24} /> },
    { to: '/goals', label: t('sidebar.goals'), icon: <PiggyBank size={24} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-inner z-50">
      <nav className="flex justify-around items-center h-16 px-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            {link.icon}
            <span className="text-xs font-medium">{link.label}</span>
          </NavLink>
        ))}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onAddTransaction('expense')}
          className="relative top-[-20px] w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        >
          <Plus size={32} />
        </Button>
      </nav>
    </div>
  );
};

export default MobileNavBar;

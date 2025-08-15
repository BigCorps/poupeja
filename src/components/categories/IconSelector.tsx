import React from 'react';
import { 
  Circle,
  Home, 
  ShoppingBag, 
  Car, 
  FilmIcon, 
  Activity, 
  BookOpen, 
  FileText, 
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  PlusCircle,
  Utensils,
  DollarSign,
  CreditCard,
  Coffee,
  Smartphone,
  Scissors,
  Shirt,
  Plane,
  LucideProps,
  Heart,
  Gamepad2,
  Banknote,
  ShoppingCart,
  Zap,
  Phone,
  Wifi,
  Droplet,
  Building,
  Wrench,
  Baby,
  PiggyBank
} from 'lucide-react';

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
}

// Define a type that matches the Lucide components structure
type LucideIconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

// Update the icons array with the correct type
const icons: { name: string, component: LucideIconComponent }[] = [
  { name: 'circle', component: Circle },
  { name: 'home', component: Home },
  { name: 'car', component: Car },
  { name: 'utensils', component: Utensils },
  { name: 'heart', component: Heart },
  { name: 'book', component: BookOpen },
  { name: 'gamepad-2', component: Gamepad2 },
  { name: 'banknote', component: Banknote },
  { name: 'briefcase', component: Briefcase },
  { name: 'trending-up', component: TrendingUp },
  { name: 'shopping-cart', component: ShoppingCart },
  { name: 'plane', component: Plane },
  { name: 'coffee', component: Coffee },
  { name: 'gift', component: Gift },
  { name: 'zap', component: Zap },
  { name: 'phone', component: Phone },
  { name: 'wifi', component: Wifi },
  { name: 'droplet', component: Droplet },
  { name: 'building', component: Building },
  { name: 'shirt', component: Shirt },
  { name: 'wrench', component: Wrench },
  { name: 'baby', component: Baby },
  { name: 'piggy-bank', component: PiggyBank },
  { name: 'credit-card', component: CreditCard },
  { name: 'shopping-bag', component: ShoppingBag },
  { name: 'film', component: FilmIcon },
  { name: 'activity', component: Activity },
  { name: 'file-text', component: FileText },
  { name: 'more-horizontal', component: MoreHorizontal },
  { name: 'laptop', component: Laptop },
  { name: 'plus-circle', component: PlusCircle },
  { name: 'dollar-sign', component: DollarSign },
  { name: 'smartphone', component: Smartphone },
  { name: 'scissors', component: Scissors }
];

const IconSelector: React.FC<IconSelectorProps> = ({ selectedIcon, onSelectIcon }) => {
  return (
    <div className="grid grid-cols-6 gap-2 py-2 max-h-48 overflow-y-auto">
      {icons.map((icon) => {
        const IconComponent = icon.component;
        return (
          <button
            key={icon.name}
            type="button"
            onClick={() => onSelectIcon(icon.name)}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
              selectedIcon === icon.name 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <IconComponent size={16} />
          </button>
        );
      })}
    </div>
  );
};

export default IconSelector;


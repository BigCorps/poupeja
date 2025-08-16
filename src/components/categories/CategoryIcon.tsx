import React from 'react';
import { 
  Home, Car, Utensils, Heart, Book, Gamepad2, 
  Circle, Banknote, Briefcase, TrendingUp, 
  ShoppingCart, Plane, Coffee, Gift,
  Zap, Phone, Wifi, Droplet, Building,
  Shirt, Wrench, Baby, PiggyBank, CreditCard,
  // Novos ícones necessários
  BriefcaseBusiness, Headphones, ArrowLeftCircle,
  Percent, Handshake, MedicalCross, GraduationCap,
  MoreHorizontal, DollarSign, Package, Users,
  UserCheck, Settings, Building2, Megaphone,
  PlusCircle
} from 'lucide-react';

interface CategoryIconProps {
  icon: string | null;
  color: string;
  className?: string;
}

const iconMap = {
  // Ícones padrão do sistema
  home: Home,
  car: Car,
  utensils: Utensils,
  heart: Heart,
  book: Book,
  'gamepad-2': Gamepad2,
  gamepad: Gamepad2,
  banknote: Banknote,
  briefcase: Briefcase,
  'trending-up': TrendingUp,
  circle: Circle,
  
  // Ícones adicionais existentes
  'shopping-cart': ShoppingCart,
  plane: Plane,
  coffee: Coffee,
  gift: Gift,
  zap: Zap,
  phone: Phone,
  wifi: Wifi,
  droplet: Droplet,
  building: Building,
  shirt: Shirt,
  wrench: Wrench,
  baby: Baby,
  'piggy-bank': PiggyBank,
  'credit-card': CreditCard,
  
  // Novos ícones da tabela
  'briefcase-business': BriefcaseBusiness,
  headphones: Headphones,
  'arrow-left-circle': ArrowLeftCircle,
  percent: Percent,
  handshake: Handshake,
  'medical-cross': MedicalCross,
  'graduation-cap': GraduationCap,
  'more-horizontal': MoreHorizontal,
  'dollar-sign': DollarSign,
  package: Package,
  users: Users,
  'user-check': UserCheck,
  settings: Settings,
  'building-2': Building2,
  megaphone: Megaphone,
  'plus-circle': PlusCircle
};

export default function CategoryIcon({ icon, color, className = "w-4 h-4" }: CategoryIconProps) {
  const IconComponent = icon && iconMap[icon as keyof typeof iconMap] 
    ? iconMap[icon as keyof typeof iconMap] 
    : Circle;
  
  return (
    <IconComponent 
      className={className}
      style={{ color }}
    />
  );
}

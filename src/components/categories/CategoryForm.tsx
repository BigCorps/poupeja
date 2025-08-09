import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Category, TransactionType } from '@/types/categories';
import ColorPicker from './ColorPicker'; // Assumindo que você tem este componente
import IconSelector from './IconSelector'; // Assumindo que você tem este componente
import { useApp } from '@/contexts/AppContext';

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Category | null;
  onSave: (category: Omit<Category, 'id'> | Category) => void;
  categoryType: TransactionType;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  open,
  onOpenChange,
  initialData,
  onSave,
  categoryType,
}) => {
  const { t } = usePreferences();
  const { categories } = useApp();
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || categoryType);
  const [color, setColor] = useState(initialData?.color || '#000000');
  const [icon, setIcon] = useState(initialData?.icon || 'LayoutList');
  const [parentId, setParentId] = useState(initialData?.parent_id || null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setColor(initialData.color);
      setIcon(initialData.icon);
      setParentId(initialData.parent_id || null);
    } else {
      setName('');
      setType(categoryType);
      setColor('#000000');
      setIcon('LayoutList');
      setParentId(null);
    }
  }, [initialData, categoryType]);

  const handleSave = () => {
    if (!name || !type) {
      // Adicione validação, se necessário
      return;
    }

    const newCategoryData = {
      name: name,
      type: type,
      color: color,
      icon: icon,
      is_default: false,
      parent_id: parentId,
    };

    if (initialData) {
      onSave({ ...newCategoryData, id: initialData.id });
    } else {
      onSave(newCategoryData);
    }

    onOpenChange(false);
  };

  // Filtra as categorias principais (aquelas sem parent_id) para a seleção
  const mainCategories = categories.filter(cat => !cat.parent_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? t('categories.edit') : t('categories.add')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {t('common.name')}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              {t('common.type')}
            </Label>
            <Select value={type} onValueChange={(value) => setType(value as TransactionType)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t('common.selectType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">{t('common.expense')}</SelectItem>
                <SelectItem value="income">{t('common.income')}</SelectItem>
                <SelectItem value="operational_inflow">Fluxo Operacional (Entrada)</SelectItem>
                <SelectItem value="operational_outflow">Fluxo Operacional (Saída)</SelectItem>
                <SelectItem value="investment_inflow">Fluxo de Investimento (Entrada)</SelectItem>
                <SelectItem value="investment_outflow">Fluxo de Investimento (Saída)</SelectItem>
                <SelectItem value="financing_inflow">Fluxo de Financiamento (Entrada)</SelectItem>
                <SelectItem value="financing_outflow">Fluxo de Financiamento (Saída)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Campo para selecionar a categoria pai */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="parent" className="text-right">
              Categoria Pai
            </Label>
            <Select
              value={parentId || ''}
              onValueChange={(value) => setParentId(value === '' ? null : value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Nenhuma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhuma (Categoria Principal)</SelectItem>
                {mainCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Cor
            </Label>
            <div className="col-span-3">
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="icon" className="text-right">
              Ícone
            </Label>
            <div className="col-span-3">
              <IconSelector value={icon} onChange={setIcon} />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={handleSave}>
            {initialData ? t('common.saveChanges') : t('common.add')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;

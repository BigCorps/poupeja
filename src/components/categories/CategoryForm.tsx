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
import ColorPicker from './ColorPicker'; // Assuming you have this component
import IconSelector from './IconSelector'; // Assuming you have this component
import { useApp } from '@/contexts/AppContext';

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Category | null;
  onSave: (category: Omit<Category, 'id'> | Category) => void;
  categoryType: TransactionType;
  parentId?: string | null;
  parentName?: string | null;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  open,
  onOpenChange,
  initialData,
  onSave,
  categoryType,
  parentId,
  parentName,
}) => {
  const { t } = usePreferences();
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || categoryType);
  const [color, setColor] = useState(initialData?.color || '#000000');
  const [icon, setIcon] = useState(initialData?.icon || 'LayoutList');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setColor(initialData.color);
      setIcon(initialData.icon);
    } else {
      setName('');
      setType(categoryType);
      setColor('#000000');
      setIcon('LayoutList');
    }
  }, [initialData, categoryType]);

  const handleSave = () => {
    if (!name || !type) {
      return;
    }

    const newCategoryData = {
      name: name,
      type: type,
      color: color,
      icon: icon,
      is_default: false,
      parent_id: parentId || null,
    };

    if (initialData) {
      onSave({ ...newCategoryData, id: initialData.id });
    } else {
      onSave(newCategoryData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? t('categories.edit') : t('categories.add')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {parentName && (
            <div className="bg-muted p-2 rounded-lg text-sm text-center">
              Adicionando subcategoria para: <span className="font-semibold">{parentName}</span>
            </div>
          )}
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

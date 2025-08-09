import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Caminho de importação corrigido para o diretório atual.
// Assume que o arquivo ColorPicker.tsx está na mesma pasta que CategoryForm.tsx.
import ColorPicker from './ColorPicker'; 
import { IconPicker } from '@/components/IconPicker';
import CategoryPicker from '@/components/CategoryPicker';
import { Category } from '@/types/categories';

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Category | null;
  onSave: (category: Omit<Category, 'id'> | Category) => void;
  categoryType: 'operational_inflow' | 'operational_outflow' | 'investment_inflow' | 'investment_outflow' | 'financing_inflow' | 'financing_outflow';
}

const CategoryForm: React.FC<CategoryFormProps> = ({ open, onOpenChange, initialData, onSave, categoryType }) => {
  const [formData, setFormData] = useState<Omit<Category, 'id' | 'user_id' | 'created_at'> | Category>({
    name: '',
    color: '#000000',
    icon: '',
    is_default: false,
    parent_id: null,
    type: categoryType,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        parent_id: initialData.parent_id || null
      });
    } else {
      setFormData({
        name: '',
        color: '#000000',
        icon: '',
        is_default: false,
        parent_id: null,
        type: categoryType,
      });
    }
  }, [initialData, categoryType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleParentCategoryChange = (parentId: string | null) => {
    setFormData(prev => ({ ...prev, parent_id: parentId }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Omit<Category, 'user_id' | 'created_at'> | Category);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Categoria' : 'Adicionar Categoria'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Faça alterações na sua categoria existente.' : 'Adicione uma nova categoria para organizar suas finanças.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="col-span-3"
              />
            </div>
            
            {/* Seletor de Categoria Pai */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parent_id" className="text-right">
                Categoria Pai
              </Label>
              <div className="col-span-3">
                <CategoryPicker 
                  value={formData.parent_id || ''}
                  onValueChange={handleParentCategoryChange}
                />
              </div>
            </div>

            {/* Outros campos (cor e ícone) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Cor
              </Label>
              <div className="col-span-3">
                <ColorPicker
                  selectedColor={formData.color}
                  onSelectColor={(newColor) => setFormData(prev => ({ ...prev, color: newColor }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icon" className="text-right">
                Ícone
              </Label>
              <div className="col-span-3">
                <IconPicker
                  icon={formData.icon}
                  onIconChange={(newIcon) => setFormData(prev => ({ ...prev, icon: newIcon }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;

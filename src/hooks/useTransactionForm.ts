import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { lucideReact as icons } from 'lucide-react';

// Dados mockados para simular categorias e subcategorias
// No seu sistema, esses dados viriam do seu AppContext
const mockCategories = [
  { id: '1', name: 'Alimentação', parent_id: null, type: 'expense', color: '#ff6b6b' },
  { id: '2', name: 'Transporte', parent_id: null, type: 'expense', color: '#4ecdc4' },
  { id: '3', name: 'Moradia', parent_id: null, type: 'expense', color: '#45b7d1' },
  { id: '4', name: 'Supermercado', parent_id: '1', type: 'expense', color: '#ff6b6b' },
  { id: '5', name: 'Restaurante', parent_id: '1', type: 'expense', color: '#ff6b6b' },
  { id: '6', name: 'Combustível', parent_id: '2', type: 'expense', color: '#4ecdc4' },
  { id: '7', name: 'Seguro', parent_id: '2', type: 'expense', color: '#4ecdc4' },
  { id: '8', name: 'Aluguel', parent_id: '3', type: 'expense', color: '#45b7d1' },
  { id: '9', name: 'Contas', parent_id: '3', type: 'expense', color: '#45b7d1' },
];

// O esquema de validação corrigido (do seu Canvas)
export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive(),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  date: z.string().min(1),
  goalId: z.union([z.string().min(1), z.literal("none"), z.null(), z.undefined()]).optional(),
});

// Tipos do formulário
export type TransactionFormValues = z.infer<typeof createTransactionSchema>;

// Adaptando o seu hook useTransactionForm para este exemplo
const useTransactionForm = () => {
    const [selectedType, setSelectedType] = useState<'income' | 'expense'>('expense');
    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(createTransactionSchema),
        defaultValues: {
            type: 'expense',
            amount: 0,
            category: '',
            subcategory: '',
            date: new Date().toISOString().split('T')[0],
            goalId: undefined,
        }
    });

    const onSubmit = (values: TransactionFormValues) => {
        console.log("Formulário enviado com sucesso!", values);
        // Aqui a lógica para salvar a transação
    };

    return { form, selectedType, onSubmit, setSelectedType };
}

export default function App() {
  const { form, selectedType, onSubmit, setSelectedType } = useTransactionForm();
  const { register, handleSubmit, setValue, watch } = form;
  
  // Watch the value of the 'category' field
  const selectedParentCategory = watch('category');

  const parentCategories = useMemo(() => {
    return mockCategories.filter(cat => cat.parent_id === null && cat.type === selectedType);
  }, [selectedType]);

  const subcategories = useMemo(() => {
    if (!selectedParentCategory) return [];
    return mockCategories.filter(cat => cat.parent_id === selectedParentCategory);
  }, [selectedParentCategory]);

  // Handle the change for parent category and reset subcategory
  const handleParentCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParentId = e.target.value;
    setValue('category', newParentId, { shouldValidate: true });
    // Reset the subcategory when the parent category changes
    setValue('subcategory', '', { shouldValidate: true });
  };
  
  // Update the form's type when the user clicks the buttons
  useEffect(() => {
    form.setValue('type', selectedType);
  }, [selectedType, form]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 antialiased">
      <div className="bg-gray-800 text-gray-200 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Editar Transação (PF)</h2>
          <button className="text-gray-400 hover:text-white transition-colors">
            <icons.X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Botões de tipo (Receita/Despesa) */}
          <div className="flex justify-center p-1 bg-gray-700 rounded-xl space-x-2">
            <button
              type="button"
              onClick={() => setSelectedType('income')}
              className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-colors ${selectedType === 'income' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('expense')}
              className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-colors ${selectedType === 'expense' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}
            >
              Despesa
            </button>
          </div>

          {/* Campo Categoria Principal */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Categoria Principal
            </label>
            <select
              id="category"
              {...register('category')}
              onChange={handleParentCategoryChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Selecione a categoria principal</option>
              {parentCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Campo Subcategoria (opcional) */}
          {selectedParentCategory && subcategories.length > 0 && (
            <div>
              <label htmlFor="subcategory" className="block text-sm font-medium mb-2">
                Subcategoria (Opcional)
              </label>
              <select
                id="subcategory"
                {...register('subcategory')}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione uma subcategoria</option>
                {subcategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              className="px-6 py-2 bg-gray-600 text-gray-200 rounded-lg font-semibold hover:bg-gray-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold shadow-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedParentCategory}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

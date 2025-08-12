import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { lucideReact as icons } from 'lucide-react';
import { useCategories } from '@/hooks/use-categories'; // Importa o hook real

// O esquema de validação corrigido (do seu Canvas)
export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive(),
  // A categoria principal é obrigatória apenas se for uma despesa ou receita
  category: z.string().optional(),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  date: z.string().min(1),
  goalId: z.union([z.string().min(1), z.literal("none"), z.null(), z.undefined()]).optional(),
}).refine(data => {
  // Adiciona a validação para garantir que a categoria principal é selecionada
  // se houver uma subcategoria, ou se for uma transação de tipo despesa/receita.
  // A validação do seu `TransactionForm` anterior era mais robusta.
  // Ajuste o `zod` schema conforme a necessidade exata.
  if (data.type === 'expense' || data.type === 'income') {
    return !!data.category;
  }
  return true;
}, {
  message: "A categoria é obrigatória para despesas e receitas.",
  path: ['category'],
});

// Tipos do formulário
export type TransactionFormValues = z.infer<typeof createTransactionSchema>;

const useTransactionForm = () => {
    // Agora usa o hook real para buscar as categorias
    const { categories: allCategories } = useCategories();
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
    };

    const { register, handleSubmit, setValue, watch } = form;
    
    const selectedParentCategory = watch('category');

    const parentCategories = useMemo(() => {
      // Usa os dados reais e aninhados para filtrar as categorias
      return allCategories.filter(cat => cat.type === selectedType);
    }, [allCategories, selectedType]);

    const subcategories = useMemo(() => {
      if (!selectedParentCategory) return [];
      const parent = allCategories.find(cat => cat.id === selectedParentCategory);
      return parent?.subcategories || [];
    }, [allCategories, selectedParentCategory]);

    const handleParentCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newParentId = e.target.value;
      setValue('category', newParentId, { shouldValidate: true });
      setValue('subcategory', '', { shouldValidate: true });
    };

    const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newSubcategoryId = e.target.value;
      setValue('subcategory', newSubcategoryId, { shouldValidate: true });

      // Lógica para preencher a categoria principal automaticamente
      const subcategory = allCategories.flatMap(c => c.subcategories || []).find(s => s.id === newSubcategoryId);
      if (subcategory && subcategory.parent_id) {
        setValue('category', subcategory.parent_id, { shouldValidate: true });
      }
    };
    
    useEffect(() => {
      form.setValue('type', selectedType);
    }, [selectedType, form]);

    return { form, selectedType, onSubmit, setSelectedType, parentCategories, subcategories, handleParentCategoryChange, handleSubcategoryChange, selectedParentCategory };
}

export default function App() {
  const { form, selectedType, onSubmit, setSelectedType, parentCategories, subcategories, handleParentCategoryChange, handleSubcategoryChange, selectedParentCategory } = useTransactionForm();
  const { register, handleSubmit, formState: { errors } } = form;
  
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

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Categoria Principal
            </label>
            <select
              id="category"
              {...register('category')}
              onChange={handleParentCategoryChange}
              value={selectedParentCategory || ''}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Selecione a categoria principal</option>
              {parentCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category.message}</p>}
          </div>

          {selectedParentCategory && subcategories.length > 0 && (
            <div>
              <label htmlFor="subcategory" className="block text-sm font-medium mb-2">
                Subcategoria (Opcional)
              </label>
              <select
                id="subcategory"
                {...register('subcategory')}
                onChange={handleSubcategoryChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione uma subcategoria</option>
                {subcategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* ... Outros campos do formulário ... */}

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
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

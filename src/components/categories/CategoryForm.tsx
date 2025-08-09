import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Category } from '@/types';

// O restante do seu código para o componente CategoryForm
const CategoryForm = () => {
  // Use o hook `useApp` para acessar o contexto
  const { addCategory, updateCategory, categories } = useApp();

  // Estados locais para o formulário
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState('#000000');
  const [icon, setIcon] = useState<string | null>(null);

  // Lógica para lidar com o envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCategory: Omit<Category, 'id' | 'created_at' | 'user_id'> = {
      name,
      type,
      color,
      icon,
      is_default: false,
      parent_id: null,
    };
    // Exemplo de como chamar a função do contexto
    // addCategory(newCategory as Category);
    // ...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Seus campos de formulário */}
      <div>
        <label htmlFor="name">Nome da Categoria</label>
        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {/* ... Outros campos ... */}
      <button type="submit">Salvar Categoria</button>
    </form>
  );
};

export default CategoryForm;

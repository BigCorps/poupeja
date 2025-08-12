import { useAppContext } from '@/contexts/AppContext';
import { useMemo } from 'react';

// ✅ Defina os tipos para as categorias
type ParentCategory = {
  id: string;
  name: string;
};

type Subcategory = {
  id: string;
  name: string;
  parent_id: string;
};

// ✅ Este hook personalizado fornece as categorias e subcategorias
export const useCategories = () => {
  const { categories, parentCategories, subcategories, isLoading } = useAppContext();

  // A função original do useAppContext já fornece parentCategories e subcategories
  // Se o seu AppContext tiver apenas `categories`, você pode usar `useMemo` para separá-las
  // Exemplo:
  /*
  const allParentCategories = useMemo(() => {
    return categories.filter(c => c.parent_id === null);
  }, [categories]);

  const allSubcategories = useMemo(() => {
    return categories.filter(c => c.parent_id !== null);
  }, [categories]);
  */

  // ✅ Retorne os dados já processados, garantindo que o tipo de retorno seja consistente
  return {
    parentCategories: parentCategories,
    subcategories: subcategories,
    isLoading,
  };
};

export default useCategories;

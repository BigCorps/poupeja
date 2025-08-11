import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/categories";
import { v4 as uuidv4 } from "uuid";

// Ajustado para garantir que o parent_id é sempre mapeado
export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from("poupeja_categories")
      .select("*, parent_id") // Inclui explicitamente o parent_id
      .order("name");

    if (error) throw error;

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type as 'income' | 'expense',
      color: item.color,
      icon: item.icon || "circle",
      isDefault: item.is_default,
      parent_id: item.parent_id || null // Garante que a propriedade exista
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const getCategoriesByType = async (type: 'income' | 'expense'): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from("poupeja_categories")
      .select("*, parent_id") // Inclui explicitamente o parent_id
      .eq("type", type)
      .order("name");

    if (error) throw error;

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type as 'income' | 'expense',
      color: item.color,
      icon: item.icon || "circle",
      isDefault: item.is_default,
      parent_id: item.parent_id || null // Garante que a propriedade exista
    }));
  } catch (error) {
    console.error(`Error fetching ${type} categories:`, error);
    return [];
  }
};

export const addCategory = async (category: Omit<Category, "id">): Promise<Category | null> => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      console.error("No authenticated user found");
      throw new Error("You must be logged in to add a category");
    }

    const userId = authData.user.id;
    console.log("Adding category for authenticated user");
    
    const newId = uuidv4();
    
    const { data, error } = await supabase
      .from("poupeja_categories")
      .insert({
        id: newId,
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
        is_default: category.isDefault || false,
        user_id: userId,
        parent_id: category.parent_id // Passa o parent_id para o insert
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insertion error:", error);
      throw error;
    }

    console.log("Category added successfully:", data);
    return {
      id: data.id,
      name: data.name,
      type: data.type as 'income' | 'expense',
      color: data.color,
      icon: data.icon || "circle",
      isDefault: data.is_default,
      parent_id: data.parent_id // Garante que o objeto retornado tenha o parent_id
    };
  } catch (error) {
    console.error("Error adding category:", error);
    return null;
  }
};

export const updateCategory = async (category: Category): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from("poupeja_categories")
      .update({
        name: category.name,
        color: category.color,
        icon: category.icon,
        is_default: category.isDefault,
        parent_id: category.parent_id // Passa o parent_id para o update
      })
      .eq("id", category.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      type: data.type as 'income' | 'expense',
      color: data.color,
      icon: data.icon || "circle",
      isDefault: data.is_default,
      parent_id: data.parent_id // Garante que o objeto retornado tenha o parent_id
    };
  } catch (error) {
    console.error("Error updating category:", error);
    return null;
  }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    const { data: category } = await supabase
      .from("poupeja_categories")
      .select("is_default")
      .eq("id", id)
      .single();
    
    if (category?.is_default) {
      console.error("Cannot delete default category");
      return false;
    }

    const { data: defaultCategory } = await supabase
      .from("poupeja_categories")
      .select("id, type")
      .eq("is_default", true)
      .eq("name", "Outros")
      .single();

    if (defaultCategory) {
      await supabase
        .from("poupeja_transactions")
        .update({ category_id: defaultCategory.id })
        .eq("category_id", id);
    }

    const { error } = await supabase
      .from("poupeja_categories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    return false;
  }
};

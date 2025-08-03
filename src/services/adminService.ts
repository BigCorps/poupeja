import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

/**
 * Fetches the total number of users from the 'users' table.
 * @returns A promise that resolves to the user count or null if an error occurs.
 */
export const fetchUserCount = async (): Promise<number | null> => {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact' });

    if (error) throw error;
    return count;
  } catch (error) {
    console.error('Error fetching user count:', error);
    return null;
  }
};

/**
 * Fetches the distribution of users across different subscription plans.
 * @returns A promise that resolves to a record of plan names and their user counts, or null.
 */
export const fetchPlanDistribution = async (): Promise<Record<string, number> | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('subscription_plan');

    if (error) throw error;

    if (!data) return null;

    const distribution = data.reduce((acc, user) => {
      const planName = user.subscription_plan || 'free';
      acc[planName] = (acc[planName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return distribution;
  } catch (error) {
    console.error('Error fetching plan distribution:', error);
    return null;
  }
};

/**
 * Fetches the most recent transactions from all users.
 * This is for demonstration purposes and assumes the admin has read access.
 * @returns A promise that resolves to an array of recent transactions.
 */
export const fetchRecentTransactions = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, amount, description, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
};

/**
 * Fetches aggregated spending habits data.
 * This is a placeholder and would be more complex in a real-world scenario.
 * @returns A promise that resolves to a placeholder array of spending habits data.
 */
export const fetchSpendingHabits = async (): Promise<any[]> => {
  try {
    // Exemplo de agregação (placeholder)
    // Em um cenário real, isso envolveria queries mais complexas com GROUP BY e SUM
    const { data, error } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .limit(50); // Limite para evitar buscar muitos dados

    if (error) throw error;

    if (!data) return [];

    const categorySpending = data.reduce((acc, transaction) => {
      const categoryId = transaction.category_id || 'uncategorized';
      acc[categoryId] = (acc[categoryId] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categorySpending).map(([categoryId, amount]) => ({
      category: categoryId,
      totalSpent: amount,
    }));
  } catch (error) {
    console.error('Error fetching spending habits:', error);
    return [];
  }
};

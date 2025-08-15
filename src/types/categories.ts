export type TransactionType = 'income' | 'expense';

export interface Category {
  id?: string;
  user_id?: string;
  name: string;
  type: TransactionType;
  color: string;
  icon?: string;
  parent_id?: string | null;
  sort_order?: number;
  is_default?: boolean;
  created_at?: string;
}

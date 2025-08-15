export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  parent_id: string | null;
  is_default: boolean;
  created_at: string;
  user_id: string;
}

export interface PaymentMethod {
  id?: string;
  user_id?: string;
  name: string;
  type: 'payment' | 'receipt' | 'both';
  is_default?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id?: string;
  user_id?: string;
  name: string;
  type: 'supplier' | 'customer' | 'both';
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}


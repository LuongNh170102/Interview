export interface Merchant {
  [key: string]: unknown;
  id: string;
  code: string;
  name: string;
  avatarUrl?: string;
  agency: string;
  phone: string;
  productCount: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

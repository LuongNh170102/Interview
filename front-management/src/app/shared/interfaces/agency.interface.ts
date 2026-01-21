/**
 * Store interface for DataTable
 * Using index signature for generic type compatibility
 */
export interface Agency {
  [key: string]: unknown;
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly initials: string;
  readonly initialsColor: string;
  readonly location: string;
  readonly phone: string;
  readonly totalMerchants: number;
  readonly joinDate: string;
  readonly status: 'active' | 'inactive' | 'suspended' | 'locked';
}

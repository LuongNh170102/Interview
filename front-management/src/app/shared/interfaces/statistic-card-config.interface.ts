import { StatisticCardVariant } from '../types/statistic-card-variant.type';

export interface StatisticCardConfig {
  value: string | number;
  /** Translation key for the label (e.g., 'admin.partners.stats.totalAgencies') */
  labelKey: string;
  /** Translation key for optional subtitle */
  subtitleKey?: string;
  icon: string;
  variant?: StatisticCardVariant;
  trend?: {
    value: string;
    direction: 'up' | 'down';
    /** Translation key for trend label */
    labelKey?: string;
  };
  progress?: {
    current: number;
    total: number;
  };
}

import { StatisticCardVariant } from '../types/statistic-card-variant.type';

export interface StatisticCardConfig {
  value: string | number;
  label: string;
  subtitle?: string;
  icon: string;
  variant?: StatisticCardVariant;
  trend?: {
    value: string;
    direction: 'up' | 'down';
    label?: string;
  };
  progress?: {
    current: number;
    total: number;
  };
}

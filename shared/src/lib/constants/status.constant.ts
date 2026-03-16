/**
 * Shared status constants for all apps (management, b2b, b2c).
 *
 * These mirror the Prisma enums defined in schema.prisma:
 *   enum ApprovalStatus  { PENDING | APPROVED | REJECTED }
 *   enum OperationalStatus { ACTIVE | INACTIVE | SUSPENDED | LOCKED }
 *
 * Usage:
 *   import { APPROVAL_STATUS, OPERATIONAL_STATUS } from '@vhandelivery/shared-ui';
 *   approvalStatus: APPROVAL_STATUS.APPROVED
 */

export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type ApprovalStatusValue =
  (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];

export const OPERATIONAL_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  LOCKED: 'LOCKED',
} as const;

export type OperationalStatusValue =
  (typeof OPERATIONAL_STATUS)[keyof typeof OPERATIONAL_STATUS];

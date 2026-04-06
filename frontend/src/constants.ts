export const ROLES = {
  ADMIN: 1,
  HR: 2,
  PAYROLL: 3,
  EMPLOYEE: 4,
} as const;

export const ROLE_NAMES: Record<number, string> = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.HR]: 'HR',
  [ROLES.PAYROLL]: 'Payroll',
  [ROLES.EMPLOYEE]: 'Employee',
};

export const ROLE_LABELS_BY_NAME: Record<string, string> = {
  admin: 'Admin',
  hr_manager: 'HR',
  payroll_officer: 'Payroll',
  employee: 'Employee',
};

export const DEFAULT_ROLE_ID = ROLES.EMPLOYEE;

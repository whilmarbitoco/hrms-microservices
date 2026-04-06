export const ROLES = {
  ADMIN: 1,
  HR_MANAGER: 2,
  EMPLOYEE: 3,
} as const;

export const ROLE_NAMES: Record<number, string> = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.HR_MANAGER]: 'HR',
  [ROLES.EMPLOYEE]: 'Employee',
};

export const ROLE_LABELS_BY_NAME: Record<string, string> = {
  admin: 'Admin',
  hr_manager: 'HR',
  employee: 'Employee',
};

export const ROLE_OPTIONS = [
  { id: ROLES.ADMIN, name: 'admin', label: 'Admin' },
  { id: ROLES.HR_MANAGER, name: 'hr_manager', label: 'HR' },
  { id: ROLES.EMPLOYEE, name: 'employee', label: 'Employee' },
] as const;

export const DEFAULT_ROLE_ID = ROLES.EMPLOYEE;

BEGIN;

INSERT INTO permissions (name, description) VALUES
    ('employee.view', 'View employee records'),
    ('employee.create', 'Create employees'),
    ('employee.update', 'Update employees'),
    ('employee.delete', 'Delete employees'),
    ('employee.terminate', 'Terminate employees'),
    ('employee.rehire', 'Rehire employees'),
    ('department.view', 'View departments'),
    ('department.create', 'Create departments'),
    ('department.update', 'Update departments'),
    ('department.delete', 'Delete departments'),
    ('employee_role.view', 'View employee roles'),
    ('employee_role.create', 'Create employee roles'),
    ('employee_role.update', 'Update employee roles'),
    ('employee_role.delete', 'Delete employee roles'),
    ('payroll.view', 'View payroll'),
    ('payroll.create', 'Create payroll batches'),
    ('payroll.process', 'Process payroll batches'),
    ('payslip.view', 'View payslips'),
    ('salary_component.view', 'View salary components'),
    ('salary_component.create', 'Create salary components'),
    ('salary_component.update', 'Update salary components'),
    ('salary_component.delete', 'Delete salary components'),
    ('adjustment.view', 'View adjustments'),
    ('adjustment.create', 'Create adjustments'),
    ('adjustment.update', 'Update adjustments'),
    ('adjustment.delete', 'Delete adjustments'),
    ('leave_request.view', 'View leave requests'),
    ('leave_request.create', 'Create leave requests'),
    ('leave_request.update', 'Update leave requests'),
    ('leave_request.delete', 'Delete leave requests'),
    ('leave_request.approve', 'Approve leave requests'),
    ('leave_request.reject', 'Reject leave requests'),
    ('leave_request.cancel', 'Cancel leave requests'),
    ('leave_policy.view', 'View leave policies'),
    ('leave_policy.create', 'Create leave policies'),
    ('leave_policy.update', 'Update leave policies'),
    ('leave_policy.delete', 'Delete leave policies'),
    ('leave_balance.view', 'View leave balances'),
    ('leave_balance.adjust', 'Adjust leave balances'),
    ('user.view', 'View users'),
    ('user.create', 'Create users'),
    ('user.assign_role', 'Assign roles to users'),
    ('user.deactivate', 'Deactivate users'),
    ('user.reactivate', 'Reactivate users'),
    ('user.reset_password', 'Reset user passwords')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO roles (name, description) VALUES
    ('admin', 'admin role'),
    ('hr_manager', 'hr_manager role'),
    ('employee', 'employee role')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

DELETE FROM role_permissions
WHERE role_id IN (
    SELECT id FROM roles WHERE name IN ('admin', 'hr_manager', 'employee')
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'employee.view', 'employee.create', 'employee.update', 'employee.delete',
    'employee.terminate', 'employee.rehire',
    'department.view', 'department.create', 'department.update', 'department.delete',
    'employee_role.view', 'employee_role.create', 'employee_role.update',
    'payroll.view', 'payslip.view', 'salary_component.view',
    'leave_request.view', 'leave_request.create', 'leave_request.update',
    'leave_request.delete', 'leave_request.approve', 'leave_request.reject',
    'leave_request.cancel', 'leave_policy.view', 'leave_policy.create',
    'leave_policy.update', 'leave_policy.delete', 'leave_balance.view', 'leave_balance.adjust',
    'user.view', 'user.create', 'user.deactivate', 'user.reactivate', 'user.reset_password'
)
WHERE r.name = 'hr_manager'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'employee.view',
    'payslip.view',
    'leave_request.view', 'leave_request.create', 'leave_request.update',
    'leave_request.cancel', 'leave_balance.view'
)
WHERE r.name = 'employee'
ON CONFLICT DO NOTHING;

INSERT INTO users (name, email, password_hash, is_active, employee_id, role_id) VALUES
    (
        'HRMS Admin',
        'admin@hrms.com',
        'scrypt:32768:8:1$UQFIZUiZXf3g15tT$c51f8167e199602f7250f1744da1c14c61f11e43725ec9d90a1e820f1b4dbc9ba0ecb14ffbe09d070f371a0736e3575c13aa623aac033aebfc44913b38e31ffd',
        TRUE,
        NULL,
        (SELECT id FROM roles WHERE name = 'admin')
    ),
    (
        'HR Manager',
        'hr@hrms.com',
        'scrypt:32768:8:1$kkv0xXcIXYzl9Hsw$f12102b5473bfca33df8d07244e5d994707e070dd75ae20bf519948a4cb8faaa093cdc137cb9ac2d282cf7de8894d7c5bbf0fbc08362a2f160d7381ccdda7b8f',
        TRUE,
        'EMP004',
        (SELECT id FROM roles WHERE name = 'hr_manager')
    ),
    (
        'Employee One',
        'employee1@hrms.com',
        'scrypt:32768:8:1$GxfsbF5b5hcjFLII$ac4e7fa6d789acd647f20a2c662848e3e127224f30b617487b336a53751923e80800e84134e3053d57d1de641de224e9f006f859ec1891f57c09dd7ed157087d',
        TRUE,
        'EMP001',
        (SELECT id FROM roles WHERE name = 'employee')
    ),
    (
        'Employee Two',
        'employee2@hrms.com',
        'scrypt:32768:8:1$lcXFyvl8ZkSD5TmS$da1fab6ded0d5966f5428f28e4c26644595e95f00c8ac6402f0291db708355813bd10af0f4e620e9480fa31d95e461734269996395157d6d9b7700376bc1b72d',
        TRUE,
        'EMP002',
        (SELECT id FROM roles WHERE name = 'employee')
    ),
    (
        'Employee Three',
        'employee3@hrms.com',
        'scrypt:32768:8:1$epiT7YCF1y4ufvp6$5f3db8d02a352d9088bd77ed22abda6e28441681d2f264671d9caf7985bcc6cf6957e3363cfcf0a8d3cd5cb456cb5dee502c69c34d48256d2e9a02be5f6711f4',
        TRUE,
        'EMP003',
        (SELECT id FROM roles WHERE name = 'employee')
    )
ON CONFLICT (email) DO UPDATE
SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    is_active = EXCLUDED.is_active,
    employee_id = EXCLUDED.employee_id,
    role_id = EXCLUDED.role_id;

COMMIT;

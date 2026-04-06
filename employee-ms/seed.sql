BEGIN;

INSERT INTO employee_roles (name, description, level) VALUES
    ('Backend Developer', 'Builds backend services', 'mid'),
    ('Frontend Developer', 'Builds frontend applications', 'mid'),
    ('HR Specialist', 'Handles people operations', 'senior')
ON CONFLICT (name) DO UPDATE
SET
    description = EXCLUDED.description,
    level = EXCLUDED.level;

INSERT INTO departments (name, description, manager_id) VALUES
    ('Engineering', 'Software engineering department', NULL),
    ('People Operations', 'HR and people operations', NULL)
ON CONFLICT (name) DO UPDATE
SET
    description = EXCLUDED.description,
    manager_id = EXCLUDED.manager_id;

INSERT INTO employees (employee_id, name, email, phone, department_id, role_id, manager_id, status, hired_at, terminated_at) VALUES
    (
        'EMP004',
        'HR Manager',
        'hr@company.local',
        '+639170000004',
        (SELECT id FROM departments WHERE name = 'People Operations'),
        (SELECT id FROM employee_roles WHERE name = 'HR Specialist'),
        NULL,
        'active',
        DATE '2024-01-15',
        NULL
    ),
    (
        'EMP001',
        'Employee One',
        'employee1@company.local',
        '+639170000001',
        (SELECT id FROM departments WHERE name = 'Engineering'),
        (SELECT id FROM employee_roles WHERE name = 'Backend Developer'),
        NULL,
        'active',
        DATE '2024-03-01',
        NULL
    ),
    (
        'EMP002',
        'Employee Two',
        'employee2@company.local',
        '+639170000002',
        (SELECT id FROM departments WHERE name = 'Engineering'),
        (SELECT id FROM employee_roles WHERE name = 'Frontend Developer'),
        NULL,
        'active',
        DATE '2024-04-01',
        NULL
    ),
    (
        'EMP003',
        'Employee Three',
        'employee3@company.local',
        '+639170000003',
        (SELECT id FROM departments WHERE name = 'Engineering'),
        (SELECT id FROM employee_roles WHERE name = 'Backend Developer'),
        NULL,
        'active',
        DATE '2024-05-01',
        NULL
    )
ON CONFLICT (email) DO UPDATE
SET
    employee_id = EXCLUDED.employee_id,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    department_id = EXCLUDED.department_id,
    role_id = EXCLUDED.role_id,
    manager_id = EXCLUDED.manager_id,
    status = EXCLUDED.status,
    hired_at = EXCLUDED.hired_at,
    terminated_at = EXCLUDED.terminated_at;

UPDATE departments
SET manager_id = (SELECT id FROM employees WHERE employee_id = 'EMP004')
WHERE name = 'People Operations';

UPDATE employees
SET manager_id = (SELECT id FROM employees WHERE employee_id = 'EMP004')
WHERE employee_id IN ('EMP001', 'EMP002', 'EMP003');

INSERT INTO employee_history (employee_id, action, changed_by, metadata)
SELECT e.id, 'hired', 'seed', json_build_object('employee_id', e.employee_id)
FROM employees e
WHERE NOT EXISTS (
    SELECT 1
    FROM employee_history h
    WHERE h.employee_id = e.id AND h.action = 'hired'
);

COMMIT;

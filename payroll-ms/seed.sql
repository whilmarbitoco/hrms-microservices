BEGIN;

INSERT INTO employee_cache (employee_id, name, department, role, status) VALUES
    ('EMP001', 'Employee One', 'Engineering', 'Backend Developer', 'active'),
    ('EMP002', 'Employee Two', 'Engineering', 'Frontend Developer', 'active'),
    ('EMP003', 'Employee Three', 'Engineering', 'Backend Developer', 'active'),
    ('EMP004', 'HR Manager', 'People Operations', 'HR Specialist', 'active')
ON CONFLICT (employee_id) DO UPDATE
SET
    name = EXCLUDED.name,
    department = EXCLUDED.department,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

INSERT INTO salary_components (employee_id, type, name, amount)
SELECT *
FROM (
    VALUES
        ('EMP001', 'base', 'Base Salary', 5000.00),
        ('EMP001', 'allowance', 'Internet Allowance', 300.00),
        ('EMP002', 'base', 'Base Salary', 4500.00),
        ('EMP002', 'allowance', 'Transport Allowance', 250.00),
        ('EMP003', 'base', 'Base Salary', 5200.00),
        ('EMP003', 'allowance', 'Internet Allowance', 300.00),
        ('EMP004', 'base', 'Base Salary', 6000.00)
) AS seed(employee_id, type, name, amount)
WHERE NOT EXISTS (
    SELECT 1
    FROM salary_components sc
    WHERE sc.employee_id = seed.employee_id
      AND sc.type = seed.type
      AND sc.name = seed.name
);

COMMIT;

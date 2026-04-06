BEGIN;

INSERT INTO employee_cache (employee_id, name, department, status) VALUES
    ('EMP001', 'Employee One', 'Engineering', 'active'),
    ('EMP002', 'Employee Two', 'Engineering', 'active'),
    ('EMP003', 'Employee Three', 'Engineering', 'active'),
    ('EMP004', 'HR Manager', 'People Operations', 'active')
ON CONFLICT (employee_id) DO UPDATE
SET
    name = EXCLUDED.name,
    department = EXCLUDED.department,
    status = EXCLUDED.status;

INSERT INTO leave_policies (name, type, max_days, accrual_rate, accrual_frequency) VALUES
    ('Annual Vacation', 'vacation', 15.00, 1.25, 'monthly'),
    ('Sick Leave', 'sick', 10.00, 0.83, 'monthly'),
    ('Unpaid Leave', 'unpaid', 365.00, 0.00, 'yearly')
ON CONFLICT (name) DO UPDATE
SET
    type = EXCLUDED.type,
    max_days = EXCLUDED.max_days,
    accrual_rate = EXCLUDED.accrual_rate,
    accrual_frequency = EXCLUDED.accrual_frequency;

INSERT INTO leave_balances (employee_id, policy_id, balance, accrued_at)
SELECT
    emp.employee_id,
    pol.id,
    CASE pol.type
        WHEN 'vacation' THEN 15.00
        WHEN 'sick' THEN 10.00
        ELSE 0.00
    END,
    NOW()
FROM employee_cache emp
CROSS JOIN leave_policies pol
WHERE NOT EXISTS (
    SELECT 1
    FROM leave_balances lb
    WHERE lb.employee_id = emp.employee_id
      AND lb.policy_id = pol.id
);

COMMIT;

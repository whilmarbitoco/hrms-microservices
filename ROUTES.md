# HRMS Microservices API Routes Reference

All requests go through NGINX at `http://localhost`.  
All protected endpoints require: `Authorization: Bearer <token>`  
Get a token from `POST /auth/login`.

---

## Auth Service (`auth-ms`)

### Public / Self-Service

#### POST /auth/register

```json
{
  "email": "user@hrms.com",
  "name": "John Doe",
  "password": "password123",
  "role_id": 1,
  "employee_id": "EMP001"
}
```

- `role_id` and `employee_id` are optional
- Returns: `{ "message": "Registered successfully", "user_id": 1 }`

---

#### POST /auth/login

```json
{
  "email": "user@hrms.com",
  "password": "password123"
}
```

- Returns: `{ "access_token": "...", "user": { ... } }`
- Sets `refresh_token` as HTTPOnly cookie

---

#### POST /auth/refresh

- No body — uses refresh token cookie
- Returns: `{ "access_token": "..." }`

---

#### POST /auth/logout

- No body — requires access token
- Clears refresh token cookie

---

#### GET /auth/me

- No body
- Returns current user profile

---

#### PATCH /auth/me/password

```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

---

#### POST /auth/forgot-password

```json
{
  "email": "user@hrms.com"
}
```

- Returns: `{ "message": "...", "reset_token": "..." }`
- In production the token would be emailed — currently returned in response for testing

---

#### POST /auth/reset-password

```json
{
  "token": "<reset_token>",
  "new_password": "newpassword123"
}
```

---

### User Management (requires `user.*` permissions)

#### GET /auth/users

- Permission: `user.view`
- Returns list of all users

---

#### GET /auth/users/`<id>`

- Permission: `user.view`
- Returns single user

---

#### POST /auth/users

- Permission: `user.create`

```json
{
  "email": "newuser@hrms.com",
  "name": "New User",
  "password": "password123",
  "role_id": 2,
  "employee_id": "EMP001"
}
```

- `role_id` and `employee_id` are optional

---

#### PATCH /auth/users/`<id>`/role

- Permission: `user.assign_role`

```json
{
  "role_id": 3
}
```

---

#### PATCH /auth/users/`<id>`/deactivate

- Permission: `user.deactivate`
- No body

---

#### PATCH /auth/users/`<id>`/reactivate

- Permission: `user.reactivate`
- No body

---

#### POST /auth/users/`<id>`/reset-password

- Permission: `user.reset_password`

```json
{
  "new_password": "newpassword123"
}
```

---

---

## Employee Management Service (`employee-ms`)

### Departments

#### GET /departments

- Permission: `department.view`
- Returns list of all departments

---

#### GET /departments/`<id>`

- Permission: `department.view`

---

#### POST /departments

- Permission: `department.create`

```json
{
  "name": "Engineering",
  "description": "Software engineering department",
  "manager_id": 5
}
```

- `description` and `manager_id` are optional

---

#### PUT /departments/`<id>`

- Permission: `department.update`

```json
{
  "name": "Engineering",
  "description": "Updated description",
  "manager_id": 5
}
```

- All fields required

---

#### PATCH /departments/`<id>`

- Permission: `department.update`

```json
{
  "description": "Only this field changes"
}
```

- All fields optional

---

#### DELETE /departments/`<id>`

- Permission: `department.delete`
- Blocked if active employees exist in the department

---

#### GET /departments/`<id>`/employees

- Permission: `department.view`
- Returns all employees in the department

---

### Employee Roles

#### GET /employee-roles

- Permission: `employee_role.view`

---

#### GET /employee-roles/`<id>`

- Permission: `employee_role.view`

---

#### POST /employee-roles

- Permission: `employee_role.create`

```json
{
  "name": "Backend Developer",
  "description": "Develops backend systems",
  "level": "mid"
}
```

- `description` optional
- `level` optional — one of: `junior`, `mid`, `senior`, `lead`, `principal`

---

#### PUT /employee-roles/`<id>`

- Permission: `employee_role.update`

```json
{
  "name": "Backend Developer",
  "description": "Updated description",
  "level": "senior"
}
```

- All fields required

---

#### PATCH /employee-roles/`<id>`

- Permission: `employee_role.update`

```json
{
  "level": "senior"
}
```

- All fields optional

---

#### DELETE /employee-roles/`<id>`

- Permission: `employee_role.delete`
- Blocked if active employees are assigned to this role

---

#### GET /employee-roles/`<id>`/employees

- Permission: `employee_role.view`
- Returns all employees with this role

---

### Employees

#### GET /employees

- Permission: `employee.view`
- Query params: `name`, `email`, `department_id`, `role_id`, `status`, `hired_from`, `hired_to`

---

#### GET /employees/`<id>`

- Permission: `employee.view`

---

#### POST /employees

- Permission: `employee.create`

```json
{
  "name": "John Doe",
  "email": "john.doe@hrms.com",
  "phone": "+1234567890",
  "department_id": 1,
  "role_id": 2,
  "manager_id": 5,
  "hired_at": "2024-01-15"
}
```

- Only `name` and `email` are required
- Auto-generates `employee_id` (e.g. `EMP001`)
- Publishes `employee.created`

---

#### PUT /employees/`<id>`

- Permission: `employee.update`

```json
{
  "name": "John Doe",
  "email": "john.doe@hrms.com",
  "phone": "+1234567890",
  "department_id": 1,
  "role_id": 2,
  "manager_id": 5,
  "hired_at": "2024-01-15"
}
```

- All fields required (use `null` for optional ones)
- Publishes `employee.updated`

---

#### PATCH /employees/`<id>`

- Permission: `employee.update`

```json
{
  "phone": "+9999999999"
}
```

- All fields optional
- Publishes `employee.updated`

---

#### DELETE /employees/`<id>`

- Permission: `employee.delete`
- Only allowed if employee status is `terminated`

---

#### POST /employees/`<id>`/terminate

- Permission: `employee.terminate`

```json
{
  "reason": "Voluntary resignation",
  "terminated_at": "2024-06-30"
}
```

- `reason` required, `terminated_at` optional (defaults to today)
- Publishes `employee.terminated`

---

#### POST /employees/`<id>`/rehire

- Permission: `employee.rehire`

```json
{
  "department_id": 1,
  "role_id": 2,
  "hired_at": "2024-09-01"
}
```

- `department_id` and `role_id` required (can be `null`)
- `hired_at` optional
- Publishes `employee.rehired`

---

#### GET /employees/`<id>`/history

- Permission: `employee.view`
- Returns full lifecycle audit history

---

#### GET /employees/`<id>`/subordinates

- Permission: `employee.view`
- Returns all direct and indirect subordinates

---

---

## Payroll Management Service (`payroll-ms`)

### Employee Cache (read-only)

#### GET /payroll/employees

- Permission: `payroll.view`
- Returns cached employee list synced from EMS via events

---

#### GET /payroll/employees/`<employee_id>`

- Permission: `payroll.view`
- `employee_id` is the string ID e.g. `EMP001`

---

### Salary Components

#### GET /payroll/salary-components

- Permission: `salary_component.view`
- Query params: `employee_id`, `type`

---

#### GET /payroll/salary-components/`<id>`

- Permission: `salary_component.view`

---

#### GET /payroll/salary-components/employee/`<employee_id>`

- Permission: `salary_component.view`
- Returns all components for a specific employee

---

#### POST /payroll/salary-components

- Permission: `salary_component.create`

```json
{
  "employee_id": "EMP001",
  "type": "base",
  "name": "Base Salary",
  "amount": "5000.00"
}
```

- `type` one of: `base`, `allowance`, `deduction`
- `amount` as string decimal

---

#### PUT /payroll/salary-components/`<id>`

- Permission: `salary_component.update`

```json
{
  "employee_id": "EMP001",
  "type": "allowance",
  "name": "Housing Allowance",
  "amount": "500.00"
}
```

- All fields required

---

#### PATCH /payroll/salary-components/`<id>`

- Permission: `salary_component.update`

```json
{
  "amount": "600.00"
}
```

- All fields optional

---

#### DELETE /payroll/salary-components/`<id>`

- Permission: `salary_component.delete`
- Blocked if component has been included in a processed batch

---

### Adjustments

#### GET /payroll/adjustments

- Permission: `adjustment.view`
- Query params: `employee_id`, `batch_id`, `type`

---

#### GET /payroll/adjustments/`<id>`

- Permission: `adjustment.view`

---

#### GET /payroll/adjustments/employee/`<employee_id>`

- Permission: `adjustment.view`

---

#### POST /payroll/adjustments

- Permission: `adjustment.create`

```json
{
  "employee_id": "EMP001",
  "batch_id": 1,
  "type": "bonus",
  "amount": "1000.00",
  "reason": "Q4 performance bonus"
}
```

- `type` one of: `bonus`, `deduction`, `override`
- `reason` optional
- Blocked if batch is already processed

---

#### PUT /payroll/adjustments/`<id>`

- Permission: `adjustment.update`

```json
{
  "employee_id": "EMP001",
  "batch_id": 1,
  "type": "bonus",
  "amount": "1200.00",
  "reason": "Updated reason"
}
```

- All fields required
- Blocked if batch is already processed

---

#### PATCH /payroll/adjustments/`<id>`

- Permission: `adjustment.update`

```json
{
  "amount": "1500.00"
}
```

- All fields optional
- Blocked if batch is already processed

---

#### DELETE /payroll/adjustments/`<id>`

- Permission: `adjustment.delete`
- Blocked if batch is already processed

---

### Payroll Batches

#### GET /payroll/batches

- Permission: `payroll.view`
- Query params: `status`, `cycle`

---

#### GET /payroll/batches/`<id>`

- Permission: `payroll.view`

---

#### POST /payroll/batches

- Permission: `payroll.create`

```json
{
  "name": "November 2024 Payroll",
  "cycle": "monthly",
  "period_start": "2024-11-01",
  "period_end": "2024-11-30"
}
```

- `cycle` one of: `monthly`, `semi-monthly`
- Batch starts in `draft` status

---

#### PUT /payroll/batches/`<id>`

- Permission: `payroll.create`

```json
{
  "name": "November 2024 Payroll",
  "cycle": "monthly",
  "period_start": "2024-11-01",
  "period_end": "2024-11-30"
}
```

- All fields required
- Blocked if status is not `draft`

---

#### PATCH /payroll/batches/`<id>`

- Permission: `payroll.create`

```json
{
  "name": "Updated Name"
}
```

- All fields optional
- Blocked if status is not `draft`

---

#### DELETE /payroll/batches/`<id>`

- Permission: `payroll.create`
- Blocked if status is not `draft`

---

#### POST /payroll/batches/`<id>`/process

- Permission: `payroll.process`
- No body
- Computes salaries for all active employees, generates payslips
- Sets batch status to `processed`
- Publishes `payroll.processed` and `payslip.generated`

---

### Payslips

#### GET /payroll/payslips

- Permission: `payslip.view`
- Query params: `batch_id`, `status`

---

#### GET /payroll/payslips/`<id>`

- Permission: `payslip.view`
- Returns full breakdown: `gross`, `deductions`, `net`

---

#### GET /payroll/payslips/employee/`<employee_id>`

- Permission: `payslip.view`

---

#### GET /payroll/payslips/batch/`<batch_id>`

- Permission: `payslip.view`

---

#### PATCH /payroll/payslips/`<id>`

- Permission: `payslip.view`

```json
{
  "status": "sent"
}
```

- `status` one of: `sent`, `acknowledged`

---

---

## Leave Management Service (`leave-ms`)

### Employee Cache (read-only)

#### GET /leave/employees

- Permission: `leave_request.view`

---

#### GET /leave/employees/`<employee_id>`

- Permission: `leave_request.view`

---

### Leave Policies

#### GET /leave/policies

- Permission: `leave_policy.view`

---

#### GET /leave/policies/`<id>`

- Permission: `leave_policy.view`

---

#### POST /leave/policies

- Permission: `leave_policy.create`

```json
{
  "name": "Annual Vacation",
  "type": "vacation",
  "max_days": "15",
  "accrual_rate": "1.25",
  "accrual_frequency": "monthly"
}
```

- `type` one of: `vacation`, `sick`, `unpaid`, `maternity`, `paternity`
- `accrual_frequency` one of: `monthly`, `yearly`
- `max_days` and `accrual_rate` as string decimals

---

#### PUT /leave/policies/`<id>`

- Permission: `leave_policy.update`

```json
{
  "name": "Annual Vacation",
  "type": "vacation",
  "max_days": "20",
  "accrual_rate": "1.67",
  "accrual_frequency": "monthly"
}
```

- All fields required

---

#### PATCH /leave/policies/`<id>`

- Permission: `leave_policy.update`

```json
{
  "max_days": "20"
}
```

- All fields optional

---

#### DELETE /leave/policies/`<id>`

- Permission: `leave_policy.delete`
- Blocked if any leave balances are tied to this policy

---

### Leave Balances

#### GET /leave/balances

- Permission: `leave_balance.view`
- Query params: `employee_id`, `policy_id`

---

#### GET /leave/balances/`<employee_id>`

- Permission: `leave_balance.view`
- Returns all balances for the employee across all policy types

---

#### PATCH /leave/balances/`<id>`

- Permission: `leave_balance.adjust`

```json
{
  "amount": "20.00",
  "reason": "Carry-over adjustment"
}
```

- `reason` optional
- Overrides the balance to the given amount

---

#### POST /leave/balances/accrue

- Permission: `leave_balance.adjust`

```json
{
  "employee_id": "EMP001"
}
```

- `employee_id` optional — omit to accrue for all employees
- Adds `accrual_rate` to each balance up to `max_days`

---

### Leave Requests

#### GET /leave/requests

- Permission: `leave_request.view`
- Query params: `employee_id`, `status`, `policy_id`, `from_date`, `to_date`

---

#### GET /leave/requests/`<id>`

- Permission: `leave_request.view`

---

#### POST /leave/requests

- Permission: `leave_request.create`

```json
{
  "employee_id": "EMP001",
  "policy_id": 1,
  "start_date": "2025-06-02",
  "end_date": "2025-06-04",
  "reason": "Family vacation"
}
```

- `reason` optional
- Validates employee is active and has sufficient balance
- Publishes `leave.applied`

---

#### PUT /leave/requests/`<id>`

- Permission: `leave_request.update`

```json
{
  "employee_id": "EMP001",
  "policy_id": 1,
  "start_date": "2025-06-02",
  "end_date": "2025-06-04",
  "reason": "Updated reason"
}
```

- All fields required
- Blocked if status is not `pending`

---

#### PATCH /leave/requests/`<id>`

- Permission: `leave_request.update`

```json
{
  "reason": "Updated reason"
}
```

- Fields: `start_date`, `end_date`, `reason` — all optional
- Blocked if status is not `pending`

---

#### DELETE /leave/requests/`<id>`

- Permission: `leave_request.delete`
- Blocked if status is not `pending`

---

#### POST /leave/requests/`<id>`/approve

- Permission: `leave_request.approve`
- No body
- Decrements leave balance
- Publishes `leave.approved`

---

#### POST /leave/requests/`<id>`/reject

- Permission: `leave_request.reject`

```json
{
  "reason": "Critical project deadline"
}
```

- `reason` required
- Publishes `leave.rejected`

---

#### POST /leave/requests/`<id>`/cancel

- Permission: `leave_request.cancel`
- No body
- Restores balance if request was approved
- Works on both `pending` and `approved` requests

---

#### GET /leave/requests/calendar

- Permission: `leave_request.view`
- Query params: `from_date` (required), `to_date` (required), `department_id` (optional)
- Returns all approved leaves within the date range

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "status_code": 400
}
```

| Code | Meaning                                                  |
| ---- | -------------------------------------------------------- |
| 400  | Bad request / validation error / business rule violation |
| 401  | Missing or invalid token / deactivated account           |
| 403  | Insufficient permissions                                 |
| 404  | Resource not found                                       |
| 409  | Conflict (duplicate email, name, etc.)                   |
| 500  | Internal server error                                    |

---

## Endpoint Count

| Service                    | Endpoints |
| -------------------------- | --------- |
| Auth — public/self-service | 8         |
| Auth — user management     | 7         |
| EMS — departments          | 7         |
| EMS — employee roles       | 7         |
| EMS — employees            | 10        |
| PMS — employee cache       | 2         |
| PMS — salary components    | 7         |
| PMS — adjustments          | 7         |
| PMS — payroll batches      | 7         |
| PMS — payslips             | 5         |
| LMS — employee cache       | 2         |
| LMS — leave policies       | 6         |
| LMS — leave balances       | 4         |
| LMS — leave requests       | 10        |
| **Total**                  | **89**    |

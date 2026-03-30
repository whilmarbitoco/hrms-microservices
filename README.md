# HRMS Microservices — Detailed Feature & API Reference

---

## Table of Contents

- [Employee Management Service (EMS)](#1-employee-management-service-ems)
- [Payroll Management Service (PMS)](#2-payroll-management-service-pms)
- [Leave Management Service (LMS)](#3-leave-management-service-lms)
- [RBAC Permissions Reference](#rbac-permissions-reference)
- [Event Reference](#event-reference)

---

## Roles

There are **4 roles** in the system. Each role is shared across all three services via a shared JWT secret — every service validates the token and checks permissions independently.

### `admin`
- Full access to everything across EMS, PMS, and LMS
- No restrictions, no policy-level blocks

### `hr_manager`
- **EMS** — everything: create, update, delete, terminate, rehire employees, manage departments and roles — except `employee_role.delete`
- **PMS** — read only: view payroll batches, view payslips, view salary components
- **LMS** — everything: submit, approve, reject, cancel leave requests, manage policies, adjust balances

### `payroll_officer`
- **EMS** — read only: view employees, view departments (needs this to resolve employee info)
- **PMS** — everything: create and process payroll batches, manage salary components, create adjustments, view payslips
- **LMS** — read only: view leave requests and balances (needs this to calculate unpaid leave deductions)

### `employee`
- **EMS** — view only, restricted to their own record via `EmployeePolicy`
- **PMS** — view only their own payslips, restricted via `PayslipPolicy`
- **LMS** — self-service only: submit their own leave requests, update/cancel their own pending requests, view their own balances — all restricted via `LeaveRequestPolicy` and `LeaveBalancePolicy`

---

# 1. Employee Management Service (EMS)

**Base URL:** `/employees`  
**Role:** Source of truth for employee identity and organizational structure.  
**Database:** `employee_db` (PostgreSQL)  
**Events Published:** `employee.created`, `employee.updated`, `employee.terminated`, `employee.rehired`  
**Events Consumed:** none

---

## Module: Employees

### Features

- Create a new employee with personal info, department, role, and manager assignment
- Full update of an employee record (all fields required)
- Partial update of an employee record (only provided fields updated)
- Soft delete an employee record
- Hire lifecycle action — sets status to `active`, records in `employee_history`
- Terminate lifecycle action — sets status to `terminated`, records termination reason and date in `employee_history`
- Rehire lifecycle action — sets status to `active`, records rehire date in `employee_history`
- View full audit/lifecycle history of an employee
- View organizational hierarchy — list all direct and indirect subordinates of a manager
- Search and filter employees by name, email, department, role, status, hire date range

### Endpoints

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/employees` | `employee.view` | List all employees. Supports query params: `name`, `email`, `department_id`, `role_id`, `status`, `hired_from`, `hired_to` |
| POST | `/employees` | `employee.create` | Create and hire a new employee. Generates `employee_id` (e.g. `EMP001`). Publishes `employee.created` |
| GET | `/employees/<id>` | `employee.view` | Get a single employee by ID with full details |
| PUT | `/employees/<id>` | `employee.update` | Full update — all fields must be provided. Publishes `employee.updated` |
| PATCH | `/employees/<id>` | `employee.update` | Partial update — only provided fields are updated. Publishes `employee.updated` |
| DELETE | `/employees/<id>` | `employee.delete` | Soft delete an employee record. Only allowed if status is `terminated` |
| POST | `/employees/<id>/terminate` | `employee.terminate` | Terminate an active employee. Requires `reason` in body. Sets status to `terminated`. Publishes `employee.terminated` |
| POST | `/employees/<id>/rehire` | `employee.rehire` | Rehire a terminated employee. Requires `department_id`, `role_id` in body. Sets status to `active`. Publishes `employee.rehired` |
| GET | `/employees/<id>/history` | `employee.view` | Get full lifecycle and audit history for an employee |
| GET | `/employees/<id>/subordinates` | `employee.view` | Get all direct and indirect subordinates of an employee (manager hierarchy) |

### Request / Response Shapes

**POST /employees body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@company.com",
  "phone": "+1234567890",
  "department_id": 1,
  "role_id": 2,
  "manager_id": 5,
  "hired_at": "2024-01-15"
}
```

**POST /employees/<id>/terminate body:**
```json
{
  "reason": "Voluntary resignation",
  "terminated_at": "2024-06-30"
}
```

**POST /employees/<id>/rehire body:**
```json
{
  "department_id": 1,
  "role_id": 2,
  "hired_at": "2024-09-01"
}
```

---

## Module: Departments

### Features

- Create a department with a name, description, and optional manager assignment
- Full update of a department record
- Partial update of a department record
- Delete a department — only allowed if no active employees are assigned to it
- List all employees belonging to a department

### Endpoints

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/departments` | `department.view` | List all departments |
| POST | `/departments` | `department.create` | Create a new department |
| GET | `/departments/<id>` | `department.view` | Get a single department by ID |
| PUT | `/departments/<id>` | `department.update` | Full update of a department |
| PATCH | `/departments/<id>` | `department.update` | Partial update of a department |
| DELETE | `/departments/<id>` | `department.delete` | Delete a department. Blocked if active employees exist in it |
| GET | `/departments/<id>/employees` | `department.view` | List all employees in a department |

### Request / Response Shapes

**POST /departments body:**
```json
{
  "name": "Engineering",
  "description": "Software engineering department",
  "manager_id": 5
}
```

---

## Module: Employee Roles

> Named `employee_roles` internally to avoid collision with the RBAC `roles` table.

### Features

- Create a role/position with a name, description, and seniority level
- Full update of a role
- Partial update of a role
- Delete a role — only allowed if no active employees are assigned to it
- List all employees holding a specific role

### Endpoints

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/employee-roles` | `employee_role.view` | List all employee roles/positions |
| POST | `/employee-roles` | `employee_role.create` | Create a new role/position |
| GET | `/employee-roles/<id>` | `employee_role.view` | Get a single role by ID |
| PUT | `/employee-roles/<id>` | `employee_role.update` | Full update of a role |
| PATCH | `/employee-roles/<id>` | `employee_role.update` | Partial update of a role |
| DELETE | `/employee-roles/<id>` | `employee_role.delete` | Delete a role. Blocked if active employees are assigned |
| GET | `/employee-roles/<id>/employees` | `employee_role.view` | List all employees with this role |

### Request / Response Shapes

**POST /employee-roles body:**
```json
{
  "name": "Backend Developer",
  "description": "Develops and maintains backend systems",
  "level": "mid"
}
```

---

## Database Tables (EMS)

| Table | Key Columns |
|-------|-------------|
| `employees` | `id`, `employee_id` (EMP001), `name`, `email`, `phone`, `department_id`, `role_id`, `manager_id`, `status` (active/terminated), `hired_at`, `terminated_at` |
| `departments` | `id`, `name`, `description`, `manager_id` |
| `employee_roles` | `id`, `name`, `description`, `level` |
| `employee_history` | `id`, `employee_id`, `action` (hired/updated/terminated/rehired), `changed_by`, `metadata` (JSON), `created_at` |
| `roles` | inherited from base-template (RBAC) |
| `permissions` | inherited from base-template (RBAC) |
| `role_permissions` | inherited from base-template (RBAC) |
| `users` | inherited from base-template (auth) |

---

---

# 2. Payroll Management Service (PMS)

**Base URL:** `/payroll`  
**Role:** Handles salary computation, payroll processing, and payslip generation.  
**Database:** `payroll_db` (PostgreSQL)  
**Events Published:** `payroll.processed`, `payslip.generated`  
**Events Consumed:** `employee.created`, `employee.updated`, `employee.terminated`, `leave.approved`

---

## Module: Employee Cache

### Features

- Read-only HTTP access to locally cached employee data
- Cache is written exclusively by the event consumer — never via HTTP
- Used internally by payroll and payslip modules to resolve employee info

### Endpoints

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/payroll/employees` | `payroll.view` | List all cached employees |
| GET | `/payroll/employees/<employee_id>` | `payroll.view` | Get a single cached employee record |

---

## Module: Salary Components

### Features

- Define salary components per employee: base salary, allowances, deductions
- Each component has a type, name, and fixed amount
- Multiple components can be assigned to a single employee
- Components are aggregated during payroll batch processing to compute gross and net pay
- Full and partial update support
- Delete only allowed if the component has not been included in a processed batch

### Endpoints

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/payroll/salary-components` | `salary_component.view` | List all salary components. Supports filter by `employee_id`, `type` |
| POST | `/payroll/salary-components` | `salary_component.create` | Create a salary component for an employee |
| GET | `/payroll/salary-components/<id>` | `salary_component.view` | Get a single salary component |
| PUT | `/payroll/salary-components/<id>` | `salary_component.update` | Full update of a salary component |
| PATCH | `/payroll/salary-components/<id>` | `salary_component.update` | Partial update (e.g. change amount only) |
| DELETE | `/payroll/salary-components/<id>` | `salary_component.delete` | Delete a component. Blocked if used in a processed batch |
| GET | `/payroll/salary-components/employee/<employee_id>` | `salary_component.view` | Get all salary components for a specific employee |

### Request / Response Shapes

**POST /payroll/salary-components body:**
```json
{
  "employee_id": "EMP001",
  "type": "allowance",
  "name": "Housing Allowance",
  "amount": 500.00
}
```

---

## Module: Adjustments

### Features

- Create one-time adjustments per employee per payroll cycle: bonuses, extra deductions, manual overrides
- Adjustments are linked to a specific payroll batch
- Full and partial update allowed only if the linked batch has not been processed
- Delete allowed only if the linked batch has not been processed
- Filter adjustments by employee or batch

### Endpoints

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/payroll/adjustments` | `adjustment.view` | List all adjustments. Supports filter by `employee_id`, `batch_id`, `type` |
| POST | `/payroll/adjustments` | `adjustment.create` | Create a manual adjustment |
| GET | `/payroll/adjustments/<id>` | `adjustment.view` | Get a single adjustment |
| PUT | `/payroll/adjustments/<id>` | `adjustment.update` | Full update. Blocked if batch is already processed |
| PATCH | `/payroll/adjustments/<id>` | `adjustment.update` | Partial update (e.g. change amount or reason). Blocked if batch is already processed |
| DELETE | `/payroll/adjustments/<id>` | `adjustment.delete` | Delete an adjustment. Blocked if batch is already processed |
| GET | `/payroll/adjustments/employee/<employee_id>` | `adjustment.view` | Get all adjustments for a specific employee |

### Request / Response Shapes

**POST /payroll/adjustments body:**
```json
{
  "employee_id": "EMP001",
  "batch_id": 3,
  "type": "bonus",
  "amount": 1000.00,
  "reason": "Q4 performance bonus"
}
```

---

## Module: Payroll Batches

### Features

- Create a payroll batch defining the cycle type and period dates
- Batch starts in `draft` status — components and adjustments can be modified
- Processing a batch computes salary for every active employee in the cache:
  - Aggregates all salary components (base + allowances − deductions)
  - Applies all adjustments for the period
  - Applies leave deductions from consumed `leave.approved` events
  - Generates one payslip per employee
  - Sets batch status to `processed`
- Full and partial update allowed only while batch is in `draft` status
- Delete allowed only while batch is in `draft` status
- Publishes `payroll.processed` after successful processing

### Endpoints

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/payroll/batches` | `payroll.view` | List all payroll batches. Supports filter by `status`, `cycle`, `period` |
| POST | `/payroll/batches` | `payroll.create` | Create a new payroll batch |
| GET | `/payroll/batches/<id>` | `payroll.view` | Get a single batch with summary (employee count, total gross, total net) |
| PUT | `/payroll/batches/<id>` | `payroll.create` | Full update of a batch. Blocked if status is not `draft` |
| PATCH | `/payroll/batches/<id>` | `payroll.create` | Partial update (e.g. change period dates). Blocked if status is not `draft` |
| DELETE | `/payroll/batches/<id>` | `payroll.create` | Delete a batch. Blocked if status is not `draft` |
| POST | `/payroll/batches/<id>/process` | `payroll.process` | Trigger salary computation. Generates payslips. Publishes `payroll.processed` |

### Request / Response Shapes

**POST /payroll/batches body:**
```json
{
  "name": "November 2024 Payroll",
  "cycle": "monthly",
  "period_start": "2024-11-01",
  "period_end": "2024-11-30"
}
```

---

## Module: Payslips

### Features

- Payslips are generated automatically when a batch is processed — not created via HTTP
- View all payslips, filter by employee or batch
- Employee role can only view their own payslips (enforced by `PayslipPolicy`)
- Mark a payslip as `sent` or `acknowledged`
- Publishes `payslip.generated` per payslip after batch processing

### Endpoints

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/payroll/payslips` | `payslip.view` | List all payslips. Supports filter by `batch_id`, `status` |
| GET | `/payroll/payslips/<id>` | `payslip.view` | Get a single payslip with full breakdown (gross, deductions, net) |
| GET | `/payroll/payslips/employee/<employee_id>` | `payslip.view` | Get all payslips for a specific employee. Employee role restricted to own records |
| GET | `/payroll/payslips/batch/<batch_id>` | `payslip.view` | Get all payslips in a batch |
| PATCH | `/payroll/payslips/<id>` | `payslip.view` | Mark payslip status as `sent` or `acknowledged` |

---

## Database Tables (PMS)

| Table | Key Columns |
|-------|-------------|
| `employee_cache` | `id`, `employee_id`, `name`, `department`, `role`, `status` (active/terminated), `synced_at` |
| `salary_components` | `id`, `employee_id`, `type` (base/allowance/deduction), `name`, `amount` |
| `adjustments` | `id`, `employee_id`, `batch_id`, `type` (bonus/deduction/override), `amount`, `reason`, `created_by` |
| `payroll_batches` | `id`, `name`, `cycle` (monthly/semi-monthly), `period_start`, `period_end`, `status` (draft/processing/processed), `created_by` |
| `payslips` | `id`, `batch_id`, `employee_id`, `gross`, `deductions`, `net`, `status` (generated/sent/acknowledged), `generated_at` |
| `processed_events` | `id`, `event_id` (UUID), `processed_at` — idempotency table |
| `roles` | inherited (RBAC) |
| `permissions` | inherited (RBAC) |
| `role_permissions` | inherited (RBAC) |
| `users` | inherited (auth) |

---

---

# 3. Leave Management Service (LMS)

**Base URL:** `/leave`  
**Role:** Manages employee leave requests, approvals, balances, and policies.  
**Database:** `leave_db` (PostgreSQL)  
**Events Published:** `leave.applied`, `leave.approved`, `leave.rejected`  
**Events Consumed:** `employee.created`, `employee.terminated`

---

## Module: Employee Cache

### Features

- Read-only HTTP access to locally cached employee data
- Cache is written exclusively by the event consumer — never via HTTP
- Used internally to validate employee existence and status before processing leave requests

### Endpoints

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/leave/employees` | `leave_request.view` | List all cached employees |
| GET | `/leave/employees/<employee_id>` | `leave_request.view` | Get a single cached employee record |

---

## Module: Leave Policies

### Features

- Define leave policy types: vacation, sick, unpaid, maternity, paternity, etc.
- Each policy defines max days per year, accrual rate, and accrual frequency (monthly/yearly)
- Full and partial update support
- Delete only allowed if no active leave balances are tied to the policy
- Policies are assigned to employees when their `employee.created` event is consumed — default policy is applied automatically

### Endpoints

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/leave/policies` | `leave_policy.view` | List all leave policies |
| POST | `/leave/policies` | `leave_policy.create` | Create a new leave policy |
| GET | `/leave/policies/<id>` | `leave_policy.view` | Get a single leave policy |
| PUT | `/leave/policies/<id>` | `leave_policy.update` | Full update of a leave policy |
| PATCH | `/leave/policies/<id>` | `leave_policy.update` | Partial update (e.g. change max days or accrual rate) |
| DELETE | `/leave/policies/<id>` | `leave_policy.delete` | Delete a policy. Blocked if active balances are tied to it |

### Request / Response Shapes

**POST /leave/policies body:**
```json
{
  "name": "Annual Vacation",
  "type": "vacation",
  "max_days": 15,
  "accrual_rate": 1.25,
  "accrual_frequency": "monthly"
}
```

---

## Module: Leave Balances

### Features

- Leave balances are initialized automatically when `employee.created` is consumed — one balance record per policy per employee
- Balance is decremented when a leave request is approved
- Balance is restored when an approved leave request is cancelled
- Manual admin adjustment of a balance (override)
- Trigger a manual accrual run for a specific employee or all employees (admin only — normally runs on schedule)
- Employee role can only view their own balances (enforced by `LeaveBalancePolicy`)

### Endpoints

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/leave/balances` | `leave_balance.view` | List all leave balances. Supports filter by `employee_id`, `policy_id` |
| GET | `/leave/balances/<employee_id>` | `leave_balance.view` | Get all balances for a specific employee across all policy types. Employee role restricted to own records |
| PATCH | `/leave/balances/<id>` | `leave_balance.adjust` | Manual admin adjustment of a balance (override). Requires `amount` and `reason` |
| POST | `/leave/balances/accrue` | `leave_balance.adjust` | Trigger a manual accrual run. Body can specify `employee_id` for single employee or leave empty for all |

### Request / Response Shapes

**PATCH /leave/balances/<id> body:**
```json
{
  "amount": 3.0,
  "reason": "Carry-over adjustment from previous year"
}
```

**POST /leave/balances/accrue body:**
```json
{
  "employee_id": "EMP001"
}
```

---

## Module: Leave Requests

### Features

- Submit a new leave request — validates employee exists and is active, validates sufficient balance for the requested policy type
- Full update of a pending request (employee can edit before it is reviewed)
- Partial update of a pending request (e.g. change dates or reason only)
- Delete a pending request that has not yet been reviewed
- Approve a pending request — decrements leave balance, publishes `leave.approved`
- Reject a pending request with a mandatory reason — publishes `leave.rejected`
- Cancel an approved or pending request — restores balance if approved, publishes `leave.applied` status update
- Team leave calendar — returns all approved leaves within a date range, grouped by employee
- Filter requests by employee, status, date range, policy type
- State machine enforcement: `pending → approved/rejected`, `approved → cancelled`, `pending → cancelled`
- Blocked entirely if employee status in cache is `terminated`

### Endpoints

| Method | Endpoint | Permission Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/leave/requests` | `leave_request.view` | List all leave requests. Supports filter by `employee_id`, `status`, `policy_id`, `from_date`, `to_date` |
| POST | `/leave/requests` | `leave_request.create` | Submit a new leave request. Validates balance. Publishes `leave.applied` |
| GET | `/leave/requests/<id>` | `leave_request.view` | Get a single leave request |
| PUT | `/leave/requests/<id>` | `leave_request.update` | Full update of a pending request. Blocked if status is not `pending` |
| PATCH | `/leave/requests/<id>` | `leave_request.update` | Partial update of a pending request (e.g. change dates). Blocked if status is not `pending` |
| DELETE | `/leave/requests/<id>` | `leave_request.delete` | Delete a pending request. Blocked if status is not `pending` |
| POST | `/leave/requests/<id>/approve` | `leave_request.approve` | Approve a pending request. Decrements balance. Publishes `leave.approved` |
| POST | `/leave/requests/<id>/reject` | `leave_request.reject` | Reject a pending request. Requires `reason` in body. Publishes `leave.rejected` |
| POST | `/leave/requests/<id>/cancel` | `leave_request.cancel` | Cancel a pending or approved request. Restores balance if approved |
| GET | `/leave/requests/calendar` | `leave_request.view` | Team leave calendar. Query params: `from_date`, `to_date`, `department_id` |

### Request / Response Shapes

**POST /leave/requests body:**
```json
{
  "employee_id": "EMP001",
  "policy_id": 1,
  "start_date": "2024-12-23",
  "end_date": "2024-12-27",
  "reason": "Family vacation"
}
```

**POST /leave/requests/<id>/reject body:**
```json
{
  "reason": "Critical project deadline during requested period"
}
```

---

## Database Tables (LMS)

| Table | Key Columns |
|-------|-------------|
| `employee_cache` | `id`, `employee_id`, `name`, `department`, `status` (active/terminated), `synced_at` |
| `leave_policies` | `id`, `name`, `type` (vacation/sick/unpaid/maternity/paternity), `max_days`, `accrual_rate`, `accrual_frequency` (monthly/yearly) |
| `leave_balances` | `id`, `employee_id`, `policy_id`, `balance`, `accrued_at` |
| `leave_requests` | `id`, `employee_id`, `policy_id`, `start_date`, `end_date`, `days`, `reason`, `status` (pending/approved/rejected/cancelled), `reviewed_by`, `reviewed_at` |
| `processed_events` | `id`, `event_id` (UUID), `processed_at` — idempotency table |
| `roles` | inherited (RBAC) |
| `permissions` | inherited (RBAC) |
| `role_permissions` | inherited (RBAC) |
| `users` | inherited (auth) |

---

---

# RBAC Permissions Reference

## EMS Permissions

| Permission | Description |
|------------|-------------|
| `employee.view` | View employee records |
| `employee.create` | Create and hire new employees |
| `employee.update` | Update employee records |
| `employee.delete` | Delete employee records |
| `employee.terminate` | Terminate an active employee |
| `employee.rehire` | Rehire a terminated employee |
| `department.view` | View departments |
| `department.create` | Create departments |
| `department.update` | Update departments |
| `department.delete` | Delete departments |
| `employee_role.view` | View employee roles/positions |
| `employee_role.create` | Create employee roles/positions |
| `employee_role.update` | Update employee roles/positions |
| `employee_role.delete` | Delete employee roles/positions |

## PMS Permissions

| Permission | Description |
|------------|-------------|
| `payroll.view` | View payroll batches and employee cache |
| `payroll.create` | Create and manage payroll batches |
| `payroll.process` | Trigger payroll batch processing |
| `payslip.view` | View payslips |
| `salary_component.view` | View salary components |
| `salary_component.create` | Create salary components |
| `salary_component.update` | Update salary components |
| `salary_component.delete` | Delete salary components |
| `adjustment.view` | View adjustments |
| `adjustment.create` | Create adjustments |
| `adjustment.update` | Update adjustments |
| `adjustment.delete` | Delete adjustments |

## LMS Permissions

| Permission | Description |
|------------|-------------|
| `leave_request.view` | View leave requests |
| `leave_request.create` | Submit leave requests |
| `leave_request.update` | Update pending leave requests |
| `leave_request.delete` | Delete pending leave requests |
| `leave_request.approve` | Approve leave requests |
| `leave_request.reject` | Reject leave requests |
| `leave_request.cancel` | Cancel leave requests |
| `leave_policy.view` | View leave policies |
| `leave_policy.create` | Create leave policies |
| `leave_policy.update` | Update leave policies |
| `leave_policy.delete` | Delete leave policies |
| `leave_balance.view` | View leave balances |
| `leave_balance.adjust` | Manually adjust leave balances |

## Suggested Role-Permission Matrix

| Role | EMS | PMS | LMS |
|------|-----|-----|-----|
| `admin` | all | all | all |
| `hr_manager` | all except `employee_role.delete` | `payroll.view`, `payslip.view`, `salary_component.view` | all |
| `payroll_officer` | `employee.view`, `department.view` | all | `leave_request.view`, `leave_balance.view` |
| `employee` | `employee.view` (own only via policy) | `payslip.view` (own only via policy) | `leave_request.create`, `leave_request.update`, `leave_request.cancel`, `leave_request.view`, `leave_balance.view` (own only via policy) |

---

---

# Event Reference

## Exchange

- Name: `hrms_exchange`
- Type: `topic`

## Events

| Routing Key | Published By | Consumed By | Trigger |
|-------------|-------------|-------------|---------|
| `employee.created` | EMS | PMS, LMS | New employee hired |
| `employee.updated` | EMS | PMS | Employee record updated |
| `employee.terminated` | EMS | PMS, LMS | Employee terminated |
| `employee.rehired` | EMS | PMS, LMS | Employee rehired |
| `leave.applied` | LMS | — | Leave request submitted |
| `leave.approved` | LMS | PMS | Leave request approved |
| `leave.rejected` | LMS | — | Leave request rejected |
| `payroll.processed` | PMS | — | Payroll batch processed |
| `payslip.generated` | PMS | — | Individual payslip generated |

## Event Payload Structure

All events follow this envelope:

```json
{
  "event_id": "uuid-v4",
  "event": "employee.created",
  "version": "v1",
  "timestamp": "2024-11-01T10:00:00Z",
  "data": {}
}
```

## Consumer Behavior (PMS & LMS)

| Event | PMS Action | LMS Action |
|-------|-----------|-----------|
| `employee.created` | Insert into `employee_cache`, initialize default salary components | Insert into `employee_cache`, initialize `leave_balances` from default policy |
| `employee.updated` | Update `employee_cache` record | — |
| `employee.terminated` | Update `employee_cache` status to `terminated`, block future payroll processing | Update `employee_cache` status to `terminated`, block future leave requests |
| `employee.rehired` | Update `employee_cache` status to `active` | Update `employee_cache` status to `active`, restore leave balances |
| `leave.approved` | Create deduction adjustment if leave type is unpaid | — |

---

## Endpoint Count Summary

| Service | Module | Endpoints |
|---------|--------|-----------|
| EMS | Employees | 10 |
| EMS | Departments | 7 |
| EMS | Employee Roles | 7 |
| **EMS Total** | | **24** |
| PMS | Employee Cache | 2 |
| PMS | Salary Components | 7 |
| PMS | Adjustments | 7 |
| PMS | Payroll Batches | 7 |
| PMS | Payslips | 5 |
| **PMS Total** | | **28** |
| LMS | Employee Cache | 2 |
| LMS | Leave Policies | 6 |
| LMS | Leave Balances | 4 |
| LMS | Leave Requests | 10 |
| **LMS Total** | | **22** |
| **Grand Total** | | **74** |

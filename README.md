# HRMS Microservices

> A production-grade, containerized, event-driven Human Resource Management System built with Flask microservices.

**Project Status - April 06, 2026**

You can read the API docs [here](ROUTES.md) or access the web app at [https://hrms.whilmarbitoco.qzz.io/](https://hrms.whilmarbitoco.qzz.io/).

---

## Accomplished Features

- **Auth Service** - register, login, refresh, logout, forgot/reset password, user management, role assignment, deactivate/reactivate accounts, JWT with embedded permissions and `employee_id`
- **Employee Management Service** - full CRUD for employees, departments, employee roles, lifecycle actions (hire, terminate, rehire), audit history, manager hierarchy/subordinates, search and filtering
- **Payroll Management Service** - salary components, payroll batch creation and processing, adjustments, payslip generation, and employee cache synchronization via events
- **Leave Management Service** - leave policies, leave balances with accrual, leave requests with full state transitions (`pending` to `approved`, `rejected`, or `cancelled`), team calendar, and employee cache synchronization via events
- **Frontend Web App** - Vite/React frontend integrated with the live API, role-aware dashboards for `admin`, `hr_manager`, and `employee`, employee self-service leave and payslips, and HR/admin management pages
- **RBAC** - JWT-embedded permissions, 3 seeded roles (`admin`, `hr_manager`, `employee`), and decentralized permission checks inside each microservice
- **Event-Driven Architecture** - RabbitMQ topic exchange (`hrms_exchange`), dead-letter queues, idempotency via `processed_events`, and exponential backoff retry
- **Containerized Deployment** - Docker Compose stack with frontend, 4 backend services, 4 PostgreSQL databases, RabbitMQ, NGINX, and a production frontend Docker image served by NGINX
- **Per-Service Migration + Seed Flow** - each microservice owns its own `seed.sql`; with `FORCE_MIGRATE=true`, startup wipes the owned schema, rebuilds tables, runs migrations/bootstrap creation, and seeds fresh data automatically
- **Integration Test Suite** - 89 endpoints exercised via real HTTP through NGINX (`tests/integration/runner.py`)
- **Unit Test Suites** - 141 pytest tests across all 4 backend services
- **Add Frontend** - Added a simple web app.

---

## In Progress

None.

---

## Known Bugs

None.

---

## Seeded Credentials

The auth seed creates these default users:

| Role       | Email                | Password        | Employee ID |
| ---------- | -------------------- | --------------- | ----------- |
| Admin      | `admin@hrms.com`     | `Admin@1234`    | `NULL`      |
| HR Manager | `hr@hrms.com`        | `Hr@1234`       | `EMP004`    |
| Employee   | `employee1@hrms.com` | `EmpOne@1234`   | `EMP001`    |
| Employee   | `employee2@hrms.com` | `EmpTwo@1234`   | `EMP002`    |
| Employee   | `employee3@hrms.com` | `EmpThree@1234` | `EMP003`    |

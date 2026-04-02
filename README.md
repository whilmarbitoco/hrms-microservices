# HRMS Microservices

> A production-grade, containerized, event-driven Human Resource Management System built with Flask microservices.

**Project Status — March 31, 2026**

You can read the api docs [here](ROUTES.md) or directly test the api here: `https://hrms-api.whilmarbitoco.qzz.io/`.

---

## Accomplished Features

- **Auth Service** — register, login, refresh, logout, forgot/reset password, user management, role assignment, deactivate/reactivate accounts, JWT with embedded permissions and `employee_id`
- **Employee Management Service** — full CRUD for employees, departments, employee roles, lifecycle actions (hire/terminate/rehire), audit history, manager hierarchy/subordinates, search and filtering
- **Payroll Management Service** — salary components, payroll batch creation and processing, adjustments, payslip generation, employee cache synced via events
- **Leave Management Service** — leave policies, leave balances with accrual, leave requests with full state machine (`pending` → `approved`/`rejected`/`cancelled`), team calendar, employee cache synced via events
- **RBAC** — JWT-embedded permissions, 4 roles, permissions checked locally per service without DB lookup
- **Event-driven architecture** — RabbitMQ topic exchange (`hrms_exchange`), DLQ, idempotency via `processed_events` table, exponential backoff retry
- **NGINX reverse proxy** — single entry point, routes to all 4 services
- **Docker Compose** — fully containerized, 4 services, 4 PostgreSQL databases, RabbitMQ, NGINX
- **Database seeder** — seeds auth-ms with all roles, permissions, and admin user, generates JWT token
- **Integration test suite** — 89 endpoints tested via real HTTP through NGINX (`tests/integration/runner.py`)
- **Unit test suites** — 141 tests passing across all 4 services (pytest)

---

## In Progress

- **UI** — frontend not yet started

---

## Known Bugs

None.

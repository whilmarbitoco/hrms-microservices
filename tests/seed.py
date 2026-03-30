"""
HRMS Seeder
-----------
Seeds roles, permissions, and an admin test user into all 3 service databases.
Generates and prints a JWT token for use with the HTTP tester.

Usage:
    docker compose run --rm employee-ms python -c "
        import sys; sys.path.insert(0, '.')
    "

Or run directly against each DB:
    python tests/seed.py

Requires the .env file at the project root with:
    JWT_SECRET_KEY=...
    (DB connection strings are read from env or defaults)
"""

import os
import sys
import uuid
import datetime
import psycopg2
import jwt
from dotenv import load_dotenv
from colorama import init, Fore, Style

init(autoreset=True, convert=True)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-to-a-strong-jwt-secret")

DATABASES = {
    "employee-ms": os.getenv(
        "EMPLOYEE_DB_URL", "postgresql://hrms:hrms_secret@localhost:5432/employee_db"
    ),
    "payroll-ms": os.getenv(
        "PAYROLL_DB_URL", "postgresql://hrms:hrms_secret@localhost:5432/payroll_db"
    ),
    "leave-ms": os.getenv(
        "LEAVE_DB_URL", "postgresql://hrms:hrms_secret@localhost:5432/leave_db"
    ),
}

print(f"{Fore.YELLOW}{'='*50}")
print("Database Connection Strings:")
for service, db_url in DATABASES.items():
    print(f"  {service}: {db_url}")
print(f"{'='*50}{Style.RESET_ALL}")

# ── Permissions per service ────────────────────────────────────────────────

EMS_PERMISSIONS = [
    ("employee.view", "View employee records"),
    ("employee.create", "Create employees"),
    ("employee.update", "Update employees"),
    ("employee.delete", "Delete employees"),
    ("employee.terminate", "Terminate employees"),
    ("employee.rehire", "Rehire employees"),
    ("department.view", "View departments"),
    ("department.create", "Create departments"),
    ("department.update", "Update departments"),
    ("department.delete", "Delete departments"),
    ("employee_role.view", "View employee roles"),
    ("employee_role.create", "Create employee roles"),
    ("employee_role.update", "Update employee roles"),
    ("employee_role.delete", "Delete employee roles"),
]

PMS_PERMISSIONS = [
    ("payroll.view", "View payroll"),
    ("payroll.create", "Create payroll batches"),
    ("payroll.process", "Process payroll batches"),
    ("payslip.view", "View payslips"),
    ("salary_component.view", "View salary components"),
    ("salary_component.create", "Create salary components"),
    ("salary_component.update", "Update salary components"),
    ("salary_component.delete", "Delete salary components"),
    ("adjustment.view", "View adjustments"),
    ("adjustment.create", "Create adjustments"),
    ("adjustment.update", "Update adjustments"),
    ("adjustment.delete", "Delete adjustments"),
]

LMS_PERMISSIONS = [
    ("leave_request.view", "View leave requests"),
    ("leave_request.create", "Create leave requests"),
    ("leave_request.update", "Update leave requests"),
    ("leave_request.delete", "Delete leave requests"),
    ("leave_request.approve", "Approve leave requests"),
    ("leave_request.reject", "Reject leave requests"),
    ("leave_request.cancel", "Cancel leave requests"),
    ("leave_policy.view", "View leave policies"),
    ("leave_policy.create", "Create leave policies"),
    ("leave_policy.update", "Update leave policies"),
    ("leave_policy.delete", "Delete leave policies"),
    ("leave_balance.view", "View leave balances"),
    ("leave_balance.adjust", "Adjust leave balances"),
]

SERVICE_PERMISSIONS = {
    "employee-ms": EMS_PERMISSIONS,
    "payroll-ms": PMS_PERMISSIONS,
    "leave-ms": LMS_PERMISSIONS,
}


def seed_service(service_name, db_url, permissions):
    print(f"\n{Fore.CYAN}Seeding {service_name}...{Style.RESET_ALL}")
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = False
        cur = conn.cursor()

        # Insert permissions
        permission_ids = []
        for name, description in permissions:
            cur.execute(
                "INSERT INTO permissions (name, description) VALUES (%s, %s) "
                "ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description "
                "RETURNING id",
                (name, description),
            )
            permission_ids.append(cur.fetchone()[0])

        # Insert admin role
        cur.execute(
            "INSERT INTO roles (name, description) VALUES (%s, %s) "
            "ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description "
            "RETURNING id",
            ("admin", "Full access to all resources"),
        )
        role_id = cur.fetchone()[0]

        # Link all permissions to admin role
        for perm_id in permission_ids:
            cur.execute(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES (%s, %s) "
                "ON CONFLICT DO NOTHING",
                (role_id, perm_id),
            )

        # Insert admin user
        cur.execute(
            "INSERT INTO users (name, email, role_id) VALUES (%s, %s, %s) "
            "ON CONFLICT (email) DO UPDATE SET role_id = EXCLUDED.role_id "
            "RETURNING id",
            ("HRMS Admin", "admin@hrms.com", role_id),
        )
        user_id = cur.fetchone()[0]

        conn.commit()
        cur.close()
        conn.close()

        print(f"{Fore.GREEN}  [OK] {len(permissions)} permissions seeded{Style.RESET_ALL}")
        print(f"{Fore.GREEN}  [OK] admin role seeded{Style.RESET_ALL}")
        print(f"{Fore.GREEN}  [OK] admin user seeded (id={user_id}){Style.RESET_ALL}")
        return user_id

    except Exception as e:
        print(f"{Fore.RED}  [FAIL] Failed to seed {service_name}: {e}{Style.RESET_ALL}")
        sys.exit(1)


def generate_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "fresh": False,
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "nbf": datetime.datetime.now(datetime.timezone.utc),
        "exp": datetime.datetime.now(datetime.timezone.utc)
        + datetime.timedelta(days=1),
        "jti": str(uuid.uuid4()),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")


def main():
    print(f"{Fore.YELLOW}{'='*50}")
    print("  HRMS Seeder")
    print(f"{'='*50}{Style.RESET_ALL}")

    user_ids = {}
    for service, db_url in DATABASES.items():
        permissions = SERVICE_PERMISSIONS[service]
        user_id = seed_service(service, db_url, permissions)
        user_ids[service] = user_id

    # All services share the same admin user id=1 in their own DBs
    # Generate token using EMS user id (all will be 1 on fresh DBs)
    token = generate_token(user_ids["employee-ms"])

    print(f"\n{Fore.YELLOW}{'='*50}")
    print("  Seeding Complete")
    print(f"{'='*50}{Style.RESET_ALL}")
    print(f"\n{Fore.GREEN}JWT Token (valid 24h):{Style.RESET_ALL}")
    print(f"\n{token}\n")
    print(
        f"{Fore.CYAN}Set this in your environment before running the HTTP tester:{Style.RESET_ALL}"
    )
    print(f'  export HRMS_TOKEN="{token}"')
    print(f"  python tests/http/runner.py\n")


if __name__ == "__main__":
    main()

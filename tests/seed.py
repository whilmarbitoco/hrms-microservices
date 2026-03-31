"""
HRMS Seeder
-----------
Seeds the auth-ms database with roles, permissions, and an admin user.
Generates a JWT token for use with the HTTP tester and Postman.

Usage:
    python tests/seed.py

Requires the .env file at the project root with:
    JWT_SECRET_KEY=...
    AUTH_DB_URL=postgresql://hrms:hrms_secret@localhost:5436/auth_db
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

AUTH_DB_URL = os.getenv("AUTH_DB_URL", "postgresql://hrms:hrms_secret@localhost:5436/auth_db")

# ── All permissions across all services ───────────────────────────────────────

ALL_PERMISSIONS = [
    # EMS
    ("employee.view",        "View employee records"),
    ("employee.create",      "Create employees"),
    ("employee.update",      "Update employees"),
    ("employee.delete",      "Delete employees"),
    ("employee.terminate",   "Terminate employees"),
    ("employee.rehire",      "Rehire employees"),
    ("department.view",      "View departments"),
    ("department.create",    "Create departments"),
    ("department.update",    "Update departments"),
    ("department.delete",    "Delete departments"),
    ("employee_role.view",   "View employee roles"),
    ("employee_role.create", "Create employee roles"),
    ("employee_role.update", "Update employee roles"),
    ("employee_role.delete", "Delete employee roles"),
    # PMS
    ("payroll.view",              "View payroll"),
    ("payroll.create",            "Create payroll batches"),
    ("payroll.process",           "Process payroll batches"),
    ("payslip.view",              "View payslips"),
    ("salary_component.view",     "View salary components"),
    ("salary_component.create",   "Create salary components"),
    ("salary_component.update",   "Update salary components"),
    ("salary_component.delete",   "Delete salary components"),
    ("adjustment.view",           "View adjustments"),
    ("adjustment.create",         "Create adjustments"),
    ("adjustment.update",         "Update adjustments"),
    ("adjustment.delete",         "Delete adjustments"),
    # LMS
    ("leave_request.view",    "View leave requests"),
    ("leave_request.create",  "Create leave requests"),
    ("leave_request.update",  "Update leave requests"),
    ("leave_request.delete",  "Delete leave requests"),
    ("leave_request.approve", "Approve leave requests"),
    ("leave_request.reject",  "Reject leave requests"),
    ("leave_request.cancel",  "Cancel leave requests"),
    ("leave_policy.view",     "View leave policies"),
    ("leave_policy.create",   "Create leave policies"),
    ("leave_policy.update",   "Update leave policies"),
    ("leave_policy.delete",   "Delete leave policies"),
    ("leave_balance.view",    "View leave balances"),
    ("leave_balance.adjust",  "Adjust leave balances"),
    # Auth
    ("user.view",           "View users"),
    ("user.create",         "Create users"),
    ("user.assign_role",    "Assign roles to users"),
    ("user.deactivate",     "Deactivate users"),
    ("user.reactivate",     "Reactivate users"),
    ("user.reset_password", "Reset user passwords"),
]

ROLES = {
    "admin": ALL_PERMISSIONS,
    "hr_manager": [
        "employee.view", "employee.create", "employee.update", "employee.delete",
        "employee.terminate", "employee.rehire",
        "department.view", "department.create", "department.update", "department.delete",
        "employee_role.view", "employee_role.create", "employee_role.update",
        "payroll.view", "payslip.view", "salary_component.view",
        "leave_request.view", "leave_request.create", "leave_request.update",
        "leave_request.delete", "leave_request.approve", "leave_request.reject",
        "leave_request.cancel", "leave_policy.view", "leave_policy.create",
        "leave_policy.update", "leave_policy.delete", "leave_balance.view", "leave_balance.adjust",
        "user.view", "user.create", "user.deactivate", "user.reactivate", "user.reset_password",
    ],
    "payroll_officer": [
        "employee.view", "department.view",
        "payroll.view", "payroll.create", "payroll.process", "payslip.view",
        "salary_component.view", "salary_component.create", "salary_component.update", "salary_component.delete",
        "adjustment.view", "adjustment.create", "adjustment.update", "adjustment.delete",
        "leave_request.view", "leave_balance.view",
    ],
    "employee": [
        "employee.view",
        "payslip.view",
        "leave_request.view", "leave_request.create", "leave_request.update",
        "leave_request.cancel", "leave_balance.view",
    ],
}


def seed():
    print(f"\n{Fore.YELLOW}{'='*50}")
    print("  HRMS Seeder")
    print(f"{'='*50}{Style.RESET_ALL}")
    print(f"\n{Fore.CYAN}Connecting to auth-db: {AUTH_DB_URL}{Style.RESET_ALL}")

    try:
        conn = psycopg2.connect(AUTH_DB_URL)
        conn.autocommit = False
        cur = conn.cursor()

        # Insert all permissions
        print(f"\n{Fore.CYAN}Seeding permissions...{Style.RESET_ALL}")
        perm_ids = {}
        for name, description in ALL_PERMISSIONS:
            cur.execute(
                "INSERT INTO permissions (name, description) VALUES (%s, %s) "
                "ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id",
                (name, description),
            )
            perm_ids[name] = cur.fetchone()[0]
        print(f"{Fore.GREEN}  [OK] {len(ALL_PERMISSIONS)} permissions seeded{Style.RESET_ALL}")

        # Insert roles with their permissions
        print(f"\n{Fore.CYAN}Seeding roles...{Style.RESET_ALL}")
        role_ids = {}
        for role_name, role_perms in ROLES.items():
            cur.execute(
                "INSERT INTO roles (name, description) VALUES (%s, %s) "
                "ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id",
                (role_name, f"{role_name} role"),
            )
            role_id = cur.fetchone()[0]
            role_ids[role_name] = role_id

            # Clear existing role permissions and re-assign
            cur.execute("DELETE FROM role_permissions WHERE role_id = %s", (role_id,))
            for perm_name in role_perms:
                if perm_name in perm_ids:
                    cur.execute(
                        "INSERT INTO role_permissions (role_id, permission_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                        (role_id, perm_ids[perm_name]),
                    )
            print(f"{Fore.GREEN}  [OK] {role_name} ({len(role_perms)} permissions){Style.RESET_ALL}")

        # Insert admin user
        print(f"\n{Fore.CYAN}Seeding admin user...{Style.RESET_ALL}")
        from werkzeug.security import generate_password_hash
        cur.execute(
            "INSERT INTO users (name, email, password_hash, is_active, role_id) "
            "VALUES (%s, %s, %s, %s, %s) "
            "ON CONFLICT (email) DO UPDATE SET role_id = EXCLUDED.role_id, is_active = true RETURNING id",
            ("HRMS Admin", "admin@hrms.com", generate_password_hash("Admin@1234"), True, role_ids["admin"]),
        )
        user_id = cur.fetchone()[0]
        print(f"{Fore.GREEN}  [OK] admin@hrms.com seeded (id={user_id}){Style.RESET_ALL}")

        conn.commit()
        cur.close()
        conn.close()

    except Exception as e:
        print(f"{Fore.RED}  [FAIL] {e}{Style.RESET_ALL}")
        sys.exit(1)

    # Generate token
    token = generate_token(user_id, "admin", list(perm_ids.keys()))

    print(f"\n{Fore.YELLOW}{'='*50}")
    print("  Seeding Complete")
    print(f"{'='*50}{Style.RESET_ALL}")
    print(f"\n{Fore.GREEN}Admin credentials:{Style.RESET_ALL}")
    print(f"  Email:    admin@hrms.com")
    print(f"  Password: Admin@1234")
    print(f"\n{Fore.GREEN}JWT Token (valid 24h):{Style.RESET_ALL}")
    print(f"\n{token}\n")
    print(f"{Fore.CYAN}Set this before running the HTTP tester:{Style.RESET_ALL}")
    print(f"  set HRMS_TOKEN={token}")
    print(f"  python -m tests.integration.runner\n")


def generate_token(user_id: int, role: str, permissions: list) -> str:
    payload = {
        "sub": str(user_id),
        "fresh": False,
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "nbf": datetime.datetime.now(datetime.timezone.utc),
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1),
        "jti": str(uuid.uuid4()),
        "type": "access",
        "email": "admin@hrms.com",
        "role": role,
        "employee_id": None,
        "is_active": True,
        "permissions": permissions,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")


if __name__ == "__main__":
    seed()

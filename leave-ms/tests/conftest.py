import pytest
import os

os.environ["FLASK_ENV"] = "testing"

from app import create_app
from app.extensions import db as _db
from app.database.schema import User, Role, Permission, EmployeeCache, LeavePolicy, LeaveBalance
from flask_jwt_extended import create_access_token

LMS_PERMISSIONS = [
    "leave_request.view", "leave_request.create", "leave_request.update",
    "leave_request.delete", "leave_request.approve", "leave_request.reject",
    "leave_request.cancel",
    "leave_policy.view", "leave_policy.create", "leave_policy.update", "leave_policy.delete",
    "leave_balance.view", "leave_balance.adjust",
]


@pytest.fixture(scope="session")
def app():
    app = create_app()
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture(scope="session")
def client(app):
    return app.test_client()


@pytest.fixture(scope="session")
def auth_headers(app):
    with app.app_context():
        permissions = [Permission(name=p, description=p) for p in LMS_PERMISSIONS]
        _db.session.add_all(permissions)
        _db.session.flush()

        role = Role(name="admin", description="Full access", permissions=permissions)
        _db.session.add(role)
        _db.session.flush()

        user = User(name="Admin User", email="admin@lms.com", role=role)
        _db.session.add(user)
        _db.session.flush()

        emp = EmployeeCache(employee_id="EMP001", name="John Doe",
                            department="Engineering", status="active")
        _db.session.add(emp)
        _db.session.flush()

        policy = LeavePolicy(name="Annual Vacation", type="vacation",
                             max_days=15, accrual_rate=1.25, accrual_frequency="monthly")
        _db.session.add(policy)
        _db.session.flush()

        balance = LeaveBalance(employee_id="EMP001", policy_id=policy.id, balance=15)
        _db.session.add(balance)
        _db.session.commit()

        token = create_access_token(identity=str(user.id))
        return {"Authorization": f"Bearer {token}"}

import pytest
import os

os.environ["FLASK_ENV"] = "testing"

from app import create_app
from app.extensions import db as _db
from app.database.schema import User, Role, Permission, EmployeeCache
from flask_jwt_extended import create_access_token

PMS_PERMISSIONS = [
    "payroll.view", "payroll.create", "payroll.process",
    "payslip.view",
    "salary_component.view", "salary_component.create", "salary_component.update", "salary_component.delete",
    "adjustment.view", "adjustment.create", "adjustment.update", "adjustment.delete",
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
        permissions = [Permission(name=p, description=p) for p in PMS_PERMISSIONS]
        _db.session.add_all(permissions)
        _db.session.flush()

        role = Role(name="admin", description="Full access", permissions=permissions)
        _db.session.add(role)
        _db.session.flush()

        user = User(name="Admin User", email="admin@pms.com", role=role)
        _db.session.add(user)
        _db.session.flush()

        # seed an employee in cache for payroll processing tests
        emp = EmployeeCache(employee_id="EMP001", name="John Doe",
                            department="Engineering", role="Backend Developer", status="active")
        _db.session.add(emp)
        _db.session.commit()

        token = create_access_token(identity=str(user.id))
        return {"Authorization": f"Bearer {token}"}

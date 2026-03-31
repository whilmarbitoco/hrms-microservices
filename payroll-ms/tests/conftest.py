import pytest
import os

os.environ["FLASK_ENV"] = "testing"

from app import create_app
from app.extensions import db as _db
from app.database.schema import EmployeeCache
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
        emp = EmployeeCache(employee_id="EMP001", name="John Doe",
                            department="Engineering", role="Backend Developer", status="active")
        _db.session.add(emp)
        _db.session.commit()
        yield app
        _db.drop_all()


@pytest.fixture(scope="session")
def client(app):
    return app.test_client()


@pytest.fixture(scope="session")
def auth_headers(app):
    with app.app_context():
        token = create_access_token(
            identity="1",
            additional_claims={
                "email": "admin@pms.com",
                "role": "admin",
                "employee_id": None,
                "is_active": True,
                "permissions": PMS_PERMISSIONS,
            }
        )
        return {"Authorization": f"Bearer {token}"}

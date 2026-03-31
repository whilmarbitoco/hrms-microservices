import pytest
import os

os.environ["FLASK_ENV"] = "testing"

from app import create_app
from app.extensions import db as _db
from flask_jwt_extended import create_access_token

EMS_PERMISSIONS = [
    "employee.view", "employee.create", "employee.update", "employee.delete",
    "employee.terminate", "employee.rehire",
    "department.view", "department.create", "department.update", "department.delete",
    "employee_role.view", "employee_role.create", "employee_role.update", "employee_role.delete",
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
        token = create_access_token(
            identity="1",
            additional_claims={
                "email": "admin@ems.com",
                "role": "admin",
                "employee_id": None,
                "is_active": True,
                "permissions": EMS_PERMISSIONS,
            }
        )
        return {"Authorization": f"Bearer {token}"}

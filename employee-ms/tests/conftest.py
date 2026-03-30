import pytest
import os

os.environ["FLASK_ENV"] = "testing"

from app import create_app
from app.extensions import db as _db
from app.database.schema import User, Role, Permission
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
        permissions = [Permission(name=p, description=p) for p in EMS_PERMISSIONS]
        _db.session.add_all(permissions)
        _db.session.flush()

        role = Role(name="admin", description="Full access", permissions=permissions)
        _db.session.add(role)
        _db.session.flush()

        user = User(name="Admin User", email="admin@ems.com", role=role)
        _db.session.add(user)
        _db.session.commit()

        token = create_access_token(identity=str(user.id))
        return {"Authorization": f"Bearer {token}"}

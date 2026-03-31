import pytest
import os

os.environ["FLASK_ENV"] = "testing"

from app import create_app
from app.extensions import db as _db
from app.database.schema import User, Role, Permission


@pytest.fixture(scope="session")
def app():
    app = create_app()
    with app.app_context():
        _db.create_all()

        # Seed roles and permissions
        perms = [
            Permission(name="user.view"), Permission(name="user.create"),
            Permission(name="user.assign_role"), Permission(name="user.deactivate"),
            Permission(name="user.reactivate"), Permission(name="user.reset_password"),
        ]
        _db.session.add_all(perms)
        _db.session.flush()

        admin_role = Role(name="admin", description="Full access", permissions=perms)
        hr_role = Role(name="hr_manager", description="HR access", permissions=perms[:5])
        _db.session.add_all([admin_role, hr_role])
        _db.session.commit()

        yield app
        _db.drop_all()


@pytest.fixture(scope="session")
def client(app):
    return app.test_client()


@pytest.fixture(scope="session")
def admin_headers(app, client):
    with app.app_context():
        from werkzeug.security import generate_password_hash
        from app.database.schema import Role
        role = _db.session.execute(
            _db.select(Role).where(Role.name == "admin")
        ).unique().scalar_one()
        user = User(
            name="Admin", email="admin@auth.com",
            password_hash=generate_password_hash("adminpass123"),
            role=role, is_active=True
        )
        _db.session.add(user)
        _db.session.commit()

    res = client.post("/auth/login", json={"email": "admin@auth.com", "password": "adminpass123"})
    token = res.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

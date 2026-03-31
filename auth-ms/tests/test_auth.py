import pytest

BASE = "/auth"
state = {}


# ── Register ──────────────────────────────────────────────────────────────────

def test_register_success(client):
    res = client.post(f"{BASE}/register", json={
        "email": "newuser@auth.com", "name": "New User", "password": "password123"
    })
    assert res.status_code == 201
    assert "user_id" in res.get_json()


def test_register_duplicate_email(client):
    client.post(f"{BASE}/register", json={"email": "dup@auth.com", "name": "Dup", "password": "password123"})
    res = client.post(f"{BASE}/register", json={"email": "dup@auth.com", "name": "Dup2", "password": "password123"})
    assert res.status_code == 409


def test_register_weak_password(client):
    res = client.post(f"{BASE}/register", json={"email": "weak@auth.com", "name": "Weak", "password": "short"})
    assert res.status_code == 400


def test_register_invalid_email(client):
    res = client.post(f"{BASE}/register", json={"email": "not-an-email", "name": "Bad", "password": "password123"})
    assert res.status_code == 400


# ── Login ─────────────────────────────────────────────────────────────────────

def test_login_success(client):
    client.post(f"{BASE}/register", json={"email": "login@auth.com", "name": "Login User", "password": "password123"})
    res = client.post(f"{BASE}/login", json={"email": "login@auth.com", "password": "password123"})
    assert res.status_code == 200
    data = res.get_json()
    assert "access_token" in data
    assert "user" in data
    state["token"] = data["access_token"]


def test_login_wrong_password(client):
    res = client.post(f"{BASE}/login", json={"email": "login@auth.com", "password": "wrongpass"})
    assert res.status_code == 401


def test_login_unknown_email(client):
    res = client.post(f"{BASE}/login", json={"email": "nobody@auth.com", "password": "password123"})
    assert res.status_code == 401


# ── Me ────────────────────────────────────────────────────────────────────────

def test_me_requires_auth(client):
    assert client.get(f"{BASE}/me").status_code == 401


def test_me_success(client):
    headers = {"Authorization": f"Bearer {state['token']}"}
    res = client.get(f"{BASE}/me", headers=headers)
    assert res.status_code == 200
    assert res.get_json()["email"] == "login@auth.com"


# ── Change Password ───────────────────────────────────────────────────────────

def test_change_password_success(client):
    headers = {"Authorization": f"Bearer {state['token']}"}
    res = client.patch(f"{BASE}/me/password", json={
        "current_password": "password123", "new_password": "newpassword123"
    }, headers=headers)
    assert res.status_code == 200


def test_change_password_wrong_current(client):
    headers = {"Authorization": f"Bearer {state['token']}"}
    res = client.patch(f"{BASE}/me/password", json={
        "current_password": "wrongpass", "new_password": "newpassword123"
    }, headers=headers)
    assert res.status_code == 401


# ── Forgot / Reset Password ───────────────────────────────────────────────────

def test_forgot_password(client):
    res = client.post(f"{BASE}/forgot-password", json={"email": "login@auth.com"})
    assert res.status_code == 200
    data = res.get_json()
    assert "reset_token" in data
    state["reset_token"] = data["reset_token"]


def test_forgot_password_unknown_email(client):
    res = client.post(f"{BASE}/forgot-password", json={"email": "nobody@auth.com"})
    assert res.status_code == 200  # silent — no reveal


def test_reset_password_success(client):
    res = client.post(f"{BASE}/reset-password", json={
        "token": state["reset_token"], "new_password": "resetpassword123"
    })
    assert res.status_code == 200


def test_reset_password_invalid_token(client):
    res = client.post(f"{BASE}/reset-password", json={
        "token": "invalidtoken", "new_password": "resetpassword123"
    })
    assert res.status_code == 400


# ── Refresh ───────────────────────────────────────────────────────────────────

def test_refresh_requires_refresh_token(client):
    # Access token should not work for refresh
    headers = {"Authorization": f"Bearer {state['token']}"}
    res = client.post(f"{BASE}/refresh", headers=headers)
    assert res.status_code == 422


# ── User Management ───────────────────────────────────────────────────────────

def test_users_requires_auth(client):
    assert client.get(f"{BASE}/users").status_code == 401


def test_users_list(client, admin_headers):
    res = client.get(f"{BASE}/users", headers=admin_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_users_create(client, admin_headers):
    res = client.post(f"{BASE}/users", json={
        "email": "created@auth.com", "name": "Created User", "password": "password123"
    }, headers=admin_headers)
    assert res.status_code == 201
    state["created_user_id"] = res.get_json()["id"]


def test_users_get(client, admin_headers):
    res = client.get(f"{BASE}/users/{state['created_user_id']}", headers=admin_headers)
    assert res.status_code == 200


def test_users_assign_role(client, admin_headers, app):
    with app.app_context():
        from app.database.schema import Role
        from app.extensions import db
        role = db.session.execute(db.select(Role).where(Role.name == "hr_manager")).unique().scalar_one()
        role_id = role.id
    res = client.patch(f"{BASE}/users/{state['created_user_id']}/role",
                       json={"role_id": role_id}, headers=admin_headers)
    assert res.status_code == 200


def test_users_deactivate(client, admin_headers):
    res = client.patch(f"{BASE}/users/{state['created_user_id']}/deactivate", headers=admin_headers)
    assert res.status_code == 200
    assert res.get_json()["is_active"] is False


def test_users_reactivate(client, admin_headers):
    res = client.patch(f"{BASE}/users/{state['created_user_id']}/reactivate", headers=admin_headers)
    assert res.status_code == 200
    assert res.get_json()["is_active"] is True


def test_users_reset_password(client, admin_headers):
    res = client.post(f"{BASE}/users/{state['created_user_id']}/reset-password",
                      json={"new_password": "adminreset123"}, headers=admin_headers)
    assert res.status_code == 200


def test_deactivated_user_cannot_login(client, admin_headers):
    # Create and deactivate a user
    client.post(f"{BASE}/users", json={
        "email": "inactive@auth.com", "name": "Inactive", "password": "password123"
    }, headers=admin_headers)
    user_id = client.get(f"{BASE}/users", headers=admin_headers).get_json()
    inactive = next(u for u in user_id if u["email"] == "inactive@auth.com")
    client.patch(f"{BASE}/users/{inactive['id']}/deactivate", headers=admin_headers)
    res = client.post(f"{BASE}/login", json={"email": "inactive@auth.com", "password": "password123"})
    assert res.status_code == 401


def test_users_not_found(client, admin_headers):
    assert client.get(f"{BASE}/users/999999", headers=admin_headers).status_code == 404

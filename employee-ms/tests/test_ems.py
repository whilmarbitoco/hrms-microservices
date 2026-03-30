import pytest

# ── Departments ──────────────────────────────────────────────────────────────

DEPT = "/departments"
DEPT_PAYLOAD = {"name": "Engineering", "description": "Eng dept"}


def test_dept_requires_auth(client):
    assert client.get(DEPT).status_code == 401


def test_dept_create(client, auth_headers):
    res = client.post(DEPT, json=DEPT_PAYLOAD, headers=auth_headers)
    assert res.status_code == 201
    assert res.get_json()["name"] == "Engineering"


def test_dept_list(client, auth_headers):
    res = client.get(DEPT, headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_dept_get(client, auth_headers):
    created = client.post(DEPT, json={"name": "HR", "description": "HR dept"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.get(f"{DEPT}/{id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["id"] == id


def test_dept_put(client, auth_headers):
    created = client.post(DEPT, json={"name": "Finance", "description": "Fin"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.put(f"{DEPT}/{id}", json={"name": "Finance Updated", "description": "Updated", "manager_id": None}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["name"] == "Finance Updated"


def test_dept_patch(client, auth_headers):
    created = client.post(DEPT, json={"name": "Legal", "description": "Legal"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.patch(f"{DEPT}/{id}", json={"description": "Legal and Compliance"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["description"] == "Legal and Compliance"


def test_dept_delete(client, auth_headers):
    created = client.post(DEPT, json={"name": "Temp Dept", "description": "temp"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.delete(f"{DEPT}/{id}", headers=auth_headers)
    assert res.status_code == 200


def test_dept_not_found(client, auth_headers):
    assert client.get(f"{DEPT}/999999", headers=auth_headers).status_code == 404


def test_dept_duplicate_name(client, auth_headers):
    client.post(DEPT, json={"name": "Duplicate", "description": "d"}, headers=auth_headers)
    res = client.post(DEPT, json={"name": "Duplicate", "description": "d"}, headers=auth_headers)
    assert res.status_code == 409


# ── Employee Roles ────────────────────────────────────────────────────────────

EROLE = "/employee-roles"
EROLE_PAYLOAD = {"name": "Backend Developer", "description": "Backend dev", "level": "mid"}


def test_erole_requires_auth(client):
    assert client.get(EROLE).status_code == 401


def test_erole_create(client, auth_headers):
    res = client.post(EROLE, json=EROLE_PAYLOAD, headers=auth_headers)
    assert res.status_code == 201
    assert res.get_json()["name"] == "Backend Developer"


def test_erole_list(client, auth_headers):
    res = client.get(EROLE, headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_erole_get(client, auth_headers):
    created = client.post(EROLE, json={"name": "Frontend Dev", "level": "junior"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.get(f"{EROLE}/{id}", headers=auth_headers)
    assert res.status_code == 200


def test_erole_put(client, auth_headers):
    created = client.post(EROLE, json={"name": "DevOps", "level": "senior"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.put(f"{EROLE}/{id}", json={"name": "DevOps Engineer", "description": "Infra", "level": "senior"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["name"] == "DevOps Engineer"


def test_erole_patch(client, auth_headers):
    created = client.post(EROLE, json={"name": "QA Engineer", "level": "mid"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.patch(f"{EROLE}/{id}", json={"level": "senior"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["level"] == "senior"


def test_erole_delete(client, auth_headers):
    created = client.post(EROLE, json={"name": "Temp Role", "level": "junior"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.delete(f"{EROLE}/{id}", headers=auth_headers)
    assert res.status_code == 200


def test_erole_not_found(client, auth_headers):
    assert client.get(f"{EROLE}/999999", headers=auth_headers).status_code == 404


def test_erole_invalid_level(client, auth_headers):
    res = client.post(EROLE, json={"name": "Bad Level", "level": "god"}, headers=auth_headers)
    assert res.status_code == 400


# ── Employees ─────────────────────────────────────────────────────────────────

EMP = "/employees"


def _create_employee(client, auth_headers, name="John Doe", email="john@ems.com"):
    return client.post(EMP, json={"name": name, "email": email}, headers=auth_headers)


def test_emp_requires_auth(client):
    assert client.get(EMP).status_code == 401


def test_emp_create(client, auth_headers):
    res = _create_employee(client, auth_headers)
    assert res.status_code == 201
    data = res.get_json()
    assert data["employee_id"].startswith("EMP")
    assert data["status"] == "active"


def test_emp_list(client, auth_headers):
    res = client.get(EMP, headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_emp_get(client, auth_headers):
    created = _create_employee(client, auth_headers, "Jane Doe", "jane@ems.com")
    id = created.get_json()["id"]
    res = client.get(f"{EMP}/{id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["id"] == id


def test_emp_put(client, auth_headers):
    created = _create_employee(client, auth_headers, "Put User", "put@ems.com")
    id = created.get_json()["id"]
    res = client.put(f"{EMP}/{id}", json={
        "name": "Put Updated", "email": "put@ems.com",
        "phone": None, "department_id": None, "role_id": None,
        "manager_id": None, "hired_at": None,
    }, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["name"] == "Put Updated"


def test_emp_patch(client, auth_headers):
    created = _create_employee(client, auth_headers, "Patch User", "patch@ems.com")
    id = created.get_json()["id"]
    res = client.patch(f"{EMP}/{id}", json={"phone": "+1234567890"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["phone"] == "+1234567890"


def test_emp_terminate(client, auth_headers):
    created = _create_employee(client, auth_headers, "Term User", "term@ems.com")
    id = created.get_json()["id"]
    res = client.post(f"{EMP}/{id}/terminate", json={"reason": "Resigned"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["status"] == "terminated"


def test_emp_rehire(client, auth_headers):
    created = _create_employee(client, auth_headers, "Rehire User", "rehire@ems.com")
    id = created.get_json()["id"]
    client.post(f"{EMP}/{id}/terminate", json={"reason": "Resigned"}, headers=auth_headers)
    res = client.post(f"{EMP}/{id}/rehire", json={"department_id": None, "role_id": None}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["status"] == "active"


def test_emp_delete_only_terminated(client, auth_headers):
    created = _create_employee(client, auth_headers, "Del Active", "delactive@ems.com")
    id = created.get_json()["id"]
    res = client.delete(f"{EMP}/{id}", headers=auth_headers)
    assert res.status_code == 400


def test_emp_delete_terminated(client, auth_headers):
    created = _create_employee(client, auth_headers, "Del Term", "delterm@ems.com")
    id = created.get_json()["id"]
    client.post(f"{EMP}/{id}/terminate", json={"reason": "End of contract"}, headers=auth_headers)
    res = client.delete(f"{EMP}/{id}", headers=auth_headers)
    assert res.status_code == 200


def test_emp_history(client, auth_headers):
    created = _create_employee(client, auth_headers, "History User", "history@ems.com")
    id = created.get_json()["id"]
    res = client.get(f"{EMP}/{id}/history", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)
    assert len(res.get_json()) >= 1


def test_emp_subordinates(client, auth_headers):
    created = _create_employee(client, auth_headers, "Manager", "manager@ems.com")
    id = created.get_json()["id"]
    res = client.get(f"{EMP}/{id}/subordinates", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_emp_not_found(client, auth_headers):
    assert client.get(f"{EMP}/999999", headers=auth_headers).status_code == 404


def test_emp_duplicate_email(client, auth_headers):
    _create_employee(client, auth_headers, "Dup1", "dup@ems.com")
    res = _create_employee(client, auth_headers, "Dup2", "dup@ems.com")
    assert res.status_code == 409


def test_emp_terminate_already_terminated(client, auth_headers):
    created = _create_employee(client, auth_headers, "Double Term", "dterm@ems.com")
    id = created.get_json()["id"]
    client.post(f"{EMP}/{id}/terminate", json={"reason": "First"}, headers=auth_headers)
    res = client.post(f"{EMP}/{id}/terminate", json={"reason": "Second"}, headers=auth_headers)
    assert res.status_code == 400


def test_emp_rehire_active_fails(client, auth_headers):
    created = _create_employee(client, auth_headers, "Active Rehire", "activerehire@ems.com")
    id = created.get_json()["id"]
    res = client.post(f"{EMP}/{id}/rehire", json={"department_id": None, "role_id": None}, headers=auth_headers)
    assert res.status_code == 400

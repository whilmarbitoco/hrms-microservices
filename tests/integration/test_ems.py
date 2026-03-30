import tests.integration.client as http

state = {}


def test_dept_auth_guard():
    res = http.get("/departments", auth=False)
    http.expect(res, 401, "GET /departments no auth")


def test_dept_create():
    res = http.post("/departments", json={"name": "Engineering", "description": "Eng dept"})
    data = http.expect(res, 201, "POST /departments")
    state["dept_id"] = data["id"]


def test_dept_list():
    res = http.get("/departments")
    data = http.expect(res, 200, "GET /departments")
    assert isinstance(data, list)
    assert any(d["id"] == state["dept_id"] for d in data)


def test_dept_get():
    res = http.get(f"/departments/{state['dept_id']}")
    data = http.expect(res, 200, f"GET /departments/{state['dept_id']}")
    assert data["id"] == state["dept_id"]


def test_dept_put():
    res = http.put(f"/departments/{state['dept_id']}", json={
        "name": "Engineering Updated", "description": "Updated", "manager_id": None
    })
    data = http.expect(res, 200, f"PUT /departments/{state['dept_id']}")
    assert data["name"] == "Engineering Updated"


def test_dept_patch():
    res = http.patch(f"/departments/{state['dept_id']}", json={"description": "Patched desc"})
    data = http.expect(res, 200, f"PATCH /departments/{state['dept_id']}")
    assert data["description"] == "Patched desc"


def test_dept_not_found():
    res = http.get("/departments/999999")
    http.expect(res, 404, "GET /departments/999999")


def test_dept_duplicate_name():
    http.post("/departments", json={"name": "Dup Dept"})
    res = http.post("/departments", json={"name": "Dup Dept"})
    http.expect(res, 409, "POST /departments duplicate name")


def test_dept_employees():
    res = http.get(f"/departments/{state['dept_id']}/employees")
    data = http.expect(res, 200, f"GET /departments/{state['dept_id']}/employees")
    assert isinstance(data, list)


def test_erole_auth_guard():
    res = http.get("/employee-roles", auth=False)
    http.expect(res, 401, "GET /employee-roles no auth")


def test_erole_create():
    res = http.post("/employee-roles", json={"name": "Backend Developer", "description": "Backend dev", "level": "mid"})
    data = http.expect(res, 201, "POST /employee-roles")
    state["role_id"] = data["id"]


def test_erole_list():
    res = http.get("/employee-roles")
    data = http.expect(res, 200, "GET /employee-roles")
    assert isinstance(data, list)


def test_erole_get():
    res = http.get(f"/employee-roles/{state['role_id']}")
    data = http.expect(res, 200, f"GET /employee-roles/{state['role_id']}")
    assert data["id"] == state["role_id"]


def test_erole_put():
    res = http.put(f"/employee-roles/{state['role_id']}", json={
        "name": "Backend Developer", "description": "Updated", "level": "senior"
    })
    data = http.expect(res, 200, f"PUT /employee-roles/{state['role_id']}")
    assert data["level"] == "senior"


def test_erole_patch():
    res = http.patch(f"/employee-roles/{state['role_id']}", json={"level": "lead"})
    data = http.expect(res, 200, f"PATCH /employee-roles/{state['role_id']}")
    assert data["level"] == "lead"


def test_erole_not_found():
    res = http.get("/employee-roles/999999")
    http.expect(res, 404, "GET /employee-roles/999999")


def test_erole_invalid_level():
    res = http.post("/employee-roles", json={"name": "Bad Level", "level": "god"})
    http.expect(res, 400, "POST /employee-roles invalid level")


def test_erole_employees():
    res = http.get(f"/employee-roles/{state['role_id']}/employees")
    data = http.expect(res, 200, f"GET /employee-roles/{state['role_id']}/employees")
    assert isinstance(data, list)


def test_emp_auth_guard():
    res = http.get("/employees", auth=False)
    http.expect(res, 401, "GET /employees no auth")


def test_emp_create():
    res = http.post("/employees", json={
        "name": "John Doe",
        "email": "john.doe@hrms.com",
        "phone": "+1234567890",
        "department_id": state["dept_id"],
        "role_id": state["role_id"],
    })
    data = http.expect(res, 201, "POST /employees")
    assert data["status"] == "active"
    assert data["employee_id"].startswith("EMP")
    state["emp_id"] = data["id"]
    state["employee_id"] = data["employee_id"]


def test_emp_list():
    res = http.get("/employees")
    data = http.expect(res, 200, "GET /employees")
    assert isinstance(data, list)
    assert any(e["id"] == state["emp_id"] for e in data)


def test_emp_list_filter():
    res = http.get("/employees", params={"status": "active"})
    data = http.expect(res, 200, "GET /employees?status=active")
    assert all(e["status"] == "active" for e in data)


def test_emp_get():
    res = http.get(f"/employees/{state['emp_id']}")
    data = http.expect(res, 200, f"GET /employees/{state['emp_id']}")
    assert data["id"] == state["emp_id"]


def test_emp_put():
    res = http.put(f"/employees/{state['emp_id']}", json={
        "name": "John Doe Updated",
        "email": "john.doe@hrms.com",
        "phone": "+9999999999",
        "department_id": state["dept_id"],
        "role_id": state["role_id"],
        "manager_id": None,
        "hired_at": None,
    })
    data = http.expect(res, 200, f"PUT /employees/{state['emp_id']}")
    assert data["name"] == "John Doe Updated"


def test_emp_patch():
    res = http.patch(f"/employees/{state['emp_id']}", json={"phone": "+1111111111"})
    data = http.expect(res, 200, f"PATCH /employees/{state['emp_id']}")
    assert data["phone"] == "+1111111111"


def test_emp_duplicate_email():
    res = http.post("/employees", json={"name": "Dup", "email": "john.doe@hrms.com"})
    http.expect(res, 409, "POST /employees duplicate email")


def test_emp_not_found():
    res = http.get("/employees/999999")
    http.expect(res, 404, "GET /employees/999999")


def test_emp_delete_active_fails():
    res = http.delete(f"/employees/{state['emp_id']}")
    http.expect(res, 400, "DELETE /employees active employee")


def test_emp_terminate():
    res = http.post(f"/employees/{state['emp_id']}/terminate", json={"reason": "Resigned"})
    data = http.expect(res, 200, f"POST /employees/{state['emp_id']}/terminate")
    assert data["status"] == "terminated"


def test_emp_terminate_again_fails():
    res = http.post(f"/employees/{state['emp_id']}/terminate", json={"reason": "Again"})
    http.expect(res, 400, "POST /employees terminate already terminated")


def test_emp_rehire():
    res = http.post(f"/employees/{state['emp_id']}/rehire", json={
        "department_id": state["dept_id"],
        "role_id": state["role_id"],
    })
    data = http.expect(res, 200, f"POST /employees/{state['emp_id']}/rehire")
    assert data["status"] == "active"


def test_emp_rehire_active_fails():
    res = http.post(f"/employees/{state['emp_id']}/rehire", json={
        "department_id": state["dept_id"],
        "role_id": state["role_id"],
    })
    http.expect(res, 400, "POST /employees rehire active employee")


def test_emp_history():
    res = http.get(f"/employees/{state['emp_id']}/history")
    data = http.expect(res, 200, f"GET /employees/{state['emp_id']}/history")
    assert isinstance(data, list)
    assert len(data) >= 2


def test_emp_subordinates():
    res = http.get(f"/employees/{state['emp_id']}/subordinates")
    data = http.expect(res, 200, f"GET /employees/{state['emp_id']}/subordinates")
    assert isinstance(data, list)


def test_emp_delete_terminated():
    http.post(f"/employees/{state['emp_id']}/terminate", json={"reason": "Final"})
    res = http.delete(f"/employees/{state['emp_id']}")
    http.expect(res, 200, f"DELETE /employees/{state['emp_id']} terminated")


def test_dept_delete_with_active_employees_fails():
    # Create a fresh dept and employee, try to delete dept
    dept = http.post("/departments", json={"name": "Temp Dept"}).json()
    role = http.post("/employee-roles", json={"name": "Temp Role", "level": "junior"}).json()
    http.post("/employees", json={
        "name": "Temp Emp", "email": "temp@hrms.com",
        "department_id": dept["id"], "role_id": role["id"],
    })
    res = http.delete(f"/departments/{dept['id']}")
    http.expect(res, 400, "DELETE /departments with active employees")


def test_erole_delete_with_active_employees_fails():
    role = http.post("/employee-roles", json={"name": "Busy Role", "level": "mid"}).json()
    http.post("/employees", json={
        "name": "Busy Emp", "email": "busy@hrms.com",
        "role_id": role["id"],
    })
    res = http.delete(f"/employee-roles/{role['id']}")
    http.expect(res, 400, "DELETE /employee-roles with active employees")


TESTS = [
    test_dept_auth_guard,
    test_dept_create,
    test_dept_list,
    test_dept_get,
    test_dept_put,
    test_dept_patch,
    test_dept_not_found,
    test_dept_duplicate_name,
    test_dept_employees,
    test_erole_auth_guard,
    test_erole_create,
    test_erole_list,
    test_erole_get,
    test_erole_put,
    test_erole_patch,
    test_erole_not_found,
    test_erole_invalid_level,
    test_erole_employees,
    test_emp_auth_guard,
    test_emp_create,
    test_emp_list,
    test_emp_list_filter,
    test_emp_get,
    test_emp_put,
    test_emp_patch,
    test_emp_duplicate_email,
    test_emp_not_found,
    test_emp_delete_active_fails,
    test_emp_terminate,
    test_emp_terminate_again_fails,
    test_emp_rehire,
    test_emp_rehire_active_fails,
    test_emp_history,
    test_emp_subordinates,
    test_emp_delete_terminated,
    test_dept_delete_with_active_employees_fails,
    test_erole_delete_with_active_employees_fails,
]

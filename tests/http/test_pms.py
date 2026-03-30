import tests.http.client as http

state = {}


def test_cache_auth_guard():
    res = http.get("/payroll/employees", auth=False)
    http.expect(res, 401, "GET /payroll/employees no auth")


def test_cache_list():
    res = http.get("/payroll/employees")
    data = http.expect(res, 200, "GET /payroll/employees")
    assert isinstance(data, list)


def test_sc_auth_guard():
    res = http.get("/payroll/salary-components", auth=False)
    http.expect(res, 401, "GET /payroll/salary-components no auth")


def test_sc_create_base():
    res = http.post("/payroll/salary-components", json={
        "employee_id": "EMP001",
        "type": "base",
        "name": "Base Salary",
        "amount": "5000.00",
    })
    data = http.expect(res, 201, "POST /payroll/salary-components base")
    state["sc_id"] = data["id"]


def test_sc_create_allowance():
    res = http.post("/payroll/salary-components", json={
        "employee_id": "EMP001",
        "type": "allowance",
        "name": "Housing Allowance",
        "amount": "500.00",
    })
    http.expect(res, 201, "POST /payroll/salary-components allowance")


def test_sc_create_deduction():
    res = http.post("/payroll/salary-components", json={
        "employee_id": "EMP001",
        "type": "deduction",
        "name": "Tax",
        "amount": "300.00",
    })
    http.expect(res, 201, "POST /payroll/salary-components deduction")


def test_sc_list():
    res = http.get("/payroll/salary-components")
    data = http.expect(res, 200, "GET /payroll/salary-components")
    assert isinstance(data, list)


def test_sc_list_filter():
    res = http.get("/payroll/salary-components", params={"type": "base"})
    data = http.expect(res, 200, "GET /payroll/salary-components?type=base")
    assert all(c["type"] == "base" for c in data)


def test_sc_get():
    res = http.get(f"/payroll/salary-components/{state['sc_id']}")
    data = http.expect(res, 200, f"GET /payroll/salary-components/{state['sc_id']}")
    assert data["id"] == state["sc_id"]


def test_sc_put():
    res = http.put(f"/payroll/salary-components/{state['sc_id']}", json={
        "employee_id": "EMP001", "type": "base", "name": "Base Salary Updated", "amount": "5500.00"
    })
    data = http.expect(res, 200, f"PUT /payroll/salary-components/{state['sc_id']}")
    assert data["amount"] == "5500.00"


def test_sc_patch():
    res = http.patch(f"/payroll/salary-components/{state['sc_id']}", json={"amount": "6000.00"})
    data = http.expect(res, 200, f"PATCH /payroll/salary-components/{state['sc_id']}")
    assert data["amount"] == "6000.00"


def test_sc_by_employee():
    res = http.get("/payroll/salary-components/employee/EMP001")
    data = http.expect(res, 200, "GET /payroll/salary-components/employee/EMP001")
    assert isinstance(data, list)
    assert len(data) >= 1


def test_sc_not_found():
    res = http.get("/payroll/salary-components/999999")
    http.expect(res, 404, "GET /payroll/salary-components/999999")


def test_sc_invalid_type():
    res = http.post("/payroll/salary-components", json={
        "employee_id": "EMP001", "type": "invalid", "name": "X", "amount": "100"
    })
    http.expect(res, 400, "POST /payroll/salary-components invalid type")


def test_batch_auth_guard():
    res = http.get("/payroll/batches", auth=False)
    http.expect(res, 401, "GET /payroll/batches no auth")


def test_batch_create():
    res = http.post("/payroll/batches", json={
        "name": "Nov 2024 Payroll",
        "cycle": "monthly",
        "period_start": "2024-11-01",
        "period_end": "2024-11-30",
    })
    data = http.expect(res, 201, "POST /payroll/batches")
    assert data["status"] == "draft"
    state["batch_id"] = data["id"]


def test_batch_list():
    res = http.get("/payroll/batches")
    data = http.expect(res, 200, "GET /payroll/batches")
    assert isinstance(data, list)


def test_batch_get():
    res = http.get(f"/payroll/batches/{state['batch_id']}")
    data = http.expect(res, 200, f"GET /payroll/batches/{state['batch_id']}")
    assert data["id"] == state["batch_id"]


def test_batch_put():
    res = http.put(f"/payroll/batches/{state['batch_id']}", json={
        "name": "Nov 2024 Updated", "cycle": "monthly",
        "period_start": "2024-11-01", "period_end": "2024-11-30",
    })
    data = http.expect(res, 200, f"PUT /payroll/batches/{state['batch_id']}")
    assert data["name"] == "Nov 2024 Updated"


def test_batch_patch():
    res = http.patch(f"/payroll/batches/{state['batch_id']}", json={"name": "Nov 2024 Patched"})
    data = http.expect(res, 200, f"PATCH /payroll/batches/{state['batch_id']}")
    assert data["name"] == "Nov 2024 Patched"


def test_adj_auth_guard():
    res = http.get("/payroll/adjustments", auth=False)
    http.expect(res, 401, "GET /payroll/adjustments no auth")


def test_adj_create():
    res = http.post("/payroll/adjustments", json={
        "employee_id": "EMP001",
        "batch_id": state["batch_id"],
        "type": "bonus",
        "amount": "1000.00",
        "reason": "Q4 performance bonus",
    })
    data = http.expect(res, 201, "POST /payroll/adjustments")
    state["adj_id"] = data["id"]


def test_adj_list():
    res = http.get("/payroll/adjustments")
    data = http.expect(res, 200, "GET /payroll/adjustments")
    assert isinstance(data, list)


def test_adj_get():
    res = http.get(f"/payroll/adjustments/{state['adj_id']}")
    data = http.expect(res, 200, f"GET /payroll/adjustments/{state['adj_id']}")
    assert data["id"] == state["adj_id"]


def test_adj_put():
    res = http.put(f"/payroll/adjustments/{state['adj_id']}", json={
        "employee_id": "EMP001",
        "batch_id": state["batch_id"],
        "type": "bonus",
        "amount": "1200.00",
        "reason": "Updated bonus",
    })
    data = http.expect(res, 200, f"PUT /payroll/adjustments/{state['adj_id']}")
    assert data["amount"] == "1200.00"


def test_adj_patch():
    res = http.patch(f"/payroll/adjustments/{state['adj_id']}", json={"amount": "1500.00"})
    data = http.expect(res, 200, f"PATCH /payroll/adjustments/{state['adj_id']}")
    assert data["amount"] == "1500.00"


def test_adj_by_employee():
    res = http.get("/payroll/adjustments/employee/EMP001")
    data = http.expect(res, 200, "GET /payroll/adjustments/employee/EMP001")
    assert isinstance(data, list)


def test_adj_not_found():
    res = http.get("/payroll/adjustments/999999")
    http.expect(res, 404, "GET /payroll/adjustments/999999")


def test_batch_process():
    res = http.post(f"/payroll/batches/{state['batch_id']}/process")
    data = http.expect(res, 200, f"POST /payroll/batches/{state['batch_id']}/process")
    assert data["status"] == "processed"


def test_batch_process_twice_fails():
    res = http.post(f"/payroll/batches/{state['batch_id']}/process")
    http.expect(res, 400, "POST /payroll/batches process twice")


def test_batch_update_processed_fails():
    res = http.patch(f"/payroll/batches/{state['batch_id']}", json={"name": "Should Fail"})
    http.expect(res, 400, "PATCH /payroll/batches processed batch")


def test_adj_update_processed_fails():
    res = http.patch(f"/payroll/adjustments/{state['adj_id']}", json={"amount": "999.00"})
    http.expect(res, 400, "PATCH /payroll/adjustments in processed batch")


def test_adj_delete_processed_fails():
    res = http.delete(f"/payroll/adjustments/{state['adj_id']}")
    http.expect(res, 400, "DELETE /payroll/adjustments in processed batch")


def test_batch_not_found():
    res = http.get("/payroll/batches/999999")
    http.expect(res, 404, "GET /payroll/batches/999999")


def test_slip_auth_guard():
    res = http.get("/payroll/payslips", auth=False)
    http.expect(res, 401, "GET /payroll/payslips no auth")


def test_slip_list():
    res = http.get("/payroll/payslips")
    data = http.expect(res, 200, "GET /payroll/payslips")
    assert isinstance(data, list)


def test_slip_by_batch():
    res = http.get(f"/payroll/payslips/batch/{state['batch_id']}")
    data = http.expect(res, 200, f"GET /payroll/payslips/batch/{state['batch_id']}")
    assert isinstance(data, list)
    assert len(data) >= 1
    state["slip_id"] = data[0]["id"]


def test_slip_by_employee():
    res = http.get("/payroll/payslips/employee/EMP001")
    data = http.expect(res, 200, "GET /payroll/payslips/employee/EMP001")
    assert isinstance(data, list)


def test_slip_get():
    res = http.get(f"/payroll/payslips/{state['slip_id']}")
    data = http.expect(res, 200, f"GET /payroll/payslips/{state['slip_id']}")
    assert data["id"] == state["slip_id"]
    assert "gross" in data
    assert "net" in data


def test_slip_patch_sent():
    res = http.patch(f"/payroll/payslips/{state['slip_id']}", json={"status": "sent"})
    data = http.expect(res, 200, f"PATCH /payroll/payslips/{state['slip_id']} sent")
    assert data["status"] == "sent"


def test_slip_patch_acknowledged():
    res = http.patch(f"/payroll/payslips/{state['slip_id']}", json={"status": "acknowledged"})
    data = http.expect(res, 200, f"PATCH /payroll/payslips/{state['slip_id']} acknowledged")
    assert data["status"] == "acknowledged"


def test_slip_not_found():
    res = http.get("/payroll/payslips/999999")
    http.expect(res, 404, "GET /payroll/payslips/999999")


TESTS = [
    test_cache_auth_guard,
    test_cache_list,
    test_sc_auth_guard,
    test_sc_create_base,
    test_sc_create_allowance,
    test_sc_create_deduction,
    test_sc_list,
    test_sc_list_filter,
    test_sc_get,
    test_sc_put,
    test_sc_patch,
    test_sc_by_employee,
    test_sc_not_found,
    test_sc_invalid_type,
    test_batch_auth_guard,
    test_batch_create,
    test_batch_list,
    test_batch_get,
    test_batch_put,
    test_batch_patch,
    test_adj_auth_guard,
    test_adj_create,
    test_adj_list,
    test_adj_get,
    test_adj_put,
    test_adj_patch,
    test_adj_by_employee,
    test_adj_not_found,
    test_batch_process,
    test_batch_process_twice_fails,
    test_batch_update_processed_fails,
    test_adj_update_processed_fails,
    test_adj_delete_processed_fails,
    test_batch_not_found,
    test_slip_auth_guard,
    test_slip_list,
    test_slip_by_batch,
    test_slip_by_employee,
    test_slip_get,
    test_slip_patch_sent,
    test_slip_patch_acknowledged,
    test_slip_not_found,
]

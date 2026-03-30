import tests.integration.client as http

state = {}


def test_cache_auth_guard():
    res = http.get("/leave/employees", auth=False)
    http.expect(res, 401, "GET /leave/employees no auth")


def test_cache_list():
    res = http.get("/leave/employees")
    data = http.expect(res, 200, "GET /leave/employees")
    assert isinstance(data, list)


def test_policy_auth_guard():
    res = http.get("/leave/policies", auth=False)
    http.expect(res, 401, "GET /leave/policies no auth")


def test_policy_create():
    res = http.post("/leave/policies", json={
        "name": "Annual Vacation",
        "type": "vacation",
        "max_days": "15",
        "accrual_rate": "1.25",
        "accrual_frequency": "monthly",
    })
    data = http.expect(res, 201, "POST /leave/policies")
    state["policy_id"] = data["id"]


def test_policy_list():
    res = http.get("/leave/policies")
    data = http.expect(res, 200, "GET /leave/policies")
    assert isinstance(data, list)
    assert any(p["id"] == state["policy_id"] for p in data)


def test_policy_get():
    res = http.get(f"/leave/policies/{state['policy_id']}")
    data = http.expect(res, 200, f"GET /leave/policies/{state['policy_id']}")
    assert data["id"] == state["policy_id"]


def test_policy_put():
    res = http.put(f"/leave/policies/{state['policy_id']}", json={
        "name": "Annual Vacation",
        "type": "vacation",
        "max_days": "20",
        "accrual_rate": "1.67",
        "accrual_frequency": "monthly",
    })
    data = http.expect(res, 200, f"PUT /leave/policies/{state['policy_id']}")
    assert data["max_days"] == "20.00"


def test_policy_patch():
    res = http.patch(f"/leave/policies/{state['policy_id']}", json={"max_days": "25"})
    data = http.expect(res, 200, f"PATCH /leave/policies/{state['policy_id']}")
    assert data["max_days"] == "25.00"


def test_policy_not_found():
    res = http.get("/leave/policies/999999")
    http.expect(res, 404, "GET /leave/policies/999999")


def test_policy_duplicate_name():
    http.post("/leave/policies", json={"name": "Dup Policy", "type": "sick", "max_days": "10", "accrual_rate": "0.83", "accrual_frequency": "monthly"})
    res = http.post("/leave/policies", json={"name": "Dup Policy", "type": "sick", "max_days": "10", "accrual_rate": "0.83", "accrual_frequency": "monthly"})
    http.expect(res, 409, "POST /leave/policies duplicate name")


def test_policy_invalid_type():
    res = http.post("/leave/policies", json={"name": "Bad", "type": "invalid", "max_days": "5", "accrual_rate": "0", "accrual_frequency": "yearly"})
    http.expect(res, 400, "POST /leave/policies invalid type")


def test_balance_auth_guard():
    res = http.get("/leave/balances", auth=False)
    http.expect(res, 401, "GET /leave/balances no auth")


def test_balance_list():
    res = http.get("/leave/balances")
    data = http.expect(res, 200, "GET /leave/balances")
    assert isinstance(data, list)


def test_balance_by_employee():
    # EMP001 should have been seeded via employee.created event from EMS
    # If event hasn't propagated, this may return empty list — still valid
    res = http.get("/leave/balances/EMP001")
    data = http.expect(res, 200, "GET /leave/balances/EMP001")
    assert isinstance(data, list)


def test_balance_accrue():
    res = http.post("/leave/balances/accrue", json={"employee_id": "EMP001"})
    http.expect(res, 200, "POST /leave/balances/accrue")


def test_balance_accrue_all():
    res = http.post("/leave/balances/accrue", json={})
    http.expect(res, 200, "POST /leave/balances/accrue all")


def test_request_auth_guard():
    res = http.get("/leave/requests", auth=False)
    http.expect(res, 401, "GET /leave/requests no auth")


def test_request_create():
    # Seed a balance directly if needed — assumes EMP001 has balance from event or manual seed
    balances = http.get("/leave/balances/EMP001").json()
    if not balances:
        # Manually initialize via accrue
        http.post("/leave/balances/accrue", json={"employee_id": "EMP001"})
        balances = http.get("/leave/balances/EMP001").json()

    state["balance_id"] = balances[0]["id"] if balances else None

    res = http.post("/leave/requests", json={
        "employee_id": "EMP001",
        "policy_id": state["policy_id"],
        "start_date": "2025-06-02",
        "end_date": "2025-06-04",
        "reason": "Family vacation",
    })
    data = http.expect(res, 201, "POST /leave/requests")
    assert data["status"] == "pending"
    state["req_id"] = data["id"]


def test_request_list():
    res = http.get("/leave/requests")
    data = http.expect(res, 200, "GET /leave/requests")
    assert isinstance(data, list)


def test_request_list_filter():
    res = http.get("/leave/requests", params={"status": "pending"})
    data = http.expect(res, 200, "GET /leave/requests?status=pending")
    assert isinstance(data, list)


def test_request_get():
    res = http.get(f"/leave/requests/{state['req_id']}")
    data = http.expect(res, 200, f"GET /leave/requests/{state['req_id']}")
    assert data["id"] == state["req_id"]


def test_request_patch():
    res = http.patch(f"/leave/requests/{state['req_id']}", json={"reason": "Updated reason"})
    data = http.expect(res, 200, f"PATCH /leave/requests/{state['req_id']}")
    assert data["reason"] == "Updated reason"


def test_request_put():
    res = http.put(f"/leave/requests/{state['req_id']}", json={
        "employee_id": "EMP001",
        "policy_id": state["policy_id"],
        "start_date": "2025-06-02",
        "end_date": "2025-06-04",
        "reason": "Full update reason",
    })
    data = http.expect(res, 200, f"PUT /leave/requests/{state['req_id']}")
    assert data["reason"] == "Full update reason"


def test_request_approve():
    res = http.post(f"/leave/requests/{state['req_id']}/approve")
    data = http.expect(res, 200, f"POST /leave/requests/{state['req_id']}/approve")
    assert data["status"] == "approved"


def test_request_approve_twice_fails():
    res = http.post(f"/leave/requests/{state['req_id']}/approve")
    http.expect(res, 400, "POST /leave/requests approve twice")


def test_request_update_approved_fails():
    res = http.patch(f"/leave/requests/{state['req_id']}", json={"reason": "Should fail"})
    http.expect(res, 400, "PATCH /leave/requests approved request")


def test_request_cancel_approved():
    res = http.post(f"/leave/requests/{state['req_id']}/cancel")
    data = http.expect(res, 200, f"POST /leave/requests/{state['req_id']}/cancel")
    assert data["status"] == "cancelled"


def test_request_reject():
    res = http.post("/leave/requests", json={
        "employee_id": "EMP001",
        "policy_id": state["policy_id"],
        "start_date": "2025-07-07",
        "end_date": "2025-07-08",
    })
    req_id = res.json()["id"]
    res = http.post(f"/leave/requests/{req_id}/reject", json={"reason": "Busy period"})
    data = http.expect(res, 200, f"POST /leave/requests/{req_id}/reject")
    assert data["status"] == "rejected"


def test_request_cancel_pending():
    res = http.post("/leave/requests", json={
        "employee_id": "EMP001",
        "policy_id": state["policy_id"],
        "start_date": "2025-08-04",
        "end_date": "2025-08-05",
    })
    req_id = res.json()["id"]
    res = http.post(f"/leave/requests/{req_id}/cancel")
    data = http.expect(res, 200, f"POST /leave/requests/{req_id}/cancel")
    assert data["status"] == "cancelled"


def test_request_delete():
    res = http.post("/leave/requests", json={
        "employee_id": "EMP001",
        "policy_id": state["policy_id"],
        "start_date": "2025-09-01",
        "end_date": "2025-09-02",
    })
    req_id = res.json()["id"]
    res = http.delete(f"/leave/requests/{req_id}")
    http.expect(res, 200, f"DELETE /leave/requests/{req_id}")


def test_request_delete_approved_fails():
    res = http.post("/leave/requests", json={
        "employee_id": "EMP001",
        "policy_id": state["policy_id"],
        "start_date": "2025-10-06",
        "end_date": "2025-10-07",
    })
    req_id = res.json()["id"]
    http.post(f"/leave/requests/{req_id}/approve")
    res = http.delete(f"/leave/requests/{req_id}")
    http.expect(res, 400, "DELETE /leave/requests approved request")


def test_request_not_found():
    res = http.get("/leave/requests/999999")
    http.expect(res, 404, "GET /leave/requests/999999")


def test_request_calendar():
    res = http.get("/leave/requests/calendar", params={"from_date": "2025-01-01", "to_date": "2025-12-31"})
    data = http.expect(res, 200, "GET /leave/requests/calendar")
    assert isinstance(data, list)


def test_request_calendar_missing_params():
    res = http.get("/leave/requests/calendar")
    http.expect(res, 400, "GET /leave/requests/calendar missing params")


def test_balance_adjust():
    if state.get("balance_id"):
        res = http.patch(f"/leave/balances/{state['balance_id']}", json={"amount": "20.00", "reason": "Carry-over"})
        data = http.expect(res, 200, f"PATCH /leave/balances/{state['balance_id']}")
        assert data["balance"] == "20.00"


def test_policy_delete_with_balances_fails():
    res = http.delete(f"/leave/policies/{state['policy_id']}")
    http.expect(res, 400, "DELETE /leave/policies with active balances")


TESTS = [
    test_cache_auth_guard,
    test_cache_list,
    test_policy_auth_guard,
    test_policy_create,
    test_policy_list,
    test_policy_get,
    test_policy_put,
    test_policy_patch,
    test_policy_not_found,
    test_policy_duplicate_name,
    test_policy_invalid_type,
    test_balance_auth_guard,
    test_balance_list,
    test_balance_by_employee,
    test_balance_accrue,
    test_balance_accrue_all,
    test_request_auth_guard,
    test_request_create,
    test_request_list,
    test_request_list_filter,
    test_request_get,
    test_request_patch,
    test_request_put,
    test_request_approve,
    test_request_approve_twice_fails,
    test_request_update_approved_fails,
    test_request_cancel_approved,
    test_request_reject,
    test_request_cancel_pending,
    test_request_delete,
    test_request_delete_approved_fails,
    test_request_not_found,
    test_request_calendar,
    test_request_calendar_missing_params,
    test_balance_adjust,
    test_policy_delete_with_balances_fails,
]

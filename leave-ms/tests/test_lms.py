import pytest

# ── Employee Cache ────────────────────────────────────────────────────────────

CACHE = "/leave/employees"


def test_cache_requires_auth(client):
    assert client.get(CACHE).status_code == 401


def test_cache_list(client, auth_headers):
    res = client.get(CACHE, headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_cache_get(client, auth_headers):
    res = client.get(f"{CACHE}/EMP001", headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["employee_id"] == "EMP001"


def test_cache_not_found(client, auth_headers):
    assert client.get(f"{CACHE}/EMP999", headers=auth_headers).status_code == 404


# ── Leave Policies ────────────────────────────────────────────────────────────

POL = "/leave/policies"


def test_policy_requires_auth(client):
    assert client.get(POL).status_code == 401


def test_policy_list(client, auth_headers):
    res = client.get(POL, headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)
    assert len(res.get_json()) >= 1


def test_policy_get(client, auth_headers):
    policies = client.get(POL, headers=auth_headers).get_json()
    id = policies[0]["id"]
    res = client.get(f"{POL}/{id}", headers=auth_headers)
    assert res.status_code == 200


def test_policy_create(client, auth_headers):
    res = client.post(POL, json={
        "name": "Sick Leave", "type": "sick",
        "max_days": "10", "accrual_rate": "0.83", "accrual_frequency": "monthly"
    }, headers=auth_headers)
    assert res.status_code == 201
    assert res.get_json()["name"] == "Sick Leave"


def test_policy_put(client, auth_headers):
    created = client.post(POL, json={
        "name": "Paternity Leave", "type": "paternity",
        "max_days": "5", "accrual_rate": "0", "accrual_frequency": "yearly"
    }, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.put(f"{POL}/{id}", json={
        "name": "Paternity Leave Updated", "type": "paternity",
        "max_days": "7", "accrual_rate": "0", "accrual_frequency": "yearly"
    }, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["max_days"] == "7.00"


def test_policy_patch(client, auth_headers):
    created = client.post(POL, json={
        "name": "Maternity Leave", "type": "maternity",
        "max_days": "90", "accrual_rate": "0", "accrual_frequency": "yearly"
    }, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.patch(f"{POL}/{id}", json={"max_days": "120"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["max_days"] == "120.00"


def test_policy_not_found(client, auth_headers):
    assert client.get(f"{POL}/999999", headers=auth_headers).status_code == 404


def test_policy_duplicate_name(client, auth_headers):
    client.post(POL, json={"name": "Dup Policy", "type": "unpaid", "max_days": "5", "accrual_rate": "0", "accrual_frequency": "yearly"}, headers=auth_headers)
    res = client.post(POL, json={"name": "Dup Policy", "type": "unpaid", "max_days": "5", "accrual_rate": "0", "accrual_frequency": "yearly"}, headers=auth_headers)
    assert res.status_code == 409


def test_policy_invalid_type(client, auth_headers):
    res = client.post(POL, json={"name": "Bad", "type": "invalid", "max_days": "5", "accrual_rate": "0", "accrual_frequency": "yearly"}, headers=auth_headers)
    assert res.status_code == 400


# ── Leave Balances ────────────────────────────────────────────────────────────

BAL = "/leave/balances"


def test_balance_requires_auth(client):
    assert client.get(BAL).status_code == 401


def test_balance_list(client, auth_headers):
    res = client.get(BAL, headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_balance_by_employee(client, auth_headers):
    res = client.get(f"{BAL}/EMP001", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)
    assert len(res.get_json()) >= 1


def test_balance_adjust(client, auth_headers):
    balances = client.get(f"{BAL}/EMP001", headers=auth_headers).get_json()
    id = balances[0]["id"]
    res = client.patch(f"{BAL}/{id}", json={"amount": "20.00", "reason": "Carry-over"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["balance"] == "20.00"


def test_balance_accrue(client, auth_headers):
    res = client.post(f"{BAL}/accrue", json={"employee_id": "EMP001"}, headers=auth_headers)
    assert res.status_code == 200


def test_balance_not_found(client, auth_headers):
    assert client.patch(f"{BAL}/999999", json={"amount": "5", "reason": "x"}, headers=auth_headers).status_code == 404


# ── Leave Requests ────────────────────────────────────────────────────────────

REQ = "/leave/requests"


def _get_policy_id(client, auth_headers):
    return client.get("/leave/policies", headers=auth_headers).get_json()[0]["id"]


def test_request_requires_auth(client):
    assert client.get(REQ).status_code == 401


def test_request_create(client, auth_headers):
    policy_id = _get_policy_id(client, auth_headers)
    res = client.post(REQ, json={
        "employee_id": "EMP001", "policy_id": policy_id,
        "start_date": "2025-01-06", "end_date": "2025-01-08", "reason": "Vacation"
    }, headers=auth_headers)
    assert res.status_code == 201
    assert res.get_json()["status"] == "pending"


def test_request_list(client, auth_headers):
    res = client.get(REQ, headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_request_get(client, auth_headers):
    policy_id = _get_policy_id(client, auth_headers)
    created = client.post(REQ, json={
        "employee_id": "EMP001", "policy_id": policy_id,
        "start_date": "2025-02-03", "end_date": "2025-02-04"
    }, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.get(f"{REQ}/{id}", headers=auth_headers)
    assert res.status_code == 200


def test_request_patch(client, auth_headers):
    policy_id = _get_policy_id(client, auth_headers)
    created = client.post(REQ, json={
        "employee_id": "EMP001", "policy_id": policy_id,
        "start_date": "2025-03-03", "end_date": "2025-03-04"
    }, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.patch(f"{REQ}/{id}", json={"reason": "Updated reason"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["reason"] == "Updated reason"


def test_request_approve(client, auth_headers):
    policy_id = _get_policy_id(client, auth_headers)
    created = client.post(REQ, json={
        "employee_id": "EMP001", "policy_id": policy_id,
        "start_date": "2025-04-07", "end_date": "2025-04-08"
    }, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.post(f"{REQ}/{id}/approve", headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["status"] == "approved"


def test_request_reject(client, auth_headers):
    policy_id = _get_policy_id(client, auth_headers)
    created = client.post(REQ, json={
        "employee_id": "EMP001", "policy_id": policy_id,
        "start_date": "2025-05-05", "end_date": "2025-05-06"
    }, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.post(f"{REQ}/{id}/reject", json={"reason": "Busy period"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["status"] == "rejected"


def test_request_cancel_pending(client, auth_headers):
    policy_id = _get_policy_id(client, auth_headers)
    created = client.post(REQ, json={
        "employee_id": "EMP001", "policy_id": policy_id,
        "start_date": "2025-06-02", "end_date": "2025-06-03"
    }, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.post(f"{REQ}/{id}/cancel", headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["status"] == "cancelled"


def test_request_cancel_approved(client, auth_headers):
    policy_id = _get_policy_id(client, auth_headers)
    created = client.post(REQ, json={
        "employee_id": "EMP001", "policy_id": policy_id,
        "start_date": "2025-07-07", "end_date": "2025-07-08"
    }, headers=auth_headers)
    id = created.get_json()["id"]
    client.post(f"{REQ}/{id}/approve", headers=auth_headers)
    res = client.post(f"{REQ}/{id}/cancel", headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["status"] == "cancelled"


def test_request_delete(client, auth_headers):
    policy_id = _get_policy_id(client, auth_headers)
    created = client.post(REQ, json={
        "employee_id": "EMP001", "policy_id": policy_id,
        "start_date": "2025-08-04", "end_date": "2025-08-05"
    }, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.delete(f"{REQ}/{id}", headers=auth_headers)
    assert res.status_code == 200


def test_request_approve_twice_fails(client, auth_headers):
    policy_id = _get_policy_id(client, auth_headers)
    created = client.post(REQ, json={
        "employee_id": "EMP001", "policy_id": policy_id,
        "start_date": "2025-09-01", "end_date": "2025-09-02"
    }, headers=auth_headers)
    id = created.get_json()["id"]
    client.post(f"{REQ}/{id}/approve", headers=auth_headers)
    res = client.post(f"{REQ}/{id}/approve", headers=auth_headers)
    assert res.status_code == 400


def test_request_not_found(client, auth_headers):
    assert client.get(f"{REQ}/999999", headers=auth_headers).status_code == 404


def test_request_calendar(client, auth_headers):
    res = client.get(f"{REQ}/calendar?from_date=2025-01-01&to_date=2025-12-31", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_request_calendar_missing_params(client, auth_headers):
    res = client.get(f"{REQ}/calendar", headers=auth_headers)
    assert res.status_code == 400

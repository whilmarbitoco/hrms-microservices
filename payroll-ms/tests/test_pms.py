import pytest

# ── Employee Cache ────────────────────────────────────────────────────────────

CACHE = "/payroll/employees"


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


# ── Salary Components ─────────────────────────────────────────────────────────

SC = "/payroll/salary-components"
SC_PAYLOAD = {"employee_id": "EMP001", "type": "base", "name": "Base Salary", "amount": "5000.00"}


def test_sc_requires_auth(client):
    assert client.get(SC).status_code == 401


def test_sc_create(client, auth_headers):
    res = client.post(SC, json=SC_PAYLOAD, headers=auth_headers)
    assert res.status_code == 201
    assert res.get_json()["name"] == "Base Salary"


def test_sc_list(client, auth_headers):
    res = client.get(SC, headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_sc_get(client, auth_headers):
    created = client.post(SC, json={"employee_id": "EMP001", "type": "allowance", "name": "Housing", "amount": "500.00"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.get(f"{SC}/{id}", headers=auth_headers)
    assert res.status_code == 200


def test_sc_put(client, auth_headers):
    created = client.post(SC, json={"employee_id": "EMP001", "type": "allowance", "name": "Transport", "amount": "200.00"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.put(f"{SC}/{id}", json={"employee_id": "EMP001", "type": "allowance", "name": "Transport Updated", "amount": "250.00"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["name"] == "Transport Updated"


def test_sc_patch(client, auth_headers):
    created = client.post(SC, json={"employee_id": "EMP001", "type": "deduction", "name": "Tax", "amount": "300.00"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.patch(f"{SC}/{id}", json={"amount": "350.00"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["amount"] == "350.00"


def test_sc_delete(client, auth_headers):
    created = client.post(SC, json={"employee_id": "EMP001", "type": "allowance", "name": "Temp", "amount": "100.00"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.delete(f"{SC}/{id}", headers=auth_headers)
    assert res.status_code == 200


def test_sc_by_employee(client, auth_headers):
    res = client.get(f"{SC}/employee/EMP001", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_sc_not_found(client, auth_headers):
    assert client.get(f"{SC}/999999", headers=auth_headers).status_code == 404


def test_sc_invalid_type(client, auth_headers):
    res = client.post(SC, json={"employee_id": "EMP001", "type": "invalid", "name": "X", "amount": "100"}, headers=auth_headers)
    assert res.status_code == 400


# ── Payroll Batches ───────────────────────────────────────────────────────────

BATCH = "/payroll/batches"
BATCH_PAYLOAD = {"name": "Nov 2024", "cycle": "monthly", "period_start": "2024-11-01", "period_end": "2024-11-30"}


def test_batch_requires_auth(client):
    assert client.get(BATCH).status_code == 401


def test_batch_create(client, auth_headers):
    res = client.post(BATCH, json=BATCH_PAYLOAD, headers=auth_headers)
    assert res.status_code == 201
    assert res.get_json()["status"] == "draft"


def test_batch_list(client, auth_headers):
    res = client.get(BATCH, headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_batch_get(client, auth_headers):
    created = client.post(BATCH, json={"name": "Dec 2024", "cycle": "monthly", "period_start": "2024-12-01", "period_end": "2024-12-31"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.get(f"{BATCH}/{id}", headers=auth_headers)
    assert res.status_code == 200


def test_batch_put(client, auth_headers):
    created = client.post(BATCH, json={"name": "Jan 2025", "cycle": "monthly", "period_start": "2025-01-01", "period_end": "2025-01-31"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.put(f"{BATCH}/{id}", json={"name": "Jan 2025 Updated", "cycle": "monthly", "period_start": "2025-01-01", "period_end": "2025-01-31"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["name"] == "Jan 2025 Updated"


def test_batch_patch(client, auth_headers):
    created = client.post(BATCH, json={"name": "Feb 2025", "cycle": "monthly", "period_start": "2025-02-01", "period_end": "2025-02-28"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.patch(f"{BATCH}/{id}", json={"name": "Feb 2025 Patched"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["name"] == "Feb 2025 Patched"


def test_batch_delete(client, auth_headers):
    created = client.post(BATCH, json={"name": "Temp Batch", "cycle": "monthly", "period_start": "2025-03-01", "period_end": "2025-03-31"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.delete(f"{BATCH}/{id}", headers=auth_headers)
    assert res.status_code == 200


def test_batch_process(client, auth_headers):
    created = client.post(BATCH, json={"name": "Process Batch", "cycle": "monthly", "period_start": "2025-04-01", "period_end": "2025-04-30"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.post(f"{BATCH}/{id}/process", headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["status"] == "processed"


def test_batch_process_twice_fails(client, auth_headers):
    created = client.post(BATCH, json={"name": "Double Process", "cycle": "monthly", "period_start": "2025-05-01", "period_end": "2025-05-31"}, headers=auth_headers)
    id = created.get_json()["id"]
    client.post(f"{BATCH}/{id}/process", headers=auth_headers)
    res = client.post(f"{BATCH}/{id}/process", headers=auth_headers)
    assert res.status_code == 400


def test_batch_update_processed_fails(client, auth_headers):
    created = client.post(BATCH, json={"name": "Lock Batch", "cycle": "monthly", "period_start": "2025-06-01", "period_end": "2025-06-30"}, headers=auth_headers)
    id = created.get_json()["id"]
    client.post(f"{BATCH}/{id}/process", headers=auth_headers)
    res = client.patch(f"{BATCH}/{id}", json={"name": "Should Fail"}, headers=auth_headers)
    assert res.status_code == 400


def test_batch_not_found(client, auth_headers):
    assert client.get(f"{BATCH}/999999", headers=auth_headers).status_code == 404


# ── Adjustments ───────────────────────────────────────────────────────────────

ADJ = "/payroll/adjustments"


def _get_draft_batch_id(client, auth_headers):
    res = client.post(BATCH, json={"name": "Adj Batch", "cycle": "monthly", "period_start": "2025-07-01", "period_end": "2025-07-31"}, headers=auth_headers)
    return res.get_json()["id"]


def test_adj_requires_auth(client):
    assert client.get(ADJ).status_code == 401


def test_adj_create(client, auth_headers):
    batch_id = _get_draft_batch_id(client, auth_headers)
    res = client.post(ADJ, json={"employee_id": "EMP001", "batch_id": batch_id, "type": "bonus", "amount": "1000.00", "reason": "Q4 bonus"}, headers=auth_headers)
    assert res.status_code == 201


def test_adj_list(client, auth_headers):
    res = client.get(ADJ, headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_adj_get(client, auth_headers):
    batch_id = _get_draft_batch_id(client, auth_headers)
    created = client.post(ADJ, json={"employee_id": "EMP001", "batch_id": batch_id, "type": "bonus", "amount": "500.00"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.get(f"{ADJ}/{id}", headers=auth_headers)
    assert res.status_code == 200


def test_adj_patch(client, auth_headers):
    batch_id = _get_draft_batch_id(client, auth_headers)
    created = client.post(ADJ, json={"employee_id": "EMP001", "batch_id": batch_id, "type": "bonus", "amount": "200.00"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.patch(f"{ADJ}/{id}", json={"amount": "300.00"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["amount"] == "300.00"


def test_adj_delete(client, auth_headers):
    batch_id = _get_draft_batch_id(client, auth_headers)
    created = client.post(ADJ, json={"employee_id": "EMP001", "batch_id": batch_id, "type": "deduction", "amount": "100.00"}, headers=auth_headers)
    id = created.get_json()["id"]
    res = client.delete(f"{ADJ}/{id}", headers=auth_headers)
    assert res.status_code == 200


def test_adj_by_employee(client, auth_headers):
    res = client.get(f"{ADJ}/employee/EMP001", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_adj_not_found(client, auth_headers):
    assert client.get(f"{ADJ}/999999", headers=auth_headers).status_code == 404


# ── Payslips ──────────────────────────────────────────────────────────────────

SLIP = "/payroll/payslips"


def _get_processed_batch_id(client, auth_headers):
    res = client.post(BATCH, json={"name": "Slip Batch", "cycle": "monthly", "period_start": "2025-08-01", "period_end": "2025-08-31"}, headers=auth_headers)
    id = res.get_json()["id"]
    client.post(f"{BATCH}/{id}/process", headers=auth_headers)
    return id


def test_slip_requires_auth(client):
    assert client.get(SLIP).status_code == 401


def test_slip_list(client, auth_headers):
    res = client.get(SLIP, headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_slip_by_batch(client, auth_headers):
    batch_id = _get_processed_batch_id(client, auth_headers)
    res = client.get(f"{SLIP}/batch/{batch_id}", headers=auth_headers)
    assert res.status_code == 200
    slips = res.get_json()
    assert isinstance(slips, list)
    assert len(slips) >= 1


def test_slip_by_employee(client, auth_headers):
    _get_processed_batch_id(client, auth_headers)
    res = client.get(f"{SLIP}/employee/EMP001", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_slip_get(client, auth_headers):
    batch_id = _get_processed_batch_id(client, auth_headers)
    slips = client.get(f"{SLIP}/batch/{batch_id}", headers=auth_headers).get_json()
    id = slips[0]["id"]
    res = client.get(f"{SLIP}/{id}", headers=auth_headers)
    assert res.status_code == 200


def test_slip_patch_status(client, auth_headers):
    batch_id = _get_processed_batch_id(client, auth_headers)
    slips = client.get(f"{SLIP}/batch/{batch_id}", headers=auth_headers).get_json()
    id = slips[0]["id"]
    res = client.patch(f"{SLIP}/{id}", json={"status": "sent"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.get_json()["status"] == "sent"


def test_slip_not_found(client, auth_headers):
    assert client.get(f"{SLIP}/999999", headers=auth_headers).status_code == 404

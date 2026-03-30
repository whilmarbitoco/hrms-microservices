def test_liveness(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.get_json() == {"status": "ok"}


def test_readiness(client):
    res = client.get("/ready")
    assert res.status_code == 200
    assert res.get_json() == {"status": "ready"}

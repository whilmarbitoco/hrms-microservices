import os
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

BASE_URL = os.getenv("HRMS_BASE_URL", "http://localhost")
TOKEN = os.getenv("HRMS_TOKEN", "")


def _headers():
    return {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}


def _no_auth_headers():
    return {"Content-Type": "application/json"}


def get(path, params=None, auth=True):
    headers = _headers() if auth else _no_auth_headers()
    return requests.get(f"{BASE_URL}{path}", headers=headers, params=params, timeout=10)


def post(path, json=None, auth=True):
    headers = _headers() if auth else _no_auth_headers()
    return requests.post(f"{BASE_URL}{path}", headers=headers, json=json, timeout=10)


def put(path, json=None, auth=True):
    headers = _headers() if auth else _no_auth_headers()
    return requests.put(f"{BASE_URL}{path}", headers=headers, json=json, timeout=10)


def patch(path, json=None, auth=True):
    headers = _headers() if auth else _no_auth_headers()
    return requests.patch(f"{BASE_URL}{path}", headers=headers, json=json, timeout=10)


def delete(path, auth=True):
    headers = _headers() if auth else _no_auth_headers()
    return requests.delete(f"{BASE_URL}{path}", headers=headers, timeout=10)


def expect(res, status_code, label=""):
    if res.status_code != status_code:
        raise AssertionError(
            f"{label} — expected {status_code}, got {res.status_code}\n"
            f"  Body: {res.text[:300]}"
        )
    return res.json() if res.text else {}

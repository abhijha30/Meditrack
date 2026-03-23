"""
Tests for MediTrack API
Run with: pytest tests/ -v
Install test deps: pip install pytest httpx pytest-asyncio
"""
import pytest
from httpx import AsyncClient
from main import app

BASE = "http://test"

# ─── Helpers ─────────────────────────────────────────────────────────────────

TEST_PATIENT = {
    "email": "testpatient@meditrack.test",
    "password": "testpass123",
    "full_name": "Test Patient",
    "role": "patient",
}

TEST_ADMIN = {
    "email": "testadmin@meditrack.test",
    "password": "testpass123",
    "full_name": "Test Admin",
    "role": "admin",
    "hospital_name": "Test Hospital",
}


@pytest.fixture
def anyio_backend():
    return "asyncio"


# ─── Health check ─────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_health():
    async with AsyncClient(app=app, base_url=BASE) as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.anyio
async def test_root():
    async with AsyncClient(app=app, base_url=BASE) as client:
        resp = await client.get("/")
    assert resp.status_code == 200


# ─── Auth ─────────────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_register_patient():
    async with AsyncClient(app=app, base_url=BASE) as client:
        resp = await client.post("/api/auth/register", json=TEST_PATIENT)
    # 200 = success, 400 = already exists (both acceptable in test env)
    assert resp.status_code in (200, 400)


@pytest.mark.anyio
async def test_login_wrong_password():
    async with AsyncClient(app=app, base_url=BASE) as client:
        resp = await client.post("/api/auth/login", json={
            "email": "nobody@test.com",
            "password": "wrongpass",
        })
    assert resp.status_code == 401


# ─── Protected routes ─────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_my_visits_requires_auth():
    async with AsyncClient(app=app, base_url=BASE) as client:
        resp = await client.get("/api/visits/my")
    assert resp.status_code == 403  # no token


@pytest.mark.anyio
async def test_my_reports_requires_auth():
    async with AsyncClient(app=app, base_url=BASE) as client:
        resp = await client.get("/api/reports/my")
    assert resp.status_code == 403


@pytest.mark.anyio
async def test_patient_search_requires_admin():
    async with AsyncClient(app=app, base_url=BASE) as client:
        resp = await client.get("/api/patients/search", headers={"Authorization": "Bearer fake_token"})
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_create_visit_requires_admin():
    async with AsyncClient(app=app, base_url=BASE) as client:
        resp = await client.post("/api/visits/", json={}, headers={"Authorization": "Bearer fake_token"})
    assert resp.status_code == 401

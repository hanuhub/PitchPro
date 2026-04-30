"""Iteration 2 backend tests — Fees, Staff views, Admin charts, CORS regression."""
import os
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL") or ""
if not BASE:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL"):
                BASE = line.split("=", 1)[1].strip().strip('"').strip("'")
                break
BASE = BASE.rstrip("/")
API = f"{BASE}/api"

ADMIN = {"email": "admin@cricketacademy.com", "password": "Admin@12345"}
USER = {"email": "user@cricketacademy.com", "password": "User@12345"}
COACH = {"email": "coach@cricketacademy.com", "password": "Coach@12345"}


def _session(creds):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json=creds, timeout=20)
    assert r.status_code == 200, f"Login fail {creds['email']}: {r.status_code} {r.text}"
    return s, r.json()


@pytest.fixture(scope="module")
def admin_ctx():
    return _session(ADMIN)


@pytest.fixture(scope="module")
def user_ctx():
    return _session(USER)


@pytest.fixture(scope="module")
def coach_ctx():
    return _session(COACH)


# --------- Admin Charts ---------
class TestAdminCharts:
    def test_admin_charts_ok(self, admin_ctx):
        s, _ = admin_ctx
        r = s.get(f"{API}/admin/charts", timeout=20)
        assert r.status_code == 200
        data = r.json()
        for key in ("timeseries", "lanes", "coaches", "roles"):
            assert key in data, f"Missing {key}"
        assert isinstance(data["timeseries"], list)
        assert len(data["timeseries"]) == 14, f"Expected 14 days, got {len(data['timeseries'])}"
        # Each timeseries entry shape
        sample = data["timeseries"][0]
        for k in ("date", "bookings", "sessions", "revenue"):
            assert k in sample
        # lanes/coaches/roles sanity
        assert isinstance(data["lanes"], list) and len(data["lanes"]) >= 1
        assert isinstance(data["coaches"], list) and len(data["coaches"]) >= 1
        assert isinstance(data["roles"], list) and len(data["roles"]) >= 1
        # Expect admin/user/coach roles present
        roles = {r["role"] for r in data["roles"]}
        assert {"admin", "user", "coach"}.issubset(roles), f"roles={roles}"

    def test_admin_charts_forbidden_for_user(self, user_ctx):
        s, _ = user_ctx
        r = s.get(f"{API}/admin/charts", timeout=20)
        assert r.status_code == 403, r.text

    def test_admin_charts_forbidden_for_coach(self, coach_ctx):
        s, _ = coach_ctx
        r = s.get(f"{API}/admin/charts", timeout=20)
        assert r.status_code == 403, r.text

    def test_admin_charts_unauthenticated(self):
        r = requests.get(f"{API}/admin/charts", timeout=20)
        assert r.status_code == 401


# --------- Staff: Lane Usage ---------
class TestStaffLaneUsage:
    def test_lane_usage_admin(self, admin_ctx):
        s, _ = admin_ctx
        # pick a date that has seeded data (yesterday)
        from datetime import date, timedelta
        td = (date.today() - timedelta(days=1)).isoformat()
        r = s.get(f"{API}/staff/lane-usage", params={"target_date": td}, timeout=20)
        assert r.status_code == 200
        lanes = r.json()
        assert isinstance(lanes, list) and len(lanes) >= 1
        for ln in lanes:
            assert "id" in ln and "name" in ln and "slots" in ln
            assert isinstance(ln["slots"], list)

    def test_lane_usage_coach_allowed(self, coach_ctx):
        s, _ = coach_ctx
        from datetime import date
        r = s.get(f"{API}/staff/lane-usage", params={"target_date": date.today().isoformat()}, timeout=20)
        assert r.status_code == 200

    def test_lane_usage_user_forbidden(self, user_ctx):
        s, _ = user_ctx
        from datetime import date
        r = s.get(f"{API}/staff/lane-usage", params={"target_date": date.today().isoformat()}, timeout=20)
        assert r.status_code == 403


# --------- Staff: Coach Usage ---------
class TestStaffCoachUsage:
    def test_coach_usage_admin(self, admin_ctx):
        s, _ = admin_ctx
        from datetime import date
        r = s.get(f"{API}/staff/coach-usage", params={"target_date": date.today().isoformat()}, timeout=20)
        assert r.status_code == 200
        coaches = r.json()
        assert isinstance(coaches, list) and len(coaches) >= 1
        for c in coaches:
            assert "id" in c and "name" in c and "slots" in c and "available_today" in c
            assert isinstance(c["available_today"], bool)

    def test_coach_usage_coach_allowed(self, coach_ctx):
        s, _ = coach_ctx
        from datetime import date
        r = s.get(f"{API}/staff/coach-usage", params={"target_date": date.today().isoformat()}, timeout=20)
        assert r.status_code == 200

    def test_coach_usage_user_forbidden(self, user_ctx):
        s, _ = user_ctx
        from datetime import date
        r = s.get(f"{API}/staff/coach-usage", params={"target_date": date.today().isoformat()}, timeout=20)
        assert r.status_code == 403


# --------- Fees ---------
class TestFees:
    def test_user_sees_seeded_fees(self, user_ctx):
        s, me = user_ctx
        r = s.get(f"{API}/fees/me", timeout=20)
        assert r.status_code == 200
        fees = r.json()
        assert isinstance(fees, list)
        assert len(fees) >= 3, f"Expected >=3 seeded fees, got {len(fees)}"
        # all belong to this user
        for f in fees:
            assert f["user_id"] == me["id"]
            assert "amount" in f and "status" in f and "label" in f

    def test_list_fees_admin(self, admin_ctx):
        s, _ = admin_ctx
        r = s.get(f"{API}/fees", timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_list_fees_user_forbidden(self, user_ctx):
        s, _ = user_ctx
        r = s.get(f"{API}/fees", timeout=20)
        assert r.status_code == 403

    def test_create_mark_paid_delete_flow(self, admin_ctx, user_ctx):
        admin_s, _ = admin_ctx
        user_s, user_me = user_ctx

        # Notification count before
        before = user_s.get(f"{API}/notifications/me", timeout=20).json()
        before_ct = len(before)

        # CREATE
        payload = {
            "user_id": user_me["id"],
            "kid_name": "Aarav Sharma",
            "label": "TEST_Iter2_Fee",
            "amount": 99.5,
            "due_date": "2026-12-31",
            "status": "pending",
        }
        r = admin_s.post(f"{API}/fees", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        created = r.json()
        fee_id = created["id"]
        assert created["label"] == "TEST_Iter2_Fee"
        assert created["user_email"] == user_me["email"]
        assert created["amount"] == 99.5

        # Verify GET — fee appears in user's list
        user_fees = user_s.get(f"{API}/fees/me", timeout=20).json()
        assert any(f["id"] == fee_id for f in user_fees)

        # Notification was sent to user
        after = user_s.get(f"{API}/notifications/me", timeout=20).json()
        assert len(after) >= before_ct + 1
        assert any(n.get("type") == "fee_added" and "TEST_Iter2_Fee" in n.get("subject", "") for n in after)

        # MARK PAID
        r = admin_s.put(f"{API}/fees/{fee_id}/mark-paid", timeout=20)
        assert r.status_code == 200
        user_fees = user_s.get(f"{API}/fees/me", timeout=20).json()
        match = [f for f in user_fees if f["id"] == fee_id]
        assert match and match[0]["status"] == "paid"
        assert "paid_at" in match[0]

        # DELETE
        r = admin_s.delete(f"{API}/fees/{fee_id}", timeout=20)
        assert r.status_code == 200
        user_fees = user_s.get(f"{API}/fees/me", timeout=20).json()
        assert not any(f["id"] == fee_id for f in user_fees)

    def test_create_fee_user_forbidden(self, user_ctx):
        s, me = user_ctx
        r = s.post(f"{API}/fees", json={
            "user_id": me["id"], "label": "hack", "amount": 10, "due_date": "2026-12-31"
        }, timeout=20)
        assert r.status_code == 403

    def test_create_fee_coach_forbidden(self, coach_ctx, user_ctx):
        s, _ = coach_ctx
        _, user_me = user_ctx
        r = s.post(f"{API}/fees", json={
            "user_id": user_me["id"], "label": "hack", "amount": 10, "due_date": "2026-12-31"
        }, timeout=20)
        assert r.status_code == 403

    def test_create_fee_bad_user(self, admin_ctx):
        s, _ = admin_ctx
        r = s.post(f"{API}/fees", json={
            "user_id": "nonexistent-id", "label": "oops",
            "amount": 1.0, "due_date": "2026-12-31"
        }, timeout=20)
        assert r.status_code == 404

    def test_mark_paid_nonexistent(self, admin_ctx):
        s, _ = admin_ctx
        r = s.put(f"{API}/fees/nonexistent-fee-id/mark-paid", timeout=20)
        assert r.status_code == 404

    def test_fees_me_unauthenticated(self):
        r = requests.get(f"{API}/fees/me", timeout=20)
        assert r.status_code == 401


# --------- CORS / Regression smoke ---------
class TestRegression:
    def test_cors_credentials_on_actual_request(self):
        """Real request: backend CORS middleware must send allow-credentials=true
        so cookie-based auth works. (Preflight is intercepted by the edge ingress,
        which does not set credentials — but the actual POST goes through to the
        backend middleware.)"""
        origin = BASE
        r = requests.post(
            f"{API}/auth/login",
            json=ADMIN,
            headers={"Origin": origin, "Content-Type": "application/json"},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        assert r.headers.get("access-control-allow-credentials", "").lower() == "true", \
            f"Missing allow-credentials header; headers={dict(r.headers)}"

    def test_lanes_listing(self):
        r = requests.get(f"{API}/lanes", timeout=20)
        assert r.status_code == 200
        assert len(r.json()) >= 5

    def test_coaches_listing(self):
        r = requests.get(f"{API}/coaches", timeout=20)
        assert r.status_code == 200
        assert len(r.json()) >= 3

    def test_games_listing(self):
        r = requests.get(f"{API}/games", timeout=20)
        assert r.status_code == 200
        assert len(r.json()) >= 2

    def test_announcements_admin_list(self, admin_ctx):
        s, _ = admin_ctx
        r = s.get(f"{API}/announcements", timeout=20)
        assert r.status_code == 200

    def test_my_bookings_authenticated(self, user_ctx):
        s, _ = user_ctx
        r = s.get(f"{API}/bookings/me", timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_stats(self, admin_ctx):
        s, _ = admin_ctx
        r = s.get(f"{API}/admin/stats", timeout=20)
        assert r.status_code == 200
        d = r.json()
        for k in ("users", "lanes", "coaches", "bookings_active", "sessions_active"):
            assert k in d

    def test_progress_me(self, user_ctx):
        s, _ = user_ctx
        r = s.get(f"{API}/progress/me", timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_notifications_me(self, user_ctx):
        s, _ = user_ctx
        r = s.get(f"{API}/notifications/me", timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_auth_me(self, user_ctx):
        s, _ = user_ctx
        r = s.get(f"{API}/auth/me", timeout=20)
        assert r.status_code == 200
        assert r.json()["email"] == USER["email"]

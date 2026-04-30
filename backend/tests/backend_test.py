"""Cricket Academy - Full backend API test suite (pytest)."""
import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE:
    # fallback to frontend env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL"):
                    BASE = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    except Exception:
        pass
BASE = (BASE or "").rstrip("/")
API = f"{BASE}/api"

ADMIN = {"email": "admin@cricketacademy.com", "password": "Admin@12345"}
USER = {"email": "user@cricketacademy.com", "password": "User@12345"}
COACH = {"email": "coach@cricketacademy.com", "password": "Coach@12345"}


def _session(creds=None):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    if creds:
        r = s.post(f"{API}/auth/login", json=creds, timeout=20)
        assert r.status_code == 200, f"Login failed for {creds['email']}: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="session")
def admin_s():
    return _session(ADMIN)


@pytest.fixture(scope="session")
def user_s():
    return _session(USER)


@pytest.fixture(scope="session")
def coach_s():
    return _session(COACH)


# ------------------- AUTH -------------------
class TestAuth:
    def test_admin_login(self):
        s = _session()
        r = s.post(f"{API}/auth/login", json=ADMIN)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN["email"]
        assert data["role"] == "admin"
        assert "access_token" in s.cookies

    def test_user_login(self):
        s = _session()
        r = s.post(f"{API}/auth/login", json=USER)
        assert r.status_code == 200
        assert r.json()["role"] == "user"

    def test_coach_login(self):
        s = _session()
        r = s.post(f"{API}/auth/login", json=COACH)
        assert r.status_code == 200
        assert r.json()["role"] == "coach"

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_returns_user(self, user_s):
        r = user_s.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == USER["email"]

    def test_register_and_logout(self):
        s = _session()
        email = f"TEST_{uuid.uuid4().hex[:8]}@test.com"
        r = s.post(f"{API}/auth/register",
                   json={"email": email, "password": "Pass@1234", "name": "Test User"})
        assert r.status_code == 200
        assert r.json()["role"] == "user"
        assert "access_token" in s.cookies
        r2 = s.get(f"{API}/auth/me")
        assert r2.status_code == 200
        # duplicate
        r3 = s.post(f"{API}/auth/register",
                    json={"email": email, "password": "Pass@1234", "name": "Dup"})
        assert r3.status_code == 400
        # logout clears
        r4 = s.post(f"{API}/auth/logout")
        assert r4.status_code == 200
        r5 = s.get(f"{API}/auth/me")
        assert r5.status_code == 401

    def test_invalid_login(self):
        s = _session()
        r = s.post(f"{API}/auth/login",
                   json={"email": f"nope_{uuid.uuid4().hex[:6]}@x.com", "password": "wrong"})
        assert r.status_code == 401

    def test_brute_force_lockout(self):
        s = requests.Session()
        email = f"brute_{uuid.uuid4().hex[:8]}@x.com"
        codes = []
        for _ in range(6):
            r = s.post(f"{API}/auth/login", json={"email": email, "password": "wrong"})
            codes.append(r.status_code)
        assert 429 in codes, f"Expected 429 lockout, got {codes}"


# ------------------- PUBLIC DATA -------------------
class TestPublicData:
    def test_lanes_seeded(self):
        r = requests.get(f"{API}/lanes")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 5, f"Expected >=5 lanes, got {len(data)}"
        assert all("id" in l and "name" in l for l in data)

    def test_coaches_seeded(self):
        r = requests.get(f"{API}/coaches")
        assert r.status_code == 200
        assert len(r.json()) >= 3

    def test_games_seeded(self):
        r = requests.get(f"{API}/games")
        assert r.status_code == 200
        assert len(r.json()) >= 2

    def test_awards_seeded(self):
        r = requests.get(f"{API}/awards")
        assert r.status_code == 200
        assert len(r.json()) >= 4


# ------------------- BOOKINGS -------------------
class TestBookings:
    @pytest.fixture(scope="class")
    def lane_id(self):
        return requests.get(f"{API}/lanes").json()[0]["id"]

    @pytest.fixture(scope="class")
    def far_date(self):
        return (datetime.now(timezone.utc).date() + timedelta(days=10)).isoformat()

    def test_create_booking(self, user_s, lane_id, far_date):
        r = user_s.post(f"{API}/bookings",
                        json={"lane_id": lane_id, "booking_date": far_date,
                              "start_hour": 10, "duration_hours": 1,
                              "notes": "TEST_booking"})
        assert r.status_code == 200, r.text
        b = r.json()
        assert b["status"] == "confirmed"
        assert b["lane_id"] == lane_id
        assert b["total_price"] > 0
        pytest.booking_id = b["id"]

        # GET persistence verify
        mine = user_s.get(f"{API}/bookings/me").json()
        assert any(x["id"] == b["id"] for x in mine)

        # notification created
        notifs = user_s.get(f"{API}/notifications/me").json()
        assert any(n["type"] == "booking_confirmed" for n in notifs)

    def test_conflict(self, user_s, lane_id, far_date):
        r = user_s.post(f"{API}/bookings",
                        json={"lane_id": lane_id, "booking_date": far_date,
                              "start_hour": 10, "duration_hours": 1})
        assert r.status_code == 409

    def test_availability(self, lane_id, far_date):
        r = requests.get(f"{API}/lanes/{lane_id}/availability",
                         params={"target_date": far_date})
        assert r.status_code == 200
        data = r.json()
        assert 10 in data["booked_hours"]

    def test_invalid_hours(self, user_s, lane_id, far_date):
        r = user_s.post(f"{API}/bookings",
                        json={"lane_id": lane_id, "booking_date": far_date,
                              "start_hour": 5, "duration_hours": 1})
        assert r.status_code == 400

    def test_update_booking(self, user_s, far_date):
        bid = pytest.booking_id
        r = user_s.put(f"{API}/bookings/{bid}",
                       json={"start_hour": 14})
        assert r.status_code == 200
        assert r.json()["start_hour"] == 14

    def test_24h_rule(self, user_s):
        lane_id = requests.get(f"{API}/lanes").json()[1]["id"]
        # Book tomorrow within 24h window
        tomorrow = (datetime.now(timezone.utc) + timedelta(hours=2)).date().isoformat()
        hour = (datetime.now(timezone.utc) + timedelta(hours=2)).hour
        if hour < 6 or hour > 20:
            hour = 10
        r = user_s.post(f"{API}/bookings",
                        json={"lane_id": lane_id, "booking_date": tomorrow,
                              "start_hour": hour, "duration_hours": 1})
        if r.status_code != 200:
            pytest.skip(f"Couldn't create near-booking: {r.status_code}")
        bid = r.json()["id"]
        # Try to modify — should fail 24h rule
        r2 = user_s.put(f"{API}/bookings/{bid}", json={"start_hour": hour + 1})
        assert r2.status_code == 400
        # Cancel — should also fail
        r3 = user_s.delete(f"{API}/bookings/{bid}")
        assert r3.status_code == 400

    def test_cancel_booking(self, user_s):
        bid = pytest.booking_id
        r = user_s.delete(f"{API}/bookings/{bid}")
        assert r.status_code == 200


# ------------------- SESSIONS -------------------
class TestSessions:
    def test_coach_availability_and_create_session(self, user_s):
        coach = requests.get(f"{API}/coaches").json()[0]
        cid = coach["id"]
        # pick a date that falls on an available weekday
        for i in range(2, 15):
            d = datetime.now(timezone.utc).date() + timedelta(days=i)
            if d.weekday() in coach["available_days"]:
                target = d.isoformat()
                break
        else:
            pytest.skip("No available day found")

        r = requests.get(f"{API}/coaches/{cid}/availability", params={"target_date": target})
        assert r.status_code == 200
        data = r.json()
        assert "booked_hours" in data and "available_start_hour" in data

        start = coach["available_start_hour"]
        r = user_s.post(f"{API}/sessions",
                        json={"coach_id": cid, "session_date": target,
                              "start_hour": start, "duration_hours": 1,
                              "focus": "TEST_session"})
        assert r.status_code == 200, r.text
        sess = r.json()
        pytest.session_id = sess["id"]

        # conflict
        r2 = user_s.post(f"{API}/sessions",
                         json={"coach_id": cid, "session_date": target,
                               "start_hour": start, "duration_hours": 1})
        assert r2.status_code == 409

    def test_session_day_validation(self, user_s):
        coach = requests.get(f"{API}/coaches").json()[0]
        cid = coach["id"]
        for i in range(2, 15):
            d = datetime.now(timezone.utc).date() + timedelta(days=i)
            if d.weekday() not in coach["available_days"]:
                target = d.isoformat()
                break
        else:
            pytest.skip("No unavailable day found")
        r = user_s.post(f"{API}/sessions",
                        json={"coach_id": cid, "session_date": target,
                              "start_hour": coach["available_start_hour"], "duration_hours": 1})
        assert r.status_code == 400

    def test_session_hours_out_of_range(self, user_s):
        coach = requests.get(f"{API}/coaches").json()[0]
        cid = coach["id"]
        for i in range(2, 15):
            d = datetime.now(timezone.utc).date() + timedelta(days=i)
            if d.weekday() in coach["available_days"]:
                target = d.isoformat()
                break
        r = user_s.post(f"{API}/sessions",
                        json={"coach_id": cid, "session_date": target,
                              "start_hour": coach["available_end_hour"], "duration_hours": 2})
        assert r.status_code == 400


# ------------------- PROGRESS -------------------
class TestProgress:
    def test_admin_creates_progress_user_sees(self, admin_s, user_s):
        me = user_s.get(f"{API}/auth/me").json()
        payload = {
            "user_id": me["id"], "kid_name": "Aarav Sharma",
            "period_type": "weekly", "period_label": "Week 2 - 2026",
            "batting_score": 80, "bowling_score": 70,
            "fielding_score": 75, "fitness_score": 85,
            "summary": "TEST_progress Good week overall",
            "strengths": ["timing"], "areas_to_improve": ["footwork"],
        }
        r = admin_s.post(f"{API}/progress", json=payload)
        assert r.status_code == 200, r.text
        # user sees it
        items = user_s.get(f"{API}/progress/me").json()
        assert any(p["summary"] == "TEST_progress Good week overall" for p in items)
        # notification created
        notifs = user_s.get(f"{API}/notifications/me").json()
        assert any(n["type"] == "progress_report" for n in notifs)

    def test_user_cannot_create_progress(self, user_s):
        me = user_s.get(f"{API}/auth/me").json()
        r = user_s.post(f"{API}/progress",
                        json={"user_id": me["id"], "kid_name": "x",
                              "period_type": "weekly", "period_label": "W",
                              "batting_score": 1, "bowling_score": 1,
                              "fielding_score": 1, "fitness_score": 1,
                              "summary": "x"})
        assert r.status_code == 403


# ------------------- GAMES / ANNOUNCEMENTS -------------------
class TestGamesAndAnnouncements:
    def test_admin_create_game_and_notify(self, admin_s, user_s):
        gdate = (datetime.now(timezone.utc).date() + timedelta(days=7)).isoformat()
        r = admin_s.post(f"{API}/games",
                         json={"title": "TEST_Match", "game_date": gdate,
                               "start_time": "09:00", "ground_name": "Test Ground",
                               "ground_address": "Test Addr", "gps_lat": 1.0, "gps_lng": 2.0,
                               "team_a": ["A"], "team_b": ["B"]})
        assert r.status_code == 200
        gid = r.json()["id"]

        r2 = admin_s.post(f"{API}/games/{gid}/notify")
        assert r2.status_code == 200
        body = r2.json()
        assert body["mocked"] is True
        assert set(body["channels"]) == {"email", "whatsapp", "in-app"}

        # user has game_announcement notifications across 3 channels
        notifs = user_s.get(f"{API}/notifications/me").json()
        channels = {n["channel"] for n in notifs if n.get("type") == "game_announcement" and n.get("game_id") == gid}
        assert channels == {"email", "whatsapp", "in-app"}

        # cleanup
        admin_s.delete(f"{API}/games/{gid}")

    def test_announcement(self, admin_s, user_s):
        r = admin_s.post(f"{API}/announcements",
                         json={"channel": "whatsapp", "audience": "users",
                               "subject": "TEST_ann", "message": "hello"})
        assert r.status_code == 200
        data = r.json()
        assert data["mocked"] is True
        assert data["recipients"] >= 1
        notifs = user_s.get(f"{API}/notifications/me").json()
        assert any(n["subject"] == "TEST_ann" for n in notifs)


# ------------------- ADMIN / RBAC -------------------
class TestRBAC:
    def test_admin_stats(self, admin_s):
        r = admin_s.get(f"{API}/admin/stats")
        assert r.status_code == 200
        data = r.json()
        for k in ["users", "lanes", "coaches", "bookings_active", "sessions_active",
                  "progress_reports", "games"]:
            assert k in data

    def test_admin_users(self, admin_s):
        r = admin_s.get(f"{API}/admin/users")
        assert r.status_code == 200
        users = r.json()
        assert all("password_hash" not in u for u in users)

    def test_user_forbidden_admin_stats(self, user_s):
        r = user_s.get(f"{API}/admin/stats")
        assert r.status_code == 403

    def test_user_forbidden_create_lane(self, user_s):
        r = user_s.post(f"{API}/lanes",
                        json={"name": "TEST_lane", "surface": "turf"})
        assert r.status_code == 403

    def test_user_forbidden_create_game(self, user_s):
        r = user_s.post(f"{API}/games",
                        json={"title": "x", "game_date": "2026-12-01",
                              "start_time": "09:00", "ground_name": "g",
                              "ground_address": "a"})
        assert r.status_code == 403

    def test_admin_create_and_delete_lane(self, admin_s):
        r = admin_s.post(f"{API}/lanes",
                         json={"name": f"TEST_Lane_{uuid.uuid4().hex[:6]}",
                               "surface": "turf", "hourly_rate": 20.0})
        assert r.status_code == 200
        lid = r.json()["id"]
        r2 = admin_s.delete(f"{API}/lanes/{lid}")
        assert r2.status_code == 200


# ------------------- NOTIFICATIONS -------------------
class TestNotifications:
    def test_list_and_mark_read(self, user_s):
        r = user_s.get(f"{API}/notifications/me")
        assert r.status_code == 200
        items = r.json()
        if items:
            nid = items[0]["id"]
            r2 = user_s.post(f"{API}/notifications/{nid}/read")
            assert r2.status_code == 200

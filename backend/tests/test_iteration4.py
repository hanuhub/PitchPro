"""Iteration 4: multi-tenant role split (platform_admin / academy_admin) + academy scoping."""
import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests

BASE = (os.environ.get("REACT_APP_BACKEND_URL") or "").rstrip("/")
if not BASE:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL"):
                BASE = line.split("=", 1)[1].strip().strip('"').strip("'").rstrip("/")
                break
API = f"{BASE}/api"

PLATFORM_ADMIN = {"email": "admin@cricketacademy.com", "password": "Admin@12345"}
CREASE_ADMIN = {"email": "hello@crease.club", "password": "AcaAdmin@1"}
BOUNDARY_ADMIN = {"email": "hello@boundaryline.in", "password": "AcaAdmin@1"}
STUMPS_ADMIN = {"email": "hello@stumps.cc", "password": "AcaAdmin@1"}
PARENT = {"email": "user@cricketacademy.com", "password": "User@12345"}
COACH = {"email": "coach@cricketacademy.com", "password": "Coach@12345"}


def _login(creds):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json=creds, timeout=20)
    assert r.status_code == 200, f"login failed for {creds['email']}: {r.status_code} {r.text}"
    return s, r.json()


# ---------- session-scoped fixtures ----------
@pytest.fixture(scope="session")
def platform_ctx():
    s, me = _login(PLATFORM_ADMIN)
    return s, me


@pytest.fixture(scope="session")
def crease_ctx():
    s, me = _login(CREASE_ADMIN)
    return s, me


@pytest.fixture(scope="session")
def boundary_ctx():
    s, me = _login(BOUNDARY_ADMIN)
    return s, me


@pytest.fixture(scope="session")
def stumps_ctx():
    s, me = _login(STUMPS_ADMIN)
    return s, me


@pytest.fixture(scope="session")
def parent_ctx():
    s, me = _login(PARENT)
    return s, me


@pytest.fixture(scope="session")
def coach_ctx():
    s, me = _login(COACH)
    return s, me


# ---------- ROLES / LOGIN ----------
class TestRolesAndAccent:
    def test_platform_admin_role_and_accent(self, platform_ctx):
        _, me = platform_ctx
        assert me["role"] == "platform_admin", me
        assert me.get("academy_id")
        assert me.get("academy_accent_color") == "#D82234"

    def test_crease_admin(self, crease_ctx):
        _, me = crease_ctx
        assert me["role"] == "academy_admin"
        assert me.get("academy_accent_color") == "#D82234"
        assert me.get("academy_id")

    def test_boundary_admin(self, boundary_ctx):
        _, me = boundary_ctx
        assert me["role"] == "academy_admin"
        assert me.get("academy_accent_color") == "#F59E0B"

    def test_stumps_admin(self, stumps_ctx):
        _, me = stumps_ctx
        assert me["role"] == "academy_admin"
        assert me.get("academy_accent_color") == "#10B981"

    def test_parent_and_coach_have_academy(self, parent_ctx, coach_ctx):
        assert parent_ctx[1]["role"] == "user"
        assert parent_ctx[1].get("academy_id")
        assert coach_ctx[1]["role"] == "coach"
        assert coach_ctx[1].get("academy_id")


# ---------- SCOPING: lanes / coaches / games ----------
class TestScopingPublicLists:
    def test_lanes_scoped(self, platform_ctx, crease_ctx, boundary_ctx, stumps_ctx):
        pa, _ = platform_ctx
        ca, _ = crease_ctx
        ba, _ = boundary_ctx
        sa, _ = stumps_ctx

        all_lanes = pa.get(f"{API}/lanes").json()
        crease_lanes = ca.get(f"{API}/lanes").json()
        boundary_lanes = ba.get(f"{API}/lanes").json()
        stumps_lanes = sa.get(f"{API}/lanes").json()

        assert len(all_lanes) >= 5
        assert len(crease_lanes) >= 5
        assert len(boundary_lanes) == 0, f"Boundary should have 0 lanes, got {len(boundary_lanes)}"
        assert len(stumps_lanes) == 0

    def test_coaches_scoped(self, platform_ctx, boundary_ctx, crease_ctx):
        assert len(platform_ctx[0].get(f"{API}/coaches").json()) >= 3
        assert len(boundary_ctx[0].get(f"{API}/coaches").json()) == 0
        assert len(crease_ctx[0].get(f"{API}/coaches").json()) >= 3

    def test_games_scoped(self, platform_ctx, boundary_ctx, crease_ctx):
        assert len(platform_ctx[0].get(f"{API}/games").json()) >= 2
        assert len(boundary_ctx[0].get(f"{API}/games").json()) == 0
        assert len(crease_ctx[0].get(f"{API}/games").json()) >= 2


# ---------- SCOPING: admin endpoints ----------
class TestAdminScoping:
    def test_admin_users_scoped(self, crease_ctx, boundary_ctx, platform_ctx):
        _, crease_me = crease_ctx
        crease_users = crease_ctx[0].get(f"{API}/admin/users").json()
        assert all(u.get("academy_id") == crease_me["academy_id"] for u in crease_users), \
            "Crease admin seeing cross-academy users"
        # boundary admin should only see themselves (no other users in boundary)
        b_users = boundary_ctx[0].get(f"{API}/admin/users").json()
        _, bme = boundary_ctx
        assert all(u.get("academy_id") == bme["academy_id"] for u in b_users)
        # platform admin sees all
        all_users = platform_ctx[0].get(f"{API}/admin/users").json()
        assert len(all_users) >= len(crease_users)

    def test_admin_stats_scoped(self, crease_ctx, boundary_ctx):
        c = crease_ctx[0].get(f"{API}/admin/stats").json()
        b = boundary_ctx[0].get(f"{API}/admin/stats").json()
        assert c["lanes"] >= 5
        assert b["lanes"] == 0
        assert b["coaches"] == 0
        assert b["games"] == 0

    def test_admin_charts_scoped(self, crease_ctx, boundary_ctx):
        c = crease_ctx[0].get(f"{API}/admin/charts").json()
        b = boundary_ctx[0].get(f"{API}/admin/charts").json()
        for k in ["timeseries", "lanes", "coaches", "roles"]:
            assert k in c and k in b, f"missing key {k}"
        # boundary has no lanes/coaches
        assert len(b["lanes"]) == 0
        assert len(b["coaches"]) == 0

    def test_staff_usage_scoped(self, crease_ctx, boundary_ctx):
        td = datetime.now(timezone.utc).date().isoformat()
        cl = crease_ctx[0].get(f"{API}/staff/lane-usage", params={"target_date": td}).json()
        bl = boundary_ctx[0].get(f"{API}/staff/lane-usage", params={"target_date": td}).json()
        cc = crease_ctx[0].get(f"{API}/staff/coach-usage", params={"target_date": td}).json()
        bc = boundary_ctx[0].get(f"{API}/staff/coach-usage", params={"target_date": td}).json()
        assert isinstance(cl, list) and len(cl) >= 5
        assert isinstance(bl, list) and len(bl) == 0
        assert len(cc) >= 3 and len(bc) == 0

    def test_admin_bookings_sessions_progress_fees_announcements(self, crease_ctx, boundary_ctx):
        # crease has data, boundary empty
        c_sess = crease_ctx[0].get(f"{API}/bookings")
        assert c_sess.status_code == 200
        b_bk = boundary_ctx[0].get(f"{API}/bookings").json()
        assert len(b_bk) == 0
        assert len(boundary_ctx[0].get(f"{API}/sessions").json()) == 0
        assert len(boundary_ctx[0].get(f"{API}/progress").json()) == 0
        assert len(boundary_ctx[0].get(f"{API}/fees").json()) == 0
        # All announcements boundary sees must be scoped to boundary academy
        _, bme = boundary_ctx
        b_anns = boundary_ctx[0].get(f"{API}/announcements").json()
        assert all(a.get("academy_id") == bme["academy_id"] for a in b_anns), \
            "Boundary admin sees cross-academy announcements"
        # crease has fees
        assert len(crease_ctx[0].get(f"{API}/fees").json()) >= 1


# ---------- ROLE GATING ----------
class TestRoleGating:
    def test_parent_cannot_hit_admin(self, parent_ctx):
        r = parent_ctx[0].get(f"{API}/admin/stats")
        assert r.status_code == 403
        r2 = parent_ctx[0].get(f"{API}/admin/users")
        assert r2.status_code == 403

    def test_parent_cannot_hit_staff(self, parent_ctx):
        td = datetime.now(timezone.utc).date().isoformat()
        r = parent_ctx[0].get(f"{API}/staff/lane-usage", params={"target_date": td})
        assert r.status_code == 403

    def test_academy_admin_cannot_create_academy(self, crease_ctx):
        r = crease_ctx[0].post(f"{API}/academies",
                               json={"name": "TEST_NewAcademy", "slug": f"test-{uuid.uuid4().hex[:6]}",
                                     "accent_color": "#123456"})
        assert r.status_code == 403

    def test_platform_admin_can_list_academies(self, platform_ctx):
        r = platform_ctx[0].get(f"{API}/academies")
        assert r.status_code == 200
        assert len(r.json()) >= 3


# ---------- CROSS-ACADEMY VALIDATION ----------
class TestCrossAcademyValidation:
    def test_parent_booking_cross_academy_lane_rejected(self, parent_ctx, platform_ctx, boundary_ctx):
        # create a lane in Boundary as Boundary admin
        _, bme = boundary_ctx
        r = boundary_ctx[0].post(f"{API}/lanes",
                                 json={"name": f"TEST_B_Lane_{uuid.uuid4().hex[:6]}",
                                       "surface": "turf", "hourly_rate": 20.0})
        assert r.status_code == 200, r.text
        b_lane = r.json()
        assert b_lane.get("academy_id") == bme["academy_id"]

        far = (datetime.now(timezone.utc).date() + timedelta(days=14)).isoformat()
        # parent (Crease) tries to book Boundary lane
        rb = parent_ctx[0].post(f"{API}/bookings",
                                json={"lane_id": b_lane["id"], "booking_date": far,
                                      "start_hour": 11, "duration_hours": 1})
        assert rb.status_code == 403, f"Expected 403, got {rb.status_code}: {rb.text}"
        assert "different academy" in rb.text.lower() or "academy" in rb.text.lower()

        # cleanup: delete as boundary admin
        boundary_ctx[0].delete(f"{API}/lanes/{b_lane['id']}")

    def test_parent_session_cross_academy_coach_rejected(self, parent_ctx, boundary_ctx):
        # create a coach in Boundary
        r = boundary_ctx[0].post(f"{API}/coaches",
                                 json={"name": f"TEST_B_Coach_{uuid.uuid4().hex[:6]}",
                                       "title": "Specialist",
                                       "bio": "Test coach bio",
                                       "specialties": ["Batting"],
                                       "hourly_rate": 50.0,
                                       "available_days": [0, 1, 2, 3, 4, 5, 6],
                                       "available_start_hour": 9,
                                       "available_end_hour": 18})
        assert r.status_code == 200, r.text
        coach = r.json()
        far = (datetime.now(timezone.utc).date() + timedelta(days=14)).isoformat()
        rs = parent_ctx[0].post(f"{API}/sessions",
                                json={"coach_id": coach["id"], "session_date": far,
                                      "start_hour": 10, "duration_hours": 1})
        assert rs.status_code == 403, f"Expected 403, got {rs.status_code}: {rs.text}"
        boundary_ctx[0].delete(f"{API}/coaches/{coach['id']}")

    def test_academy_admin_progress_for_other_academy_user_rejected(self, boundary_ctx, parent_ctx):
        # parent is in Crease. Boundary admin tries to post progress for parent.
        parent_me = parent_ctx[0].get(f"{API}/auth/me").json()
        r = boundary_ctx[0].post(f"{API}/progress",
                                 json={"user_id": parent_me["id"], "kid_name": "x",
                                       "period_type": "weekly", "period_label": "W-test",
                                       "batting_score": 1, "bowling_score": 1,
                                       "fielding_score": 1, "fitness_score": 1,
                                       "summary": "TEST_cross"})
        assert r.status_code == 403

    def test_academy_admin_fee_for_other_academy_user_rejected(self, boundary_ctx, parent_ctx):
        parent_me = parent_ctx[0].get(f"{API}/auth/me").json()
        r = boundary_ctx[0].post(f"{API}/fees",
                                 json={"user_id": parent_me["id"], "kid_name": "Aarav Sharma",
                                       "label": "TEST_cross_fee",
                                       "amount": 100.0,
                                       "due_date": "2026-06-01"})
        assert r.status_code == 403


# ---------- ACADEMY ADMIN OWN-SCOPE CRUD ----------
class TestAcademyAdminScopedCRUD:
    def test_create_lane_academy_tagged(self, boundary_ctx, crease_ctx):
        _, bme = boundary_ctx
        r = boundary_ctx[0].post(f"{API}/lanes",
                                 json={"name": f"TEST_B_LaneC_{uuid.uuid4().hex[:6]}",
                                       "surface": "turf"})
        assert r.status_code == 200
        lane = r.json()
        assert lane["academy_id"] == bme["academy_id"]
        # Crease admin cannot delete Boundary lane → 404 (not visible)
        rd = crease_ctx[0].delete(f"{API}/lanes/{lane['id']}")
        assert rd.status_code == 404
        # Boundary can
        rd2 = boundary_ctx[0].delete(f"{API}/lanes/{lane['id']}")
        assert rd2.status_code == 200

    def test_create_coach_academy_tagged(self, boundary_ctx, crease_ctx):
        _, bme = boundary_ctx
        r = boundary_ctx[0].post(f"{API}/coaches",
                                 json={"name": f"TEST_B_CoachC_{uuid.uuid4().hex[:6]}",
                                       "title": "Coach", "bio": "bio",
                                       "specialties": ["x"], "hourly_rate": 40.0,
                                       "available_days": [0, 1, 2, 3, 4],
                                       "available_start_hour": 9,
                                       "available_end_hour": 17})
        assert r.status_code == 200
        c = r.json()
        assert c["academy_id"] == bme["academy_id"]
        rd = crease_ctx[0].delete(f"{API}/coaches/{c['id']}")
        assert rd.status_code == 404
        boundary_ctx[0].delete(f"{API}/coaches/{c['id']}")

    def test_create_game_academy_tagged(self, boundary_ctx):
        _, bme = boundary_ctx
        gdate = (datetime.now(timezone.utc).date() + timedelta(days=10)).isoformat()
        r = boundary_ctx[0].post(f"{API}/games",
                                 json={"title": "TEST_B_Match", "game_date": gdate,
                                       "start_time": "09:00", "ground_name": "G",
                                       "ground_address": "A", "gps_lat": 1.0, "gps_lng": 2.0,
                                       "team_a": ["X"], "team_b": ["Y"]})
        assert r.status_code == 200
        g = r.json()
        assert g["academy_id"] == bme["academy_id"]
        boundary_ctx[0].delete(f"{API}/games/{g['id']}")


# ---------- ANNOUNCEMENTS / GAME NOTIFY scope ----------
class TestNotifyScope:
    def test_announcement_crease_reaches_parent(self, crease_ctx, parent_ctx):
        subj = f"TEST_ann_scope_{uuid.uuid4().hex[:6]}"
        r = crease_ctx[0].post(f"{API}/announcements",
                               json={"channel": "in-app", "audience": "all",
                                     "subject": subj, "message": "hello"})
        assert r.status_code == 200
        data = r.json()
        assert data["recipients"] >= 1
        # parent (Crease) sees it
        notifs = parent_ctx[0].get(f"{API}/notifications/me").json()
        assert any(n.get("subject") == subj for n in notifs)

    def test_announcement_boundary_does_not_reach_crease_parent(self, boundary_ctx, parent_ctx):
        subj = f"TEST_ann_b_{uuid.uuid4().hex[:6]}"
        r = boundary_ctx[0].post(f"{API}/announcements",
                                 json={"channel": "in-app", "audience": "all",
                                       "subject": subj, "message": "hi"})
        assert r.status_code == 200
        # recipients count should be only Boundary users (1 = academy_admin itself or 0 if excluded)
        notifs = parent_ctx[0].get(f"{API}/notifications/me").json()
        assert not any(n.get("subject") == subj for n in notifs), \
            "Boundary announcement leaked to Crease parent"

    def test_game_notify_scoped(self, crease_ctx, parent_ctx):
        # use an existing crease game or create one
        games = crease_ctx[0].get(f"{API}/games").json()
        assert games
        gid = games[0]["id"]
        r = crease_ctx[0].post(f"{API}/games/{gid}/notify")
        assert r.status_code == 200
        body = r.json()
        assert body["mocked"] is True
        notifs = parent_ctx[0].get(f"{API}/notifications/me").json()
        assert any(n.get("type") == "game_announcement" and n.get("game_id") == gid for n in notifs)


# ---------- REGRESSION ----------
class TestRegression:
    def test_parent_can_still_book_own_academy_lane(self, parent_ctx):
        lanes = parent_ctx[0].get(f"{API}/lanes").json()
        assert lanes, "parent should see Crease lanes"
        lane_id = lanes[0]["id"]
        far = (datetime.now(timezone.utc).date() + timedelta(days=20)).isoformat()
        # Try multiple hours to avoid conflict with prior test runs
        booked = None
        for hr in range(8, 20):
            r = parent_ctx[0].post(f"{API}/bookings",
                                   json={"lane_id": lane_id, "booking_date": far,
                                         "start_hour": hr, "duration_hours": 1,
                                         "notes": "TEST_regression"})
            if r.status_code == 200:
                booked = r.json()
                break
        assert booked, "Could not create a booking on any hour for regression"
        # cleanup
        parent_ctx[0].delete(f"{API}/bookings/{booked['id']}")

    def test_parent_sessions_and_progress_me(self, parent_ctx):
        r1 = parent_ctx[0].get(f"{API}/bookings/me")
        assert r1.status_code == 200
        r2 = parent_ctx[0].get(f"{API}/sessions/me")
        assert r2.status_code == 200
        r3 = parent_ctx[0].get(f"{API}/progress/me")
        assert r3.status_code == 200
        r4 = parent_ctx[0].get(f"{API}/fees/me")
        assert r4.status_code == 200

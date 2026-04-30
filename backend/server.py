from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import secrets
from datetime import datetime, timezone, timedelta, date
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# --------------------- Setup ---------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"

app = FastAPI(title="PitchPro Cricket Academy API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("cricket-academy")


# --------------------- Auth helpers ---------------------
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True,
                        samesite="none", max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True,
                        samesite="none", max_age=604800, path="/")


def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
        "phone": user.get("phone"),
        "kids": user.get("kids", []),
        "academy_id": user.get("academy_id"),
        "academy_name": user.get("academy_name"),
        "academy_accent_color": user.get("academy_accent_color"),
        "created_at": user.get("created_at"),
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_role(request: Request, roles: List[str]) -> dict:
    user = await get_current_user(request)
    if user.get("role") not in roles:
        raise HTTPException(status_code=403, detail="Forbidden")
    return user


async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


def scope_filter(user: dict, base: Optional[dict] = None) -> dict:
    """Build a Mongo filter scoped to user's academy unless they're platform_admin."""
    q = dict(base or {})
    if user.get("role") != "platform_admin":
        q["academy_id"] = user.get("academy_id")
    return q


def can_cross_academy(user: dict) -> bool:
    return user.get("role") == "platform_admin"


async def attach_academy_color(user_doc: dict) -> dict:
    if user_doc.get("academy_id") and not user_doc.get("academy_accent_color"):
        a = await db.academies.find_one({"id": user_doc["academy_id"]}, {"_id": 0, "accent_color": 1})
        if a:
            user_doc["academy_accent_color"] = a.get("accent_color")
    return user_doc


# --------------------- Models ---------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)
    phone: Optional[str] = None
    academy_id: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class KidIn(BaseModel):
    name: str
    age: int


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    kids: Optional[List[KidIn]] = None


class LaneIn(BaseModel):
    name: str
    surface: Literal["turf", "cement", "matting", "synthetic"] = "turf"
    indoor: bool = False
    hourly_rate: float = 25.0
    description: Optional[str] = None


class BookingIn(BaseModel):
    lane_id: str
    booking_date: str  # YYYY-MM-DD
    start_hour: int    # 6..21
    duration_hours: int = 1
    notes: Optional[str] = None


class BookingUpdate(BaseModel):
    booking_date: Optional[str] = None
    start_hour: Optional[int] = None
    duration_hours: Optional[int] = None
    notes: Optional[str] = None


class CoachIn(BaseModel):
    name: str
    title: str
    bio: str
    specialties: List[str] = []
    photo_url: Optional[str] = None
    awards: List[str] = []
    available_days: List[int] = [1, 2, 3, 4, 5]   # 0=Mon ... 6=Sun
    available_start_hour: int = 9
    available_end_hour: int = 19
    hourly_rate: float = 50.0


class SessionIn(BaseModel):
    coach_id: str
    session_date: str
    start_hour: int
    duration_hours: int = 1
    focus: Optional[str] = None
    kid_name: Optional[str] = None


class ProgressIn(BaseModel):
    user_id: str
    kid_name: str
    period_type: Literal["weekly", "monthly"]
    period_label: str  # e.g. "Week 12 - 2026" or "Feb 2026"
    coach_id: Optional[str] = None
    batting_score: int = Field(ge=0, le=100)
    bowling_score: int = Field(ge=0, le=100)
    fielding_score: int = Field(ge=0, le=100)
    fitness_score: int = Field(ge=0, le=100)
    summary: str
    strengths: List[str] = []
    areas_to_improve: List[str] = []


class GameIn(BaseModel):
    title: str
    game_date: str
    start_time: str  # HH:MM
    ground_name: str
    ground_address: str
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    team_a: List[str] = []
    team_b: List[str] = []
    notes: Optional[str] = None


class AnnouncementIn(BaseModel):
    channel: Literal["email", "whatsapp", "in-app"]
    audience: Literal["all", "coaches", "users", "single"] = "all"
    target_user_id: Optional[str] = None
    subject: str
    message: str


class FeeIn(BaseModel):
    user_id: str
    kid_name: Optional[str] = None
    label: str
    amount: float
    due_date: str  # YYYY-MM-DD
    status: Literal["pending", "paid", "overdue"] = "pending"


class AcademyIn(BaseModel):
    name: str
    slug: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    photo_url: Optional[str] = None
    accent_color: Optional[str] = None  # hex eg "#D82234"


# --------------------- Helpers ---------------------
def now_utc():
    return datetime.now(timezone.utc)


def doc_serialize(doc: dict) -> dict:
    """Strip _id and serialize datetimes for JSON."""
    if not doc:
        return doc
    out = {k: v for k, v in doc.items() if k != "_id"}
    for k, v in out.items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
    return out


# --------------------- Auth routes ---------------------
@api_router.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    academy_id = body.academy_id
    academy_name = None
    if academy_id:
        academy = await db.academies.find_one({"id": academy_id}, {"_id": 0})
        if not academy:
            raise HTTPException(status_code=404, detail="Academy not found")
        academy_name = academy["name"]
    else:
        # default to first academy if any exists, so the user has a context
        first = await db.academies.find_one({}, {"_id": 0}, sort=[("created_at", 1)])
        if first:
            academy_id = first["id"]
            academy_name = first["name"]
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name,
        "phone": body.phone,
        "role": "user",
        "kids": [],
        "academy_id": academy_id,
        "academy_name": academy_name,
        "created_at": now_utc().isoformat(),
    }
    await db.users.insert_one(user_doc)
    set_auth_cookies(response, create_access_token(user_id, email), create_refresh_token(user_id))
    return public_user(user_doc)


async def check_brute_force(identifier: str):
    record = await db.login_attempts.find_one({"identifier": identifier})
    if record and record.get("locked_until"):
        locked_until = record["locked_until"]
        if isinstance(locked_until, str):
            locked_until = datetime.fromisoformat(locked_until)
        if locked_until > now_utc():
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")


async def record_failed_attempt(identifier: str):
    record = await db.login_attempts.find_one({"identifier": identifier})
    attempts = (record or {}).get("attempts", 0) + 1
    update = {"identifier": identifier, "attempts": attempts, "last_attempt": now_utc().isoformat()}
    if attempts >= 5:
        update["locked_until"] = (now_utc() + timedelta(minutes=15)).isoformat()
        update["attempts"] = 0
    await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)


async def clear_attempts(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})


@api_router.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    await check_brute_force(identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        await record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await clear_attempts(identifier)
    set_auth_cookies(response, create_access_token(user["id"], email), create_refresh_token(user["id"]))
    user = await attach_academy_color(user)
    return public_user(user)


@api_router.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}


@api_router.get("/auth/me")
async def me(request: Request):
    user = await get_current_user(request)
    user = await attach_academy_color(user)
    return public_user(user)


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    set_auth_cookies(response, create_access_token(user["id"], user["email"]), create_refresh_token(user["id"]))
    return {"ok": True}


@api_router.put("/auth/me")
async def update_me(body: UserUpdate, request: Request):
    user = await get_current_user(request)
    update = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if "kids" in update:
        update["kids"] = [k.model_dump() if hasattr(k, "model_dump") else k for k in update["kids"]]
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return public_user(user)


# --------------------- Lanes ---------------------
@api_router.get("/lanes")
async def list_lanes(request: Request, academy_id: Optional[str] = None):
    user = await get_optional_user(request)
    q: dict = {}
    if user and user.get("role") != "platform_admin":
        q["academy_id"] = user.get("academy_id")
    elif academy_id:
        q["academy_id"] = academy_id
    lanes = await db.lanes.find(q, {"_id": 0}).to_list(500)
    return lanes


@api_router.post("/lanes")
async def create_lane(body: LaneIn, request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin"])
    lane = body.model_dump()
    lane["id"] = str(uuid.uuid4())
    lane["academy_id"] = user.get("academy_id")
    lane["created_at"] = now_utc().isoformat()
    await db.lanes.insert_one(lane)
    return doc_serialize(lane)


@api_router.delete("/lanes/{lane_id}")
async def delete_lane(lane_id: str, request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin"])
    q = {"id": lane_id}
    if not can_cross_academy(user):
        q["academy_id"] = user.get("academy_id")
    res = await db.lanes.delete_one(q)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lane not found")
    return {"ok": True}


@api_router.get("/lanes/{lane_id}/availability")
async def lane_availability(lane_id: str, target_date: str):
    """Return list of booked hours for the given date."""
    bookings = await db.bookings.find({"lane_id": lane_id, "booking_date": target_date,
                                       "status": {"$ne": "cancelled"}}, {"_id": 0}).to_list(500)
    booked_hours = []
    for b in bookings:
        for h in range(b["start_hour"], b["start_hour"] + b.get("duration_hours", 1)):
            booked_hours.append(h)
    return {"date": target_date, "booked_hours": sorted(set(booked_hours))}


# --------------------- Bookings ---------------------
def parse_booking_dt(date_str: str, hour: int) -> datetime:
    y, m, d = [int(x) for x in date_str.split("-")]
    return datetime(y, m, d, hour, 0, 0, tzinfo=timezone.utc)


async def conflict_check(lane_id: str, booking_date: str, start_hour: int,
                         duration_hours: int, exclude_id: Optional[str] = None) -> bool:
    q = {"lane_id": lane_id, "booking_date": booking_date, "status": {"$ne": "cancelled"}}
    if exclude_id:
        q["id"] = {"$ne": exclude_id}
    bookings = await db.bookings.find(q, {"_id": 0}).to_list(500)
    new_range = set(range(start_hour, start_hour + duration_hours))
    for b in bookings:
        existing = set(range(b["start_hour"], b["start_hour"] + b.get("duration_hours", 1)))
        if new_range & existing:
            return True
    return False


@api_router.post("/bookings")
async def create_booking(body: BookingIn, request: Request):
    user = await get_current_user(request)
    lane = await db.lanes.find_one({"id": body.lane_id})
    if not lane:
        raise HTTPException(status_code=404, detail="Lane not found")
    if not can_cross_academy(user) and lane.get("academy_id") != user.get("academy_id"):
        raise HTTPException(status_code=403, detail="Lane belongs to a different academy")
    if body.start_hour < 6 or body.start_hour + body.duration_hours > 22:
        raise HTTPException(status_code=400, detail="Bookings allowed between 6:00 and 22:00")
    booking_dt = parse_booking_dt(body.booking_date, body.start_hour)
    if booking_dt < now_utc() - timedelta(minutes=5):
        raise HTTPException(status_code=400, detail="Cannot book in the past")
    if await conflict_check(body.lane_id, body.booking_date, body.start_hour, body.duration_hours):
        raise HTTPException(status_code=409, detail="Slot already booked")
    booking = body.model_dump()
    booking["id"] = str(uuid.uuid4())
    booking["user_id"] = user["id"]
    booking["user_name"] = user["name"]
    booking["user_email"] = user["email"]
    booking["lane_name"] = lane["name"]
    booking["status"] = "confirmed"
    booking["total_price"] = lane["hourly_rate"] * body.duration_hours
    booking["academy_id"] = lane.get("academy_id") or user.get("academy_id")
    booking["created_at"] = now_utc().isoformat()
    await db.bookings.insert_one(booking)
    # Mock email confirmation: log notification
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": "booking_confirmed",
        "channel": "email",
        "subject": f"Lane Booking Confirmed — {lane['name']}",
        "message": f"Your booking for {lane['name']} on {body.booking_date} at {body.start_hour}:00 is confirmed.",
        "read": False,
        "created_at": now_utc().isoformat(),
    })
    return doc_serialize(booking)


@api_router.get("/bookings/me")
async def my_bookings(request: Request):
    user = await get_current_user(request)
    bookings = await db.bookings.find({"user_id": user["id"]}, {"_id": 0}).sort("booking_date", -1).to_list(500)
    return bookings


@api_router.get("/bookings")
async def all_bookings(request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin"])
    bookings = await db.bookings.find(scope_filter(user), {"_id": 0}).sort("booking_date", -1).to_list(2000)
    return bookings


@api_router.put("/bookings/{booking_id}")
async def update_booking(booking_id: str, body: BookingUpdate, request: Request):
    user = await get_current_user(request)
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["user_id"] != user["id"] and user["role"] not in ("platform_admin", "academy_admin"):
        raise HTTPException(status_code=403, detail="Not allowed")
    if booking.get("status") == "cancelled":
        raise HTTPException(status_code=400, detail="Booking already cancelled")
    booking_dt = parse_booking_dt(booking["booking_date"], booking["start_hour"])
    if booking_dt - now_utc() < timedelta(hours=24) and user["role"] not in ("platform_admin", "academy_admin"):
        raise HTTPException(status_code=400, detail="Cannot modify within 24 hours of booking")
    update = body.model_dump(exclude_none=True)
    new_date = update.get("booking_date", booking["booking_date"])
    new_hour = update.get("start_hour", booking["start_hour"])
    new_dur = update.get("duration_hours", booking["duration_hours"])
    if await conflict_check(booking["lane_id"], new_date, new_hour, new_dur, exclude_id=booking_id):
        raise HTTPException(status_code=409, detail="Slot already booked")
    if update:
        await db.bookings.update_one({"id": booking_id}, {"$set": update})
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return booking


@api_router.delete("/bookings/{booking_id}")
async def cancel_booking(booking_id: str, request: Request):
    user = await get_current_user(request)
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["user_id"] != user["id"] and user["role"] not in ("platform_admin", "academy_admin"):
        raise HTTPException(status_code=403, detail="Not allowed")
    booking_dt = parse_booking_dt(booking["booking_date"], booking["start_hour"])
    if booking_dt - now_utc() < timedelta(hours=24) and user["role"] not in ("platform_admin", "academy_admin"):
        raise HTTPException(status_code=400, detail="Cannot cancel within 24 hours")
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": "cancelled"}})
    return {"ok": True}


# --------------------- Coaches ---------------------
@api_router.get("/coaches")
async def list_coaches(request: Request, academy_id: Optional[str] = None):
    user = await get_optional_user(request)
    q: dict = {}
    if user and user.get("role") != "platform_admin":
        q["academy_id"] = user.get("academy_id")
    elif academy_id:
        q["academy_id"] = academy_id
    coaches = await db.coaches.find(q, {"_id": 0}).to_list(500)
    return coaches


@api_router.post("/coaches")
async def create_coach(body: CoachIn, request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin"])
    coach = body.model_dump()
    coach["id"] = str(uuid.uuid4())
    coach["academy_id"] = user.get("academy_id")
    coach["created_at"] = now_utc().isoformat()
    await db.coaches.insert_one(coach)
    return doc_serialize(coach)


@api_router.delete("/coaches/{coach_id}")
async def delete_coach(coach_id: str, request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin"])
    q = {"id": coach_id}
    if not can_cross_academy(user):
        q["academy_id"] = user.get("academy_id")
    res = await db.coaches.delete_one(q)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coach not found")
    return {"ok": True}


@api_router.get("/coaches/{coach_id}/availability")
async def coach_availability(coach_id: str, target_date: str):
    coach = await db.coaches.find_one({"id": coach_id}, {"_id": 0})
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    sessions = await db.sessions.find({"coach_id": coach_id, "session_date": target_date,
                                       "status": {"$ne": "cancelled"}}, {"_id": 0}).to_list(500)
    booked = []
    for s in sessions:
        for h in range(s["start_hour"], s["start_hour"] + s.get("duration_hours", 1)):
            booked.append(h)
    return {
        "date": target_date,
        "available_start_hour": coach["available_start_hour"],
        "available_end_hour": coach["available_end_hour"],
        "available_days": coach["available_days"],
        "booked_hours": sorted(set(booked)),
    }


# --------------------- 1-1 Sessions ---------------------
@api_router.post("/sessions")
async def create_session(body: SessionIn, request: Request):
    user = await get_current_user(request)
    coach = await db.coaches.find_one({"id": body.coach_id}, {"_id": 0})
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    if not can_cross_academy(user) and coach.get("academy_id") != user.get("academy_id"):
        raise HTTPException(status_code=403, detail="Coach belongs to a different academy")
    sd = datetime.strptime(body.session_date, "%Y-%m-%d")
    weekday = sd.weekday()
    if weekday not in coach["available_days"]:
        raise HTTPException(status_code=400, detail="Coach not available on this day")
    if body.start_hour < coach["available_start_hour"] or \
       body.start_hour + body.duration_hours > coach["available_end_hour"]:
        raise HTTPException(status_code=400, detail="Outside coach availability hours")
    session_dt = parse_booking_dt(body.session_date, body.start_hour)
    if session_dt < now_utc():
        raise HTTPException(status_code=400, detail="Cannot book in the past")
    # Conflict check
    existing = await db.sessions.find({"coach_id": body.coach_id, "session_date": body.session_date,
                                       "status": {"$ne": "cancelled"}}, {"_id": 0}).to_list(500)
    new_range = set(range(body.start_hour, body.start_hour + body.duration_hours))
    for s in existing:
        if new_range & set(range(s["start_hour"], s["start_hour"] + s.get("duration_hours", 1))):
            raise HTTPException(status_code=409, detail="Slot already booked")
    sess = body.model_dump()
    sess["id"] = str(uuid.uuid4())
    sess["user_id"] = user["id"]
    sess["user_name"] = user["name"]
    sess["coach_name"] = coach["name"]
    sess["status"] = "confirmed"
    sess["total_price"] = coach["hourly_rate"] * body.duration_hours
    sess["academy_id"] = coach.get("academy_id") or user.get("academy_id")
    sess["created_at"] = now_utc().isoformat()
    await db.sessions.insert_one(sess)
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": "session_confirmed",
        "channel": "email",
        "subject": f"1-1 Session Confirmed with {coach['name']}",
        "message": f"Your 1-1 session with {coach['name']} on {body.session_date} at {body.start_hour}:00 is confirmed.",
        "read": False,
        "created_at": now_utc().isoformat(),
    })
    return doc_serialize(sess)


@api_router.get("/sessions/me")
async def my_sessions(request: Request):
    user = await get_current_user(request)
    sessions = await db.sessions.find({"user_id": user["id"]}, {"_id": 0}).sort("session_date", -1).to_list(500)
    return sessions


@api_router.get("/sessions")
async def all_sessions(request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin", "coach"])
    q = scope_filter(user)
    if user["role"] == "coach":
        q["coach_id"] = user.get("coach_id")
    sessions = await db.sessions.find(q, {"_id": 0}).sort("session_date", -1).to_list(500)
    return sessions


@api_router.delete("/sessions/{session_id}")
async def cancel_session(session_id: str, request: Request):
    user = await get_current_user(request)
    sess = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    if sess["user_id"] != user["id"] and user["role"] not in ("platform_admin", "academy_admin"):
        raise HTTPException(status_code=403, detail="Not allowed")
    session_dt = parse_booking_dt(sess["session_date"], sess["start_hour"])
    if session_dt - now_utc() < timedelta(hours=24) and user["role"] not in ("platform_admin", "academy_admin"):
        raise HTTPException(status_code=400, detail="Cannot cancel within 24 hours")
    await db.sessions.update_one({"id": session_id}, {"$set": {"status": "cancelled"}})
    return {"ok": True}


# --------------------- Kids progress ---------------------
@api_router.post("/progress")
async def create_progress(body: ProgressIn, request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin", "coach"])
    target = await db.users.find_one({"id": body.user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Parent user not found")
    if not can_cross_academy(user) and target.get("academy_id") != user.get("academy_id"):
        raise HTTPException(status_code=403, detail="User belongs to a different academy")
    progress = body.model_dump()
    progress["id"] = str(uuid.uuid4())
    progress["academy_id"] = target.get("academy_id")
    progress["created_at"] = now_utc().isoformat()
    progress["user_email"] = target["email"]
    progress["user_name"] = target["name"]
    await db.progress.insert_one(progress)
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": body.user_id,
        "type": "progress_report",
        "channel": "email",
        "subject": f"Progress Report — {body.kid_name} ({body.period_label})",
        "message": body.summary,
        "read": False,
        "created_at": now_utc().isoformat(),
    })
    return doc_serialize(progress)


@api_router.get("/progress/me")
async def my_progress(request: Request):
    user = await get_current_user(request)
    items = await db.progress.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api_router.get("/progress")
async def all_progress(request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin", "coach"])
    items = await db.progress.find(scope_filter(user), {"_id": 0}).sort("created_at", -1).to_list(2000)
    return items


# --------------------- Weekly Games ---------------------
@api_router.get("/games")
async def list_games(request: Request, academy_id: Optional[str] = None):
    user = await get_optional_user(request)
    q: dict = {}
    if user and user.get("role") != "platform_admin":
        q["academy_id"] = user.get("academy_id")
    elif academy_id:
        q["academy_id"] = academy_id
    items = await db.games.find(q, {"_id": 0}).sort("game_date", 1).to_list(500)
    return items


@api_router.post("/games")
async def create_game(body: GameIn, request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin", "coach"])
    g = body.model_dump()
    g["id"] = str(uuid.uuid4())
    g["academy_id"] = user.get("academy_id")
    g["created_at"] = now_utc().isoformat()
    await db.games.insert_one(g)
    return doc_serialize(g)


@api_router.delete("/games/{game_id}")
async def delete_game(game_id: str, request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin"])
    q = {"id": game_id}
    if not can_cross_academy(user):
        q["academy_id"] = user.get("academy_id")
    res = await db.games.delete_one(q)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Game not found")
    return {"ok": True}


@api_router.post("/games/{game_id}/notify")
async def notify_game(game_id: str, request: Request):
    """Mocks WhatsApp + email: creates notification entries for all users in this academy."""
    user = await require_role(request, ["platform_admin", "academy_admin", "coach"])
    game = await db.games.find_one({"id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if not can_cross_academy(user) and game.get("academy_id") != user.get("academy_id"):
        raise HTTPException(status_code=403, detail="Game belongs to a different academy")
    user_query = {"role": "user"}
    if game.get("academy_id"):
        user_query["academy_id"] = game.get("academy_id")
    users = await db.users.find(user_query, {"_id": 0}).to_list(2000)
    msg = (f"Weekly Game: {game['title']} on {game['game_date']} at {game['start_time']}. "
           f"Ground: {game['ground_name']}, {game['ground_address']}.")
    sent = 0
    for u in users:
        for ch in ["email", "whatsapp", "in-app"]:
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": u["id"],
                "type": "game_announcement",
                "channel": ch,
                "subject": f"Weekly Game — {game['title']}",
                "message": msg,
                "game_id": game_id,
                "read": False,
                "created_at": now_utc().isoformat(),
            })
        sent += 1
    return {"ok": True, "recipients": sent, "channels": ["email", "whatsapp", "in-app"], "mocked": True}


# --------------------- Announcements (mock WhatsApp + Email) ---------------------
@api_router.post("/announcements")
async def create_announcement(body: AnnouncementIn, request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin", "coach"])
    targets: List[dict] = []
    base_q: dict = {}
    if not can_cross_academy(user):
        base_q["academy_id"] = user.get("academy_id")
    if body.audience == "single":
        if not body.target_user_id:
            raise HTTPException(status_code=400, detail="target_user_id required")
        q = {"id": body.target_user_id, **base_q}
        u = await db.users.find_one(q, {"_id": 0})
        if u:
            targets.append(u)
    elif body.audience == "coaches":
        targets = await db.users.find({"role": "coach", **base_q}, {"_id": 0}).to_list(1000)
    elif body.audience == "users":
        targets = await db.users.find({"role": "user", **base_q}, {"_id": 0}).to_list(1000)
    else:
        targets = await db.users.find({"role": {"$in": ["user", "coach"]}, **base_q}, {"_id": 0}).to_list(2000)
    ann_id = str(uuid.uuid4())
    await db.announcements.insert_one({
        "id": ann_id,
        "academy_id": user.get("academy_id"),
        "channel": body.channel,
        "audience": body.audience,
        "subject": body.subject,
        "message": body.message,
        "recipients": [t["id"] for t in targets],
        "created_at": now_utc().isoformat(),
        "mocked": body.channel in ("email", "whatsapp"),
    })
    for t in targets:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": t["id"],
            "type": "announcement",
            "channel": body.channel,
            "subject": body.subject,
            "message": body.message,
            "read": False,
            "created_at": now_utc().isoformat(),
        })
    return {"ok": True, "id": ann_id, "recipients": len(targets), "mocked": body.channel in ("email", "whatsapp")}


@api_router.get("/announcements")
async def list_announcements(request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin", "coach"])
    items = await db.announcements.find(scope_filter(user), {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


# --------------------- Notifications ---------------------
@api_router.get("/notifications/me")
async def my_notifications(request: Request):
    user = await get_current_user(request)
    items = await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api_router.post("/notifications/{notif_id}/read")
async def mark_read(notif_id: str, request: Request):
    user = await get_current_user(request)
    await db.notifications.update_one(
        {"id": notif_id, "user_id": user["id"]}, {"$set": {"read": True}}
    )
    return {"ok": True}


# --------------------- Awards ---------------------
@api_router.get("/awards")
async def list_awards():
    items = await db.awards.find({}, {"_id": 0}).sort("year", -1).to_list(200)
    return items


# --------------------- Academies (multi-tenant platform) ---------------------
@api_router.get("/academies")
async def list_academies():
    academies = await db.academies.find({}, {"_id": 0}).sort("created_at", 1).to_list(500)
    for a in academies:
        a["players_count"] = await db.users.count_documents({"academy_id": a["id"], "role": "user"})
        a["lanes_count"] = await db.lanes.count_documents({"academy_id": a["id"]})
        a["coaches_count"] = await db.coaches.count_documents({"academy_id": a["id"]})
    return academies


@api_router.get("/academies/{academy_id}")
async def get_academy(academy_id: str):
    a = await db.academies.find_one({"id": academy_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Academy not found")
    a["players_count"] = await db.users.count_documents({"academy_id": academy_id, "role": "user"})
    return a


@api_router.post("/academies")
async def create_academy(body: AcademyIn, request: Request):
    await require_role(request, ["platform_admin"])
    if await db.academies.find_one({"slug": body.slug}):
        raise HTTPException(status_code=400, detail="Slug already exists")
    a = body.model_dump()
    a["id"] = str(uuid.uuid4())
    a["created_at"] = now_utc().isoformat()
    await db.academies.insert_one(a)
    return doc_serialize(a)


# --------------------- Fees ---------------------
@api_router.get("/fees/me")
async def my_fees(request: Request):
    user = await get_current_user(request)
    items = await db.fees.find({"user_id": user["id"]}, {"_id": 0}).sort("due_date", -1).to_list(500)
    return items


@api_router.get("/fees")
async def list_fees(request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin", "coach"])
    items = await db.fees.find(scope_filter(user), {"_id": 0}).sort("due_date", -1).to_list(2000)
    return items


@api_router.post("/fees")
async def create_fee(body: FeeIn, request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin"])
    target = await db.users.find_one({"id": body.user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if not can_cross_academy(user) and target.get("academy_id") != user.get("academy_id"):
        raise HTTPException(status_code=403, detail="User belongs to a different academy")
    fee = body.model_dump()
    fee["id"] = str(uuid.uuid4())
    fee["academy_id"] = target.get("academy_id")
    fee["user_email"] = target["email"]
    fee["user_name"] = target["name"]
    fee["created_at"] = now_utc().isoformat()
    await db.fees.insert_one(fee)
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": body.user_id,
        "type": "fee_added",
        "channel": "in-app",
        "subject": f"New invoice — {body.label}",
        "message": f"Amount ${body.amount:.2f} due {body.due_date}.",
        "read": False,
        "created_at": now_utc().isoformat(),
    })
    return doc_serialize(fee)


@api_router.put("/fees/{fee_id}/mark-paid")
async def mark_fee_paid(fee_id: str, request: Request):
    await require_role(request, ["platform_admin", "academy_admin"])
    res = await db.fees.update_one({"id": fee_id}, {"$set": {"status": "paid", "paid_at": now_utc().isoformat()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Fee not found")
    return {"ok": True}


@api_router.delete("/fees/{fee_id}")
async def delete_fee(fee_id: str, request: Request):
    await require_role(request, ["platform_admin", "academy_admin"])
    res = await db.fees.delete_one({"id": fee_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fee not found")
    return {"ok": True}


# --------------------- Staff (academy) views ---------------------
@api_router.get("/staff/lane-usage")
async def staff_lane_usage(target_date: str, request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin", "coach"])
    lane_q: dict = {}
    booking_q: dict = {"booking_date": target_date, "status": {"$ne": "cancelled"}}
    if not can_cross_academy(user):
        lane_q["academy_id"] = user.get("academy_id")
        booking_q["academy_id"] = user.get("academy_id")
    lanes = await db.lanes.find(lane_q, {"_id": 0}).to_list(500)
    bookings = await db.bookings.find(booking_q, {"_id": 0}).to_list(2000)
    out = []
    for l in lanes:
        slots = []
        for b in bookings:
            if b["lane_id"] != l["id"]:
                continue
            for h in range(b["start_hour"], b["start_hour"] + b.get("duration_hours", 1)):
                slots.append({"hour": h, "user_name": b.get("user_name"),
                              "user_email": b.get("user_email"),
                              "booking_id": b["id"], "duration": b.get("duration_hours", 1)})
        out.append({**l, "slots": sorted(slots, key=lambda x: x["hour"])})
    return out


@api_router.get("/staff/coach-usage")
async def staff_coach_usage(target_date: str, request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin", "coach"])
    coach_q: dict = {}
    session_q: dict = {"session_date": target_date, "status": {"$ne": "cancelled"}}
    if not can_cross_academy(user):
        coach_q["academy_id"] = user.get("academy_id")
        session_q["academy_id"] = user.get("academy_id")
    coaches = await db.coaches.find(coach_q, {"_id": 0}).to_list(500)
    sessions = await db.sessions.find(session_q, {"_id": 0}).to_list(2000)
    sd = datetime.strptime(target_date, "%Y-%m-%d")
    weekday = sd.weekday()
    out = []
    for c in coaches:
        slots = []
        for s in sessions:
            if s["coach_id"] != c["id"]:
                continue
            for h in range(s["start_hour"], s["start_hour"] + s.get("duration_hours", 1)):
                slots.append({"hour": h, "user_name": s.get("user_name"),
                              "kid_name": s.get("kid_name"), "focus": s.get("focus"),
                              "session_id": s["id"]})
        out.append({**c, "slots": sorted(slots, key=lambda x: x["hour"]),
                    "available_today": weekday in c.get("available_days", [])})
    return out


# --------------------- Admin ---------------------
@api_router.get("/admin/charts")
async def admin_charts(request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin"])
    today = datetime.now(timezone.utc).date()
    days: List[str] = [(today - timedelta(days=i)).isoformat() for i in range(13, -1, -1)]
    sf = scope_filter(user)
    bookings = await db.bookings.find(sf, {"_id": 0}).to_list(5000)
    sessions = await db.sessions.find(sf, {"_id": 0}).to_list(5000)
    lane_q = {} if can_cross_academy(user) else {"academy_id": user.get("academy_id")}
    lanes = await db.lanes.find(lane_q, {"_id": 0}).to_list(500)
    coaches = await db.coaches.find(lane_q, {"_id": 0}).to_list(500)

    # Bookings & sessions per day (last 14 days)
    booking_by_day = {d: 0 for d in days}
    session_by_day = {d: 0 for d in days}
    revenue_by_day = {d: 0.0 for d in days}
    for b in bookings:
        if b.get("status") == "cancelled":
            continue
        d = b.get("booking_date")
        if d in booking_by_day:
            booking_by_day[d] += 1
            revenue_by_day[d] += float(b.get("total_price", 0))
    for s in sessions:
        if s.get("status") == "cancelled":
            continue
        d = s.get("session_date")
        if d in session_by_day:
            session_by_day[d] += 1
            revenue_by_day[d] += float(s.get("total_price", 0))
    timeseries = [{"date": d[5:], "bookings": booking_by_day[d],
                   "sessions": session_by_day[d], "revenue": round(revenue_by_day[d], 2)}
                  for d in days]

    # Lane utilization
    lane_counts = {l["id"]: {"name": l["name"], "bookings": 0, "revenue": 0.0} for l in lanes}
    for b in bookings:
        if b.get("status") == "cancelled":
            continue
        if b["lane_id"] in lane_counts:
            lane_counts[b["lane_id"]]["bookings"] += 1
            lane_counts[b["lane_id"]]["revenue"] += float(b.get("total_price", 0))
    lane_chart = list(lane_counts.values())

    # Coach session counts
    coach_counts = {c["id"]: {"name": c["name"], "sessions": 0} for c in coaches}
    for s in sessions:
        if s.get("status") == "cancelled":
            continue
        if s["coach_id"] in coach_counts:
            coach_counts[s["coach_id"]]["sessions"] += 1
    coach_chart = list(coach_counts.values())

    # Role mix
    user_q: dict = {} if can_cross_academy(user) else {"academy_id": user.get("academy_id")}
    user_roles = await db.users.aggregate([{"$match": user_q}, {"$group": {"_id": "$role", "count": {"$sum": 1}}}]).to_list(20)
    role_chart = [{"role": r["_id"], "count": r["count"]} for r in user_roles]

    return {
        "timeseries": timeseries,
        "lanes": lane_chart,
        "coaches": coach_chart,
        "roles": role_chart,
    }


@api_router.get("/admin/users")
async def admin_users(request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin", "coach"])
    users = await db.users.find(scope_filter(user), {"_id": 0, "password_hash": 0}).to_list(2000)
    return users


@api_router.get("/admin/stats")
async def admin_stats(request: Request):
    user = await require_role(request, ["platform_admin", "academy_admin"])
    sf = scope_filter(user)
    lane_q = {} if can_cross_academy(user) else {"academy_id": user.get("academy_id")}
    today = datetime.now(timezone.utc).date()
    thirty_ago = (today - timedelta(days=30)).isoformat()

    # Revenue (last 30d) & outstanding fees (all-time pending/overdue)
    rev_pipeline_b = [
        {"$match": {**sf, "status": {"$ne": "cancelled"}, "booking_date": {"$gte": thirty_ago}}},
        {"$group": {"_id": None, "t": {"$sum": "$total_price"}}},
    ]
    rev_pipeline_s = [
        {"$match": {**sf, "status": {"$ne": "cancelled"}, "session_date": {"$gte": thirty_ago}}},
        {"$group": {"_id": None, "t": {"$sum": "$total_price"}}},
    ]
    outstanding_p = [
        {"$match": {**sf, "status": {"$in": ["pending", "overdue"]}}},
        {"$group": {"_id": None, "t": {"$sum": "$amount"}}},
    ]

    async def _sum(coll, pipeline):
        res = await db[coll].aggregate(pipeline).to_list(1)
        return float(res[0]["t"]) if res else 0.0

    rev_b = await _sum("bookings", rev_pipeline_b)
    rev_s = await _sum("sessions", rev_pipeline_s)
    outstanding = await _sum("fees", outstanding_p)

    return {
        "users": await db.users.count_documents(sf),
        "lanes": await db.lanes.count_documents(lane_q),
        "coaches": await db.coaches.count_documents(lane_q),
        "bookings_active": await db.bookings.count_documents({**sf, "status": "confirmed"}),
        "sessions_active": await db.sessions.count_documents({**sf, "status": "confirmed"}),
        "progress_reports": await db.progress.count_documents(sf),
        "games": await db.games.count_documents(lane_q),
        "revenue_30d": round(rev_b + rev_s, 2),
        "outstanding_fees": round(outstanding, 2),
    }


# --------------------- Platform-level (cross-academy) Console ---------------------
@api_router.get("/platform/stats")
async def platform_stats(request: Request):
    """Cross-academy KPIs for the PitchPro super-admin console."""
    await require_role(request, ["platform_admin"])
    today = datetime.now(timezone.utc).date()
    thirty_ago = (today - timedelta(days=30)).isoformat()

    total_academies = await db.academies.count_documents({})
    total_players = await db.users.count_documents({"role": "user"})
    total_coaches = await db.coaches.count_documents({})
    total_lanes = await db.lanes.count_documents({})
    total_bookings_30d = await db.bookings.count_documents(
        {"status": {"$ne": "cancelled"}, "booking_date": {"$gte": thirty_ago}}
    )
    total_sessions_30d = await db.sessions.count_documents(
        {"status": {"$ne": "cancelled"}, "session_date": {"$gte": thirty_ago}}
    )

    # Revenue = confirmed bookings + confirmed sessions (last 30d) + paid fees (last 30d)
    rev_pipeline_bookings = [
        {"$match": {"status": {"$ne": "cancelled"}, "booking_date": {"$gte": thirty_ago}}},
        {"$group": {"_id": None, "t": {"$sum": "$total_price"}}},
    ]
    rev_pipeline_sessions = [
        {"$match": {"status": {"$ne": "cancelled"}, "session_date": {"$gte": thirty_ago}}},
        {"$group": {"_id": None, "t": {"$sum": "$total_price"}}},
    ]
    fee_pipeline_paid = [
        {"$match": {"status": "paid"}},
        {"$group": {"_id": None, "t": {"$sum": "$amount"}}},
    ]
    fee_pipeline_outstanding = [
        {"$match": {"status": {"$in": ["pending", "overdue"]}}},
        {"$group": {"_id": None, "t": {"$sum": "$amount"}}},
    ]

    async def _sum(coll, pipeline):
        res = await db[coll].aggregate(pipeline).to_list(1)
        return float(res[0]["t"]) if res else 0.0

    rev_bookings = await _sum("bookings", rev_pipeline_bookings)
    rev_sessions = await _sum("sessions", rev_pipeline_sessions)
    rev_fees_paid = await _sum("fees", fee_pipeline_paid)
    outstanding = await _sum("fees", fee_pipeline_outstanding)

    gmv_30d = rev_bookings + rev_sessions

    # New players & new academies in last 30 days
    new_players_30d = await db.users.count_documents({"role": "user", "created_at": {"$gte": thirty_ago}})
    new_academies_30d = await db.academies.count_documents({"created_at": {"$gte": thirty_ago}})

    # Active academies = any academy that had a booking or session in last 30d
    active_ids = set()
    async for b in db.bookings.find(
        {"status": {"$ne": "cancelled"}, "booking_date": {"$gte": thirty_ago}},
        {"_id": 0, "academy_id": 1},
    ):
        if b.get("academy_id"):
            active_ids.add(b["academy_id"])
    async for s in db.sessions.find(
        {"status": {"$ne": "cancelled"}, "session_date": {"$gte": thirty_ago}},
        {"_id": 0, "academy_id": 1},
    ):
        if s.get("academy_id"):
            active_ids.add(s["academy_id"])

    return {
        "total_academies": total_academies,
        "active_academies_30d": len(active_ids),
        "total_players": total_players,
        "total_coaches": total_coaches,
        "total_lanes": total_lanes,
        "bookings_30d": total_bookings_30d,
        "sessions_30d": total_sessions_30d,
        "gmv_30d": round(gmv_30d, 2),
        "fees_collected_lifetime": round(rev_fees_paid, 2),
        "outstanding_fees": round(outstanding, 2),
        "new_players_30d": new_players_30d,
        "new_academies_30d": new_academies_30d,
    }


@api_router.get("/platform/academies")
async def platform_academies(request: Request):
    """Per-academy leaderboard metrics for the platform admin."""
    await require_role(request, ["platform_admin"])
    today = datetime.now(timezone.utc).date()
    thirty_ago = (today - timedelta(days=30)).isoformat()

    academies = await db.academies.find({}, {"_id": 0}).to_list(500)
    # Pre-fetch counts/revenues per academy
    players_agg = await db.users.aggregate(
        [{"$match": {"role": "user"}}, {"$group": {"_id": "$academy_id", "c": {"$sum": 1}}}]
    ).to_list(500)
    coaches_agg = await db.coaches.aggregate([{"$group": {"_id": "$academy_id", "c": {"$sum": 1}}}]).to_list(500)
    lanes_agg = await db.lanes.aggregate([{"$group": {"_id": "$academy_id", "c": {"$sum": 1}}}]).to_list(500)

    bookings_rev = await db.bookings.aggregate([
        {"$match": {"status": {"$ne": "cancelled"}, "booking_date": {"$gte": thirty_ago}}},
        {"$group": {"_id": "$academy_id", "c": {"$sum": 1}, "r": {"$sum": "$total_price"}}},
    ]).to_list(500)
    sessions_rev = await db.sessions.aggregate([
        {"$match": {"status": {"$ne": "cancelled"}, "session_date": {"$gte": thirty_ago}}},
        {"$group": {"_id": "$academy_id", "c": {"$sum": 1}, "r": {"$sum": "$total_price"}}},
    ]).to_list(500)
    outstanding = await db.fees.aggregate([
        {"$match": {"status": {"$in": ["pending", "overdue"]}}},
        {"$group": {"_id": "$academy_id", "t": {"$sum": "$amount"}}},
    ]).to_list(500)

    def _map(docs, k="c"):
        return {d["_id"]: d.get(k, 0) for d in docs if d.get("_id")}

    players_map = _map(players_agg)
    coaches_map = _map(coaches_agg)
    lanes_map = _map(lanes_agg)
    br_c, br_r = _map(bookings_rev, "c"), _map(bookings_rev, "r")
    sr_c, sr_r = _map(sessions_rev, "c"), _map(sessions_rev, "r")
    outstanding_map = _map(outstanding, "t")

    out = []
    for a in academies:
        aid = a["id"]
        revenue_30d = float(br_r.get(aid, 0)) + float(sr_r.get(aid, 0))
        out.append({
            "id": aid,
            "name": a["name"],
            "slug": a.get("slug"),
            "city": a.get("city"),
            "accent_color": a.get("accent_color"),
            "players": players_map.get(aid, 0),
            "coaches": coaches_map.get(aid, 0),
            "lanes": lanes_map.get(aid, 0),
            "bookings_30d": br_c.get(aid, 0),
            "sessions_30d": sr_c.get(aid, 0),
            "revenue_30d": round(revenue_30d, 2),
            "outstanding_fees": round(float(outstanding_map.get(aid, 0)), 2),
            "active": (br_c.get(aid, 0) + sr_c.get(aid, 0)) > 0,
        })
    # Sort by revenue desc
    out.sort(key=lambda x: x["revenue_30d"], reverse=True)
    return out


@api_router.get("/platform/timeseries")
async def platform_timeseries(request: Request):
    """GMV per day across the whole platform for the last 30 days."""
    await require_role(request, ["platform_admin"])
    today = datetime.now(timezone.utc).date()
    days = [(today - timedelta(days=i)).isoformat() for i in range(29, -1, -1)]
    rev = {d: 0.0 for d in days}
    bookings = {d: 0 for d in days}
    sessions = {d: 0 for d in days}

    async for b in db.bookings.find(
        {"status": {"$ne": "cancelled"}, "booking_date": {"$gte": days[0]}},
        {"_id": 0, "booking_date": 1, "total_price": 1},
    ):
        d = b.get("booking_date")
        if d in rev:
            rev[d] += float(b.get("total_price", 0))
            bookings[d] += 1
    async for s in db.sessions.find(
        {"status": {"$ne": "cancelled"}, "session_date": {"$gte": days[0]}},
        {"_id": 0, "session_date": 1, "total_price": 1},
    ):
        d = s.get("session_date")
        if d in rev:
            rev[d] += float(s.get("total_price", 0))
            sessions[d] += 1

    return [
        {"date": d[5:], "revenue": round(rev[d], 2), "bookings": bookings[d], "sessions": sessions[d]}
        for d in days
    ]


# --------------------- Seed & Startup ---------------------
async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Academy Admin",
            "phone": None,
            "role": "platform_admin",
            "kids": [],
            "created_at": now_utc().isoformat(),
        })
        logger.info(f"Seeded admin {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password),
                                            "role": "platform_admin"}})
        logger.info("Updated admin password from env")
    elif existing.get("role") != "platform_admin":
        await db.users.update_one({"email": admin_email}, {"$set": {"role": "platform_admin"}})


async def seed_test_user():
    email = "user@cricketacademy.com"
    if not await db.users.find_one({"email": email}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hash_password("User@12345"),
            "name": "Veer Hanumaan",
            "phone": "+15551234567",
            "role": "user",
            "kids": [{"name": "Veer Hanumaan", "age": 11}, {"name": "Diya Sharma", "age": 9}],
            "created_at": now_utc().isoformat(),
        })


async def seed_coach_user():
    email = "coach@cricketacademy.com"
    if not await db.users.find_one({"email": email}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hash_password("Coach@12345"),
            "name": "Coach Vikram",
            "phone": None,
            "role": "coach",
            "kids": [],
            "created_at": now_utc().isoformat(),
        })


async def seed_lanes():
    if await db.lanes.count_documents({}) > 0:
        return
    lanes = [
        {"name": "Lane 1 — Pace Pitch", "surface": "turf", "indoor": False,
         "hourly_rate": 30.0, "description": "Outdoor turf, ideal for fast bowlers."},
        {"name": "Lane 2 — Spin Track", "surface": "matting", "indoor": False,
         "hourly_rate": 28.0, "description": "Matting wicket with extra turn for spinners."},
        {"name": "Lane 3 — Indoor A", "surface": "synthetic", "indoor": True,
         "hourly_rate": 35.0, "description": "Climate controlled indoor synthetic lane."},
        {"name": "Lane 4 — Indoor B", "surface": "synthetic", "indoor": True,
         "hourly_rate": 35.0, "description": "Indoor lane with bowling machine."},
        {"name": "Lane 5 — Cement Strip", "surface": "cement", "indoor": False,
         "hourly_rate": 22.0, "description": "Hard cement strip for power hitting drills."},
    ]
    for l in lanes:
        l["id"] = str(uuid.uuid4())
        l["created_at"] = now_utc().isoformat()
    await db.lanes.insert_many(lanes)


async def seed_coaches():
    if await db.coaches.count_documents({}) > 0:
        return
    coaches = [
        {"name": "Vikram Rathore", "title": "Head Coach — Batting",
         "bio": "Former first-class batter with 15+ years coaching elite junior talent. Known for technique correction and mental conditioning.",
         "specialties": ["Batting Technique", "Match Tactics", "Mental Game"],
         "photo_url": "https://images.unsplash.com/photo-1593766788306-28561086694e?crop=entropy&cs=srgb&fm=jpg&w=800&q=85",
         "awards": ["State Coach of the Year 2023", "Level 3 ICC Certified"],
         "available_days": [0, 1, 2, 3, 4], "available_start_hour": 9,
         "available_end_hour": 19, "hourly_rate": 60.0},
        {"name": "Priya Menon", "title": "Bowling Specialist",
         "bio": "Ex-national pacer with deep experience in swing and seam bowling. Coaches kids 8-16 in fast bowling fundamentals.",
         "specialties": ["Pace Bowling", "Swing", "Fitness"],
         "photo_url": "https://images.unsplash.com/photo-1599058917212-d750089bc07e?crop=entropy&cs=srgb&fm=jpg&w=800&q=85",
         "awards": ["NCA Level 2", "Best Junior Coach 2022"],
         "available_days": [1, 2, 3, 4, 5], "available_start_hour": 10,
         "available_end_hour": 20, "hourly_rate": 55.0},
        {"name": "Arjun Bhatia", "title": "Spin & Fielding Coach",
         "bio": "Specialist in finger and wrist spin. Three-time Ranji Trophy winner. Drills emphasize agility and reflex training.",
         "specialties": ["Spin Bowling", "Fielding Drills", "Agility"],
         "photo_url": "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?crop=entropy&cs=srgb&fm=jpg&w=800&q=85",
         "awards": ["Ranji Champion 2018, 2019, 2021"],
         "available_days": [2, 3, 4, 5, 6], "available_start_hour": 8,
         "available_end_hour": 18, "hourly_rate": 50.0},
    ]
    for c in coaches:
        c["id"] = str(uuid.uuid4())
        c["created_at"] = now_utc().isoformat()
    await db.coaches.insert_many(coaches)


async def seed_awards():
    if await db.awards.count_documents({}) > 0:
        return
    awards = [
        {"title": "Best Junior Cricket Academy", "issuer": "State Cricket Association", "year": 2024,
         "description": "Recognised for producing five state-level U-16 players in a single season."},
        {"title": "Excellence in Coaching", "issuer": "National Sports Council", "year": 2023,
         "description": "Awarded for highest pass rate in Level 2 coach certifications."},
        {"title": "Community Impact Award", "issuer": "City Sports Foundation", "year": 2023,
         "description": "Free weekend clinics for underprivileged youth, reaching 200+ children."},
        {"title": "U-14 Regional Champions", "issuer": "Inter-Academy League", "year": 2022,
         "description": "Academy team won the regional U-14 title, undefeated all season."},
    ]
    for a in awards:
        a["id"] = str(uuid.uuid4())
    await db.awards.insert_many(awards)


async def seed_games():
    if await db.games.count_documents({}) > 0:
        return
    today = datetime.now(timezone.utc).date()
    # Find next Saturday and Sunday
    days_to_sat = (5 - today.weekday()) % 7
    if days_to_sat == 0:
        days_to_sat = 7
    next_sat = today + timedelta(days=days_to_sat)
    next_sun = next_sat + timedelta(days=1)
    games = [
        {"title": "Weekend Friendly — Reds vs Greens",
         "game_date": next_sat.isoformat(), "start_time": "09:00",
         "ground_name": "Academy Main Ground",
         "ground_address": "12 Stadium Lane, Sportsville",
         "gps_lat": 12.9716, "gps_lng": 77.5946,
         "team_a": ["Veer Hanumaan", "Kabir Khan", "Reyansh Patel", "Vivaan Iyer", "Atharv Joshi"],
         "team_b": ["Ishaan Mehta", "Aryan Verma", "Vihaan Reddy", "Diya Sharma", "Anika Roy"],
         "notes": "Bring whites, water, and a positive attitude!"},
        {"title": "U-12 Sunday League — Round 4",
         "game_date": next_sun.isoformat(), "start_time": "08:30",
         "ground_name": "East Field",
         "ground_address": "Academy East Campus, Sportsville",
         "gps_lat": 12.9750, "gps_lng": 77.6010,
         "team_a": ["Reyansh Patel", "Kiaan Singh", "Aarush Nair", "Vihaan Reddy", "Veer Hanumaan"],
         "team_b": ["Atharv Joshi", "Ishaan Mehta", "Vivaan Iyer", "Aryan Verma", "Kabir Khan"],
         "notes": "Coloured kits — Yellow vs Blue."},
    ]
    for g in games:
        g["id"] = str(uuid.uuid4())
        g["created_at"] = now_utc().isoformat()
    await db.games.insert_many(games)


async def seed_academies():
    existing = await db.academies.count_documents({}) > 0
    if existing:
        # still ensure legacy docs are backfilled when academy_id is missing or null
        first = await db.academies.find_one({}, {"_id": 0}, sort=[("created_at", 1)])
        if first:
            first_id = first["id"]
            first_name = first["name"]
            flt = {"$or": [{"academy_id": {"$exists": False}}, {"academy_id": None}]}
            await db.users.update_many(
                {**flt, "role": {"$in": ["user", "coach", "admin", "platform_admin", "academy_admin"]}},
                {"$set": {"academy_id": first_id, "academy_name": first_name}},
            )
            for coll in ["lanes", "coaches", "games", "bookings", "sessions",
                         "progress", "fees", "announcements"]:
                await db[coll].update_many(flt, {"$set": {"academy_id": first_id}})
        return
    items = [
        {"name": "Pyare Mohan Academy", "slug": "pyaremohan",
         "tagline": "Where talent meets technique.",
         "description": "Founded in 2014 by former first-class players. Home of the U-14 regional champions and the flagship demo academy on PitchPro.",
         "city": "Sportsville", "address": "12 Stadium Lane, Sportsville",
         "phone": "+91 90000 11111", "email": "hello@pyaremohan.in",
         "photo_url": "https://images.pexels.com/photos/30671893/pexels-photo-30671893.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
         "accent_color": "#D82234"},
        {"name": "Boundary Line Academy", "slug": "boundaryline",
         "tagline": "Hit. Move. Repeat.",
         "description": "Indoor + outdoor T20-focused academy with bowling-machine lanes and video analysis suite.",
         "city": "Mumbai", "address": "Plot 7, Andheri Sports Complex",
         "phone": "+91 90000 22222", "email": "hello@boundaryline.in",
         "photo_url": "https://images.pexels.com/photos/30401509/pexels-photo-30401509.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
         "accent_color": "#F59E0B"},
        {"name": "Stumps & Co.", "slug": "stumps",
         "tagline": "Classical coaching for modern cricketers.",
         "description": "Boutique academy with 1-1 mentorship, technique-first batting and red-ball specialisation. Founded by ex-Ranji captains.",
         "city": "Bangalore", "address": "Cubbon Park East Wing",
         "phone": "+91 90000 33333", "email": "hello@stumps.cc",
         "photo_url": "https://images.unsplash.com/photo-1675693303492-9a5bc898bf94?crop=entropy&cs=srgb&fm=jpg&w=800&q=85",
         "accent_color": "#10B981"},
    ]
    for a in items:
        a["id"] = str(uuid.uuid4())
        a["created_at"] = now_utc().isoformat()
    await db.academies.insert_many(items)
    # backfill seeded users to first academy
    first_id = items[0]["id"]
    first_name = items[0]["name"]
    await db.users.update_many(
        {"role": {"$in": ["user", "coach", "admin", "platform_admin", "academy_admin"]},
         "academy_id": {"$exists": False}},
        {"$set": {"academy_id": first_id, "academy_name": first_name}}
    )
    # backfill all other domain collections to first academy
    for coll in ["lanes", "coaches", "games", "bookings", "sessions",
                 "progress", "fees", "announcements"]:
        await db[coll].update_many(
            {"academy_id": {"$exists": False}},
            {"$set": {"academy_id": first_id}}
        )


async def seed_academy_admins():
    """Create one academy_admin user per academy if missing."""
    academies = await db.academies.find({}, {"_id": 0}).to_list(500)
    for a in academies:
        admin_email = (a.get("email") or f"admin@{a['slug']}.pitchpro").lower()
        # do not overwrite if it already exists
        if await db.users.find_one({"email": admin_email}):
            continue
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password("AcaAdmin@1"),
            "name": f"{a['name']} Admin",
            "phone": a.get("phone"),
            "role": "academy_admin",
            "kids": [],
            "academy_id": a["id"],
            "academy_name": a["name"],
            "created_at": now_utc().isoformat(),
        })


async def seed_demo_activity():
    """Seed sample bookings, sessions and fees so charts have data on first run."""
    if await db.fees.count_documents({}) > 0:
        return
    user = await db.users.find_one({"email": "user@cricketacademy.com"}, {"_id": 0})
    lanes = await db.lanes.find({}, {"_id": 0}).to_list(20)
    coaches = await db.coaches.find({}, {"_id": 0}).to_list(20)
    if not (user and lanes and coaches):
        return
    today = datetime.now(timezone.utc).date()
    # Past 12 days of bookings (synthetic, in past so won't conflict)
    bookings = []
    for i in range(12, 0, -1):
        d = today - timedelta(days=i)
        lane = lanes[i % len(lanes)]
        b = {
            "id": str(uuid.uuid4()),
            "lane_id": lane["id"], "lane_name": lane["name"],
            "user_id": user["id"], "user_name": user["name"], "user_email": user["email"],
            "booking_date": d.isoformat(),
            "start_hour": 9 + (i % 6),
            "duration_hours": 1,
            "notes": "",
            "status": "confirmed",
            "total_price": float(lane["hourly_rate"]),
            "created_at": now_utc().isoformat(),
        }
        bookings.append(b)
    if bookings:
        await db.bookings.insert_many(bookings)

    sessions = []
    for i in range(10, 0, -1):
        d = today - timedelta(days=i)
        coach = coaches[i % len(coaches)]
        if d.weekday() not in coach.get("available_days", []):
            continue
        s = {
            "id": str(uuid.uuid4()),
            "coach_id": coach["id"], "coach_name": coach["name"],
            "user_id": user["id"], "user_name": user["name"],
            "kid_name": (user.get("kids") or [{}])[0].get("name", ""),
            "session_date": d.isoformat(),
            "start_hour": 11 + (i % 5),
            "duration_hours": 1,
            "focus": "Technique",
            "status": "confirmed",
            "total_price": float(coach.get("hourly_rate", 50)),
            "created_at": now_utc().isoformat(),
        }
        sessions.append(s)
    if sessions:
        await db.sessions.insert_many(sessions)

    # Sample fees for the test user
    fees = [
        {"id": str(uuid.uuid4()), "user_id": user["id"],
         "user_name": user["name"], "user_email": user["email"],
         "kid_name": "Veer Hanumaan", "label": "Monthly Coaching — Feb 2026",
         "amount": 320.0, "due_date": (today - timedelta(days=2)).isoformat(),
         "status": "paid", "paid_at": now_utc().isoformat(),
         "created_at": now_utc().isoformat()},
        {"id": str(uuid.uuid4()), "user_id": user["id"],
         "user_name": user["name"], "user_email": user["email"],
         "kid_name": "Veer Hanumaan", "label": "Monthly Coaching — Mar 2026",
         "amount": 320.0, "due_date": (today + timedelta(days=10)).isoformat(),
         "status": "pending", "created_at": now_utc().isoformat()},
        {"id": str(uuid.uuid4()), "user_id": user["id"],
         "user_name": user["name"], "user_email": user["email"],
         "kid_name": "Diya Sharma", "label": "Equipment Kit", "amount": 120.0,
         "due_date": (today + timedelta(days=5)).isoformat(),
         "status": "pending", "created_at": now_utc().isoformat()},
    ]
    await db.fees.insert_many(fees)

    # Sample progress reports
    progress_items = []
    for i, label in enumerate(["Week 9 - 2026", "Week 10 - 2026", "Week 11 - 2026"]):
        progress_items.append({
            "id": str(uuid.uuid4()),
            "user_id": user["id"], "user_name": user["name"], "user_email": user["email"],
            "kid_name": "Veer Hanumaan", "period_type": "weekly",
            "period_label": label, "coach_id": coaches[0]["id"],
            "batting_score": 65 + i * 4, "bowling_score": 60 + i * 3,
            "fielding_score": 70 + i * 2, "fitness_score": 72 + i * 3,
            "summary": "Strong improvement in stance and footwork. Continues to commit to drills.",
            "strengths": ["Front-foot drive", "Match temperament"],
            "areas_to_improve": ["Pull shot", "Stamina in long sessions"],
            "created_at": (now_utc() - timedelta(days=21 - i * 7)).isoformat(),
        })
    await db.progress.insert_many(progress_items)


@app.on_event("startup")
async def on_startup():
    try:
        await db.users.create_index("email", unique=True)
        await db.lanes.create_index("name")
        await db.bookings.create_index([("lane_id", 1), ("booking_date", 1)])
        await db.sessions.create_index([("coach_id", 1), ("session_date", 1)])
        await db.notifications.create_index("user_id")
    except Exception as e:
        logger.warning(f"Index creation issue: {e}")
    await seed_admin()
    await seed_test_user()
    await seed_coach_user()
    await seed_lanes()
    await seed_coaches()
    await seed_awards()
    await seed_academies()
    await seed_academy_admins()
    await seed_games()
    await seed_demo_activity()


@api_router.get("/")
async def root():
    return {"message": "PitchPro Cricket Academy API"}


# Include the router in the main app
app.include_router(api_router)

# CORS — credentials require explicit origin (or list)
cors_origins_env = os.environ.get('CORS_ORIGINS', '*')
frontend_url = os.environ.get('FRONTEND_URL', '')
origins: List[str] = []
if cors_origins_env and cors_origins_env != "*":
    origins = [o.strip() for o in cors_origins_env.split(',') if o.strip()]
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

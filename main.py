from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from passlib.hash import bcrypt
import os

app = FastAPI()

# ---------- CORS Configuration ----------
# During local development, allow all. For production, restrict to your frontend domains.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use ["*"] for local; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Supabase Setup ----------
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://qfdhtoxzdnnfbnhkzkyb.supabase.co")
SUPABASE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGh0b3h6ZG5uZmJuaGt6a3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ4MjUzMiwiZXhwIjoyMDc2MDU4NTMyfQ.GlYjWYOYQB3f_IF7dfjO8M8wWgQy5s-Xcrz1sEXQqno"
)

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"❌ Error connecting to Supabase: {e}")
    supabase = None


@app.get("/")
def root():
    return {"message": "✅ FastAPI backend running successfully!"}


# ---------- Register ----------
@app.post("/register")
async def register(request: Request):
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    hashed_password = bcrypt.hash(password)

    try:
        response = supabase.table("users").insert({
            "email": email,
            "password": hashed_password
        }).execute()
        if response.data:
            return {"message": "✅ User registered successfully!"}
        raise HTTPException(status_code=400, detail="Registration failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Login ----------
@app.post("/login")
async def login(request: Request):
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    try:
        response = supabase.table("users").select("*").eq("email", email).execute()
        users = response.data

        if not users:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user = users[0]
        if bcrypt.verify(password, user["password"]):
            return {"message": "✅ Login successful", "email": email}
        raise HTTPException(status_code=401, detail="Invalid email or password")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Form Submit ----------
@app.post("/submit-form")
async def submit_form(request: Request):
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    data = await request.json()
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    gender = data.get("gender")

    if not all([name, email, phone, gender]):
        raise HTTPException(status_code=400, detail="All fields are required!")

    try:
        response = supabase.table("person_details").insert({
            "name": name,
            "email": email,
            "phone": phone,
            "gender": gender
        }).execute()

        if response.data:
            return {"message": "✅ Form submitted successfully!"}
        raise HTTPException(status_code=400, detail="Failed to submit form.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Fetch All ----------
@app.get("/all-users")
def all_users():
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    try:
        response = supabase.table("person_details").select("*").execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Health Check ----------
@app.get("/check-db")
def check_db():
    if supabase is None:
        return {"status": "disconnected", "error": "Database not connected"}
    try:
        response = supabase.table("users").select("*").limit(1).execute()
        return {"status": "connected", "data": response.data}
    except Exception as e:
        return {"status": "error", "error": str(e)}

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from passlib.hash import bcrypt
import os

app = FastAPI()

# ---------- CORS configuration ----------
origins = [
    "https://qa-development-site.onrender.com",  # backend
    "https://qa-development-site.vercel.app",    # frontend
    "http://localhost:3000",                     # local frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # ["*"] for testing only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Supabase setup ----------
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://qfdhtoxzdnnfbnhkzkyb.supabase.co")
SUPABASE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGh0b3h6ZG5uZmJuaGt6a3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ4MjUzMiwiZXhwIjoyMDc2MDU4NTMyfQ.GlYjWYOYQB3f_IF7dfjO8M8wWgQy5s-Xcrz1sEXQqno"  # replace in production
)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ---------- Root ----------
@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI backend with Supabase!"}


# ---------- Register (optional) ----------
@app.post("/register")
async def register(request: Request):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    hashed_password = bcrypt.hash(password)

    try:
        response = supabase.table("users").insert({
            "email": email,
            "password": hashed_password
        }).select("*").execute()

        if response.data:
            return {"message": "User registered successfully!"}
        else:
            raise HTTPException(status_code=400, detail="Registration failed.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase error: {str(e)}")


# ---------- Login ----------
@app.post("/login")
async def login(request: Request):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    try:
        response = supabase.table("users").select("*").eq("email", email).execute()
        users = response.data

        if not users:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        user = users[0]

        if bcrypt.verify(password, user["password"]):
            return {"message": "Login successful!"}
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase error: {str(e)}")


# ---------- Form Submission ----------
@app.post("/submit-form")
async def submit_form(request: Request):
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
        }).select("*").execute()

        if response.data:
            return {"message": "Form submitted successfully!"}
        else:
            raise HTTPException(status_code=400, detail="Failed to submit form.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase error: {str(e)}")


# ---------- Fetch All Users ----------
@app.get("/all-users")
def all_users():
    try:
        response = supabase.table("person_details").select("*").execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase error: {str(e)}")


# ---------- Health Check ----------
@app.get("/check-db")
def check_db():
    try:
        response = supabase.table("users").select("*").limit(1).execute()
        return {"status": "connected", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

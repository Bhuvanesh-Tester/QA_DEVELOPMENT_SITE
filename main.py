# main.py (Full Update - Security Note Added)

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from passlib.hash import bcrypt
import os
# Recommended: Use Pydantic models for request bodies instead of Request and await request.json()

app = FastAPI()

# ---------- CORS (Configuration is correct based on your provided URLs) ----------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://qa-development-site.vercel.app",  # Your Vercel frontend URL
    "https://qa-development-site.onrender.com" # Your Render backend URL (if accessing a local instance of the backend from the deployed backend URL, which is unlikely)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ---------- Supabase (SECURITY WARNING: Key should be ONLY in environment variables) ----------
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://qfdhtoxzdnnfbnhkzkyb.supabase.co")
SUPABASE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    # WARNING: THIS KEY IS VISIBLE IN GITHUB/CODE. USE OS.GETENV ONLY.
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGh0b3h6ZG5uZmJuaGt6a3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ4MjUzMiwiZXhwIjoyMDc2MDU4NTMyfQ.GlYjWYOYQB3f_IF7dfjO8M8wWgQy5s-Xcrz1sEXQqno"
)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------- Root ----------
@app.get("/")
def root():
    return {"message": "✅ FastAPI backend running successfully!"}

# ---------- Register ----------
@app.post("/register")
async def register(request: Request):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    # Using passlib's bcrypt hash
    hashed_password = bcrypt.hash(password)

    try:
        response = supabase.table("users").insert({
            "email": email,
            "password": hashed_password
        }).execute()

        # Supabase will return data=[] if insert fails on unique constraint, 
        # but execute() raises an exception if there's a database error.
        if response.data:
            return {"message": "User registered successfully!"}
        # If response.data is [] and no exception, it might be due to RLS or other configuration.
        raise HTTPException(status_code=400, detail="Registration failed (check RLS or unique constraint).")
    except Exception as e:
        # Check for specific database error messages if needed (e.g., unique violation)
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
        response = supabase.table("users").select("password").eq("email", email).execute()
        users = response.data
        if not users:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        user = users[0]
        if bcrypt.verify(password, user["password"]):
            # NOTE: For a real app, you would generate and return a JWT here.
            return {"message": "Login successful!", "email": email}
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
        }).execute()

        if response.data:
            return {"message": "Form submitted successfully!"}
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
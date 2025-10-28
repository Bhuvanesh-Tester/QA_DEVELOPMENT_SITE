# main.py
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

# -----------------------------
# CORS setup (React frontend)
# -----------------------------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Supabase REST credentials
# -----------------------------
SUPABASE_URL = "https://qfdhtoxzdnnfbnhkzkyb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGh0b3h6ZG5uZmJuaGt6a3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ4MjUzMiwiZXhwIjoyMDc2MDU4NTMyfQ.GlYjWYOYQB3f_IF7dfjO8M8wWgQy5s-Xcrz1sEXQqno"

# -----------------------------
# Root route
# -----------------------------
@app.get("/")
def home():
    return {"message": "Backend is live!"}

# -----------------------------
# Login route with debug prints
# -----------------------------
@app.post("/login")
async def login(request: Request):
    try:
        data = await request.json()
        email = data.get("email")
        password = data.get("password")

        # Debug print: show received credentials
        print("Login attempt received:")
        print("Email:", email)
        print("Password:", password)

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password are required")

        # Fetch user from Supabase users table
        res = requests.get(
            f"{SUPABASE_URL}/rest/v1/users?email=eq.{email}",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json"
            },
            timeout=10
        )

        # Debug print: Supabase response
        print("Supabase response status code:", res.status_code)
        print("Supabase response JSON:", res.json())

        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail="Failed to fetch user")

        users = res.json()

        if not users:
            print("No user found with this email")
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user = users[0]

        # Debug print: password in database vs input
        print("Password in database:", user.get("password"))
        print("Password entered:", password)

        if user.get("password") != password:
            print("Password mismatch")
            raise HTTPException(status_code=401, detail="Invalid email or password")

        print("Login successful for user:", email)

        return {
            "message": "Login successful",
            "user": {
                "id": user.get("id"),
                "email": user.get("email")
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print("Unexpected error:", e)
        raise HTTPException(status_code=400, detail="Unexpected server error")

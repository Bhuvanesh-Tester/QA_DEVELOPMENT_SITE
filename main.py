from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import requests
import os

app = FastAPI()

# -----------------------------
# CORS setup
# -----------------------------
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Supabase config
# -----------------------------
SUPABASE_URL = "https://qfdhtoxzdnnfbnhkzkyb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGh0b3h6ZG5uZmJuaGt6a3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ4MjUzMiwiZXhwIjoyMDc2MDU4NTMyfQ.GlYjWYOYQB3f_IF7dfjO8M8wWgQy5s-Xcrz1sEXQqno"  # use SERVICE_ROLE_KEY

# -----------------------------
# Async login route using REST
# -----------------------------
@app.post("/login")
async def login(request: Request):
    try:
        data = await request.json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password are required")

        # Query Supabase REST API users table
        res = requests.get(
            f"{SUPABASE_URL}/rest/v1/users?email=eq.{email}",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
            }
        )

        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail="Failed to fetch users")

        users = res.json()

        if users and users[0].get("password") == password:
            # You can return the user ID/email
            return {
                "message": "Login successful",
                "user": {
                    "id": users[0]["id"],
                    "email": users[0]["email"]
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

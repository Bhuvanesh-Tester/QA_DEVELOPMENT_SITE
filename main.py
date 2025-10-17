from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os

app = FastAPI()
origins = [
    "https://qa-development-site.onrender.com",  # backend
    "https://qa-development-site.vercel.app",    # frontend (no trailing slash)
    "http://localhost:3000",                     # local frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # or use ["*"] for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://qfdhtoxzdnnfbnhkzkyb.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGh0b3h6ZG5uZmJuaGt6a3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ4MjUzMiwiZXhwIjoyMDc2MDU4NTMyfQ.GlYjWYOYQB3f_IF7dfjO8M8wWgQy5s-Xcrz1sEXQqno")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI backend with Supabase!"}


# ✅ Register endpoint (no password hashing)
@app.post("/register")
async def register(request: Request):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    try:
        response = supabase.table("users").insert({
            "email": email,
            "password": password
        }).execute()

        if response.data:
            return {"message": "User registered successfully!"}
        else:
            return {"message": "Registration failed."}
    except Exception as e:
        return {"message": f"Supabase error: {str(e)}"}


# ✅ Login endpoint
@app.post("/login")
async def login(request: Request):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    try:
        response = supabase.table("users").select("*").eq("email", email).execute()
        users = response.data

        if not users:
            return {"message": "Invalid email or password."}

        user = users[0]

        if password == user["password"]:
            return {"message": "Login successful!"}
        else:
            return {"message": "Invalid email or password."}

    except Exception as e:
        return {"message": f"Supabase error: {str(e)}"}


# ✅ Health check route
@app.get("/check-db")
def check_db():
    try:
        response = supabase.table("users").select("*").limit(1).execute()
        return {"status": "connected", "data": response.data}
    except Exception as e:
        return {"status": "failed", "error": str(e)}

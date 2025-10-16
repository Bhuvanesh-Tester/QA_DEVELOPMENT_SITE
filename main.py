from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from passlib.hash import bcrypt  # Optional: for secure password hashing

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SUPABASE_URL = os.getenv("SUPABASE_URL", "https://xyz.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "YOUR_SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI backend with Supabase!"}

@app.post("/register")
async def register(request: Request):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    
    hashed_password = bcrypt.hash(password)

    try:
        response = supabase.table("users").insert({
            "email": email,
            "password": hashed_password
        }).execute()

        if response.data:
            return {"message": "User registered successfully!"}
        else:
            return {"message": "Registration failed."}
    except Exception as e:
        return {"message": f"Supabase error: {str(e)}"}


@app.post("/login")
async def login(request: Request):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    try:
        # Fetch user by email
        response = supabase.table("users").select("*").eq("email", email).execute()
        users = response.data

        if not users:
            return {"message": "Invalid email or password."}

        user = users[0]

        # Verify hashed password
        if bcrypt.verify(password, user["password"]):
            return {"message": "Login successful!"}
        else:
            return {"message": "Invalid email or password."}

    except Exception as e:
        return {"message": f"Supabase error: {str(e)}"}


from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from passlib.hash import bcrypt
import os
from pydantic import BaseModel # New Import for data validation

# --- Pydantic Models for Request Body Validation ---
class AuthData(BaseModel):
    """Model for Login and Registration requests."""
    email: str
    password: str

class FormData(BaseModel):
    """Model for Form Submission requests."""
    name: str
    email: str
    phone: str
    gender: str

app = FastAPI()

# -------------------------------------------------------------------------------------------------
# ---------- CORS Configuration ----------
# -------------------------------------------------------------------------------------------------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://qa-development-site.vercel.app", 
    "https://qa-development-site.onrender.com" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# -------------------------------------------------------------------------------------------------
# ---------- Supabase Client Initialization ----------
# -------------------------------------------------------------------------------------------------
# SECURITY WARNING: Keys should ONLY be set in the deployment environment variables (Render).
# Hardcoding here is ONLY for local development fallback, but is a security risk in public repos.
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://qfdhtoxzdnnfbnhkzkyb.supabase.co")
SUPABASE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    # Replace with your actual key or ensure it is ONLY in environment variables
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGh0b3h6ZG5uZmJuaGt6a3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ4MjUzMiwiZXhwIjoyMDc2MDU4NTMyfQ.GlYjWYOYQB3f_IF7dfjO8M8wWgQy5s-Xcrz1sEXQqno"
)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# -------------------------------------------------------------------------------------------------
# ---------- API Routes ----------
# -------------------------------------------------------------------------------------------------

@app.get("/")
def root():
    return {"message": "✅ FastAPI backend running successfully!"}

# ---------- Register ----------
# Using Pydantic model for automatic validation
@app.post("/register")
async def register(auth_data: AuthData): 
    # Password validation is now handled by Pydantic's BaseModel
    
    hashed_password = bcrypt.hash(auth_data.password)

    try:
        response = supabase.table("users").insert({
            "email": auth_data.email,
            "password": hashed_password
        }).execute()

        if response.data:
            return {"message": "User registered successfully!"}
        
        # Default registration failure check
        raise HTTPException(status_code=400, detail="Registration failed. Check RLS or database configuration.")
        
    except Exception as e:
        error_message = str(e)
        # Catch specific error code for unique constraint violation (e.g., email already exists)
        if "unique" in error_message.lower():
            raise HTTPException(status_code=409, detail="User with this email already exists.")
        
        # General Supabase/Database error
        raise HTTPException(status_code=500, detail=f"Database Error: {error_message}")


# ---------- Login ----------
# Using Pydantic model for automatic validation
@app.post("/login")
async def login(auth_data: AuthData): 
    
    try:
        response = supabase.table("users").select("password").eq("email", auth_data.email).execute()
        users = response.data
        
        if not users:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        user = users[0]
        # Check if the submitted password matches the stored hash
        if bcrypt.verify(auth_data.password, user["password"]):
            return {"message": "Login successful!", "email": auth_data.email}
            
        # If bcrypt verification fails
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    except Exception as e:
        # If the error is related to a bad hash format (as seen before)
        if "not a valid bcrypt hash" in str(e):
             raise HTTPException(status_code=401, detail="Invalid email or password.") # Use a generic message for security
             
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

# ---------- Form Submission ----------
# Using Pydantic model for automatic validation
@app.post("/submit-form")
async def submit_form(form_data: FormData): 

    try:
        response = supabase.table("person_details").insert({
            "name": form_data.name,
            "email": form_data.email,
            "phone": form_data.phone,
            "gender": form_data.gender
        }).execute()

        if response.data:
            return {"message": "Form submitted successfully!"}
            
        raise HTTPException(status_code=400, detail="Failed to submit form.")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

# ---------- Fetch All Users (Debug/Testing Route) ----------
@app.get("/all-users")
def all_users():
    # NOTE: In a real application, this route must be protected!
    try:
        response = supabase.table("person_details").select("*").execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")
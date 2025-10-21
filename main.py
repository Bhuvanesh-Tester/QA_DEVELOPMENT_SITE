import os
import json
import bcrypt
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional

# --- Supabase Configuration ---
# NOTE: We use os.environ.get() to safely read these from Render's environment variables.
# The values you provided are hardcoded here for reference, but MUST be set in Render.
# If running locally, you must use a .env file or export these variables.
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://qfdhtoxzdnnfbnhkzkyb.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGh0b3h6ZG5uZmJuaGt6a3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ4MjUzMiwiZXhwIjoyMDc2MDU4NTMyfQ.GlYjWYOYQB3f_IF7dfjO8M8wWgQy5s-Xcrz1sEXQqno")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("FATAL: Supabase URL or Key not found in environment variables.")
    # In a real app, you'd raise an error here. For local testing flexibility, we continue.

try:
    from supabase import create_client, Client
    # Initialize the Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    # Define the table names used in your database schema (from your screenshots)
    USERS_TABLE = "users"
    DETAILS_TABLE = "person_details"
    print("✅ Supabase client initialized.")
except ImportError:
    print("WARNING: Supabase or associated packages not installed. Running in-memory (TEMPORARY).")
    supabase = None
    USERS_TABLE = None
    DETAILS_TABLE = None

# --- Configuration (FastAPI) ---
origins = [
    "*", 
    "https://qa-development-site.onrender.com"
]

# --- Pydantic Data Models ---
class UserIn(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class MessageResponse(BaseModel):
    message: str

class FormDataIn(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    phone: str = Field(..., min_length=10)
    gender: str

class AllUsersResponse(BaseModel):
    data: List[Dict[str, Any]]
    message: str


# --- FastAPI App Initialization ---
app = FastAPI(
    title="QA Development Site API",
    description="Backend with Supabase Authentication and Form Submission"
)

# Apply CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Utility Functions ---

def hash_password(password: str) -> str:
    """Hashes a password using bcrypt."""
    # bcrypt generates its own salt and hashes in one go
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    return hashed

def check_password(password: str, hashed_password: str) -> bool:
    """Checks a plaintext password against a bcrypt hash."""
    try:
        # Check the password. It handles salting internally.
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        # Catches the "not a valid bcrypt hash" error if the stored password is plaintext or corrupted
        return False

# --- Endpoints ---

@app.get("/", response_model=MessageResponse)
async def root():
    """Health check endpoint."""
    return {"message": "Server is running and healthy, connected to Supabase."}

@app.post("/register", response_model=MessageResponse)
async def register_user(user: UserIn):
    """Registers a new user in Supabase with a hashed password."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error.")

    # 1. Check if user already exists
    response = supabase.table(USERS_TABLE).select("email").eq("email", user.email).execute()
    if response.data:
        raise HTTPException(status_code=400, detail="User already exists.")
    
    # 2. Hash the password
    hashed_pass = hash_password(user.password)
    
    # 3. Insert into Supabase
    data_to_insert = {
        "email": user.email,
        "password": hashed_pass
    }
    
    response = supabase.table(USERS_TABLE).insert(data_to_insert).execute()
    
    if response.data:
        print(f"✅ Registered new user in Supabase: {user.email}")
        return {"message": "Registration successful! Please proceed to login."}
    else:
        print(f"❌ Supabase registration failed for {user.email}. Error: {response.error}")
        raise HTTPException(status_code=500, detail="Database registration failed.")


@app.post("/login", response_model=MessageResponse)
async def login_user(user: UserIn):
    """Authenticates an existing user against the hashed password in Supabase."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error.")

    # 1. Fetch the user's data (specifically the hashed password)
    response = supabase.table(USERS_TABLE).select("password").eq("email", user.email).execute()
    
    if not response.data:
        # User not found
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    # 2. Get the stored hashed password
    stored_hash = response.data[0]["password"]
    
    # 3. Check the provided password against the stored hash
    if not check_password(user.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    print(f"✅ User logged in from Supabase: {user.email}")
    return {"message": f"Login successful for user: {user.email}"}


@app.post("/submit-form", response_model=MessageResponse)
async def submit_form_data(form_data: FormDataIn):
    """Receives and stores person details in Supabase."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection error.")

    data_to_insert = form_data.model_dump()
    
    # Insert into the person_details table
    response = supabase.table(DETAILS_TABLE).insert(data_to_insert).execute()
    
    if response.data:
        print(f"💾 Form submitted to Supabase by {form_data.email}.")
        return {"message": f"Form data saved successfully for {form_data.email}."}
    else:
        print(f"❌ Supabase form submission failed for {form_data.email}. Error: {response.error}")
        raise HTTPException(status_code=500, detail="Database submission failed.")


@app.get("/all-users", response_model=AllUsersResponse)
async def get_all_users():
    """Returns all stored form data from Supabase."""
    if not supabase:
        # This will only happen if the import failed.
        return {"message": "Database not connected. Returning no data.", "data": []}
        
    # Fetch all data from the details table
    response = supabase.table(DETAILS_TABLE).select("*").execute()
    
    if response.data is not None:
        data_count = len(response.data)
        return {
            "message": f"Successfully retrieved {data_count} user submissions from Supabase.",
            "data": response.data
        }
    else:
        print(f"❌ Supabase fetch failed. Error: {response.error}")
        raise HTTPException(status_code=500, detail="Could not retrieve data from database.")

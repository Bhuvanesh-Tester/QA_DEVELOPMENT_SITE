import os
import bcrypt
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any

# --- Supabase Configuration ---
# NOTE: Replace with your actual credentials if they have changed or are not set as environment variables.
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://qfdhtoxzdnnfbnhkzkyb.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGh0b3h6ZG5uZmJuaGt6a3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ4MjUzMiwiZXhwIjoyMDc2MDU4NTMyfQ.GlYjWYOYQB3f_IF7dfjO8M8wWgQy5s-Xcrz1sEXQqno")

# Initialize variables
supabase = None
USERS_TABLE = "users"
QA_TABLE = "qa_reports"

def init_supabase():
    """Initialize Supabase client with error handling"""
    global supabase
    try:
        # Only import if not already imported
        if supabase is None:
            from supabase import create_client, Client
            print(f"Attempting to connect to Supabase at {SUPABASE_URL}")
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            # Test connection with a lightweight query
            supabase.table(USERS_TABLE).select("count").limit(1).execute()
        return True
    except ImportError as ie:
        print(f"WARNING: Supabase import failed - check installation: {str(ie)}")
        return False
    except Exception as e:
        print(f"WARNING: Supabase connection issue - will retry later: {str(e)}")
        return False

# Initialize Supabase client
if not init_supabase():
    print("WARNING: Application will start with limited functionality.")
else:
    print("✅ Supabase client initialized successfully.")

# --- Configuration (FastAPI) ---
# Configure CORS settings
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "https://qa-development-site.onrender.com",  # Add your Render.com domain
    "https://qa-development-site.onrender.com:3000",  # Add frontend URL if different
    "*",  # During development only - remove for production
]

# --- Pydantic Data Models ---
class UserIn(BaseModel):
    """Model for user login and registration."""
    email: str 
    password: str 

class MessageResponse(BaseModel):
    """Standard model for simple API messages."""
    message: str | dict

class DebugResponse(BaseModel):
    """Model for debug endpoint response."""
    status: str
    config: dict
    database_status: str

class QaReportIn(BaseModel):
    """Model for QA submission data."""
    project_name: str = Field(..., min_length=2)
    test_case_id: str = Field(..., min_length=1)
    status: str = Field(..., pattern="^(Pass|Fail|Blocked)$") # Ensures valid status
    notes: str
    tested_by: str # Email of the logged-in user

class AllQaReportsResponse(BaseModel):
    """Model for retrieving all QA reports."""
    data: List[Dict[str, Any]]
    message: str

# --- FastAPI App Initialization ---
app = FastAPI(
    title="QA Data Entry & Auth API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    root_path=os.environ.get("ROOT_PATH", ""),  # For deployment behind a proxy
)

# Event handlers for startup and shutdown
@app.on_event("startup")
async def startup_event():
    """Initialize connections and resources on startup"""
    print("Starting up the application...")
    try:
        if not init_supabase():
            print("WARNING: Starting without Supabase connection - will retry on endpoint calls")
        else:
            print("Supabase client initialized successfully")
    except Exception as e:
        print(f"Startup warning - Supabase initialization deferred: {str(e)}")
        # Continue startup even if Supabase init fails - we'll retry on endpoint calls

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    print("Shutting down the application...")

# Apply CORS Middleware with more detailed configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"]
)

# --- Utility Functions ---
def hash_password(password: str) -> bytes:
    """Hashes a password using bcrypt."""
    try:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    except Exception as e:
        print(f"Error hashing password: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing password")

def check_db_connection():
    """Ensures Supabase connection is available, attempts to initialize if needed."""
    global supabase
    try:
        if not supabase and not init_supabase():
            raise HTTPException(
                status_code=503, 
                detail="Database temporarily unavailable. Please try again in a few moments."
            )
        # Quick connection test
        supabase.table(USERS_TABLE).select("count").limit(1).execute()
        return True
    except Exception as e:
        print(f"Database connection warning: {str(e)}")
        # Try to reinitialize
        if init_supabase():
            return True
        raise HTTPException(
            status_code=503,
            detail="Database connection unavailable. Please try again shortly."
        )

# --- Endpoints ---

@app.get("/", response_model=MessageResponse)
async def root():
    """Health check endpoint."""
    try:
        check_db_connection()
        return {"message": "FastAPI Server is running and connected to Supabase."}
    except HTTPException as he:
        print(f"Health check warning - {he.detail}")
        return {"message": f"Server is running (DB status: {he.detail})"}
    except Exception as e:
        print(f"Health check error: {str(e)}")
        return {"message": "Server is running (DB status: connection checking failed)"}

@app.get("/debug")
async def debug_info():
    """Debug endpoint to check configuration."""
    try:
        # Test database connection
        db_status = "Not Connected"
        if supabase:
            try:
                # Try a simple query to test connection
                supabase.table(USERS_TABLE).select("*").limit(1).execute()
                db_status = "Connected"
            except Exception as db_error:
                db_status = f"Error: {str(db_error)}"

        return {
            "status": "ok",
            "config": {
                "supabase_url": SUPABASE_URL,
                "tables_configured": {"users": USERS_TABLE is not None, "qa": QA_TABLE is not None},
                "cors_origins": origins
            },
            "database_status": db_status
        }
    except Exception as e:
        return {
            "status": "error",
            "config": {},
            "database_status": f"Error: {str(e)}"
        }

@app.post("/register", response_model=MessageResponse)
async def register_user(user: UserIn):
    """Registers a new user."""
    try:
        print(f"Attempting to register user with email: {user.email}")
        check_db_connection()
        
        # Check if user exists
        print("Checking if user exists...")
        response = supabase.table(USERS_TABLE).select("email").eq("email", user.email).execute()
        if response.data: 
            print(f"User with email {user.email} already exists")
            raise HTTPException(status_code=400, detail="User already exists.")
        
        # Hash password and create user
        print("Hashing password...")
        hashed_pass = hash_password(user.password)
        data_to_insert = {"email": user.email, "password": hashed_pass}
        
        print("Inserting new user into database...")
        result = supabase.table(USERS_TABLE).insert(data_to_insert).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        print(f"Successfully registered user: {user.email}")
        return {"message": "Registration successful! Please proceed to login."}
        
    except HTTPException as he:
        print(f"HTTP error during registration: {str(he)}")
        raise he
    except Exception as e:
        print(f"Unexpected error during registration: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.post("/login", response_model=MessageResponse)
async def login_user(user: UserIn):
    """Authenticates a user."""
    check_db_connection()
    response = supabase.table(USERS_TABLE).select("password").eq("email", user.email).execute()
    
    if not response.data: 
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    stored_password = response.data[0]["password"]
    
    try:
        # Check if the provided password matches the stored hash
        if isinstance(stored_password, str):
            stored_password = stored_password.encode('utf-8')
        if bcrypt.checkpw(user.password.encode('utf-8'), stored_password):
            return {"message": f"Login successful for user: {user.email}"}
    except (ValueError, TypeError):
        # If there's an error with the hash, return invalid credentials
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    raise HTTPException(status_code=401, detail="Invalid email or password.")


@app.post("/submit-report", response_model=MessageResponse)
async def submit_qa_report(report: QaReportIn):
    """Saves a new QA report to the database."""
    check_db_connection()

    data_to_insert = report.model_dump()
    # Supabase will automatically set 'created_at' if configured
    response = supabase.table(QA_TABLE).insert(data_to_insert).execute()
    
    if response.data:
        return {"message": f"QA Report for {report.project_name} submitted successfully."}
    else:
        raise HTTPException(status_code=500, detail=f"Database submission failed.")


@app.get("/all-reports", response_model=AllQaReportsResponse)
async def get_all_reports():
    """Retrieves all QA reports, ordered by ID descending (newest first)."""
    check_db_connection()
        
    # Order by ID descending to get the newest reports first
    response = supabase.table(QA_TABLE).select("*").order("id", desc=True).execute()
    
    if response.data is not None:
        return {
            "message": f"Successfully retrieved {len(response.data)} QA reports.",
            "data": response.data
        }
    else:
        # If response.error exists, throw a detailed error
        if hasattr(response, 'error') and response.error:
             raise HTTPException(status_code=500, detail=f"Could not retrieve data: {response.error.get('message', 'Unknown database error')}")
        # Otherwise, assume no data found
        return {"message": "No reports found.", "data": []}

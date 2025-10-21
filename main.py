import json
from fastapi import FastAPI, HTTPException, Body, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional

# --- Configuration ---
# CORS configuration to allow the front-end to communicate with the back-end.
# For production, replace "*" with the actual front-end origin URL.
origins = [
    "*", 
    "https://qa-development-site.onrender.com" # Allow the Render URL as well
]

# --- In-Memory Database (Data lost on server restart) ---
# Simulating a database for user accounts
user_database: Dict[EmailStr, Dict[str, str]] = {}
# Simulating a database for form submissions
form_data_database: List[Dict[str, str]] = []

# --- Pydantic Data Models ---

class UserIn(BaseModel):
    """Model for incoming login and registration requests."""
    email: EmailStr
    # In a real application, passwords should be securely hashed (e.g., using bcrypt)
    password: str = Field(..., min_length=6)

class MessageResponse(BaseModel):
    """Generic response model for status messages."""
    message: str

class FormDataIn(BaseModel):
    """Model for incoming form submission data."""
    name: str = Field(..., min_length=2)
    email: EmailStr
    phone: str = Field(..., min_length=10)
    gender: str

class AllUsersResponse(BaseModel):
    """Model for the response containing all form data."""
    data: List[Dict[str, Any]]
    message: str


# --- FastAPI App Initialization ---

app = FastAPI(
    title="QA Development Site API",
    description="Backend for User Authentication and Form Submission"
)

# Apply CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Endpoints ---

@app.get("/", response_model=MessageResponse)
async def root():
    """Health check endpoint."""
    return {"message": "Server is running and healthy."}

@app.post("/register", response_model=MessageResponse)
async def register_user(user: UserIn):
    """Registers a new user."""
    if user.email in user_database:
        raise HTTPException(status_code=400, detail="User already exists.")
    
    # Store user (in a real app, hash the password!)
    user_database[user.email] = {"email": user.email, "password": user.password}
    print(f"✅ Registered new user: {user.email}")
    return {"message": "Registration successful!"}

@app.post("/login", response_model=MessageResponse)
async def login_user(user: UserIn):
    """Authenticates an existing user."""
    if user.email not in user_database:
        raise HTTPException(status_code=404, detail="User not found.")
    
    stored_user = user_database[user.email]
    
    # Simple password check (in a real app, compare hashed passwords)
    if stored_user["password"] != user.password:
        raise HTTPException(status_code=401, detail="Invalid password.")
    
    print(f"✅ User logged in: {user.email}")
    return {"message": f"Login successful for user: {user.email}"}

@app.post("/submit-form", response_model=MessageResponse)
async def submit_form_data(form_data: FormDataIn):
    """Receives and stores person details."""
    
    # Simple data storage
    form_data_database.append(form_data.dict())
    
    print(f"💾 Form submitted by {form_data.email}. Total submissions: {len(form_data_database)}")
    return {"message": f"Form data saved successfully for {form_data.email}."}

@app.get("/all-users", response_model=AllUsersResponse)
async def get_all_users():
    """Returns all stored form data (for debugging/testing)."""
    
    # Note: In a real app, this would require authentication/authorization check
    
    return {
        "message": f"Successfully retrieved {len(form_data_database)} user submissions.",
        "data": form_data_database
    }

# Endpoint to check the current in-memory data
@app.get("/debug-data")
async def debug_data():
    return {
        "users_count": len(user_database),
        "form_data_count": len(form_data_database),
    }

# Example to run the app locally (requires `uvicorn` to be installed: pip install uvicorn)
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client

app = FastAPI()

# -----------------------------
# CORS setup - FIXED FOR PRODUCTION
# -----------------------------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://qa-development-site.vercel.app",
    "https://qa-development-site-jcn9i7wzb-bhuvanesh-testers-projects.vercel.app",  # Your actual Vercel frontend URL
    # Vercel also creates preview URLs, so you might want to allow all Vercel subdomains
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Supabase setup
# -----------------------------
SUPABASE_URL = "https://qfdhtoxzdnnfbnhkzkyb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGh0b3h6ZG5uZmJuaGt6a3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ4MjUzMiwiZXhwIjoyMDc2MDU4NTMyfQ.GlYjWYOYQB3f_IF7dfjO8M8wWgQy5s-Xcrz1sEXQqno"
USERS_TABLE = "users"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


@app.get("/")
def root():
    print("✅ FastAPI root route called")
    return {"message": "FastAPI is running"}


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Backend is live"}


# -----------------------------
# Login route - ENHANCED DEBUGGING
# -----------------------------
@app.post("/login")
async def login(request: Request):
    print("=" * 50)
    print("🔹 FastAPI /login endpoint called")
    print(f"Request method: {request.method}")
    print(f"Request headers: {dict(request.headers)}")
    print(f"Client host: {request.client.host if request.client else 'Unknown'}")
    
    try:
        # Parse request body
        try:
            body_bytes = await request.body()
            print(f"Raw body bytes: {body_bytes}")
            
            data = await request.json()
            print(f"Parsed JSON data: {data}")
        except Exception as json_error:
            print(f"❌ JSON parsing error: {json_error}")
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid JSON format: {str(json_error)}"
            )
        
        email = data.get("email")
        password = data.get("password")
        
        print(f"Email received: {email}")
        print(f"Password received: {'*' * len(password) if password else 'None'}")

        if not email or not password:
            print("❌ Missing email or password")
            raise HTTPException(
                status_code=400, 
                detail="Email and password are required"
            )

        # Fetch user from Supabase
        print(f"🔍 Querying Supabase for email: {email}")
        response = supabase.table(USERS_TABLE).select("*").eq("email", email).execute()
        print(f"Supabase response: {response.data}")

        if not response.data:
            print(f"❌ No user found for email: {email}")
            raise HTTPException(
                status_code=401, 
                detail="Invalid email or password"
            )

        user = response.data[0]
        print(f"✅ User found: {user.get('email')}")

        if user.get("password") != password:
            print("❌ Password mismatch")
            raise HTTPException(
                status_code=401, 
                detail="Invalid email or password"
            )

        print("✅ Login successful")
        return {
            "message": "Login successful",
            "user": {
                "id": user.get("id"),
                "email": user.get("email")
            }
        }

    except HTTPException as http_err:
        print(f"HTTPException: {http_err.detail}")
        raise
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Server error: {str(e)}"
        )


# -----------------------------
# Form submission route
# -----------------------------
@app.post("/submit")
async def submit_form(request: Request):
    print("=" * 50)
    print("📥 /submit endpoint called")
    
    try:
        data = await request.json()
        print(f"Form data received: {data}")

        # Convert age to integer
        if "age" in data:
            try:
                data["age"] = int(data["age"])
            except ValueError:
                raise HTTPException(status_code=400, detail="Age must be a number")

        # Insert data into Supabase
        print("Inserting into Supabase...")
        insert_response = supabase.table("user_details").insert(data).execute()
        print(f"Insert response: {insert_response.data}")

        if not insert_response.data:
            raise HTTPException(
                status_code=500, 
                detail="Failed to save form data"
            )

        return {
            "message": "Form submitted successfully", 
            "data": data
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in /submit: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to submit: {str(e)}"
        )


# For running locally with uvicorn
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8003))
    uvicorn.run(app, host="0.0.0.0", port=port)
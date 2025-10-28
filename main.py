from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client

app = FastAPI()

# -----------------------------
# CORS setup
# -----------------------------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://qa-development-site.vercel.app",
    "https://qa-development-site.onrender.com",  # your Render backend URL
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
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGh0b3h6ZG5uZmJuaGt6a3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ4MjUzMiwiZXhwIjoyMDc2MDU4NTMyfQ.GlYjWYOYQB3f_IF7dfjO8M8wWgQy5s-Xcrz1sEXQqno"  # Replace with your key
USERS_TABLE = "users"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


@app.get("/")
def root():
    print("✅ FastAPI root route called")
    return {"message": "FastAPI is running"}


# -----------------------------
# Login route
# -----------------------------
@app.post("/login")
async def login(request: Request):
    print("🔹 FastAPI /login endpoint called")
    try:
        data = await request.json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password are required")

        # Fetch user from Supabase
        response = supabase.table(USERS_TABLE).select("*").eq("email", email).execute()

        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user = response.data[0]

        if user.get("password") != password:
            raise HTTPException(status_code=401, detail="Invalid email or password")

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
        raise HTTPException(status_code=500, detail="Unexpected server error")


# -----------------------------
# Form submission route
# -----------------------------
@app.post("/submit")
async def submit_form(request: Request):
    try:
        data = await request.json()
        print("📥 Form data received:", data)

        # Convert age to integer
        if "age" in data:
            try:
                data["age"] = int(data["age"])
            except ValueError:
                raise HTTPException(status_code=400, detail="Age must be a number")

        # Insert data into Supabase
        insert_response = supabase.table("user_details").insert(data).execute()
        print("Supabase insert response:", insert_response.__dict__)  # Debug output

        # Check if insert_response.data exists
        if not insert_response.data:
            raise HTTPException(status_code=500, detail="Failed to save form data to Supabase")

        return {"message": "Form submitted successfully", "data": data}

    except Exception as e:
        print("Unexpected error in /submit:", e)
        raise HTTPException(status_code=500, detail=f"Failed to submit form: {str(e)}")



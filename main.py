from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import pandas as pd
import io

app = FastAPI()

# -----------------------------
# CORS setup
# -----------------------------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://qa-development-site.vercel.app",
    "https://qa-development-site-jcn9i7wzb-bhuvanesh-testers-projects.vercel.app",
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
# Registration route
# -----------------------------
@app.post("/register")
async def register(request: Request):
    print("=" * 50)
    print("🔹 FastAPI /register endpoint called")
    
    try:
        data = await request.json()
        print(f"Received data: {data}")
        
        email = data.get("email")
        password = data.get("password")
        name = data.get("name")
        
        if not email or not password or not name:
            raise HTTPException(
                status_code=400, 
                detail="Name, email and password are required"
            )
        
        # Check if user already exists
        existing_user = supabase.table(USERS_TABLE).select("*").eq("email", email).execute()
        
        if existing_user.data:
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists"
            )
        
        # Insert new user
        new_user = {
            "email": email,
            "password": password,
            "name": name
        }
        
        insert_response = supabase.table(USERS_TABLE).insert(new_user).execute()
        
        if not insert_response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create user"
            )
        
        print(f"✅ User registered successfully: {email}")
        
        return {
            "message": "Registration successful",
            "user": {
                "email": email,
                "name": name
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


# -----------------------------
# Login route
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
                "email": user.get("email"),
                "name": user.get("name")
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


# -----------------------------
# Excel/CSV Upload and Parse Route
# -----------------------------
@app.post("/upload-excel")
async def upload_excel(file: UploadFile = File(...)):
    print("=" * 50)
    print("📤 /upload-excel endpoint called")
    print(f"Filename: {file.filename}")
    print(f"Content type: {file.content_type}")
    
    try:
        # Validate file type
        valid_extensions = ['.xlsx', '.xls', '.csv']
        if not any(file.filename.lower().endswith(ext) for ext in valid_extensions):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload Excel (.xlsx, .xls) or CSV file"
            )
        
        # Read file content
        contents = await file.read()
        print(f"File size: {len(contents)} bytes")
        
        # Parse based on file type
        try:
            if file.filename.lower().endswith('.csv'):
                df = pd.read_csv(io.BytesIO(contents))
            else:
                df = pd.read_excel(io.BytesIO(contents))
            
            print(f"DataFrame shape: {df.shape}")
            print(f"Columns found: {df.columns.tolist()}")
            print(f"First few rows:\n{df.head()}")
            
        except Exception as parse_error:
            print(f"❌ Parsing error: {parse_error}")
            raise HTTPException(
                status_code=400,
                detail=f"Error parsing file: {str(parse_error)}. Make sure the file is a valid Excel or CSV file."
            )
        
        # Validate required columns
        required_columns = ['name', 'age', 'phone', 'address', 'email']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Clean and prepare data
        df = df[required_columns]
        df = df.dropna()
        df['age'] = df['age'].astype(int)
        
        # Convert to records
        records = df.to_dict('records')
        print(f"Processing {len(records)} records")
        
        if len(records) == 0:
            raise HTTPException(
                status_code=400,
                detail="No valid data found in the file"
            )
        
        # Insert records into Supabase
        insert_response = supabase.table("user_details").insert(records).execute()
        
        if not insert_response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to save data to database"
            )
        
        print(f"✅ Successfully inserted {len(records)} records")
        
        return {
            "message": f"Successfully uploaded and processed {len(records)} records",
            "records_count": len(records),
            "columns": df.columns.tolist()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


# -----------------------------
# Get Dashboard Stats
# -----------------------------
@app.get("/dashboard-stats")
async def get_dashboard_stats():
    print("=" * 50)
    print("📊 /dashboard-stats endpoint called")
    
    try:
        # Get total users count
        users_response = supabase.table(USERS_TABLE).select("id", count="exact").execute()
        total_users = users_response.count if users_response.count else 0
        
        # Get total submissions count
        submissions_response = supabase.table("user_details").select("id", count="exact").execute()
        total_submissions = submissions_response.count if submissions_response.count else 0
        
        print(f"Total users: {total_users}")
        print(f"Total submissions: {total_submissions}")
        
        return {
            "total_users": total_users,
            "total_submissions": total_submissions,
            "active_users": total_users,  # For now, all registered users are "active"
            "completed": total_submissions,
            "pending": 0  # You can implement pending logic later
        }
        
    except Exception as e:
        print(f"❌ Error fetching stats: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch stats: {str(e)}"
        )


# For running locally with uvicorn
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8003))
    uvicorn.run(app, host="0.0.0.0", port=port)
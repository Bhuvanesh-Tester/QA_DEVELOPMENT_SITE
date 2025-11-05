from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import pandas as pd
import io
from datetime import datetime
from typing import Optional

app = FastAPI()

# CORS setup
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

# Supabase setup
SUPABASE_URL = "https://qfdhtoxzdnnfbnhkzkyb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGh0b3h6ZG5uZmJuaGt6a3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ4MjUzMiwiZXhwIjoyMDc2MDU4NTMyfQ.GlYjWYOYQB3f_IF7dfjO8M8wWgQy5s-Xcrz1sEXQqno"
USERS_TABLE = "users"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Helper function for audit logging
def log_action(user_id: int, user_email: str, action: str, details: str = ""):
    try:
        log_data = {
            "user_id": user_id,
            "user_email": user_email,
            "action": action,
            "details": details
        }
        supabase.table("audit_logs").insert(log_data).execute()
    except Exception as e:
        print(f"Failed to log action: {e}")


@app.get("/")
def root():
    return {"message": "RBAC Compliance Audit System - API Running", "version": "2.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Backend is live"}


# ==================== AUTHENTICATION ====================
@app.post("/login")
async def login(request: Request):
    print("🔹 /login endpoint called")
    
    try:
        data = await request.json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password are required")

        response = supabase.table(USERS_TABLE).select("*").eq("email", email).execute()

        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user = response.data[0]
        
        if user.get("status") != "active":
            raise HTTPException(status_code=403, detail="Account is inactive. Contact administrator.")

        if user.get("password") != password:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Update last login
        supabase.table(USERS_TABLE).update({"last_login": datetime.now().isoformat()}).eq("id", user["id"]).execute()
        
        # Log login
        log_action(user["id"], user["email"], "LOGIN", f"User logged in as {user.get('role')}")

        print(f"✅ Login successful: {email} ({user.get('role')})")
        
        return {
            "message": "Login successful",
            "user": {
                "id": user.get("id"),
                "email": user.get("email"),
                "name": user.get("name"),
                "role": user.get("role"),
                "department": user.get("department")
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ==================== USER MANAGEMENT (Admin) ====================
@app.get("/users")
async def get_all_users(admin_id: Optional[int] = None):
    print("🔹 /users endpoint called")
    
    try:
        # Verify admin access
        if admin_id:
            admin = supabase.table(USERS_TABLE).select("role").eq("id", admin_id).execute()
            if not admin.data or admin.data[0]["role"] != "Admin":
                raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        response = supabase.table(USERS_TABLE).select(
            "id, name, email, role, status, department, created_at, last_login"
        ).execute()
        
        return {"users": response.data, "total": len(response.data)}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/users/create")
async def create_user(request: Request):
    print("🔹 /users/create endpoint called")
    
    try:
        data = await request.json()
        admin_id = data.get("admin_id")
        
        # Verify admin
        admin = supabase.table(USERS_TABLE).select("role, email").eq("id", admin_id).execute()
        if not admin.data or admin.data[0]["role"] != "Admin":
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Validate required fields
        email = data.get("email")
        password = data.get("password")
        name = data.get("name")
        role = data.get("role", "QA/QC")
        department = data.get("department", "")
        
        if not email or not password or not name:
            raise HTTPException(status_code=400, detail="Name, email and password are required")
        
        # Check if user exists
        existing = supabase.table(USERS_TABLE).select("email").eq("email", email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Create user
        new_user = {
            "name": name,
            "email": email,
            "password": password,
            "role": role,
            "department": department,
            "status": "active",
            "created_by": admin_id
        }
        
        result = supabase.table(USERS_TABLE).insert(new_user).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        # Log action
        log_action(admin_id, admin.data[0]["email"], "USER_CREATED", 
                  f"Created user: {email} with role: {role}")
        
        return {"message": "User created successfully", "user": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/users/{user_id}")
async def update_user(user_id: int, request: Request):
    print(f"🔹 /users/{user_id} update called")
    
    try:
        data = await request.json()
        admin_id = data.get("admin_id")
        
        # Verify admin
        admin = supabase.table(USERS_TABLE).select("role, email").eq("id", admin_id).execute()
        if not admin.data or admin.data[0]["role"] != "Admin":
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        # Build update data
        update_data = {}
        if "name" in data:
            update_data["name"] = data["name"]
        if "role" in data:
            update_data["role"] = data["role"]
        if "status" in data:
            update_data["status"] = data["status"]
        if "department" in data:
            update_data["department"] = data["department"]
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        result = supabase.table(USERS_TABLE).update(update_data).eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Log action
        log_action(admin_id, admin.data[0]["email"], "USER_UPDATED", 
                  f"Updated user ID: {user_id}")
        
        return {"message": "User updated successfully", "user": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/users/{user_id}")
async def delete_user(user_id: int, admin_id: int):
    print(f"🔹 DELETE /users/{user_id} called")
    
    try:
        # Verify admin
        admin = supabase.table(USERS_TABLE).select("role, email").eq("id", admin_id).execute()
        if not admin.data or admin.data[0]["role"] != "Admin":
            raise HTTPException(status_code=403, detail="Access denied. Admin only.")
        
        if user_id == admin_id:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
        # Soft delete
        result = supabase.table(USERS_TABLE).update({"status": "inactive"}).eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Log action
        log_action(admin_id, admin.data[0]["email"], "USER_DELETED", f"Deleted user ID: {user_id}")
        
        return {"message": "User deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== DASHBOARD STATS ====================
@app.get("/dashboard-stats")
async def get_dashboard_stats(user_id: Optional[int] = None, role: Optional[str] = None):
    print("📊 /dashboard-stats called")
    
    try:
        stats = {}
        
        if role == "Admin":
            # Admin sees everything
            users = supabase.table(USERS_TABLE).select("id", count="exact").execute()
            stats["total_users"] = users.count or 0
            
            active = supabase.table(USERS_TABLE).select("id", count="exact").eq("status", "active").execute()
            stats["active_users"] = active.count or 0
            
            audits = supabase.table("compliance_audits").select("id", count="exact").execute()
            stats["total_audits"] = audits.count or 0
            
            pending = supabase.table("compliance_audits").select("id", count="exact").eq("status", "in_progress").execute()
            stats["pending_audits"] = pending.count or 0
            
        elif role == "Supervisor":
            # Supervisor sees operational data
            audits = supabase.table("compliance_audits").select("id", count="exact").execute()
            stats["total_audits"] = audits.count or 0
            
            my_audits = supabase.table("compliance_audits").select("id", count="exact").eq("auditor_id", user_id).execute()
            stats["my_audits"] = my_audits.count or 0
            
            stats["active_users"] = 0
            stats["pending_audits"] = 0
            
        else:  # QA/QC
            # QA sees only their data
            my_audits = supabase.table("compliance_audits").select("id", count="exact").eq("created_by", user_id).execute()
            stats["my_audits"] = my_audits.count or 0
            
            stats["total_audits"] = 0
            stats["active_users"] = 0
            stats["pending_audits"] = 0
        
        # Common stats
        submissions = supabase.table("user_details").select("id", count="exact").execute()
        stats["total_submissions"] = submissions.count or 0
        
        return stats
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== COMPLIANCE AUDITS ====================
@app.get("/audits")
async def get_audits(user_id: Optional[int] = None, role: Optional[str] = None):
    print("🔹 /audits endpoint called")
    
    try:
        if role == "Admin":
            # Admin sees all audits
            result = supabase.table("compliance_audits").select("*").order("created_at", desc=True).execute()
        elif role == "Supervisor":
            # Supervisor sees all audits
            result = supabase.table("compliance_audits").select("*").order("created_at", desc=True).execute()
        else:
            # QA sees only their audits
            result = supabase.table("compliance_audits").select("*").eq("created_by", user_id).order("created_at", desc=True).execute()
        
        return {"audits": result.data, "total": len(result.data)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/audits/create")
async def create_audit(request: Request):
    print("🔹 /audits/create endpoint called")
    
    try:
        data = await request.json()
        user_id = data.get("user_id")
        user_email = data.get("user_email")
        
        audit_data = {
            "audit_number": data.get("audit_number"),
            "audit_type": data.get("audit_type"),
            "iso_standard": data.get("iso_standard"),
            "department": data.get("department"),
            "audit_date": data.get("audit_date"),
            "auditor_name": data.get("auditor_name"),
            "status": data.get("status", "draft"),
            "created_by": user_id
        }
        
        result = supabase.table("compliance_audits").insert(audit_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create audit")
        
        # Log action
        log_action(user_id, user_email, "AUDIT_CREATED", 
                  f"Created audit: {audit_data['audit_number']}")
        
        return {"message": "Audit created successfully", "audit": result.data[0]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Keep existing endpoints
@app.post("/submit")
async def submit_form(request: Request):
    try:
        data = await request.json()
        if "age" in data:
            data["age"] = int(data["age"])
        result = supabase.table("user_details").insert(data).execute()
        return {"message": "Form submitted successfully", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-excel")
async def upload_excel(file: UploadFile = File(...)):
    try:
        valid_extensions = ['.xlsx', '.xls', '.csv']
        if not any(file.filename.lower().endswith(ext) for ext in valid_extensions):
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        contents = await file.read()
        
        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        required_columns = ['name', 'age', 'phone', 'address', 'email']
        df.columns = df.columns.str.lower().str.strip()
        
        missing = [col for col in required_columns if col not in df.columns]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing columns: {', '.join(missing)}")
        
        df = df[required_columns].dropna()
        df['age'] = df['age'].astype(int)
        
        records = df.to_dict('records')
        
        if len(records) == 0:
            raise HTTPException(status_code=400, detail="No valid data in file")
        
        supabase.table("user_details").insert(records).execute()
        
        return {"message": f"Successfully uploaded {len(records)} records", "records_count": len(records)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8003))
    uvicorn.run(app, host="0.0.0.0", port=port)
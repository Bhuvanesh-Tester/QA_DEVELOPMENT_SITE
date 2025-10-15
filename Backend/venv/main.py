from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import os


app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later restrict to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
DB_HOST = os.getenv("DB_HOST", "your-supabase-host")
DB_NAME = os.getenv("DB_NAME", "your-db-name")
DB_USER = os.getenv("DB_USER", "your-db-user")
DB_PASS = os.getenv("DB_PASS", "your-db-password")

@app.post("/login")
async def login(request: Request):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")

    conn = psycopg2.connect(
        host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS
    )
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email=%s AND password=%s", (email, password))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if user:
        return {"message": "Login successful!"}
    else:
        return {"message": "Invalid email or password."}
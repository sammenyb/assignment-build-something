from fastapi import FastAPI, HTTPException, Body
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from models import User
import jwt
import os
from dotenv import load_dotenv
import sqlite3

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to the frontend URL when done
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

DATABASE_PATH = "./users.db"

def init_db():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def get_user(username):
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT username, password FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    return user

def add_user(username, password):
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

init_db()



load_dotenv()

SECRET = os.getenv("SECRET")
if not SECRET:
    raise RuntimeError("SECRET environment variable not set")


@app.post("/register")
def register(user: User):
    if get_user(user.username):
        raise HTTPException(status_code=400, detail="User already exists")
    add_user(user.username, user.password)
    return {"message": "Registration successful"}

@app.post("/login")
def login(user: User):
    db_user = get_user(user.username)
    if not db_user or db_user[1] != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode({"username": user.username}, SECRET, algorithm="HS256")
    return {"access_token": token, "token_type": "bearer"}

@app.get("/users/me")
def read_users_me(token: str = oauth2_scheme):
    try:
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        return {"username": payload["username"]}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

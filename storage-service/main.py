import sqlite3
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query, Request
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import StreamingResponse
import os
import jwt
from fastapi.middleware.cors import CORSMiddleware
from minio import Minio
import io

origins = ["http://192.168.49.2:30000"]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


DATABASE_PATH = "/storage-service/data/files.db"

def init_db():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            owner TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            size INTEGER,
            minio_key TEXT NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id INTEGER NOT NULL,
            user TEXT NOT NULL,
            can_read BOOLEAN NOT NULL DEFAULT 1,
            can_write BOOLEAN NOT NULL DEFAULT 0,
            can_delete BOOLEAN NOT NULL DEFAULT 0,
            FOREIGN KEY(file_id) REFERENCES files(id)
        )
    ''')
    conn.commit()
    conn.close()

init_db()


SECRET = os.getenv("SECRET")
if not SECRET:
    raise RuntimeError("SECRET environment variable not set")

minio_client = Minio(
    "minio:9000", 
    access_key="minioadmin",
    secret_key="minioadmin123",
    secure=False
)

bucket_name = "uploads"
# Create the bucket if it doesn't exist
if not minio_client.bucket_exists(bucket_name):
    minio_client.make_bucket(bucket_name)


def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        return payload["username"]
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/files")
def list_files(username: str = Depends(verify_token)):
    # Return files the user has access to (can_read)
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT f.filename, f.owner, f.created_at, f.updated_at, f.size, f.minio_key
        FROM files f
        JOIN permissions p ON f.id = p.file_id
        WHERE p.user = ? AND p.can_read = 1
    ''', (username,))
    files = [
        {
            "filename": row[0],
            "owner": row[1],
            "created_at": row[2],
            "updated_at": row[3],
            "size": row[4],
            "minio_key": row[5],
        }
        for row in cursor.fetchall()
    ]
    conn.close()
    return {"files": files}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), username: str = Depends(verify_token)):
    # Upload file to MinIO
    file_data = await file.read()
    minio_client.put_object(
        bucket_name,
        file.filename,
        data=io.BytesIO(file_data),
        length=len(file_data),
        content_type=file.content_type
    )
    # Insert file metadata into files table
    now = datetime.utcnow().isoformat()
    size = len(file_data)
    minio_key = file.filename
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO files (filename, owner, created_at, updated_at, size, minio_key)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (file.filename, username, now, now, size, minio_key))
    file_id = cursor.lastrowid
    # Grant full permissions to the owner
    cursor.execute('''
        INSERT INTO permissions (file_id, user, can_read, can_write, can_delete)
        VALUES (?, ?, 1, 1, 1)
    ''', (file_id, username))
    conn.commit()
    conn.close()
    return {"filename": file.filename}


@app.get("/download/{filename}")
def download_file(filename: str, request: Request, token: str = Query(None)):
    # Try to get token from Authorization header first
    auth_header = request.headers.get("authorization")
    username = None
    if auth_header and auth_header.lower().startswith("bearer "):
        try:
            jwt_token = auth_header.split(" ", 1)[1]
            payload = jwt.decode(jwt_token, SECRET, algorithms=["HS256"])
            username = payload["username"]
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    elif token:
        try:
            payload = jwt.decode(token, SECRET, algorithms=["HS256"])
            username = payload["username"]
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    else:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Check if user has read permission for the file
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT f.minio_key
        FROM files f
        JOIN permissions p ON f.id = p.file_id
        WHERE f.filename = ? AND p.user = ? AND p.can_read = 1
    ''', (filename, username))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=403, detail="Permission denied or file not found")
    minio_key = row[0]
    try:
        response = minio_client.get_object(bucket_name, minio_key)
        return StreamingResponse(response, media_type="application/octet-stream", headers={"Content-Disposition": f"attachment; filename={filename}"})
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")


@app.delete("/delete/{filename}")
def delete_file(filename: str, username: str = Depends(verify_token)):
    # Check if user has delete permission for the file
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT f.id, f.minio_key
        FROM files f
        JOIN permissions p ON f.id = p.file_id
        WHERE f.filename = ? AND p.user = ? AND p.can_delete = 1
    ''', (filename, username))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=403, detail="Permission denied or file not found")
    file_id, minio_key = row
    try:
        minio_client.remove_object(bucket_name, minio_key)
    except Exception:
        conn.close()
        raise HTTPException(status_code=404, detail="File not found in storage")
    # Remove file and permissions from database
    cursor.execute('DELETE FROM permissions WHERE file_id = ?', (file_id,))
    cursor.execute('DELETE FROM files WHERE id = ?', (file_id,))
    conn.commit()
    conn.close()
    return {"detail": "File deleted"}

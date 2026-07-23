from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import auth, protect

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="InvisiFace API", version="1.0.0")

# CORS: allow_credentials=True requires explicit origins, not wildcard "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(protect.router, prefix="/api/protect", tags=["protect"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "InvisiFace API is running."}

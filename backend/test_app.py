"""
InvisiFace Comprehensive Test Suite
Tests: Health, Auth (Register/Login/Duplicate/BadLogin/Protected), AI Pipeline, Edge Cases
"""
import sys
import os
import cv2
import numpy as np
import io
import random

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
PASS = 0
FAIL = 0

def report(name, passed, detail=""):
    global PASS, FAIL
    if passed:
        PASS += 1
        print(f"  [PASS] {name}")
    else:
        FAIL += 1
        print(f"  [FAIL] {name} -- {detail}")

# ------------------------------------------------
# 1. HEALTH CHECK TESTS
# ------------------------------------------------
print("\n=== 1. Health Check Tests ===")

r = client.get("/api/health")
report("GET /api/health returns 200", r.status_code == 200, f"got {r.status_code}")
report("Health body has status=ok", r.json().get("status") == "ok", f"got {r.json()}")

r404 = client.get("/api/nonexistent")
report("GET nonexistent route returns 404", r404.status_code == 404, f"got {r404.status_code}")

# ------------------------------------------------
# 2. AUTHENTICATION TESTS
# ------------------------------------------------
print("\n=== 2. Authentication Tests ===")

rand = random.randint(10000, 99999)
USERNAME = f"testuser_{rand}"
EMAIL = f"test_{rand}@example.com"
PASSWORD = "Str0ngP@ss!"

# 2a. Register
r = client.post("/api/auth/register", json={
    "username": USERNAME, "email": EMAIL, "password": PASSWORD
})
report("Register new user returns 200", r.status_code == 200, f"got {r.status_code}: {r.text}")
if r.status_code == 200:
    body = r.json()
    report("Register response has username", body.get("username") == USERNAME, f"got {body}")
    report("Register response has email", body.get("email") == EMAIL, f"got {body}")
    report("Register response has id", isinstance(body.get("id"), int), f"got {body}")
    report("Register response has created_at", "created_at" in body, f"got {body}")

# 2b. Duplicate email
r = client.post("/api/auth/register", json={
    "username": "another_user", "email": EMAIL, "password": PASSWORD
})
report("Duplicate email returns 400", r.status_code == 400, f"got {r.status_code}")

# 2c. Duplicate username
r = client.post("/api/auth/register", json={
    "username": USERNAME, "email": f"other_{rand}@example.com", "password": PASSWORD
})
report("Duplicate username returns 400", r.status_code == 400, f"got {r.status_code}")

# 2d. Invalid email format
r = client.post("/api/auth/register", json={
    "username": "bademail_user", "email": "not-an-email", "password": PASSWORD
})
report("Invalid email returns 422", r.status_code == 422, f"got {r.status_code}")

# 2e. Login
r = client.post("/api/auth/login", data={
    "username": USERNAME, "password": PASSWORD
})
report("Login returns 200", r.status_code == 200, f"got {r.status_code}: {r.text}")
TOKEN = None
if r.status_code == 200:
    body = r.json()
    report("Login response has access_token", "access_token" in body, f"got {body}")
    report("Login response has token_type=bearer", body.get("token_type") == "bearer", f"got {body}")
    TOKEN = body.get("access_token")

# 2f. Wrong password
r = client.post("/api/auth/login", data={
    "username": USERNAME, "password": "WrongPassword123"
})
report("Wrong password returns 401", r.status_code == 401, f"got {r.status_code}")

# 2g. Non-existent user login
r = client.post("/api/auth/login", data={
    "username": "nonexistent_user_xyz", "password": "anything"
})
report("Non-existent user returns 401", r.status_code == 401, f"got {r.status_code}")

# ------------------------------------------------
# 3. PROTECTED ENDPOINT TESTS
# ------------------------------------------------
print("\n=== 3. Protected Endpoint Tests ===")

# 3a. Access without token
r = client.post("/api/protect", files={"file": ("test.jpg", b"fake", "image/jpeg")})
report("Protect without token returns 401", r.status_code == 401, f"got {r.status_code}")

# 3b. Access with invalid token
r = client.post(
    "/api/protect",
    headers={"Authorization": "Bearer invalid_garbage_token"},
    files={"file": ("test.jpg", b"fake", "image/jpeg")}
)
report("Protect with bad token returns 401", r.status_code == 401, f"got {r.status_code}")

if TOKEN:
    headers = {"Authorization": f"Bearer {TOKEN}"}

    # 3c. Non-image file
    r = client.post(
        "/api/protect", headers=headers,
        files={"file": ("test.txt", b"hello world", "text/plain")}
    )
    report("Non-image file returns 400", r.status_code == 400, f"got {r.status_code}")

    # 3d. Corrupted image bytes
    r = client.post(
        "/api/protect", headers=headers,
        files={"file": ("test.jpg", b"not_an_image_at_all", "image/jpeg")}
    )
    report("Corrupted image returns 400", r.status_code == 400, f"got {r.status_code}")

    # 3e. Valid image without a face (plain white)
    white_img = np.ones((200, 200, 3), dtype=np.uint8) * 255
    _, buf = cv2.imencode(".jpg", white_img)
    r = client.post(
        "/api/protect", headers=headers,
        files={"file": ("white.jpg", io.BytesIO(buf.tobytes()), "image/jpeg")}
    )
    report("Image with no face returns 400", r.status_code == 400, f"got {r.status_code}")
    if r.status_code == 400:
        report("No-face error message correct", "No face detected" in r.json().get("detail", ""), f"got {r.json()}")

    # 3f. Valid image with a realistic face-like pattern
    face_img = np.ones((480, 480, 3), dtype=np.uint8) * 200
    cv2.ellipse(face_img, (240, 220), (100, 130), 0, 0, 360, (180, 160, 140), -1)
    cv2.circle(face_img, (200, 190), 15, (40, 40, 40), -1)
    cv2.circle(face_img, (280, 190), 15, (40, 40, 40), -1)
    cv2.ellipse(face_img, (240, 280), (35, 15), 0, 0, 180, (100, 60, 60), -1)

    _, buf = cv2.imencode(".jpg", face_img)
    r = client.post(
        "/api/protect", headers=headers,
        files={"file": ("face.jpg", io.BytesIO(buf.tobytes()), "image/jpeg")}
    )
    print(f"  [info] Face image response: status={r.status_code}")
    report("Face image endpoint responds correctly", r.status_code in [200, 400], f"got {r.status_code}")
    if r.status_code == 200:
        body = r.json()
        report("Response has protected_image", "protected_image" in body, f"got {list(body.keys())}")
        report("Response has metrics", "metrics" in body, f"got {list(body.keys())}")
        if "metrics" in body:
            m = body["metrics"]
            report("Metrics has ssim", "ssim" in m, f"got {m}")
            report("Metrics has psnr", "psnr" in m, f"got {m}")
            report("Metrics has cosine_similarity", "cosine_similarity" in m, f"got {m}")
            report("Metrics has privacy_score", "privacy_score" in m, f"got {m}")

# ------------------------------------------------
# 4. EDGE CASE TESTS
# ------------------------------------------------
print("\n=== 4. Edge Case Tests ===")

# 4a. Empty body to register
r = client.post("/api/auth/register", json={})
report("Empty register body returns 422", r.status_code == 422, f"got {r.status_code}")

# 4b. Missing password in register
r = client.post("/api/auth/register", json={"username": "nopass", "email": "nopass@test.com"})
report("Missing password returns 422", r.status_code == 422, f"got {r.status_code}")

# 4c. GET on POST-only route
r = client.get("/api/auth/register")
report("GET on POST-only register returns 405", r.status_code == 405, f"got {r.status_code}")

# 4d. GET on POST-only login route
r = client.get("/api/auth/login")
report("GET on POST-only login returns 405", r.status_code == 405, f"got {r.status_code}")

# ------------------------------------------------
# SUMMARY
# ------------------------------------------------
print(f"\n{'=' * 50}")
print(f"  TOTAL: {PASS + FAIL} | PASSED: {PASS} | FAILED: {FAIL}")
print(f"{'=' * 50}")

if FAIL > 0:
    print("\nSOME TESTS FAILED. See output above.")
    sys.exit(1)
else:
    print("\nALL TESTS PASSED SUCCESSFULLY!")
    sys.exit(0)

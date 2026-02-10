import sys

import uvicorn

sys.path.insert(0, ".")
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.auth import router as authorization_router
from routers.credentials import router as credential_router
from routers.teams import router as team_router
from routers.users import router as user_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "X-CSRF-Token"],
)

app.include_router(authorization_router, prefix="/auth")
app.include_router(user_router, prefix="/users")
app.include_router(credential_router, prefix="/credentials")
app.include_router(team_router, prefix="/teams")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

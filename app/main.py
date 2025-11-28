from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.router import router, FLOWS
from app.flow_loader import load_flow


app = FastAPI(
    title="Onboarding Mini API",
    version="1.0.0",
)

# 👉 CORS: allow localhost:3000 + your Render frontend later
origins = [
    "http://localhost:3000",
    "https://localhost:3000",
    "https://onboarding-plym.onrender.com",  # backend itself (safe)
    # add your deployed Next.js URL here when you deploy the frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # or ["*"] while testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def load_flows():
    FLOWS["career_onboarding_v1"] = load_flow("flows/career_onboarding_v1.json")
    print("Loaded flows:", list(FLOWS.keys()))


@app.get("/")
def root():
    return {"status": "ok", "message": "Onboarding API running"}


app.include_router(router)

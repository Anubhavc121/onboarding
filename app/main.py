# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.router import router, FLOWS
from app.flow_loader import load_flow


# Create FastAPI app with docs enabled
app = FastAPI(
    title="Onboarding Mini API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
# Add any frontend origins here (local + deployed)
origins = [
    "http://localhost:3000",                 # Next.js dev
    "https://onboarding-plym.onrender.com",  # backend itself (optional)
    # later you can add:
    # "https://your-frontend.vercel.app",
    # "https://career.avetilearning.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],   # GET, POST, etc.
    allow_headers=["*"],   # Authorization, Content-Type, etc.
)


@app.on_event("startup")
def load_flows() -> None:
    """
    Load all onboarding flows once when the app starts.
    """
    FLOWS["career_onboarding_v1"] = load_flow("flows/career_onboarding_v1.json")
    print("Loaded flows:", list(FLOWS.keys()))


@app.get("/")
def root():
    """
    Simple health check so / doesn't 404.
    """
    return {"status": "ok", "message": "Onboarding API running"}


# Mount the onboarding router
app.include_router(router)

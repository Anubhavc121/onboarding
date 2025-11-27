from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.router import router, FLOWS
from app.flow_loader import load_flow


app = FastAPI(
    title="Onboarding Mini API",
    version="1.0.0",
    docs_url="/docs",   # enable Swagger UI
    redoc_url="/redoc", # enable ReDoc
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # you can tighten this later
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def load_flows() -> None:
    """
    Load flows once when the app starts.
    """
    FLOWS["career_onboarding_v1"] = load_flow("flows/career_onboarding_v1.json")
    print("Loaded flows:", list(FLOWS.keys()))


@app.get("/")
def root():
    """
    Simple health check so / doesn't 404.
    """
    return {"status": "ok", "message": "Onboarding API running"}


# Mount the onboarding routes
app.include_router(router)

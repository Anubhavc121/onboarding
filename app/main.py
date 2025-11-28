from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.router import router, FLOWS
from app.flow_loader import load_flow

app = FastAPI(
    title="Onboarding Mini API",
    version="1.0.0",
)

# 🟢 CORS: wide open for now so localhost + any future frontend works
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # <--- TEMP: allow everything
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def load_flows():
    # Load your JSON flow into the in-memory registry
    FLOWS["career_onboarding_v1"] = load_flow("flows/career_onboarding_v1.json")
    print("Loaded flows:", list(FLOWS.keys()))


@app.get("/")
def root():
    return {"status": "ok", "message": "Onboarding API running"}


# All onboarding endpoints live under /onboarding/...
app.include_router(router)

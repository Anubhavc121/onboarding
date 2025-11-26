from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.router import router, FLOWS
from app.flow_loader import load_flow

app = FastAPI(title="Onboarding Mini API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.on_event("startup")
def load_flows():
    FLOWS["career_onboarding_v1"] = load_flow("flows/career_onboarding_v1.json")
    print("Loaded flows:", list(FLOWS.keys()))

app.include_router(router)

import json
from app.schemas import Flow

def load_flow(path: str) -> Flow:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return Flow(**data)

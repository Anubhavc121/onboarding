import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.schemas import Flow, FlowContext, Node
from app.flow_loader import load_flow


router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

FLOWS: Dict[str, Flow] = {}
SESSIONS: Dict[str, FlowContext] = {}


# --------------------------------------------
# Apply effect logic
# --------------------------------------------
def apply_effect(eff, answer, ctx: FlowContext):
    if eff.op == "set":
        parts = eff.path.split(".")
        root = parts[0]
        key = parts[1]
        if root == "variables":
            if eff.from_ == "answer":
                ctx.variables[key] = answer

    if eff.op == "increment":
        parts = eff.path.split(".")
        key = parts[1]
        ctx.scores[key] = ctx.scores.get(key, 0) + (eff.value or 1)


# --------------------------------------------
# Find next node
# --------------------------------------------
def find_next_node(flow: Flow, node: Node, answer, ctx: FlowContext) -> Node:
    for edge in node.edges or []:
        op = edge.condition.op

        if op == "always":
            return flow.nodes[edge.next_node_id]

        if op == "eq":
            left = edge.condition.left
            right = edge.condition.right

            if left["kind"] == "answer":
                left_val = answer
            elif left["kind"] == "context":
                _, key = left["path"].split(".")
                left_val = ctx.variables.get(key)
            else:
                left_val = None

            if left_val == right["value"]:
                return flow.nodes[edge.next_node_id]

    raise HTTPException(400, "No valid next node found.")


# --------------------------------------------
# API Models
# --------------------------------------------
class StartRequest(BaseModel):
    flow_id: str

class StartResponse(BaseModel):
    session_id: str
    node: Node


# --------------------------------------------
# Start onboarding
# --------------------------------------------
@router.post("/start", response_model=StartResponse)
def start(req: StartRequest):
    flow = FLOWS.get(req.flow_id)
    if not flow:
        raise HTTPException(404, "Flow not found")

    session = str(uuid.uuid4())
    ctx = FlowContext(
        flow_id=flow.id,
        current_node_id=flow.start_node_id,
        answers={},
        variables={},
        scores={}
    )
    SESSIONS[session] = ctx

    first_node = flow.nodes[flow.start_node_id]
    return StartResponse(session_id=session, node=first_node)


class AnswerRequest(BaseModel):
    session_id: str
    node_id: str
    answer: Any

class AnswerResponse(BaseModel):
    done: bool
    node: Optional[Node] = None
    result: Optional[Dict[str, Any]] = None
    context: Optional[FlowContext] = None


# --------------------------------------------
# Result builder
# --------------------------------------------
def build_result(flow: Flow, node: Node, ctx: FlowContext):
    sorted_traits = sorted(ctx.scores.items(), key=lambda kv: kv[1], reverse=True)
    top = [k for k, _ in sorted_traits[:2]]

    return {
        "renderer": node.renderer,
        "summary": {
            "top_traits": top,
            "variables": ctx.variables,  # derived fields like class/goal/budget/location
            "answers": ctx.answers,      # ALL raw answers for every node
        },
        "recommendations": {
            "careers": [],
            "colleges": [],
            "exams": [],
            "scholarships": [],
        },
    }

# --------------------------------------------
# Answer endpoint
# --------------------------------------------
@router.post("/answer", response_model=AnswerResponse)
def answer(req: AnswerRequest):
    ctx = SESSIONS.get(req.session_id)
    if not ctx:
        raise HTTPException(404, "Session not found")

    flow = FLOWS[ctx.flow_id]
    cur = flow.nodes[ctx.current_node_id]

    if cur.id != req.node_id:
        raise HTTPException(400, "Node mismatch")

    ctx.answers[cur.id] = req.answer

    for eff in cur.effects or []:
        apply_effect(eff, req.answer, ctx)

    if cur.ui and cur.ui.options and cur.ui.input_type == "single_choice":
        for opt in cur.ui.options:
            if opt.id == req.answer:
                for eff in opt.effects or []:
                    apply_effect(eff, req.answer, ctx)

    next_node = find_next_node(flow, cur, req.answer, ctx)
    ctx.current_node_id = next_node.id

    if next_node.type == "result":
        return AnswerResponse(
            done=True,
            result=build_result(flow, next_node, ctx),
            context=ctx
        )

    return AnswerResponse(done=False, node=next_node, context=ctx)

from typing import Any, Dict, List, Optional, Literal
from pydantic import BaseModel


class Effect(BaseModel):
    op: str
    path: str
    from_: Optional[str] = None
    value: Optional[Any] = None


class UIOption(BaseModel):
    id: str
    label: str
    description: Optional[str] = None
    effects: Optional[List[Effect]] = None


class UI(BaseModel):
    question_text: str
    description: Optional[str] = None
    input_type: Literal["single_choice", "multi_choice", "text", "number"]
    options: Optional[List[UIOption]] = None
    placeholder: Optional[str] = None


class Condition(BaseModel):
    op: str
    left: Optional[Dict[str, Any]] = None
    right: Optional[Dict[str, Any]] = None


class Edge(BaseModel):
    condition: Condition
    next_node_id: str


class Node(BaseModel):
    id: str
    type: Literal["question", "result"]
    meta: Optional[Dict[str, Any]] = None
    ui: Optional[UI] = None
    effects: Optional[List[Effect]] = None
    edges: Optional[List[Edge]] = None
    renderer: Optional[str] = None


class Flow(BaseModel):
    id: str
    title: str
    start_node_id: str
    nodes: Dict[str, Node]


class FlowContext(BaseModel):
    flow_id: str
    current_node_id: str
    answers: Dict[str, Any]
    variables: Dict[str, Any]
    scores: Dict[str, float]

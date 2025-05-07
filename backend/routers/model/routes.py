from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
import backend.state as state
from .types import ModelInfoResponse, ChatRequest
from .chat_utils import chat_stream, get_conversation

model_router = APIRouter()

@model_router.get("/model", response_model=ModelInfoResponse)
def model_info(verbose: Optional[bool] = False) -> ModelInfoResponse:
    """
    GET /model
    Input: verbose (query param, optional)
    Output: ModelInfoResponse
    """
    if state.model is None or state.tokenizer is None:
        print("[model info] Model not loaded", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Model not loaded or template not set")

    return ModelInfoResponse(
        model_name=state.model.name_or_path,
        model_type=state.model.config.model_type,
        model_hidden_size=state.model.config.hidden_size,
        model_vocab_size=getattr(state.model.config, "vocab_size", len(state.tokenizer) if hasattr(state.tokenizer, "__len__") else None),
        model_num_layers=len(state.model.model.layers) if hasattr(state.model.model, "layers") else None,
        tokenizer_name=state.tokenizer.name_or_path,
        tokenizer_class=state.tokenizer.__class__.__name__,
        tokenizer_vocab_size=state.tokenizer.vocab_size,
        tokenizer_model_max_length=state.tokenizer.model_max_length,
        special_tokens=state.tokenizer.special_tokens_map,
    )

@model_router.post("/chat")
def chat_endpoint(request: ChatRequest):
    """
    POST /chat
    Input: ChatRequest
    Output: Streaming text/event-stream
    """
    return StreamingResponse(chat_stream(request), media_type="text/event-stream")

@model_router.post("/new_chat")
def new_chat_endpoint():
    """
    POST /new_chat
    Input: None
    Output: None
    """
    state._conversation = get_conversation()
    state.model._fschat_pkv = None
    return {"status": "ok"}
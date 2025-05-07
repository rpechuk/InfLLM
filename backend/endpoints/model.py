from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
import backend.state as state
from inf_llm import chat as inf_llm_chat

router = APIRouter()

class ModelInfoResponse(BaseModel):
    """response body for /model"""
    model_name: str
    model_type: str
    model_hidden_size: int
    model_vocab_size: int
    model_num_layers: int
    tokenizer_name: str
    tokenizer_class: str
    tokenizer_vocab_size: int
    tokenizer_model_max_length: int
    special_tokens: Dict[str, Any]

@router.get("/model", response_model=ModelInfoResponse)
def model_info(verbose: Optional[bool] = False) -> ModelInfoResponse:

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
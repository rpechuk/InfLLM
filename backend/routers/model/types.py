from pydantic import BaseModel
from typing import Optional, Dict, Any

class ModelInfoResponse(BaseModel):
    """Response body for /model endpoint."""
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

class ChatRequest(BaseModel):
    """Request body for /chat endpoint."""
    message: str
    temperature: Optional[float] = 0.7
    repetition_penalty: Optional[float] = 1.0
    max_new_tokens: Optional[int] = 256
    top_k: Optional[int] = -1
    top_p: Optional[float] = 1.0

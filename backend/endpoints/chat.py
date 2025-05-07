from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Generator, Any
import sys
import os

# Ensure inf_llm is importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from inf_llm import chat as inf_llm_chat
import backend.state as state

router = APIRouter()

# Single in-memory conversation (for demo; not thread-safe for production)
_conversation: Any = None

class ChatRequest(BaseModel):
    """Request body for /chat endpoint."""
    message: str
    temperature: Optional[float] = 0.7
    repetition_penalty: Optional[float] = 1.0
    max_new_tokens: Optional[int] = 256
    top_k: Optional[int] = -1
    top_p: Optional[float] = 1.0

def get_conversation():
    """Get a conversation template using the model path."""
    return inf_llm_chat.get_conversation_template(state.model.name_or_path)

def chat_stream(request: ChatRequest) -> Generator[str, None, None]:
    """Streaming generator for chat responses."""
    global _conversation
    if state.model is None or state.tokenizer is None:
        print("[chat_stream] Model not loaded", file=sys.stderr)
        yield "[Model not loaded or template not set]"
        return
    if _conversation is None:
        _conversation = get_conversation()
    conv = _conversation
    # Append user message and placeholder for assistant
    conv.append_message(conv.roles[0], request.message)
    conv.append_message(conv.roles[1], None)
    prompt = conv.get_prompt()
    gen_params = {
        "model": "unused",
        "prompt": prompt,
        "temperature": request.temperature,
        "repetition_penalty": request.repetition_penalty,
        "max_new_tokens": request.max_new_tokens,
        "stop": conv.stop_str,
        "stop_token_ids": conv.stop_token_ids,
        "echo": False,
        "top_k": request.top_k,
        "top_p": request.top_p
    }
    context_len = inf_llm_chat.get_context_length(state.model.config)
    try:
        stream = inf_llm_chat.generate_stream(
            state.model,
            state.tokenizer,
            gen_params,
            state.model.device if hasattr(state.model, "device") else "cpu",
            context_len=context_len,
            judge_sent_end=True,
            clear_kv_cache=True
        )
        last_text = ""
        for chunk in stream:
            text = chunk["text"]
            # Only yield new text
            if text[len(last_text):]:
                new_text = text[len(last_text):]
                yield new_text
            last_text = text
        # Update conversation with assistant's response
        conv.update_last_message(last_text.strip())
    except Exception as e:
        print(f"[chat_stream] Error: {e}", file=sys.stderr)
        yield f"[Error: {str(e)}]"

@router.post("/chat")
def chat_endpoint(request: ChatRequest):
    """POST endpoint for streaming chat responses."""
    return StreamingResponse(chat_stream(request), media_type="text/event-stream") 
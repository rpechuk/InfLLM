from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
import sys
import os
import gc
import torch

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
    try:
        # Reset conversation
        state._conversation = get_conversation()
        
        # Clear model cache
        if hasattr(state.model, '_fschat_pkv'):
            state.model._fschat_pkv = None
            
        # Clear input_ids from model if they exist (used for context tracking)
        if hasattr(state.model, 'input_ids'):
            state.model.input_ids = None
            
        # Clear context manager state for all layers
        if hasattr(state.model, 'model') and hasattr(state.model.model, 'layers'):
            for layer in state.model.model.layers:
                if hasattr(layer.self_attn, "_past_key_value") and layer.self_attn._past_key_value is not None:
                    # Clear the entire context manager
                    layer.self_attn._past_key_value.clear()
                    
                    # Clear forced blocks if they exist
                    if hasattr(layer.self_attn._past_key_value, 'clear_forced_blocks'):
                        layer.self_attn._past_key_value.clear_forced_blocks()
                    
                    # Clear used blocks tracking
                    if hasattr(layer.self_attn._past_key_value, 'used_blocks_this_generation'):
                        layer.self_attn._past_key_value.used_blocks_this_generation = []
                    
                    # Clear global blocks and cached blocks
                    if hasattr(layer.self_attn._past_key_value, 'global_blocks'):
                        layer.self_attn._past_key_value.global_blocks = [[] for _ in range(layer.self_attn._past_key_value.num_units)] if hasattr(layer.self_attn._past_key_value, 'num_units') else []
                    
                    if hasattr(layer.self_attn._past_key_value, 'cached_blocks'):
                        layer.self_attn._past_key_value.cached_blocks = [{} for _ in range(layer.self_attn._past_key_value.num_units)] if hasattr(layer.self_attn._past_key_value, 'num_units') else []
                    
                    # Clear block representations
                    if hasattr(layer.self_attn._past_key_value, 'block_k'):
                        for block_k in layer.self_attn._past_key_value.block_k:
                            if hasattr(block_k, 'clear'):
                                block_k.clear()
                    
                    # Reset counters and state
                    if hasattr(layer.self_attn._past_key_value, 'num_global_block'):
                        layer.self_attn._past_key_value.num_global_block = 0
                    if hasattr(layer.self_attn._past_key_value, 'length'):
                        layer.self_attn._past_key_value.length = 0
                    if hasattr(layer.self_attn._past_key_value, 'load_count'):
                        layer.self_attn._past_key_value.load_count = 0
                    if hasattr(layer.self_attn._past_key_value, 'initialized'):
                        layer.self_attn._past_key_value.initialized = False
                    
                    # Clear local and global remainder tensors
                    if hasattr(layer.self_attn._past_key_value, 'local_k'):
                        layer.self_attn._past_key_value.local_k = None
                    if hasattr(layer.self_attn._past_key_value, 'local_v'):
                        layer.self_attn._past_key_value.local_v = None
                    if hasattr(layer.self_attn._past_key_value, 'global_remainder'):
                        layer.self_attn._past_key_value.global_remainder = None
                    if hasattr(layer.self_attn._past_key_value, 'global_remainder_local_score'):
                        layer.self_attn._past_key_value.global_remainder_local_score = None
                    
                    # Clear init tensors
                    if hasattr(layer.self_attn._past_key_value, 'init_k'):
                        layer.self_attn._past_key_value.init_k = None
                    if hasattr(layer.self_attn._past_key_value, 'init_v'):
                        layer.self_attn._past_key_value.init_v = None
                    if hasattr(layer.self_attn._past_key_value, 'init_exc'):
                        layer.self_attn._past_key_value.init_exc = False
                    
                    # Clear global buffer
                    if hasattr(layer.self_attn._past_key_value, 'global_buffer'):
                        layer.self_attn._past_key_value.global_buffer = None
                    if hasattr(layer.self_attn._past_key_value, 'global_buffer_block_id_list'):
                        layer.self_attn._past_key_value.global_buffer_block_id_list = None
                    
                    # Clear CUDA cache
                    if hasattr(layer.self_attn._past_key_value, 'cuda_cache'):
                        if hasattr(layer.self_attn._past_key_value.cuda_cache, 'idle_set'):
                            layer.self_attn._past_key_value.cuda_cache.idle_set = set(list(range(layer.self_attn._past_key_value.cuda_cache.num_units))) if hasattr(layer.self_attn._past_key_value.cuda_cache, 'num_units') else set()
        
        # Clear used blocks when starting new chat
        state._last_used_blocks = []
        
        # Force garbage collection and clear CUDA cache
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        print("[new_chat] Successfully reset all chat state and cleared caches", file=sys.stderr)
        return {"status": "ok"}
    except Exception as e:
        print(f"[new_chat] Error resetting state: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@model_router.get("/used_blocks")
def get_used_blocks():
    """
    GET /used_blocks
    Input: None
    Output: List of (layer, block) tuples used in the last generation
    """
    try:
        if hasattr(state, '_last_used_blocks') and state._last_used_blocks:
            print(f"[get_used_blocks] Returning {len(state._last_used_blocks)} blocks", file=sys.stderr)
            return {"used_blocks": state._last_used_blocks}
        else:
            print("[get_used_blocks] No used blocks available", file=sys.stderr)
            return {"used_blocks": []}
    except Exception as e:
        print(f"[get_used_blocks] Error: {e}", file=sys.stderr)
        return {"used_blocks": []}
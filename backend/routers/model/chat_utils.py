from typing import Generator, Any
import sys
import traceback
import json
import backend.state as state
from inf_llm import chat as inf_llm_chat
from backend.routers.model.types import ChatRequest

def get_conversation():
    """Get a conversation template using the model path."""
    return inf_llm_chat.get_conversation_template(state.model.name_or_path)

def chat_stream(request: ChatRequest) -> Generator[str, None, None]:
    """Streaming generator for chat responses."""
    if state.model is None or state.tokenizer is None:
        print("[chat_stream] Model not loaded", file=sys.stderr)
        yield "[Model not loaded or template not set]"
        return
    if state._conversation is None:
        state._conversation = get_conversation()
    conv = state._conversation
    
    # Clear previous used blocks at the start of each generation
    state._last_used_blocks = []
    
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
    # context_len = inf_llm_chat.get_context_length(state.model.config)
    context_len = 2147483647
    # print(f"context_len: {context_len}")
    
    # Convert forced blocks to the format expected by the model
    forced_blocks = None
    if request.forced_blocks:
        forced_blocks = [{"layer": block.layer, "block": block.block} for block in request.forced_blocks]
        print(f"[chat_stream] Using forced blocks: {forced_blocks}", file=sys.stderr)
    
    try:
        # Clear cache for first message to match chat.py behavior and avoid OOM
        should_clear_cache = len(conv.messages) <= 2  # Only user and assistant placeholder
        
        stream = inf_llm_chat.generate_stream(
            state.model,
            state.tokenizer,
            gen_params,
            state.model.device if hasattr(state.model, "device") else "cpu",
            context_len=context_len,
            judge_sent_end=True,
            clear_kv_cache=should_clear_cache,
            forced_blocks=forced_blocks
        )
        last_text = ""
        final_used_blocks = set()  # Collect all unique blocks used during generation
        
        for chunk in stream:
            text = chunk["text"]
            used_blocks = chunk.get("used_blocks", {})
            
            # Collect unique blocks used across all layers
            if used_blocks:
                for layer_id, block_list in used_blocks.items():
                    if isinstance(block_list, list):
                        for block_id in block_list:
                            final_used_blocks.add((int(layer_id), int(block_id)))
            
            # Only yield new text
            if text[len(last_text):]:
                new_text = text[len(last_text):]
                yield new_text
            last_text = text
        
        # Store the used blocks in the state
        if final_used_blocks:
            state._last_used_blocks = list(final_used_blocks)
            
        # Update conversation with assistant's response
        conv.update_last_message(last_text.strip())
        
    except Exception as e:
        print(f"[chat_stream] Error: {e}", file=sys.stderr)
        traceback.print_exc()
        yield f"[Error: {str(e)}]" 
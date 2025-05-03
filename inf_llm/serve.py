# inf_llm/serve.py
"""
Serving code for InfLLM: FastAPI app, endpoints, and server logic.
"""
import os
import sys
import argparse
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from inf_llm.chat import (
    load_model, get_context_length, get_conv_template, get_conversation_template, patch_hf, generate_stream
)
from transformers import AutoModelForCausalLM, AutoTokenizer
import yaml

app = FastAPI()

# Serve static files (frontend)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

MODEL = None
TOKENIZER = None
MODEL_LOCK = asyncio.Lock()
CHAT_CONFIG = None
MODEL_READY = False

@asynccontextmanager
async def lifespan(app):
    global MODEL, TOKENIZER, CHAT_CONFIG, MODEL_READY
    MODEL_READY = False
    config_path = os.path.join(os.path.dirname(__file__), "..", "config", "working", "qwen-4b-inf-llm.yaml")
    with open(config_path, "r") as f:
        CHAT_CONFIG = yaml.safe_load(f)
    model_path = CHAT_CONFIG['model']['path']
    inf_llm_config = CHAT_CONFIG['model']
    MODEL = AutoModelForCausalLM.from_pretrained(
        model_path,
        device_map="auto",
        torch_dtype="auto",
        trust_remote_code=True
    )
    TOKENIZER = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
    MODEL = patch_hf(MODEL, inf_llm_config['type'], **inf_llm_config)
    MODEL_READY = True
    yield

app.router.lifespan_context = lifespan

@app.get("/status")
def status():
    return {"ready": MODEL_READY}

@app.get("/", response_class=HTMLResponse)
def serve_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if not os.path.exists(index_path):
        return HTMLResponse("<html><body><h1>InfLLM Chat</h1><div id='loading'>Loading model, please wait...</div></body></html>")
    return FileResponse(index_path)

@app.post("/chat")
async def chat_api(request: Request):
    if not MODEL_READY:
        return JSONResponse({"error": "Model is still loading. Please wait."}, status_code=503)
    data = await request.json()
    prompt = data.get("prompt", "")
    history = data.get("history", [])
    if not prompt:
        return JSONResponse({"error": "No prompt provided."}, status_code=400)
    global MODEL, TOKENIZER
    model_name = getattr(MODEL.config, 'name_or_path', '').lower()
    chat_models = ["llama-3", "llama-3-inst", "qwen", "mistral-inst", "vicuna"]
    is_chat_model = any(m in model_name for m in chat_models)
    if is_chat_model:
        messages = []
        for turn in history:
            if turn.get("role") == "user":
                messages.append({"role": "user", "content": turn.get("content", "")})
            elif turn.get("role") == "bot":
                messages.append({"role": "assistant", "content": turn.get("content", "")})
        messages.append({"role": "user", "content": prompt})
        full_prompt = TOKENIZER.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        stop_token_ids = []
        if hasattr(TOKENIZER, 'special_tokens_map'):
            for k, v in TOKENIZER.special_tokens_map.items():
                if isinstance(v, str):
                    stop_token_ids += TOKENIZER.encode(v, add_special_tokens=False)
                elif isinstance(v, list):
                    for s in v:
                        stop_token_ids += TOKENIZER.encode(s, add_special_tokens=False)
        if '<|im_end|>' in TOKENIZER.get_vocab():
            stop_token_ids.append(TOKENIZER.encode('<|im_end|>', add_special_tokens=False)[0])
    else:
        full_prompt = ""
        for turn in history:
            if turn.get("role") == "user":
                full_prompt += f"User: {turn.get('content', '')}\n"
            elif turn.get("role") == "bot":
                full_prompt += f"Model: {turn.get('content', '')}\n"
        full_prompt += f"User: {prompt}\nModel:"
    stream = True
    if request.query_params.get("stream", "true").lower() == "false":
        stream = False
    async def token_stream():
        async with MODEL_LOCK:
            params = {
                "prompt": full_prompt,
                "temperature": 0.7,
                "repetition_penalty": 1.0,
                "max_new_tokens": 512,
                "stop": None,
                "stop_token_ids": stop_token_ids,
                "echo": False,
                "top_k": -1,
                "top_p": 1.0
            }
            last_text = ""
            try:
                for out in generate_stream(MODEL, TOKENIZER, params, device="cuda", context_len=2147483647):
                    new_text = out["text"][len(last_text):]
                    print(f"[DEBUG] Streaming text chunk: {repr(new_text)}")
                    last_text = out["text"]
                    if new_text:
                        yield f"data: {new_text}\n\n"
                        await asyncio.sleep(0)
            except Exception as e:
                print(f"[DEBUG] Exception in token_stream: {e}")
                yield f"data: [Error: {str(e)}]\n\n"
    if stream:
        return StreamingResponse(token_stream(), media_type="text/event-stream")
    else:
        async with MODEL_LOCK:
            params = {
                "prompt": full_prompt,
                "temperature": 0.7,
                "repetition_penalty": 1.0,
                "max_new_tokens": 512,
                "stop": None,
                "stop_token_ids": stop_token_ids,
                "echo": False,
                "top_k": -1,
                "top_p": 1.0
            }
            output = ""
            try:
                for out in generate_stream(MODEL, TOKENIZER, params, device="cuda", context_len=2147483647):
                    output = out["text"]
            except Exception as e:
                return JSONResponse({"error": str(e)}, status_code=500)
        return JSONResponse({"response": output})

@app.get("/test_stream")
async def test_stream():
    async def event_stream():
        for i in range(10):
            yield f"data: {i}\\n\\n"
            await asyncio.sleep(1)
    return StreamingResponse(event_stream(), media_type="text/event-stream")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--reload", action="store_true")
    args = parser.parse_args()
    import uvicorn
    uvicorn.run("inf_llm.serve:app", host=args.host, port=args.port, reload=args.reload) 
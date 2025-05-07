from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend import state
import torch

# Hardcoded CLI-like config (replace with actual values as needed)
MODEL_PATH = "Qwen/Qwen1.5-4B-Chat"
INF_LLM_CONFIG_PATH = "config/working/qwen-4b-inf-llm.yaml"
NUM_GPUS = torch.cuda.device_count() if torch.cuda.is_available() else 0
MAX_GPU_MEMORY = "10GiB"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model and tokenizer at startup
    from inf_llm import chat as inf_llm_chat
    from omegaconf import OmegaConf
    inf_llm_config_full = OmegaConf.load(INF_LLM_CONFIG_PATH)
    inf_llm_config = inf_llm_config_full["model"]
    state.conv_template_name = inf_llm_config_full.get("conv_type", None)
    state.model, state.tokenizer = inf_llm_chat.load_model(
        MODEL_PATH,
        device="cuda" if torch.cuda.is_available() else "cpu",
        num_gpus=NUM_GPUS,
        max_gpu_memory=MAX_GPU_MEMORY,
        dtype=None,
        load_8bit=False,
        cpu_offloading=False,
        gptq_config=None,
        awq_config=None,
        exllama_config=None,
        xft_config=None,
        revision="main",
        debug=False,
    )
    state.model = inf_llm_chat.patch_hf(state.model, inf_llm_config.type, **inf_llm_config)
    yield

from backend.endpoints.chat import router as chat_router
from backend.endpoints.model import router as model_router

# Create FastAPI app
app = FastAPI(
    title="InfLLM API",
    description="API for chatting with InfLLM model.",
    lifespan=lifespan
)

# Allow CORS for local frontend development (update for production!)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(chat_router)
app.include_router(model_router)

# Optional: allow running with `python backend/main.py`
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
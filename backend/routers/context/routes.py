from fastapi import APIRouter
from .types import LayerResponse, BlockResponse
from .context_utils import extract_ctx_manager

context_router = APIRouter(prefix="/context")


@context_router.get("/layer/{layer}", response_model=LayerResponse)
def get_layer(layer: int):
    """
    GET /layer/{layer}
    Input: layer (path param)
    Output: LayerResponse
    """
    try:
        ctx_manager = extract_ctx_manager(layer)
        blocks = ctx_manager.global_blocks[0]
        num_blocks = len(blocks)
        block_indices = list(range(num_blocks))
        return LayerResponse(layer=layer, num_blocks=num_blocks, block_indices=block_indices)
    except Exception as e:
        print(e)
        return LayerResponse(layer=layer, num_blocks=0, block_indices=[], error=str(e))

@context_router.get("/block/{layer}/{block}", response_model=BlockResponse)
def get_block(layer: int, block: int):
    """
    GET /block/{layer}/{block}
    Input: layer (path param), block (path param)
    Output: BlockResponse
    """
    try:
        import backend.state as state
        ctx_manager = extract_ctx_manager(layer)
        memory_unit = ctx_manager.global_blocks[0][block]
        # Try to get input_ids from the model (patched model should have this)
        input_ids = getattr(getattr(state, "model", None), "input_ids", None)
        tokenizer = getattr(state, "tokenizer", None)
        tokens = []
        representation_score = []
        if input_ids is not None and tokenizer is not None:
            input_ids = input_ids[0].tolist() if hasattr(input_ids, 'tolist') else input_ids
            block_tokens, block_scores = memory_unit.get_tokens_and_scores(input_ids)
            tokens = tokenizer.batch_decode(block_tokens)
            # If you want decoded strings:
            # tokens = [tokenizer.decode([tid]) for tid in block_tokens]
            representation_score = block_scores.tolist() if hasattr(block_scores, 'tolist') else list(block_scores)
        else:
            if input_ids is None:
                print("Warning: input_ids not found on model. Patch may be missing.")
            if tokenizer is None:
                print("Warning: tokenizer not found in state.")
        return BlockResponse(
            layer=layer,
            block=block,
            tokens=tokens,
            representation_score=representation_score
        )
    except Exception as e:
        print(e)
        return BlockResponse(layer=layer, block=block, tokens=[], representation_score=[], error=str(e))
  
from fastapi import APIRouter
from .types import CtxResponse, LayerResponse, BlockResponse
from .context_utils import extract_ctx_manager

context_router = APIRouter()

@context_router.get("/ctx/{layer}", response_model=CtxResponse)
def get_ctx(layer: int):
    """
    GET /ctx/{layer}
    Input: layer (path param)
    Output: CtxResponse
    """
    return CtxResponse(
      layer=layer,
      context=f"dummy context for layer {layer}",
      status="ok"
    )

@context_router.get("/layer/{layer}", response_model=LayerResponse)
def get_layer(layer: int):
    """
    GET /layer/{layer}
    Input: layer (path param)
    Output: LayerResponse
    """
    return LayerResponse(layer=layer, num_blocks=10)

@context_router.get("/block/{layer}/{block}", response_model=BlockResponse)
def get_block(layer: int, block: int):
    """
    GET /block/{layer}/{block}
    Input: layer (path param), block (path param)
    Output: BlockResponse
    """
    return BlockResponse(
      layer=layer,
      block=block,
      tokens=["token1", "token2"],
      representation_score=[0.5, 0.6]
    )
  
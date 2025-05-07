from pydantic import BaseModel
from typing import List

class CtxResponse(BaseModel):
    """Response body for /ctx/{layer} endpoint."""
    layer: int
    context: str
    status: str

class LayerResponse(BaseModel):
    """Response body for /layer/{layer} endpoint."""
    layer: int
    num_blocks: int
    # TODO: add more info here

class BlockResponse(BaseModel):
    """Response body for /block/{layer}/{block} endpoint."""
    layer: int
    block: int
    tokens: List[str]
    representation_score: List[float]

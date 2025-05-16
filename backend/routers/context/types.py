from pydantic import BaseModel
from typing import List, Optional

class LayerResponse(BaseModel):
    """Response body for /layer/{layer} endpoint."""
    layer: int
    num_blocks: int
    block_indices: List[int]
    error: Optional[str] = None
    # TODO: add more info here

class BlockResponse(BaseModel):
    """Response body for /block/{layer}/{block} endpoint."""
    layer: int
    block: int
    tokens: List[str]
    representation_score: List[float]
    error: Optional[str] = None

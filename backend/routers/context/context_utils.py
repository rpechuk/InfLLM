import backend.state as state

def extract_ctx_manager(layer_idx):
    if len(state.model.model.layers) <= layer_idx:
        raise ValueError(f"Layer index {layer_idx} is out of range for the model with {len(state.model.model.layers)} layers.")
    if not hasattr(state.model.model.layers[layer_idx], "self_attn"):
        raise ValueError(f"Layer {layer_idx} does not have a self_attn attribute.")
    if not hasattr(state.model.model.layers[layer_idx].self_attn, "_past_key_value"):
        raise ValueError(f"Layer {layer_idx} does not have a _past_key_value attribute.")
    ctx_manager = state.model.model.layers[layer_idx].self_attn._past_key_value
    return ctx_manager 
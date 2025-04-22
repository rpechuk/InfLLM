from typing import Protocol, Any
from time import perf_counter

class GlobalCacheListener(Protocol):
    """
    event      – 'add' | 'load' | 'evict'
    unit_id    – batch index  (0‑based, size = num_units)
    block_id   – global block index  (0‑based, monotonically increasing)
    extra      – anything else you feel like emitting (length, timestamp …)
    """
    def __call__(self,
                 event: str,
                 unit_id: int,
                 block_id: int,
                 **extra: Any) -> None: ...

def file_listener(filename: str, model) -> GlobalCacheListener:
    """
    Returns a listener that writes to the given file as efficiently as possible.
    """
    try:
        with open(filename, 'w') as f:
            pass
    except FileNotFoundError:
        pass

    def _decode(input_ids: list[int]) -> str:
        return model.tokenizer.decode(input_ids,
                skip_special_tokens=True,
                spaces_between_special_tokens=False,
                clean_up_tokenization_spaces=True)

    def _listener(event: str, **kwargs: Any) -> None:
        with open(filename, 'a') as f:
            if event == 'add':
                f.write(f"[{perf_counter():.3f}] u{kwargs['unit_id']:02d} {event:>5} block {kwargs['block_id']}\n")
            elif event == 'load':
                f.write(f"[{perf_counter():.3f}] u{kwargs['unit_id']:02d} {event:>5} block {kwargs['block_id']}\n")
            elif event == 'evict':
                f.write(f"[{perf_counter():.3f}] u{kwargs['unit_id']:02d} {event:>5} block {kwargs['block_id']}\n")
            elif event == 'topk':
                f.write(f"[{perf_counter():.3f}] u{kwargs['unit_id']:02d} {event:>5}\n")
                f.write(f"  ret={kwargs['ret']}\n")
            else:
                raise ValueError(f"Unknown event: {event}")
        
            if 'block_start' in kwargs and 'block_end' in kwargs:
                f.write(f"  block_contents={_decode(model.input_ids.tolist()[0][kwargs['block_start']:kwargs['block_end']])}\n")

    return _listener
    
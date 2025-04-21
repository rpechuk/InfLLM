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

def file_listener(filename: str, uuid: str) -> GlobalCacheListener:
    """
    Returns a listener that writes to the given file as efficiently as possible.
    """
    def _listener(event: str, unit: int, block: int, **_):
        with open(filename, 'a') as f:
            f.write(f"[{perf_counter():.3f}] <{uuid}> u{unit:02d} {event:>5} block {block}\n")
    return _listener
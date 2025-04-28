from typing import Protocol, Any, List, Callable, Optional
from time import perf_counter
import json
import asyncio
import os

Self = Any

class GlobalCacheListener(Protocol):
    """
    event     - 'add' | 'load' | 'evict'
    unit_id   - batch index  (0-based, size = num_units)
    block_id  - global block index  (0-based, monotonically increasing)
    extra     - anything else you feel like emitting (length, timestamp …)
    """
    def __call__(self,
                 event: str,
                 unit_id: int,
                 block_id: int,
                 **extra: Any) -> Self: ...

class ListenerManager(GlobalCacheListener):
    """Manages multiple cache listeners"""

    def __init__(self, model):
        self.listeners = []
        self.model = model
        self.logs = []

    def add_listener(self, listener: GlobalCacheListener) -> Self:
        """Add a listener to the manager"""
        self.listeners.append(listener)
        return self

    def remove_listener(self, listener: GlobalCacheListener) -> Self:
        """Remove a listener from the manager"""
        if listener in self.listeners:
            self.listeners.remove(listener)
        return self

    def __call__(self, event: str, unit_id: int, block_id: int, **extra: Any) -> Self:
        """Forward events to all registered listeners"""
        for listener in self.listeners:
            try:
                listener(event, unit_id, block_id, **extra)
                self.logs.append((event, unit_id, block_id, extra))
            except Exception as e:
                # log and continue
                print(f"Error in listener: {str(e)}")
                continue

        return self

def file_listener(filename: str, model) -> GlobalCacheListener:
    """
    Returns a listener that writes to the given file as efficiently as possible.
    """
    try:
        with open(filename, 'w') as f:
            pass
    except FileNotFoundError:
        # create directory if it doesn't exist
        os.makedirs(os.path.dirname(filename) or '.', exist_ok=True)
        with open(filename, 'w') as f:
            pass

    def _decode(input_ids: list[int]) -> str:
        return model.tokenizer.decode(input_ids,
                skip_special_tokens=True,
                spaces_between_special_tokens=False,
                clean_up_tokenization_spaces=True)

    def _listener(event: str, unit_id: int, block_id: int, **kwargs: Any) -> None:
        with open(filename, 'a') as f:
            if event == 'add':
                f.write(f"[{perf_counter():.3f}] u{unit_id:02d} {event:>5} block {block_id}\n")
            elif event == 'load':
                f.write(f"[{perf_counter():.3f}] u{unit_id:02d} {event:>5} block {block_id}\n")
            elif event == 'evict':
                f.write(f"[{perf_counter():.3f}] u{unit_id:02d} {event:>5} block {block_id}\n")
            elif event == 'topk':
                f.write(f"[{perf_counter():.3f}] u{unit_id:02d} {event:>5}\n")
                f.write(f"  ret={kwargs['ret']}\n")
            else:
                f.write(f"[{perf_counter():.3f}] u{unit_id:02d} unknown event: {event}\n")
        
            if 'block_start' in kwargs and 'block_end' in kwargs:
                f.write(f"  block_contents={_decode(model.input_ids.tolist()[0][kwargs['block_start']:kwargs['block_end']])}\n")

    return _listener

def json_file_listener(filename: str, model) -> GlobalCacheListener:
    """
    Returns a listener that writes JSON events to a file for later processing.
    This can be used instead of a direct websocket connection.
    """
    try:
        # Initialize with an empty array
        with open(filename, 'w') as f:
            f.write('[]')
    except FileNotFoundError:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filename) or '.', exist_ok=True)
        with open(filename, 'w') as f:
            f.write('[]')

    def _decode(input_ids: list[int]) -> str:
        return model.tokenizer.decode(input_ids,
                skip_special_tokens=True,
                spaces_between_special_tokens=False,
                clean_up_tokenization_spaces=True)

    def _listener(event: str, unit_id: int, block_id: int, **kwargs: Any) -> None:
        # Create event object
        event_obj = {
            "timestamp": perf_counter(),
            "event": event,
            "unit_id": unit_id,
            "block_id": block_id
        }

        # Add any additional kwargs
        for key, value in kwargs.items():
            if key in ('block_start', 'block_end'):
                continue  # Handle these separately
            event_obj[key] = value

        # Add decoded block content if available
        if 'block_start' in kwargs and 'block_end' in kwargs:
            try:
                event_obj["block_contents"] = _decode(
                    model.input_ids.tolist()[0][kwargs['block_start']:kwargs['block_end']]
                )
            except Exception as e:
                event_obj["block_contents_error"] = str(e)

        # Append to the JSON file
        # Note: This is not the most efficient for large files, but works for streaming updates
        try:
            # Read existing data
            with open(filename, 'r') as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    # File might be empty or corrupted
                    data = []

            # Append new event
            data.append(event_obj)

            # Write back
            with open(filename, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            # Log error but don't crash
            print(f"Error writing to JSON file: {str(e)}")

    return _listener

def file_streaming_listener(log_filename: str, json_filename: str, model) -> GlobalCacheListener:
    """
    Creates a listener that logs both to a regular log file and to a JSON file
    that can be streamed to a websocket by an external process.

    Args:
        log_filename: Path to the regular log file
        json_filename: Path to the JSON file that can be streamed
        model: Model with tokenizer for decoding
    """
    return ListenerManager(model)                             \
        .add_listener(file_listener(log_filename, model))     \
        .add_listener(json_file_listener(json_filename, model))
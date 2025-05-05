from typing import Protocol, Any
from time import perf_counter

class GlobalCacheListener(Protocol):
    """
    event      - 'add' | 'load' | 'evict' | 'move_to_gpu' | 'move_to_cpu'
    unit_id    - batch index  (0-based, size = num_units)
    block_id   - global block index  (0-based, monotonically increasing)
    extra      - additional info, e.g.:
        was_on_gpu: bool (whether the block was already on GPU before the event)
        block_shape: str (shape of the block being loaded, if applicable)
        event_detail: str (human-readable description of the event)
        (length, timestamp, ...)
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

def word_cloud_listener(output_dir: str, model) -> GlobalCacheListener:
    """
    Returns a listener that generates word clouds from cache blocks,
    filtering out stop words. Only generates on 'add' events, and can
    be recalled later in `clouds/uXX/uXX_block_YY.png`.
    """
    try:
        import os
        os.makedirs(output_dir, exist_ok=True)

        from wordcloud import WordCloud
        import nltk
        from nltk.corpus import stopwords

        # download stop words if not found
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords', quiet=True)

        stop_words = set(stopwords.words('english'))

        stop_words.update({'the', 'and', 'is', 'in', 'to', 'of', 'a', 'for', 'that', 'on',
                           'with', 'by', 'this', 'as', 'at', 'from', 'or', 'an', 'be', 'it',
                           'are', 'was', 'were', 'been', 'has', 'have', 'had', 'will', 'would',
                           'shall', 'should', 'may', 'might', 'can', 'could', 'i', 'you', 'he',
                           'she', 'they', 'we', 'their', 'our', 'your', 'his', 'her', 'its'})
    except ImportError:
        raise ImportError("Please install wordcloud and nltk by running 'uv pip install wordcloud nltk'")

    def _decode(input_ids: list[int]) -> str:
        return model.tokenizer.decode(input_ids,
                skip_special_tokens=True,
                spaces_between_special_tokens=False,
                clean_up_tokenization_spaces=True)

    def _listener(event: str, **kwargs: Any) -> None:
        # only process 'add' events
        if event != 'add':
            return
        if 'unit_id' not in kwargs or 'block_id' not in kwargs:
            print(f"u{kwargs.get('unit_id', '??'):02d} {event:>5} block {kwargs.get('block_id', '??')} no contents")
            return

        unit_id, block_id = kwargs['unit_id'], kwargs['block_id']

        block_contents = []
        if 'block_start' in kwargs and 'block_end' in kwargs:
            block_start, block_end = kwargs['block_start'], kwargs['block_end']
            block_contents = model.input_ids.tolist()[0][block_start:block_end]

        if not block_contents:
            print(f"u{unit_id:02d} {event:>5} block {block_id} no contents")
            return

        # decode and clean up the text
        block_contents = _decode(block_contents)
        block_contents = ''.join(c.lower() if c.isalnum() or c.isspace() else ' ' for c in block_contents)

        words = block_contents.split()
        word_freq = {}

        # filter out stop words and digits
        for word in words:
            if (word not in stop_words and not word.isdigit()):
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # if not enough words, skip generating cloud
        if len(word_freq) < 5:
            print(f"u{unit_id:02d} {event:>5} block {block_id} insufficient content")
            return

        # generate and save
        wordcloud = WordCloud(
            width=800,
            height=400,
            background_color='white',
            max_words=75,
            collocations=False
        ).generate_from_frequencies(word_freq)

        output_path = os.path.join(output_dir, f"u{unit_id:02d}_block_{block_id}.png")
        wordcloud.to_file(output_path)
        print(f"u{unit_id:02d} {event:>5} block {block_id} meaningful content saved to {output_path}")

    return _listener
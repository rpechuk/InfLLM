# Global state for model and tokenizer (populated at app startup)
model = None  # HuggingFace model instance

tokenizer = None  # Tokenizer instance

conv_template_name = None  # Conversation template name (optional) 

_conversation = None # in-memory conversation (for demo; not thread-safe for production)

config = None # config for the model
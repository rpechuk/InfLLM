#!/usr/bin/env bash
(
    set -euo pipefail

    # Config
    UV_VERSION="latest" # You can pin to a version like "0.1.29"
    VENV_DIR="/storage/InfLLM/.venv"

    # Function to check if uv is installed
    has_uv() {
        command -v uv >/dev/null 2>&1
    }

    # Install uv if not already installed
    install_uv() {
        echo "Installing uv..."
        if ! curl -LsSf https://astral.sh/uv/install.sh | sh; then
            echo "❌ Failed to install uv. Please check your internet connection or try manual install."
            exit 1
        fi
        echo "✅ uv installed successfully."
    }

    # Ensure uv is available
    if ! has_uv; then
        install_uv
    fi

    # Create virtual environment using uv
    if [ ! -d "$VENV_DIR" ]; then
        echo "📦 Creating uv virtual environment in $VENV_DIR"
        uv venv "$VENV_DIR"
    else
        echo "ℹ️ Virtual environment already exists at $VENV_DIR"
    fi

    # Activate environment and install dependencies
    # shellcheck disable=SC1090
    source "$VENV_DIR/bin/activate"

    if [ -f "pyproject.toml" ]; then
        echo "📥 Installing dependencies from pyproject.toml"
        uv pip install -r <(uv pip compile pyproject.toml)
    elif [ -f "requirements.txt" ]; then
        echo "📥 Installing dependencies from requirements.txt"
        uv pip install --no-cache-dir -r requirements.txt
    else
        echo "⚠️ No pyproject.toml or requirements.txt found. Skipping dependency installation."
    fi

    # Add environment activation and variables to .bashrc if not already present
    ACTIVATE_LINE="source $VENV_DIR/bin/activate"
    HF_HOME_LINE="export HF_HOME=/storage/hf_home"
    HF_TOKEN_LINE="export HF_TOKEN_PATH=~/.huggingface/token"

    grep -qxF "$ACTIVATE_LINE" ~/.bashrc || echo "$ACTIVATE_LINE" >> ~/.bashrc
    grep -qxF "$HF_HOME_LINE" ~/.bashrc || echo "$HF_HOME_LINE" >> ~/.bashrc
    grep -qxF "$HF_TOKEN_LINE" ~/.bashrc || echo "$HF_TOKEN_LINE" >> ~/.bashrc
)

# Try to source .bashrc, but don't fail if it doesn't work (e.g., if not interactive)
if ! source ~/.bashrc 2>/dev/null; then
    echo "⚠️ Could not re-source .bashrc. Please run 'source ~/.bashrc' manually if needed."
fi

echo "✅ Setup complete."

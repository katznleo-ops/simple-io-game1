#!/bin/bash

echo "🚀 Setting up Antigravity CLI..."

# Install the CLI if it isn't already installed
if [ ! -f "$HOME/.local/bin/agy" ]; then
    curl -fsSL https://antigravity.google/cli/install.sh | bash
fi

# Make sure it's in the PATH
if ! grep -q 'export PATH="$HOME/.local/bin:$PATH"' ~/.bashrc; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
fi

# Reload path for current session
export PATH="$HOME/.local/bin:$PATH"

echo "✅ 'agy' is ready to use!"
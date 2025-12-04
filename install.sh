#!/usr/bin/env sh
set -e

if [ $# -lt 1 ]; then
    echo "Usage: $0 <path-to-executable>"
    echo "Example: ./install.sh bin/hron-linux"
    exit 1
fi

CMD_NAME="hron"
EXE_SOURCE="$1"

if [ ! -f "$EXE_SOURCE" ]; then
    echo "Error: File not found: $EXE_SOURCE"
    exit 1
fi

# Detect OS
UNAME=$(uname | tr '[:upper:]' '[:lower:]')

if echo "$UNAME" | grep -q "linux"; then
    OS="linux"
    TARGET_DIR="$HOME/.local/bin"
elif echo "$UNAME" | grep -q "darwin"; then
    OS="macos"
    TARGET_DIR="/usr/local/bin"
elif echo "$UNAME" | grep -q "mingw" || echo "$UNAME" | grep -q "msys"; then
    OS="windows"
    TARGET_DIR="$HOME/bin"
else
    OS="unknown"
    TARGET_DIR="$HOME/.local/bin"
fi

echo "OS: $OS"
echo "Installing to: $TARGET_DIR"

# Create target dir if missing
mkdir -p "$TARGET_DIR"

# Copy executable
cp "$EXE_SOURCE" "$TARGET_DIR/$CMD_NAME"

if [ "$OS" != "windows" ]; then
    chmod +x "$TARGET_DIR/$CMD_NAME"
fi

if ! echo "$PATH" | tr ':' '\n' | grep -qx "$TARGET_DIR"; then
    echo ""
    echo "PATH does not include $TARGET_DIR, updating shell profile..."

    PROFILE=""

    # Select best shell profile
    [ -f "$HOME/.bashrc" ] && PROFILE="$HOME/.bashrc"
    [ -f "$HOME/.zshrc" ] && PROFILE="$HOME/.zshrc"
    [ -z "$PROFILE" ] && PROFILE="$HOME/.profile"

    echo "export PATH=\"\$PATH:$TARGET_DIR\"" >> "$PROFILE"
    echo ""
    echo "Please restart your terminal or run:"
    echo "source $PROFILE"
else
    echo ""
    echo "PATH already contains $TARGET_DIR"
fi

echo ""
echo "Installation complete!"
echo ""
echo "You can now run:"
echo "$CMD_NAME or $CMD_NAME --help"

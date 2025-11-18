#!/bin/bash
# Install Lefthook Git hooks

echo "Installing Lefthook Git hooks..."
npx lefthook install

if [ $? -eq 0 ]; then
  echo "✓ Lefthook hooks installed successfully"
else
  echo "✗ Failed to install Lefthook hooks"
  exit 1
fi

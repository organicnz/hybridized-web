#!/bin/bash
# Uninstall Lefthook Git hooks

echo "Uninstalling Lefthook Git hooks..."
npx lefthook uninstall

if [ $? -eq 0 ]; then
  echo "✓ Lefthook hooks uninstalled successfully"
else
  echo "✗ Failed to uninstall Lefthook hooks"
  exit 1
fi

#!/bin/bash
# Manually run Lefthook hooks

HOOK_NAME=${1:-pre-commit}

echo "Running Lefthook hook: $HOOK_NAME"
npx lefthook run $HOOK_NAME

if [ $? -eq 0 ]; then
  echo "✓ Hook $HOOK_NAME completed successfully"
else
  echo "✗ Hook $HOOK_NAME failed"
  exit 1
fi

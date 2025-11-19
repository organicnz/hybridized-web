#!/bin/bash

# Deploy all edge functions with JWT verification disabled
# This ensures custom FUNCTION_SECRET authorization is used instead

echo "🚀 Deploying all edge functions with --no-verify-jwt..."

functions=(
  "sync-firstory"
  "sync-profile-data"
  "generate-band-stats"
  "search-bands"
  "keep-alive-ping"
  "invite-users"
)

for func in "${functions[@]}"; do
  echo ""
  echo "📦 Deploying $func..."
  supabase functions deploy "$func" --no-verify-jwt
  
  if [ $? -eq 0 ]; then
    echo "✅ $func deployed successfully"
  else
    echo "❌ Failed to deploy $func"
    exit 1
  fi
done

echo ""
echo "✅ All functions deployed successfully with JWT verification disabled!"
echo "🔒 Functions now use FUNCTION_SECRET for authorization"

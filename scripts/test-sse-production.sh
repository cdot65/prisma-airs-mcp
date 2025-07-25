#!/bin/bash

# Test SSE functionality in production

echo "🧪 Testing SSE functionality on production server"
echo "================================================"
echo ""

URL="https://airs.cdot.io/prisma-airs"

echo "1️⃣ Testing health endpoint..."
curl -s "$URL/health" | jq .
echo ""

echo "2️⃣ Testing standard JSON-RPC request..."
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}' | jq .
echo ""

echo "3️⃣ Testing SSE connection (5 seconds)..."
echo "Connecting to: $URL"
echo "Headers: Accept: text/event-stream"
echo ""
timeout 5 curl -N -H "Accept: text/event-stream" "$URL" || true
echo ""
echo ""

echo "4️⃣ Testing JSON-RPC with SSE Accept header..."
curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}' | jq .
echo ""

echo "5️⃣ Server info (non-SSE GET request)..."
curl -s "$URL" | jq .
echo ""

echo "✅ SSE testing complete!"
echo ""
echo "Note: Currently, no methods stream by default."
echo "The shouldStreamResponse() method returns false for all methods."
echo "SSE infrastructure is ready for when streaming is enabled."
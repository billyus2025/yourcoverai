#!/bin/bash

# Icon Factory Test Script
# Usage: ./test.sh

set -e

if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ Error: OPENAI_API_KEY environment variable is required"
  echo ""
  echo "Please set it first:"
  echo "  export OPENAI_API_KEY='your-api-key-here'"
  echo ""
  echo "Then run this script again."
  exit 1
fi

echo "🚀 Starting Icon Factory tests..."
echo ""

# Test 1: yourcoverai (professional)
echo "📱 Test 1: Generating icon for 'yourcoverai' (professional style)..."
node worker.js yourcoverai professional
echo "✅ Test 1 completed"
echo ""

# Test 2: tarotai (magic)
echo "🔮 Test 2: Generating icon for 'tarotai' (magic style)..."
node worker.js tarotai magic
echo "✅ Test 2 completed"
echo ""

# Test 3: excelai (tech)
echo "📊 Test 3: Generating icon for 'excelai' (tech style)..."
node worker.js excelai tech
echo "✅ Test 3 completed"
echo ""

echo "🎉 All tests completed successfully!"
echo ""
echo "Generated icons:"
ls -lh outputs/*.png 2>/dev/null || echo "  (Icons will appear here after generation)"


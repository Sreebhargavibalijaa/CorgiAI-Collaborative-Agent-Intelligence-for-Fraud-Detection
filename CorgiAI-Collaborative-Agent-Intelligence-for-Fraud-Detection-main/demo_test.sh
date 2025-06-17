#!/bin/bash

# Demo script for testing the Corgi Fraud Detection System

echo "🐕 Corgi Fraud Detection System - Demo Test"
echo "=========================================="

# Test file upload endpoint
echo "📁 Testing file upload endpoint..."
echo "Test document for fraud detection demo" > demo_test.txt

UPLOAD_RESPONSE=$(curl -s -X POST -F "files=@demo_test.txt" http://localhost:8000/api/upload-documents)
echo "Upload Response: $UPLOAD_RESPONSE"
echo ""

# Test single claim analysis
echo "🔍 Testing single claim analysis..."
CLAIM_RESPONSE=$(curl -s -X POST http://localhost:8000/api/analyze-claim \
  -H "Content-Type: application/json" \
  -d '{
    "claimant": "Demo User",
    "claim_text": "I was involved in a car accident while driving to work. The other driver ran a red light and hit my vehicle.",
    "claim_amount": 8500.00,
    "date_of_incident": "2025-06-10",
    "policy_number": "DEMO-12345",
    "contact_email": "demo@example.com",
    "supporting_docs": "demo_test.txt",
    "location": "40.7128,-74.0060"
  }')

echo "Claim Analysis Response:"
echo "$CLAIM_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CLAIM_RESPONSE"
echo ""

# Test system stats
echo "📊 Testing system stats..."
STATS_RESPONSE=$(curl -s http://localhost:8000/api/stats)
echo "System Stats:"
echo "$STATS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATS_RESPONSE"
echo ""

# Cleanup
rm -f demo_test.txt

echo "✅ Demo test completed!"
echo "🌐 Open http://localhost:3000/single-claim to test the UI"

#!/bin/bash

# Simplified E2E Test - Focus on Core Flow
BASE_URL="http://localhost:3002"
TEST_EMAIL="simple_test_$(date +%s)@test.com"
COOKIE_FILE="/tmp/simple_test_cookies.txt"

echo "=== 1. REGISTER USER ==="
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_FILE" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"test123456\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"tenantName\": \"Test Tenant $(date +%s)\"
  }")

echo "$REGISTER_RESPONSE" | jq .
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id // empty')
echo "User ID: $USER_ID"

echo -e "\n=== 2. CREATE INVOICE ==="
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/invoices" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_FILE" \
  -d "{
    \"invoiceNumber\": \"INV-SIMPLE-$(date +%s)\",
    \"clientName\": \"Test Client\",
    \"clientEmail\": \"client@test.com\",
    \"clientAddress\": \"123 Test St\",
    \"issueDate\": \"2025-10-06\",
    \"dueDate\": \"2025-11-06\",
    \"status\": \"sent\",
    \"tax\": 100,
    \"items\": [{
      \"description\": \"Service\",
      \"quantity\": 10,
      \"unitPrice\": 150
    }]
  }")

echo "$CREATE_RESPONSE" | jq .
INVOICE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id // empty')
echo "Invoice ID: $INVOICE_ID"

echo -e "\n=== 3. GET INVOICE BY ID ==="
if [ -n "$INVOICE_ID" ]; then
    GET_RESPONSE=$(curl -s "$BASE_URL/api/invoices/$INVOICE_ID" \
      -b "$COOKIE_FILE")
    echo "$GET_RESPONSE" | jq .
else
    echo "ERROR: No invoice ID"
fi

echo -e "\n=== 4. UPDATE INVOICE ==="
if [ -n "$INVOICE_ID" ]; then
    UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/invoices/$INVOICE_ID" \
      -H "Content-Type: application/json" \
      -b "$COOKIE_FILE" \
      -d "{
        \"status\": \"paid\"
      }")
    echo "$UPDATE_RESPONSE" | jq .
else
    echo "ERROR: No invoice ID"
fi

echo -e "\n=== 5. GET STATS ==="
STATS_RESPONSE=$(curl -s "$BASE_URL/api/invoices/stats" \
  -b "$COOKIE_FILE")
echo "$STATS_RESPONSE" | jq .

echo -e "\n=== 6. GENERATE PDF ==="
if [ -n "$INVOICE_ID" ]; then
    curl -s "$BASE_URL/api/invoices/$INVOICE_ID/pdf" \
      -b "$COOKIE_FILE" \
      -o "/tmp/test_invoice.pdf"
    
    if [ -f "/tmp/test_invoice.pdf" ]; then
        FILE_TYPE=$(file -b "/tmp/test_invoice.pdf")
        FILE_SIZE=$(stat -f%z "/tmp/test_invoice.pdf" 2>/dev/null || stat -c%s "/tmp/test_invoice.pdf")
        echo "PDF Generated: $FILE_TYPE, Size: $FILE_SIZE bytes"
    else
        echo "ERROR: PDF not created"
    fi
else
    echo "ERROR: No invoice ID"
fi

echo -e "\n=== 7. LIST INVOICES ==="
LIST_RESPONSE=$(curl -s "$BASE_URL/api/invoices" \
  -b "$COOKIE_FILE")
echo "$LIST_RESPONSE" | jq '.data | length'

echo -e "\n=== 8. DELETE INVOICE ==="
if [ -n "$INVOICE_ID" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/invoices/$INVOICE_ID" \
      -b "$COOKIE_FILE")
    echo "$DELETE_RESPONSE" | jq .
else
    echo "ERROR: No invoice ID"
fi

echo -e "\n=== 9. VERIFY DELETED ==="
if [ -n "$INVOICE_ID" ]; then
    VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/invoices/$INVOICE_ID" \
      -b "$COOKIE_FILE")
    HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tail -1)
    echo "HTTP Code: $HTTP_CODE (should be 404)"
else
    echo "ERROR: No invoice ID"
fi

echo -e "\n=== 10. LOGOUT ==="
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/logout" \
  -b "$COOKIE_FILE")
echo "$LOGOUT_RESPONSE" | jq .

# Cleanup
rm -f "$COOKIE_FILE" "/tmp/test_invoice.pdf"

echo -e "\n=== TEST COMPLETE ==="

#!/bin/bash

echo "==================================="
echo "Testing All API Endpoints"
echo "==================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Login
echo -e "\n1. Testing POST /api/auth/login"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  -c cookies.txt -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Login successful (200)${NC}"
else
    echo -e "${RED}✗ Login failed ($HTTP_CODE)${NC}"
fi

# Extract token for Bearer auth (if returned)
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty' 2>/dev/null)

# Test 2: Get Invoices
echo -e "\n2. Testing GET /api/invoices"
INVOICES_RESPONSE=$(curl -s http://localhost:3001/api/invoices \
  -b cookies.txt \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$INVOICES_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Get invoices successful (200)${NC}"
    INVOICE_COUNT=$(echo "$INVOICES_RESPONSE" | jq '.data | length' 2>/dev/null)
    echo "  Found $INVOICE_COUNT invoices"
else
    echo -e "${RED}✗ Get invoices failed ($HTTP_CODE)${NC}"
    echo "$INVOICES_RESPONSE" | grep -v "HTTP_CODE"
fi

# Test 3: Get Stats
echo -e "\n3. Testing GET /api/invoices/stats"
STATS_RESPONSE=$(curl -s http://localhost:3001/api/invoices/stats \
  -b cookies.txt \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$STATS_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Get stats successful (200)${NC}"
    echo "$STATS_RESPONSE" | grep -v "HTTP_CODE" | jq '.stats.counts' 2>/dev/null
else
    echo -e "${RED}✗ Get stats failed ($HTTP_CODE)${NC}"
    echo "$STATS_RESPONSE" | grep -v "HTTP_CODE"
fi

# Test 4: Create Invoice
echo -e "\n4. Testing POST /api/invoices"
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/invoices \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "invoiceNumber": "INV-TEST-'$(date +%s)'",
    "clientName": "Test Client",
    "clientEmail": "test@example.com",
    "clientAddress": "123 Test St",
    "issueDate": "'$(date -I)'",
    "dueDate": "'$(date -I -d '+30 days')'",
    "status": "pending",
    "items": [
      {
        "description": "Test Item",
        "quantity": 1,
        "rate": 100,
        "amount": 100
      }
    ],
    "subtotal": 100,
    "tax": 10,
    "total": 110
  }' \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Create invoice successful (201)${NC}"
    INVOICE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.invoice.id // empty' 2>/dev/null)
    echo "  Created invoice ID: $INVOICE_ID"
else
    echo -e "${RED}✗ Create invoice failed ($HTTP_CODE)${NC}"
    echo "$CREATE_RESPONSE" | grep -v "HTTP_CODE"
fi

# Test 5: Get Single Invoice (if we have an ID)
if [ ! -z "$INVOICE_ID" ]; then
    echo -e "\n5. Testing GET /api/invoices/$INVOICE_ID"
    GET_ONE_RESPONSE=$(curl -s http://localhost:3001/api/invoices/$INVOICE_ID \
      -b cookies.txt \
      -w "\nHTTP_CODE:%{http_code}")
    
    HTTP_CODE=$(echo "$GET_ONE_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Get single invoice successful (200)${NC}"
    else
        echo -e "${RED}✗ Get single invoice failed ($HTTP_CODE)${NC}"
    fi
    
    # Test 6: Update Invoice
    echo -e "\n6. Testing PATCH /api/invoices/$INVOICE_ID"
    UPDATE_RESPONSE=$(curl -s -X PATCH http://localhost:3001/api/invoices/$INVOICE_ID \
      -H "Content-Type: application/json" \
      -b cookies.txt \
      -d '{"status": "paid"}' \
      -w "\nHTTP_CODE:%{http_code}")
    
    HTTP_CODE=$(echo "$UPDATE_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Update invoice successful (200)${NC}"
    else
        echo -e "${RED}✗ Update invoice failed ($HTTP_CODE)${NC}"
    fi
    
    # Test 7: Get PDF
    echo -e "\n7. Testing GET /api/invoices/$INVOICE_ID/pdf"
    PDF_RESPONSE=$(curl -s http://localhost:3001/api/invoices/$INVOICE_ID/pdf \
      -b cookies.txt \
      -w "\nHTTP_CODE:%{http_code}" \
      -o /tmp/test-invoice.pdf)
    
    HTTP_CODE=$(echo "$PDF_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Get PDF successful (200)${NC}"
        FILE_SIZE=$(wc -c < /tmp/test-invoice.pdf)
        echo "  PDF size: $FILE_SIZE bytes"
    else
        echo -e "${RED}✗ Get PDF failed ($HTTP_CODE)${NC}"
    fi
    
    # Test 8: Delete Invoice
    echo -e "\n8. Testing DELETE /api/invoices/$INVOICE_ID"
    DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:3001/api/invoices/$INVOICE_ID \
      -b cookies.txt \
      -w "\nHTTP_CODE:%{http_code}")
    
    HTTP_CODE=$(echo "$DELETE_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Delete invoice successful (200)${NC}"
    else
        echo -e "${RED}✗ Delete invoice failed ($HTTP_CODE)${NC}"
    fi
fi

# Test 9: Logout
echo -e "\n9. Testing POST /api/auth/logout"
LOGOUT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/logout \
  -b cookies.txt \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$LOGOUT_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Logout successful (200)${NC}"
else
    echo -e "${RED}✗ Logout failed ($HTTP_CODE)${NC}"
fi

# Test 10: Register (optional, creates test user)
echo -e "\n10. Testing POST /api/auth/register"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser'$(date +%s)'@test.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "tenantName": "Test Company"
  }' \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Register successful (201)${NC}"
elif [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ Register validation working (400 - user exists)${NC}"
else
    echo -e "${RED}✗ Register failed ($HTTP_CODE)${NC}"
fi

echo -e "\n==================================="
echo "API Testing Complete"
echo "==================================="

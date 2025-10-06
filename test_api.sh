#!/bin/bash

# ===========================================
# ORYXA INVOICEFLOW - API TEST SUITE
# ===========================================

API_URL="http://localhost:3000"
TOKEN=""

echo "🚀 Testing Oryxa InvoiceFlow APIs..."
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test API
test_api() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local auth=$5
    
    echo -e "${YELLOW}Testing:${NC} $test_name"
    
    if [ -z "$auth" ]; then
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\n%{http_code}")
    else
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data" \
            -w "\n%{http_code}")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [[ $http_code == 20* ]]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        echo "Response: $body" | head -c 200
        echo ""
        echo ""
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "Response: $body"
        echo ""
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# ===========================================
# TEST 1: USER REGISTRATION
# ===========================================
echo "📝 TEST 1: User Registration"
echo "----------------------------"

REGISTER_DATA='{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@oryxa.com",
  "password": "testpass123",
  "tenantName": "Oryxa Test Company"
}'

if test_api "Register new user" "POST" "/api/auth/register" "$REGISTER_DATA"; then
    # Extract token from response
    TOKEN=$(echo "$body" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
    echo "🔑 Token received: ${TOKEN:0:50}..."
    echo ""
fi

# ===========================================
# TEST 2: USER LOGIN
# ===========================================
echo "🔐 TEST 2: User Login"
echo "--------------------"

LOGIN_DATA='{
  "email": "test@oryxa.com",
  "password": "testpass123"
}'

if test_api "Login existing user" "POST" "/api/auth/login" "$LOGIN_DATA"; then
    # Update token from login
    TOKEN=$(echo "$body" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
    echo "🔑 Token updated: ${TOKEN:0:50}..."
    echo ""
fi

# ===========================================
# TEST 3: CREATE INVOICE
# ===========================================
echo "📄 TEST 3: Create Invoice"
echo "-------------------------"

INVOICE_DATA='{
  "invoiceNumber": "ORY-2024-001",
  "clientName": "ABC Corporation",
  "clientEmail": "billing@abc.com",
  "clientAddress": "123 Main Street, Mumbai, India",
  "issueDate": "2024-10-06",
  "dueDate": "2024-11-06",
  "tax": 180,
  "status": "draft",
  "notes": "Thank you for your business!",
  "items": [
    {
      "description": "Web Development Services",
      "quantity": 10,
      "unitPrice": 150
    },
    {
      "description": "SEO Optimization",
      "quantity": 5,
      "unitPrice": 100
    }
  ]
}'

INVOICE_ID=""
if test_api "Create invoice with items" "POST" "/api/invoices" "$INVOICE_DATA" "auth"; then
    # Extract invoice ID
    INVOICE_ID=$(echo "$body" | grep -o '"id":"[^"]*' | head -1 | grep -o '[^"]*$')
    echo "📋 Invoice ID: $INVOICE_ID"
    echo ""
fi

# ===========================================
# TEST 4: GET ALL INVOICES
# ===========================================
echo "📋 TEST 4: Get All Invoices"
echo "---------------------------"

test_api "Fetch all invoices" "GET" "/api/invoices" "" "auth"

# ===========================================
# TEST 5: GET SINGLE INVOICE
# ===========================================
if [ ! -z "$INVOICE_ID" ]; then
    echo "🔍 TEST 5: Get Single Invoice"
    echo "-----------------------------"
    
    test_api "Fetch invoice by ID" "GET" "/api/invoices/$INVOICE_ID" "" "auth"
fi

# ===========================================
# TEST 6: UPDATE INVOICE
# ===========================================
if [ ! -z "$INVOICE_ID" ]; then
    echo "✏️ TEST 6: Update Invoice"
    echo "------------------------"
    
    UPDATE_DATA='{
      "status": "sent",
      "notes": "Updated: Payment terms Net 30"
    }'
    
    test_api "Update invoice status" "PUT" "/api/invoices/$INVOICE_ID" "$UPDATE_DATA" "auth"
fi

# ===========================================
# TEST 7: GENERATE PDF
# ===========================================
if [ ! -z "$INVOICE_ID" ]; then
    echo "📑 TEST 7: Generate PDF"
    echo "----------------------"
    
    echo -e "${YELLOW}Testing:${NC} Download invoice PDF"
    
    curl -s -X GET "$API_URL/api/invoices/$INVOICE_ID/pdf" \
        -H "Authorization: Bearer $TOKEN" \
        -o "test_invoice.pdf" \
        -w "%{http_code}" > /tmp/pdf_status
    
    PDF_STATUS=$(cat /tmp/pdf_status)
    
    if [ -f "test_invoice.pdf" ] && [ $PDF_STATUS -eq 200 ]; then
        PDF_SIZE=$(wc -c < "test_invoice.pdf")
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $PDF_STATUS)"
        echo "PDF downloaded: test_invoice.pdf ($PDF_SIZE bytes)"
        echo ""
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $PDF_STATUS)"
        echo ""
        FAILED=$((FAILED + 1))
    fi
fi

# ===========================================
# TEST 8: AUTHENTICATION PROTECTION
# ===========================================
echo "🔒 TEST 8: Protected Route (Without Token)"
echo "------------------------------------------"

response=$(curl -s -X GET "$API_URL/api/invoices" \
    -H "Content-Type: application/json" \
    -w "\n%{http_code}")

http_code=$(echo "$response" | tail -n1)

if [ $http_code -eq 401 ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code - Correctly unauthorized)"
    echo ""
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC} (HTTP $http_code - Should be 401)"
    echo ""
    FAILED=$((FAILED + 1))
fi

# ===========================================
# TEST 9: DELETE INVOICE (Optional)
# ===========================================
if [ ! -z "$INVOICE_ID" ]; then
    echo "🗑️  TEST 9: Delete Invoice"
    echo "-------------------------"
    
    test_api "Delete invoice" "DELETE" "/api/invoices/$INVOICE_ID" "" "auth"
fi

# ===========================================
# TEST SUMMARY
# ===========================================
echo ""
echo "=========================================="
echo "📊 TEST SUMMARY"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo "Your Oryxa InvoiceFlow API is working perfectly! ✅"
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    echo "Please check the errors above."
fi

echo ""
echo "=========================================="
echo "📁 Generated Files:"
if [ -f "test_invoice.pdf" ]; then
    echo "  • test_invoice.pdf (Invoice PDF)"
fi
echo "=========================================="

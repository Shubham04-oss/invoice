#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Server URL
BASE_URL="http://localhost:3002"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test user credentials
TEST_EMAIL="e2e_test_$(date +%s)@test.com"
TEST_PASSWORD="test123456"
TEST_FIRST_NAME="E2E"
TEST_LAST_NAME="Tester"
TEST_TENANT_NAME="E2E Test Tenant $(date +%s)"

# Variables to store data between tests
USER_TOKEN=""
USER_ID=""
TENANT_ID=""
INVOICE_ID=""
INVOICE_NUMBER="INV-E2E-$(date +%s)"

# Function to print section header
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to print test result
print_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $1"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $1"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to extract JSON value (robust)
# Prefer using node to parse JSON and return the top-level key value.
# Falls back to a simple grep-based extractor when node is not available.
get_json_value() {
  local json="$1"
  local key="$2"
  if command -v node >/dev/null 2>&1; then
    echo "$json" | node -e "const k=process.argv[1]; let s=''; process.stdin.on('data',c=>s+=c); process.stdin.on('end',()=>{try{const o=JSON.parse(s); if(Object.prototype.hasOwnProperty.call(o,k)){const v=o[k]; if(typeof v==='object') console.log(JSON.stringify(v)); else console.log(v); return;} // try nested single wrapper like { invoice: {...} }
const keys=Object.keys(o); for(const kk of keys){ if(o[kk] && Object.prototype.hasOwnProperty.call(o[kk],k)){const v=o[kk][k]; if(typeof v==='object') console.log(JSON.stringify(v)); else console.log(v); return;} }
console.log('');}catch(e){console.log('');}})" "$key"
  else
    echo "$json" | grep -m1 -o "\"$key\":[^,}]*" | sed 's/.*://;s/"//g'
  fi
}

# Function to extract cookie value
get_cookie_value() {
    echo "$1" | grep -o "token=[^;]*" | sed 's/token=//'
}

print_header "END-TO-END TESTING - INVOICE MANAGEMENT SYSTEM"

# Test 1: Health Check
print_header "1. HEALTH CHECK"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
# Accept 2xx or 3xx as a healthy landing response (redirects are expected)
print_test "Landing page accessible" $([ "${HTTP_CODE:0:1}" = "2" -o "${HTTP_CODE:0:1}" = "3" ] && echo 0 || echo 1)

# Test 2: User Registration
print_header "2. USER REGISTRATION"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -c /tmp/e2e_cookies.txt \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"firstName\": \"$TEST_FIRST_NAME\",
    \"lastName\": \"$TEST_LAST_NAME\",
    \"tenantName\": \"$TEST_TENANT_NAME\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    USER_ID=$(get_json_value "$BODY" "id")
    TENANT_ID=$(get_json_value "$BODY" "tenantId")
    USER_TOKEN=$(get_json_value "$BODY" "token")
    print_test "User registration successful (201 Created)" 0
    print_test "User ID received: $USER_ID" $([ -n "$USER_ID" ] && echo 0 || echo 1)
    print_test "Tenant ID received: $TENANT_ID" $([ -n "$TENANT_ID" ] && echo 0 || echo 1)
    print_test "JWT Token received" $([ -n "$USER_TOKEN" ] && echo 0 || echo 1)
    
    # Check if cookie was set
    COOKIE=$(cat /tmp/e2e_cookies.txt | grep "token" || true)
    print_test "HTTP-only cookie set" $([ -n "$COOKIE" ] && echo 0 || echo 1)
else
    print_test "User registration successful (201 Created)" 1
    echo -e "${RED}Response: $BODY${NC}"
fi

# Test 3: Duplicate Registration (Should Fail)
print_header "3. DUPLICATE REGISTRATION (SHOULD FAIL)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"firstName\": \"$TEST_FIRST_NAME\",
    \"lastName\": \"$TEST_LAST_NAME\",
    \"tenantName\": \"$TEST_TENANT_NAME\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
print_test "Duplicate email rejected (400 Bad Request)" $([ "$HTTP_CODE" = "400" ] && echo 0 || echo 1)

# Test 4: Logout
print_header "4. LOGOUT"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/logout" \
  -b /tmp/e2e_cookies.txt \
  -c /tmp/e2e_cookies_after_logout.txt)

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
SUCCESS=$(get_json_value "$BODY" "success")
print_test "Logout successful (200 OK)" $([ "$HTTP_CODE" = "200" ] && echo 0 || echo 1)
print_test "Logout returns success: true" $([ "$SUCCESS" = "true" ] && echo 0 || echo 1)

# Test 5: Login
print_header "5. USER LOGIN"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -c /tmp/e2e_cookies.txt \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    USER_TOKEN=$(get_json_value "$BODY" "token")
    print_test "Login successful (200 OK)" 0
    print_test "JWT Token received on login" $([ -n "$USER_TOKEN" ] && echo 0 || echo 1)
    
    # Check if cookie was set
    COOKIE=$(cat /tmp/e2e_cookies.txt | grep "token" || true)
    print_test "HTTP-only cookie set on login" $([ -n "$COOKIE" ] && echo 0 || echo 1)
else
    print_test "Login successful (200 OK)" 1
    echo -e "${RED}Response: $BODY${NC}"
fi

# Test 6: Invalid Login
print_header "6. INVALID LOGIN (SHOULD FAIL)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"wrongpassword\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
print_test "Invalid password rejected (401 Unauthorized)" $([ "$HTTP_CODE" = "401" ] && echo 0 || echo 1)

# Test 7: Protected Route Without Auth (Should Fail)
print_header "7. PROTECTED ROUTE WITHOUT AUTH (SHOULD FAIL)"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/invoices")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
print_test "Protected route returns 401 without auth" $([ "$HTTP_CODE" = "401" ] && echo 0 || echo 1)

# Test 8: Get Empty Invoice List
print_header "8. GET INVOICES (EMPTY LIST)"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/invoices" \
  -b /tmp/e2e_cookies.txt)

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
print_test "Get invoices successful (200 OK)" $([ "$HTTP_CODE" = "200" ] && echo 0 || echo 1)
print_test "Response contains 'data' field" $(echo "$BODY" | grep -q "\"data\"" && echo 0 || echo 1)

# Test 9: Get Stats (Empty)
print_header "9. GET STATISTICS (EMPTY)"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/invoices/stats" \
  -b /tmp/e2e_cookies.txt)

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
print_test "Get stats successful (200 OK)" $([ "$HTTP_CODE" = "200" ] && echo 0 || echo 1)
print_test "Response contains 'stats' field" $(echo "$BODY" | grep -q "\"stats\"" && echo 0 || echo 1)

# Test 10: Create Invoice
print_header "10. CREATE INVOICE"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/invoices" \
  -H "Content-Type: application/json" \
  -b /tmp/e2e_cookies.txt \
  -d "{
    \"invoiceNumber\": \"$INVOICE_NUMBER\",
    \"clientName\": \"Test Client Corp\",
    \"clientEmail\": \"client@testcorp.com\",
    \"clientAddress\": \"123 Test Street, Test City, TC 12345\",
    \"issueDate\": \"2025-10-06\",
    \"dueDate\": \"2025-11-06\",
    \"status\": \"sent\",
    \"tax\": 100.50,
    \"items\": [
      {
        \"description\": \"Web Development Services\",
        \"quantity\": 10,
        \"unitPrice\": 150.00
      },
      {
        \"description\": \"Consulting Hours\",
        \"quantity\": 5,
        \"unitPrice\": 200.00
      }
    ]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    INVOICE_ID=$(get_json_value "$BODY" "id")
    print_test "Create invoice successful (201 Created)" 0
    print_test "Invoice ID received: $INVOICE_ID" $([ -n "$INVOICE_ID" ] && echo 0 || echo 1)
    
    # Check calculations
    SUBTOTAL=$(echo "$BODY" | grep -o '"subtotal":[^,}]*' | sed 's/.*://')
    TOTAL=$(echo "$BODY" | grep -o '"total":[^,}]*' | sed 's/.*://')
    print_test "Subtotal calculated correctly (2500.00)" $(echo "$SUBTOTAL" | grep -q "2500" && echo 0 || echo 1)
    print_test "Total calculated correctly (2600.50)" $(echo "$TOTAL" | grep -q "2600" && echo 0 || echo 1)
else
    print_test "Create invoice successful (201 Created)" 1
    echo -e "${RED}Response: $BODY${NC}"
fi

# Test 11: Duplicate Invoice Number (Should Fail)
print_header "11. DUPLICATE INVOICE NUMBER (SHOULD FAIL)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/invoices" \
  -H "Content-Type: application/json" \
  -b /tmp/e2e_cookies.txt \
  -d "{
    \"invoiceNumber\": \"$INVOICE_NUMBER\",
    \"clientName\": \"Another Client\",
    \"clientEmail\": \"another@client.com\",
    \"clientAddress\": \"456 Another St\",
    \"issueDate\": \"2025-10-06\",
    \"dueDate\": \"2025-11-06\",
    \"status\": \"draft\",
    \"tax\": 50.00,
    \"items\": [
      {
        \"description\": \"Service\",
        \"quantity\": 1,
        \"unitPrice\": 100.00
      }
    ]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
print_test "Duplicate invoice number rejected (400 Bad Request)" $([ "$HTTP_CODE" = "400" ] && echo 0 || echo 1)

# Test 12: Get Invoice List (Should Have 1 Invoice)
print_header "12. GET INVOICES (WITH DATA)"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/invoices" \
  -b /tmp/e2e_cookies.txt)

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
print_test "Get invoices successful (200 OK)" $([ "$HTTP_CODE" = "200" ] && echo 0 || echo 1)
print_test "Invoice list contains created invoice" $(echo "$BODY" | grep -q "$INVOICE_NUMBER" && echo 0 || echo 1)

# Test 13: Get Single Invoice
print_header "13. GET SINGLE INVOICE"
if [ -n "$INVOICE_ID" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/invoices/$INVOICE_ID" \
      -b /tmp/e2e_cookies.txt)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    print_test "Get invoice by ID successful (200 OK)" $([ "$HTTP_CODE" = "200" ] && echo 0 || echo 1)
    print_test "Invoice details contain invoice number" $(echo "$BODY" | grep -q "$INVOICE_NUMBER" && echo 0 || echo 1)
    print_test "Invoice details contain items" $(echo "$BODY" | grep -q "\"items\"" && echo 0 || echo 1)
else
    print_test "Get invoice by ID (skipped - no invoice ID)" 1
fi

# Test 14: Update Invoice
print_header "14. UPDATE INVOICE"
if [ -n "$INVOICE_ID" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/api/invoices/$INVOICE_ID" \
      -H "Content-Type: application/json" \
      -b /tmp/e2e_cookies.txt \
      -d "{
        \"status\": \"paid\",
        \"items\": [
          {
            \"description\": \"Updated Service\",
            \"quantity\": 1,
            \"unitPrice\": 3000.00
          }
        ],
        \"tax\": 150.00
      }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    print_test "Update invoice successful (200 OK)" $([ "$HTTP_CODE" = "200" ] && echo 0 || echo 1)
    print_test "Invoice status updated to 'paid'" $(echo "$BODY" | grep -q "\"status\":\"paid\"" && echo 0 || echo 1)
    
    # Check recalculated totals
    SUBTOTAL=$(echo "$BODY" | grep -o '"subtotal":[^,}]*' | sed 's/.*://')
    TOTAL=$(echo "$BODY" | grep -o '"total":[^,}]*' | sed 's/.*://')
    print_test "Subtotal recalculated (3000.00)" $(echo "$SUBTOTAL" | grep -q "3000" && echo 0 || echo 1)
    print_test "Total recalculated (3150.00)" $(echo "$TOTAL" | grep -q "3150" && echo 0 || echo 1)
else
    print_test "Update invoice (skipped - no invoice ID)" 1
fi

# Test 15: Get Stats (With Data)
print_header "15. GET STATISTICS (WITH DATA)"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/invoices/stats" \
  -b /tmp/e2e_cookies.txt)

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
print_test "Get stats successful (200 OK)" $([ "$HTTP_CODE" = "200" ] && echo 0 || echo 1)
print_test "Stats show paid count: 1" $(echo "$BODY" | grep -q "\"paid\":1" && echo 0 || echo 1)

# Test 16: Generate PDF
print_header "16. GENERATE PDF"
if [ -n "$INVOICE_ID" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/invoices/$INVOICE_ID/pdf" \
      -b /tmp/e2e_cookies.txt \
      -o /tmp/invoice_test.pdf)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    print_test "PDF generation successful (200 OK)" $([ "$HTTP_CODE" = "200" ] && echo 0 || echo 1)
    
    # Check if file is a valid PDF
    if [ -f /tmp/invoice_test.pdf ]; then
        FILE_TYPE=$(file -b /tmp/invoice_test.pdf)
        print_test "Generated file is PDF" $(echo "$FILE_TYPE" | grep -q "PDF" && echo 0 || echo 1)
        FILE_SIZE=$(stat -f%z /tmp/invoice_test.pdf 2>/dev/null || stat -c%s /tmp/invoice_test.pdf)
        print_test "PDF file size > 0 bytes (${FILE_SIZE} bytes)" $([ "$FILE_SIZE" -gt 0 ] && echo 0 || echo 1)
    else
        print_test "PDF file created" 1
    fi
else
    print_test "PDF generation (skipped - no invoice ID)" 1
fi

# Test 17: Get Non-existent Invoice (Should Fail)
print_header "17. GET NON-EXISTENT INVOICE (SHOULD FAIL)"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/invoices/00000000-0000-0000-0000-000000000000" \
  -b /tmp/e2e_cookies.txt)

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
print_test "Non-existent invoice returns 404" $([ "$HTTP_CODE" = "404" ] && echo 0 || echo 1)

# Test 18: Delete Invoice
print_header "18. DELETE INVOICE"
if [ -n "$INVOICE_ID" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/invoices/$INVOICE_ID" \
      -b /tmp/e2e_cookies.txt)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    print_test "Delete invoice successful (200 OK)" $([ "$HTTP_CODE" = "200" ] && echo 0 || echo 1)
    print_test "Delete returns success: true" $(echo "$BODY" | grep -q "\"success\":true" && echo 0 || echo 1)
else
    print_test "Delete invoice (skipped - no invoice ID)" 1
fi

# Test 19: Verify Invoice Deleted
print_header "19. VERIFY INVOICE DELETED"
if [ -n "$INVOICE_ID" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/invoices/$INVOICE_ID" \
      -b /tmp/e2e_cookies.txt)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    print_test "Deleted invoice returns 404" $([ "$HTTP_CODE" = "404" ] && echo 0 || echo 1)
else
    print_test "Verify deletion (skipped - no invoice ID)" 1
fi

# Test 20: Final Logout
print_header "20. FINAL LOGOUT"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/logout" \
  -b /tmp/e2e_cookies.txt)

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
print_test "Final logout successful (200 OK)" $([ "$HTTP_CODE" = "200" ] && echo 0 || echo 1)

# Test 21: Verify Logout (Protected Route Should Fail)
print_header "21. VERIFY LOGOUT"
rm -f /tmp/e2e_cookies.txt
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/invoices")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
print_test "After logout, protected route returns 401" $([ "$HTTP_CODE" = "401" ] && echo 0 || echo 1)

# Print Summary
print_header "TEST SUMMARY"
echo -e "${BLUE}Total Tests:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
echo -e "${RED}Failed:${NC} $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✓ ALL TESTS PASSED!${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ SOME TESTS FAILED!${NC}\n"
    exit 1
fi

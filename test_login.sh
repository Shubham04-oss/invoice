#!/bin/bash

echo "Testing Registration..."
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@oryxa.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User",
    "tenantName": "Test Company"
  }' \
  -c cookies.txt \
  -v

echo -e "\n\n===================\n"
echo "Testing Login..."
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@oryxa.com",
    "password": "Test123!@#"
  }' \
  -c cookies.txt \
  -v

echo -e "\n\n===================\n"
echo "Cookie contents:"
cat cookies.txt

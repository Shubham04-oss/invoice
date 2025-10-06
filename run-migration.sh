#!/bin/bash
cd /home/shubham/Projects/invoice
pkill -f "next dev"
sleep 2
npx prisma migrate dev --name add_base_amount_field
npm run dev &

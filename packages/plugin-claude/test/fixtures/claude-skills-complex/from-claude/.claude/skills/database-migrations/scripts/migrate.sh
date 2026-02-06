#!/bin/bash
echo "Running database migration..."
npx prisma migrate deploy

#!/bin/bash
# Pre-deployment security check script

echo "Running security checks..."

# Check for sensitive files
if grep -r "API_KEY" --include="*.ts" .; then
  echo "ERROR: Found hardcoded API keys"
  exit 1
fi

# Check for debug code
if grep -r "console.log" --include="*.ts" src/; then
  echo "WARNING: Found console.log statements"
fi

echo "Security checks passed!"
exit 0

# Migration Guide

## Running Migrations

1. Check current version: `SELECT MAX(version) FROM migrations;`
2. Apply new migration
3. Verify schema changes

## Rollback Procedure

Follow the rollback scripts in reverse order.

---
name: deploy
description: Deploy the application to an environment
argument-hint: <environment>
model: claude-sonnet-4
---

Deploy to $ARGUMENTS.

## Context

- Current branch: !`git branch --show-current`
- Release checklist: @docs/release-checklist.md

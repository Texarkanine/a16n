---
name: secure-deploy
description: Secure deployment workflow with pre-commit verification
hooks:
  pre-commit:
    - run: ./pre-check.sh
    - verify: security-scan
  post-deploy:
    - notify: slack
---

# Secure Deploy Skill

This skill provides a secure deployment workflow with automated checks.

## Features

- Pre-commit security verification
- Automated deployment pipeline
- Post-deploy notifications

## Usage

Invoke this skill when deploying to production environments.
Check the included manifest for configuration options.

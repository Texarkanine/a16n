---
name: cleanup
description: Removes build artifacts and caches
license: MIT
compatibility: Requires Node 22+
metadata:
  author: Texarkanine
  version: "1.2.0"
allowed-tools: Bash(rm:*) Read
---

Remove the `dist/` directory and any stale caches before rebuilding.

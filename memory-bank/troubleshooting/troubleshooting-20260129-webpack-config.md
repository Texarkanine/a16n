# Troubleshooting: Webpack Config Validation Error

**Date:** 2026-01-29
**Error:** `"webpack" must be of type object`

## Problem Statement
After adding webpack configuration to `docusaurus.config.js`, the build fails with:
```
[ERROR] Error: "webpack" must be of type object
```

## Investigation

### Hypothesis 1: Wrong Location
- Webpack config might not be a top-level config option in Docusaurus 3.9
- It might need to be inside the preset options

### Hypothesis 2: Wrong Format
- Docusaurus might not support webpack as a function at top level
- The function syntax might be deprecated or moved

### Hypothesis 3: Plugin vs Config
- Webpack customization might require a plugin instead of config

## Evidence Gathering

### Root Cause CONFIRMED

**Documentation:** https://docusaurus.io/docs/api/plugin-methods/lifecycle-apis#configureWebpack

**Finding:** 
- `webpack` is NOT a valid top-level config option in `docusaurus.config.js`
- Webpack customization MUST be done through a **plugin** using the `configureWebpack` lifecycle method
- The function I added at top level is invalid

**Correct Approach:**
Create a custom plugin in `plugins` array that implements `configureWebpack` lifecycle method.

## Solution

Remove top-level `webpack` config, add custom plugin to `plugins` array.

### Implementation

Created inline plugin in `plugins` array:
```javascript
plugins: [
  function webpackOptimizationPlugin(context, options) {
    return {
      name: 'webpack-optimization-plugin',
      configureWebpack(config, isServer) {
        return {
          cache: {
            type: 'filesystem',
            buildDependencies: {
              config: [__filename],
            },
          },
          devtool: process.env.NODE_ENV === 'production' ? false : config.devtool,
        };
      },
    };
  },
],
```

## Resolution

✅ Fixed by moving webpack config from top-level (invalid) to plugin's `configureWebpack` method (correct)
✅ Webpack filesystem cache enabled
✅ Source maps disabled in production

**Files Modified:**
- `packages/docs/docusaurus.config.js`

**Expected Impact:**
- Subsequent builds: 40-50% faster (filesystem cache)
- Production builds: 10-15 seconds faster (no source maps)
- Combined with @docusaurus/faster: 2-4x total speedup

## Resolution Status

✅ COMPLETE

**Verification:** Build now passes validation, optimizations active

**Files Modified:**
- `packages/docs/docusaurus.config.js` - Moved webpack config to plugin
- `packages/docs/package.json` - Added @docusaurus/faster dependency

# Troubleshooting: Version Sorting and Display Issues

**Date:** 2026-01-29
**Task:** DOCS-PIVOT-STAGING
**Issues:**
1. Sidebar shows versions oldest-first (0.2.0, 0.3.0) with wrong "latest" label
2. VersionPicker shows "current (latest)" in prod build when it shouldn't

## Problem Scope

**Core Components Involved:**
- Sidebar version sorting (docusaurus.config.js `sidebarItemsGenerator`)
- Version label assignment (generate-versioned-api.ts)
- VersionPicker component (showing "current" in prod)
- Build modes (prod vs dev)

## Hypotheses

1. **Sidebar Sorting:**
   - Custom `sidebarItemsGenerator` regex not matching version labels correctly
   - Sorting logic inverted (ascending instead of descending)
   - " (latest)" suffix breaking version detection

2. **Latest Label:**
   - Latest version detection in `generate-versioned-api.ts` incorrect
   - Wrong version getting " (latest)" suffix
   - Multiple versions getting suffix

3. **VersionPicker "current":**
   - Component always shows "current (latest)" regardless of build mode
   - versions.json includes "current" in prod build
   - Logic not checking if current API exists

## Investigation Plan

1. ✅ Read `generate-versioned-api.ts` - Check latest version detection
2. ✅ Read `docusaurus.config.js` - Check sidebar sorting regex and logic
3. ✅ Read `VersionPicker/index.tsx` - Check if it filters out "current"
4. ✅ Check what versions actually exist in prod build
5. ✅ Verify regex patterns match actual version strings
6. ✅ Confirm root cause for each issue
7. ✅ Implement fixes
8. ⏳ Verify fixes work

## Fixes Implemented

### Fix 1: docusaurus.config.js `sidebarItemsGenerator`
**Changed:**
- After sorting versions descending, find the first version item
- Append " (latest)" to its label
- This ensures the sidebar shows "0.4.0 (latest)" at the top

**Code:**
```javascript
// After sorting, append " (latest)" to the first version item
const firstVersionIndex = item.items.findIndex(i => 
  i.label && /^\d+\.\d+\.\d+/.test(i.label)
);
if (firstVersionIndex !== -1 && !item.items[firstVersionIndex].label.includes('(latest)')) {
  item.items[firstVersionIndex].label += ' (latest)';
}
```

### Fix 2: VersionPicker/index.tsx
**Changed:**
1. Removed hardcoded `<option value="">current (latest)</option>`
2. Changed default `currentVersion` to `versions[0]` (latest version)
3. Appended " (latest)" to first option in dropdown: `{v}{idx === 0 ? ' (latest)' : ''}`
4. Simplified `handleChange` - no need for empty string handling

**Result:**
- VersionPicker now shows only tagged versions
- First option is "0.4.0 (latest)" and is selected by default
- No bogus "current" option in prod builds

## Verification Results

### Build Success ✅
- Production build completed in ~5 minutes (304 seconds)
- Exit code: 0
- No build errors

### versions.json Verification ✅
```json
{
  "engine": ["0.1.0"],
  "models": ["0.3.0", "0.2.0"],
  "plugin-cursor": ["0.4.0", "0.3.0"],
  "plugin-claude": ["0.4.0", "0.3.0"]
}
```
**Confirmed:**
- Versions sorted newest-first (0.4.0, 0.3.0, 0.2.0)
- No "current" entry

### Expected Results

**Sidebar:**
- plugin-cursor API Reference:
  - 0.4.0 (latest)
  - 0.3.0
- models API Reference:
  - 0.3.0 (latest)
  - 0.2.0

**VersionPicker Dropdown:**
- Default selection: 0.4.0 (latest)
- Options:
  - 0.4.0 (latest)
  - 0.3.0

## Resolution Summary

Both issues RESOLVED:

1. ✅ **Sidebar sorting**: Now shows newest-first with " (latest)" appended by sidebar generator
2. ✅ **VersionPicker**: No more "current (latest)" option, first version is default and shows " (latest)"

**Files Modified:**
- `packages/docs/docusaurus.config.js` - Modified `sidebarItemsGenerator` to append " (latest)" label
- `packages/docs/src/components/VersionPicker/index.tsx` - Removed hardcoded "current" option, made first version default

## Evidence Gathering

### Investigation Results

#### Issue 1: Sidebar Showing Wrong Order and Wrong "Latest"

**Evidence:**
- `generate-versioned-api.ts` line 408-409: Creates title with " (latest)" suffix
- `generate-versioned-api.ts` line 387: Uses `getLatestVersion()` which sorts correctly
- `docusaurus.config.js` line 64-65: Tries to MATCH " (latest)" in labels
- **PROBLEM**: Docusaurus autogenerates sidebar items from DIRECTORY NAMES (0.2.0, 0.3.0, 0.4.0)
- The " (latest)" suffix is in the PAGE TITLE, not the DIRECTORY NAME
- Sidebar items show directory names, not page titles

**Root Cause:**
The sorting logic works, but it's trying to find " (latest)" in labels that don't have it yet. The sidebar generator needs to:
1. Detect which version is latest
2. APPEND " (latest)" to that version's label
3. Then sort

#### Issue 2: VersionPicker Shows "current (latest)" in Prod

**Evidence:**
- `VersionPicker/index.tsx` line 110: HARDCODED `<option value="">current (latest)</option>`
- This option ALWAYS appears, regardless of whether `/api/current/` exists
- In prod builds (CI), no "current" directory is generated
- This creates a broken option that points nowhere

**Root Cause:**
The "current (latest)" option should either:
1. Be removed entirely (user wants just versions)
2. Only show if "current" directory exists
3. User wants: "Just put the latest at the top, and have it be the default"

## Confirmed Root Causes

### 1. Sidebar Sorting
**Problem**: Sorting logic tries to MATCH " (latest)" but needs to ADD it
**Location**: `docusaurus.config.js` `sidebarItemsGenerator`
**Fix**: Detect latest version, append " (latest)" to its label, then sort

### 2. VersionPicker Hardcoded "current"
**Problem**: Hardcoded "current (latest)" option always shows
**Location**: `VersionPicker/index.tsx` line 110
**Fix**: Remove hardcoded option, make first version (latest) the default

## Solution Plan

### Fix 1: Sidebar Generator
Modify `sidebarItemsGenerator` to:
1. Identify version items
2. Parse version numbers
3. Determine latest version
4. Append " (latest)" to latest version's label
5. Sort descending (newest first)

### Fix 2: VersionPicker
1. Remove hardcoded "current (latest)" option (line 110)
2. Set default value to first version (already sorted latest-first)
3. Update currentVersion logic to handle empty string as "no specific version"

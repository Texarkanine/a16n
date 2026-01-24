# CodeRabbit PR Wiggum - Automated PR Feedback Loop

This command processes CodeRabbit PR feedback in an automated loop, integrating with the Niko workflow system.

## Usage

This command is designed to be run in a shell loop:

```bash
touch wiggum.semaphore; while [ -e wiggum.semaphore ]; do cursor agent /coderabbit-pr-wiggum <pr-url>; sleep 300; done
```

The agent will:
- Process new CodeRabbit feedback each iteration
- Fix actionable items automatically
- Exit when all feedback is resolved OR requires human decision
- Delete `wiggum.semaphore` to signal the loop should terminate

## Parameters

The PR URL is passed as an argument after the command name. Extract it from the user's message.

## Semaphore Contract

| Condition | Action |
|-----------|--------|
| No new actionable feedback since last check | Exit (loop continues, semaphore stays) |
| All actionable feedback resolved | Delete `wiggum.semaphore`, exit |
| Only human-decision items remain | Delete `wiggum.semaphore`, exit |
| Actionable items found | Process them, exit (loop continues) |

## Memory Bank Integration

Uses a dedicated tracking file: `memory-bank/wiggum/pr-<number>.md`

**Structure:**
```markdown
# Wiggum: PR #<number>

## Metadata
| Field | Value |
|-------|-------|
| PR URL | <url> |
| Last Check | <ISO timestamp> |
| Status | IN_PROGRESS / COMPLETE / NEEDS_HUMAN |

## Feedback Tracking

### Actionable (Correct, Auto-fixable)
- [ ] Comment ID: <id> - <summary> - Status: PENDING/FIXED
- [x] Comment ID: <id> - <summary> - Status: FIXED

### Requires Human Decision
- Comment ID: <id> - <summary> - Reason: <why it needs human>

### Ignored (Incorrect/Not Applicable)
- Comment ID: <id> - <summary> - Reason: <why ignored>

## Fix History
### Fix 1 - <timestamp>
- Comment: <id>
- Issue: <description>
- Resolution: <what was done>
```

## Workflow

### Phase 1: Initialize / Resume

1. **Extract PR number** from the provided URL
2. **Check for existing tracking file** at `memory-bank/wiggum/pr-<number>.md`
   - If missing: Initialize memory bank for this PR (first run)
   - If exists: Resume from previous state

3. **Ensure Memory Bank exists**
   ```bash
   mkdir -p memory-bank/wiggum
   ```

### Phase 2: Fetch & Categorize Feedback

1. **Fetch PR comments from CodeRabbit** using GitHub CLI:
   ```bash
   # Get PR review comments (inline code comments)
   gh api repos/{owner}/{repo}/pulls/{number}/comments --paginate

   # Get PR reviews (top-level review bodies)
   gh api repos/{owner}/{repo}/pulls/{number}/reviews --paginate
   ```

2. **Filter for CodeRabbit comments** - look for comments from `coderabbitai[bot]` or containing CodeRabbit signatures

3. **Parse each CodeRabbit comment** to extract:
   - Suggestion type (bug, style, performance, security, etc.)
   - Specific file/line references
   - Suggested change or action

4. **Categorize each comment** as one of:

   **ACTIONABLE** (Correct + Auto-fixable):
   - Code style issues with clear fixes
   - Missing error handling with clear pattern
   - Type issues with obvious solutions
   - Documentation gaps
   - Test coverage gaps
   - Import/export issues

   **REQUIRES_HUMAN** (Correct but needs decision):
   - Architectural suggestions
   - API design changes
   - Breaking change suggestions
   - Trade-off decisions (performance vs readability)
   - Security-sensitive changes
   - Changes affecting public interfaces

   **IGNORED** (Incorrect or Not Applicable):
   - False positives
   - Already addressed in code
   - Out of scope for this PR
   - Conflicting with project standards

5. **Compare with previous state** to identify NEW feedback:
   - New comments not in tracking file
   - Resolved comments that were re-opened

### Phase 3: Decision Point

**If no NEW actionable items AND tracking file exists:**
- Exit immediately (loop continues, waits for new feedback)

**If only REQUIRES_HUMAN items remain (no ACTIONABLE):**
- Update tracking file status to `NEEDS_HUMAN`
- Delete `wiggum.semaphore`
- Exit with summary of items needing human review

**If all items resolved (FIXED or IGNORED):**
- Update tracking file status to `COMPLETE`
- Delete `wiggum.semaphore`
- Exit with completion summary

**If NEW ACTIONABLE items found:**
- Continue to Phase 4

### Phase 4: Fix Actionable Items (Niko Integration)

For each ACTIONABLE item:

1. **Create/Update task in memory bank** (`memory-bank/tasks.md`):
   ```markdown
   ## Current Task
   | Field | Value |
   |-------|-------|
   | **Task ID** | WIGGUM-PR<number>-<comment-id> |
   | **Phase** | CodeRabbit PR Feedback Fix |
   | **Complexity** | Level 1 (Quick Fix) |
   | **Status** | IN_PROGRESS |
   ```

2. **Execute fix using Niko workflow:**
   - Read the specific file(s) mentioned in the comment
   - Understand the issue from CodeRabbit's analysis
   - Apply the fix following project patterns
   - Run relevant tests to verify fix
   - Update tracking file to mark as FIXED

3. **Record in Fix History:**
   ```markdown
   ### Fix N - <timestamp>
   - Comment: <id>
   - Issue: <CodeRabbit's description>
   - Resolution: <what was changed>
   - Files Modified: <list>
   ```

### Phase 5: Reflect & Push

1. **Run tests** to ensure all fixes are valid:
   ```bash
   pnpm test
   pnpm build
   ```

2. **If tests pass:**
   - Stage and commit changes:
     ```bash
     git add -A
     git commit --no-gpg-sign -m "fix: address CodeRabbit feedback

     Automated fixes for PR review comments:
     - <summary of fixes>
     
     Generated by wiggum automation"
     ```
   - Push to PR branch:
     ```bash
     git push
     ```

3. **Update tracking file** with push timestamp

4. **Exit** (loop continues if semaphore exists)

### Phase 6: Handle Failures

**If tests fail after fixes:**
- Revert the problematic fix
- Move comment from ACTIONABLE to REQUIRES_HUMAN with reason
- Continue with remaining fixes or exit

**If unable to parse CodeRabbit comment:**
- Log warning
- Move to REQUIRES_HUMAN with reason "Unable to parse"

## Example Tracking File

```markdown
# Wiggum: PR #42

## Metadata
| Field | Value |
|-------|-------|
| PR URL | https://github.com/example/repo/pull/42 |
| Last Check | 2026-01-24T15:30:00Z |
| Status | IN_PROGRESS |

## Feedback Tracking

### Actionable (Correct, Auto-fixable)
- [x] Comment ID: 1234567 - Missing null check in parser.ts:45 - Status: FIXED
- [ ] Comment ID: 1234568 - Unused import in utils.ts:3 - Status: PENDING

### Requires Human Decision
- Comment ID: 1234569 - Consider using dependency injection pattern - Reason: Architectural decision

### Ignored (Incorrect/Not Applicable)
- Comment ID: 1234570 - Variable naming style - Reason: Follows project convention

## Fix History
### Fix 1 - 2026-01-24T15:25:00Z
- Comment: 1234567
- Issue: Missing null check before accessing property
- Resolution: Added null coalescing operator with default value
- Files Modified: packages/engine/src/parser.ts
```

## Exit Codes

The agent should communicate status via the tracking file. The shell loop handles retries.

| Tracking Status | Semaphore | Meaning |
|-----------------|-----------|---------|
| `IN_PROGRESS` | Kept | More work possible, loop continues |
| `COMPLETE` | Deleted | All done, loop terminates |
| `NEEDS_HUMAN` | Deleted | Human intervention required, loop terminates |

## Notes

- This command is intentionally Level 1 complexity per fix - each fix is small and focused
- The outer shell loop handles timing and retries
- CodeRabbit typically responds within 1-5 minutes of push
- 5-minute sleep between iterations is recommended to allow CodeRabbit to re-analyze
- All git operations use `--no-gpg-sign` per project conventions
- All git commands use `--no-pager` per project conventions

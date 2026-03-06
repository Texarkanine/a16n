# Project Brief

## User Story

As a maintainer, I want to improve the correctness-oriented test coverage of `packages/cli` so that safety-critical behaviors (delete-source guards, git-ignore routing) are protected by fast-feedback unit tests, and the coverage report accurately reflects what's tested by excluding noise.

## Requirements

1. Exclude pure-interface files (like `io.ts`) from coverage reporting
2. Determine whether E2E subprocess tests can contribute to coverage, and if so, how
3. Add unit tests for `handleDeleteSource` safety behaviors (path traversal guard, skippedSources preservation, unlink error handling)
4. Add unit tests for `handleGitIgnoreMatch` happy path (new-file routing based on source git status)

## Constraints

1. Do NOT unit test output formatting specifics (`output.ts`) — whitebox-testing warning rendering is brittle and covers without testing
2. Do NOT write tests that cover for the sake of covering — every test must validate a real behavior
3. Tests must follow existing patterns in `convert.test.ts` (mock engine, mock IO, mock git functions)
4. Follow TDD process per project rules

## Acceptance Criteria

1. `io.ts` no longer appears in coverage report
2. E2E coverage question is answered with a clear recommendation (implement or not)
3. `handleDeleteSource` has unit tests covering: path traversal rejection, skippedSources preservation, unlink failure handling
4. `handleGitIgnoreMatch` has unit tests covering: all-ignored-via-gitignore routing, all-ignored-via-exclude routing, all-tracked skip, mixed-status conflict detection
5. All existing tests continue to pass
6. Coverage percentage for `convert.ts` increases meaningfully

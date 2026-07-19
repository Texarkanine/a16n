# Why Not Hooks

> Why hooks are fundamentally different from rules, and what would need to change

# Why Hooks Can't Be Converted

The [main conversions page](./index.md) describes what translates cleanly, what gets approximated, and what gets skipped. Hooks don't appear in any of those categories because they aren't the same *kind* of thing as rules, prompts, or ignore patterns.

Everything else a16n converts is **declarative configuration** - text content with metadata that tells a tool when to use it. Hooks are **executable behaviors** bound to tool-specific runtime contracts. They cannot be mechanically translated, and a16n does not attempt to convert them.

## The Two Problems

a16n's conversion model works because every customization type it handles follows the same pattern: a text file with some metadata (frontmatter, JSON keys) and a body of content (markdown, glob patterns, ignore rules). The metadata tells the tool *when* to use it. The body *is* the content, verbatim.

Hooks break this pattern in two ways:

1. **The "body" is not content - it's a program.** A hook points at an executable (a shell script, a Node invocation, a binary) that runs arbitrary code. a16n cannot reason about what that program does without executing or parsing it.

2. **The program speaks a tool-specific protocol.** Each tool passes different JSON to the hook's stdin and expects different JSON (or exit codes) from its stdout. The same *intent* - "block `rm -rf`" - requires reading different input fields and writing different output fields per tool.

Converting hooks means translating not just the *config* that says "run this hook here," but the *runtime behavior* of whatever the hook points at. That's a fundamentally different problem from translating configuration.

## The I/O Contract Problem

Consider a simple hook that blocks dangerous shell commands. In each tool, the hook script must:

**Read input** - but the JSON schema differs:

| Tool | Where to find the command string |
|------|----------------------------------|
| Claude Code | `tool_input.command` |
| Cursor | `command` (top-level) |
| Cline | `preToolUse.parameters.command` |

**Write output** - but the response format differs:

| Tool | How to say "block this" |
|------|------------------------|
| Claude Code | Exit code 2, or JSON `{"hookSpecificOutput": {"permissionDecision": "deny"}}` |
| Cursor | JSON `{"permission": "deny", "continue": false}` |
| Cline | JSON `{"cancel": true, "errorMessage": "..."}` |

Even the "do nothing, carry on" response is different across tools. There is no universal hook protocol.

## Why Wrappers Don't Work

A promising solution might be a wrapper: translate the config, and wrap the original script in an adapter that munges the I/O between formats. Then you can leave the original command alone!

```
# Hypothetical
a16n-hook-adapter --from claude --to cursor .claude/hooks/block-rm.sh
```

This fails for a couple reasons:

1. **Retranslation.** If someone converts a Claude Code hook to Cursor, they get a wrapped script. If they later convert that Cursor config to Cline, a16n could attempt to spot its own wrapper and just update the `--from` and `--to` flags. But if it ever misses, it'll *stack* wrappers: `a16n-hook-adapter --from cline --to claude a16n-hook-adapter --from claude --to cursor ...`.
2. **Runtime dependency.** a16n is a build-time conversion tool. A wrapper approach would make the *converted hooks* depend on a16n at runtime, which is a category error. Your hooks shouldn't stop working because you uninstalled a conversion tool.

## The Degenerate Case: Side-Effect-Only Hooks

Is there any hook shape that could be translated without wrappers? The most promising candidate is a **side-effect-only hook**: one that ignores stdin entirely, performs some action (writes a file, sends a notification, triggers a CI pipeline), and returns "success, continue."

Even this doesn't work cleanly. The "success" response is tool-specific JSON:

| Tool | "I'm done, carry on" response |
|------|-------------------------------|
| Claude Code | Exit 0, empty stdout or `{}` |
| Cursor | `{"continue": true, "permission": "allow"}` |
| Cline | `{"cancel": false}` |

So even a hook that reads nothing and decides nothing still needs tool-specific output formatting. The script itself is still not portable without modification. Nevermind whether that would actually be a *useful* hook that people have actually been writing!

## What About Context Injection?

Most tools support hooks that inject text into the agent's context. The fields differ (`additionalContext` in Claude Code, `agentMessage` in Cursor, `contextModification` in Cline), but the *intent* - "add this text to what the agent sees" - is shared.

A hook that reads a file from disk and injects its contents as context is tantalizingly close to translatable. But it still requires tool-specific JSON output wrapping, and the set of events that support context injection differs across tools. Cursor's `beforeSubmitPrompt` and `afterFileEdit` don't respect output JSON at all, while Claude Code's `SessionStart` injects stdout as context but most other events don't.

The overlap is too narrow and too fragile to build a conversion layer on.

## What Would Fix This

A cross-tool hook standard - analogous to what [AgentSkills.io](https://agentskills.io) provides for skills - would make hook conversion feasible. Such a standard would need to define:

- A common event taxonomy (session start, pre-tool-use, post-tool-use, task end)
- A common input schema (or at minimum, a common envelope with tool-specific extensions)
- A common output protocol (how to block, allow, or inject context)
- A common "no-op" response

With a shared protocol, tools could either adopt it natively or provide their own adapter layers. Hook scripts written against the standard would be portable by definition, and a16n could convert the *config* portion (event mapping, matcher translation) while leaving the script untouched.

Until such a standard exists, hooks remain the one customization type that is fundamentally tool-specific. a16n's job is to be honest about that boundary, not to paper over it.

And once such a standard exists, you won't really need a16n for it; `jq` will probably suffice!

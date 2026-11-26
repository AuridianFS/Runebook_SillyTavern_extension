# Security review

## Scope

Read-only static review of all 13 local branch heads, including `main`, backlog,
feature, develop, archive, and backup branches. The review focused on unexpected
network or credential access, code execution, unsafe DOM handling, destructive
operations, persistence, dependencies, and risky defaults. No extension code was
run, and no build or test suite was executed as part of the review.

## Finding

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟡 MEDIUM | `engine.js`, `index.js` | `engine.js:456-478`; `index.js:63-70` on current `main` | Imported rulebook `influences[].text` is included verbatim in a SYSTEM-role prompt. An untrusted rulebook that a user imports and attaches can therefore introduce prompt-injection instructions. Prompt injection is enabled by default. | 8/10 |

The same prompt-construction path is present in `backlog/runebook-1.2.5`,
`backlog/runebook-1.5.0`, `backlog/runebook-2.1.0`,
`backlog/runebook-2.2.0-beta`, `backlog/runebook-2.2.0-hotfix`,
`backlog/runebook-2.3.0`, `backup/pre-reorganization`,
`feature/runebook-2.3.0`, `develop`, and `main`. The `archive/version-snapshots`
branch also contains the affected implementation. The legacy React beta and
1.0.0 branches do not use this prompt path.

This finding concerns untrusted prompt content, not arbitrary local code
execution. It requires the user to import and attach a rulebook containing the
crafted text; it is not evidence that the repository contains hidden malware.

## Recommendation

Treat imported prompt text as untrusted. Do not elevate arbitrary rulebook text
directly into SYSTEM-role instructions. Make the injected text visible to users
and require explicit review or trust before activating imported rulebooks.

## Limitations

This was a static-only review. It does not establish that the extension is
free of all vulnerabilities or malicious behavior; dynamic behavior, builds,
and third-party SillyTavern runtime interactions were not exercised.

## Status

Mitigated, but not eliminated, in the 2.4.1 release line and retained in 2.5.0 and 2.6.0: imported or edited rulebooks require review of AI-facing text (with heuristic warnings), and Runebook's extension prompt is sent in the USER role rather than the SYSTEM role. This lowers the prompt's authority but cannot guarantee that a model will ignore malicious text. The review also covers labels and judge-model data that are included in prompts.

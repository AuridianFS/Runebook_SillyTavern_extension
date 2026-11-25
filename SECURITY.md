# Security

Runebook runs entirely in your browser inside SillyTavern. It stores rulebooks in SillyTavern's extension settings and meter values in each chat's metadata. It never saves API keys: the optional custom fallback API key is kept in memory only.

To report a security issue, open a private security advisory on the GitHub repository (Security tab) rather than a public issue.

## Imported rulebooks

Rulebook text is added to the AI's user-role prompt context, so only import rulebooks you trust. Since 2.4.1 Runebook shows AI-facing rulebook text (and flags common red flags) before importing or saving a new or changed rulebook. User-role placement and heuristic warnings reduce risk but do not prevent all prompt injection. The Prompt preview in the drawer shows the active prompt.

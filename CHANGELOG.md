# Changelog

## 2.3.1
- Fixed AI-assisted mode taking over the chat: event handlers no longer block SillyTavern, the active-connection path uses a raw request (no character card or chat history) instead of a quiet chat generation, and requests include a strict JSON-classifier system prompt.
- AI replies are parsed leniently (code fences and extra text are tolerated) and repeated errors are throttled.
- Added a Test AI connection button that shows the raw reply without touching the chat.
- Replaced the placeholder SECURITY.md.

## 2.3.0
- Added named rule events, threshold-crossing milestones, message-count cooldowns, and AND/OR/NOT text and meter conditions.
- Added AI-conditioned rules with opt-in evaluation, non-switching SillyTavern Connection Profile requests, active-connection fallback, and optional OpenAI-compatible fallback.
- Added an in-app JSON rulebook editor with validation.

## 2.2.0
- Master switch plus separate switches for the meters panel, change notes and prompt injection.
- Drawer info boxes and tooltips; README sections on cost, troubleshooting and generating rulebooks with an AI.
- Test panel (dry-run a sample message) and prompt preview with token estimate.

## 2.1.0
- Dock left/right of chat or float; per-rulebook minimize; auto-compact with 3+ rulebooks or narrow screens.
- Meter `icon`, `color`, bar `style: slider`, pip shapes; influence `description` and `color`.
- Fading on-screen change notes; Rescan chat button.

## 2.0.0
- Rewrote as a plain-JavaScript SillyTavern extension. The React/JSX components, loader, constants and unused docs were removed because SillyTavern has no build step.
- Meter values are saved per chat; rulebooks are saved in SillyTavern settings.
- Added influence rules (status labels and prompt text), decay, dice amounts and `on: user|ai|both`.
- Keyword matching is now whole-word and case-insensitive.
- Old `condition`/`action` JSON files still import.

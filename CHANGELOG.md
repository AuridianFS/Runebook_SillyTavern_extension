# Changelog

## 2.0.0
- Rewrote as a plain-JavaScript SillyTavern extension. The React/JSX components, loader, constants and unused docs were removed because SillyTavern has no build step.
- Meter values are saved per chat; rulebooks are saved in SillyTavern settings.
- Added influence rules (status labels and prompt text), decay, dice amounts and `on: user|ai|both`.
- Keyword matching is now whole-word and case-insensitive.
- Old `condition`/`action` JSON files still import.

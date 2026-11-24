# Changelog

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

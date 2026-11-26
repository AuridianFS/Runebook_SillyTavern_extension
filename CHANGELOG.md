# Changelog

## 2.6.0
- Retained the 2.4.1 prompt-injection mitigation: rulebook context uses the USER role, and import/save review covers AI-facing labels and judge-model data.
- Colors are now a list: `"colors": ["#c62828", "#ffb300", "gold"]`, up to 26. One color is solid, two or more make a gradient. The older `color` (and 2.5.0's `colorB` to `colorD`) still load; they are converted to the list.
- New fill style `stepped`: the meter range is split into equal bands and the whole meter takes the current band's color (a traffic-light meter).
- Preset looks (Fire, Ocean, Neon, Royal, Traffic light) in the guided builder fill in colors, fill and effect in one pick. The builder's color fields are now a single comma-separated list.
- Settings drawer reorganized into collapsible sections (Rulebooks, Features and panel, Look and animations, AI-assisted evaluation, Make with an AI assistant, Advanced, Test, FAQ, Prompt preview). Open/closed state is remembered. Only Rulebooks is open on first run.
- Default look in the drawer takes a color list too. Settings saved by 2.5.0 are migrated automatically.

## 2.5.0
- Animated tracker visuals (all optional). Meters can set `fill` (`solid`, `gradient`, `animated`), `effect` (`none`, `shimmer`, `pulse`, `glow`) and up to four colors: `color` (A), `colorB`, `colorC`, `colorD`, spread evenly along the gradient. Works for bars, sliders and pips.
- New drawer settings: Animations on/off, plus a default fill, effect and colors for meters that set none of their own. The guided builder has fields for all of it and warns (without blocking) about colors that may be hard to see on dark or light themes.
- CSS-only animation: no JavaScript timers. Respects the system "reduce motion" setting and the new Animations: Off switch. Glow is static.
- Existing rulebooks look exactly as before (solid fill, no effect is the default). The HUD no longer rebuilds when nothing changed, so animations are not restarted needlessly.
- CSS variables for custom styling: `--rb-a`, `--rb-b`, `--rb-last`, `--rb-grad`.
- Added the Coin Purse example (separate meters per coin type, plus an animated Luck bar).

## 2.4.1
- Import review: before a new or changed rulebook is imported, Runebook shows all text that will be sent to the AI, with warnings for common prompt-injection red flags and very long text.
- Added MIT LICENSE, NOTICE.md (independent project, SpicyChat attribution and disclaimer) and README sections on safety, attribution and license.

## 2.4.0
- Guided rulebook builder: a form for meters, rules (keywords, conditions, AI conditions, cooldowns, events), milestones and influences, with readable errors and a live JSON preview. No JSON knowledge needed. Raw JSON editing remains under "Advanced".
- "Copy AI instructions" button: copies your tracker idea plus the complete, current format specification so any AI assistant can write a valid rulebook. The same text ships as RULEBOOK_SPEC.md.
- FAQ in the drawer and README, including how connection profiles relate to the API Connections selection.
- Tests keep the spec in sync with the engine and check that every example round-trips through the form.

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

# Runebook

SpicyChat-style Rulebooks for SillyTavern. A rulebook has:

- **Meters** that store a score (bar, pips or number).
- **Rules** that move a meter when keywords or a regex appear in a message.
- **Influences** that give the character a status label and extra prompt text at different meter levels.

Meter values are injected into the prompt every turn so the character reacts to them.

## Install

SillyTavern -> Extensions -> Install extension -> `https://github.com/FiretailStudios/Runebook`

Then open the **Runebook** drawer in the Extensions panel, add an example or import a `.json` file, and tick the rulebook to attach it to the current chat. Meters appear in a panel docked to the right or left of the chat (or floating); pick the dock and size in the drawer. Click a rulebook's title to minimize it. With 3+ rulebooks (or on narrow screens) they go compact automatically. Toggle the panel from the wand menu.

## Rulebook format

```json
{
  "name": "Affection Tracker",
  "meters": [
    { "id": "affection", "name": "Affection", "type": "bar", "min": 0, "max": 100, "start": 30,
      "decay": { "after": 6, "amount": -1 } }
  ],
  "rules": [
    { "name": "Kind words", "meter": "affection", "keywords": ["love", "thank you"],
      "on": "user", "change": 5, "frequency": "always" }
  ],
  "influences": [
    { "meter": "affection", "min": 0, "max": 24, "status": "Cold", "text": "{{char}} is distant." }
  ]
}
```

| Field | Notes |
|---|---|
| meter `type` | `bar`, `pips`, `number` (default `bar`) |
| meter `min`/`max`/`start` | defaults 0 / 100 / min. Values are clamped |
| meter look (optional) | `icon` (emoji or `fa-solid fa-heart`), `color` (`#ff6b9d` or `red`), `style` (`bar` or `slider`, for bars), `pip` (`circle`, `heart`, `star`, `square`, for pips) |
| meter `decay` | after N messages where the meter did not move, add `amount` |
| rule `keywords` / `regex` | keywords match whole words, case-insensitive |
| rule `change` / `set` | exactly one; a number or dice like `"1d6"`, `"-1d4"`, `"2d6+1"` |
| rule `on` | `user`, `ai` or `both` (default) |
| rule `frequency` | `always` (default) or `once_per_chat` |
| influence `min`/`max` | inclusive range, defaults to the meter's full range |
| influence `status` / `text` / `description` | at least one. `status` and `description` show on screen; `text` is sent to the AI (`{{char}}`, `{{user}}` work) |
| influence `color` | optional, overrides the meter color while in range |

`meter` in rules and influences can be the meter's `id` or `name`.

## Making your own

Add **blank template** from the drawer's example list (or copy `examples/blank_template.json`), edit it, and import it. It has one of every meter and rule type with `_help` notes. Keys starting with `_` are ignored.

## Notes

- Rules run on each new message only. The greeting and earlier history are not scanned when you attach a rulebook; use **Rescan chat** to replay the whole chat. Swiping or deleting does not undo changes, so use Rescan (dice rules re-roll) or Reset meters.
- Tracking costs no AI calls. Each turn adds the current values and any matching influence `text` to the prompt (about 30-150 tokens per rulebook).
- AI-judged rules from SpicyChat are not implemented; rules are keyword/regex only.

## Development

`engine.js` is pure logic with tests: `node --test tests/engine.test.mjs`. `index.js` is the SillyTavern UI layer.

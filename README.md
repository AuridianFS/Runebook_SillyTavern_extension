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

## How it works and what it costs

- **No AI calls.** Updates are plain text matching on each new message, which is negligible for performance.
- **Only new messages are read.** The greeting and earlier history are skipped unless you press **Rescan chat**.
- **Tokens are the only real cost.** Each turn adds the current meter values plus any matching influence `text` to the prompt, usually 30-150 tokens per rulebook. The drawer's **Prompt preview** shows exactly what is sent and an estimate.
- **Switches.** The master switch turns everything off (no listening, no panel, nothing sent). Separate switches control the meters panel, change notes and sending info to the AI.
- **Storage.** Rulebooks live in SillyTavern's settings; meter values live in each chat's metadata.
- **Test panel.** Type a sample message in the drawer to see which rules would fire and the resulting prompt, without changing anything.

## Troubleshooting

| Problem | Fix |
|---|---|
| Import says "references unknown meter" | A rule or influence `meter` must match a meter `id` or `name` |
| A rule never fires | Keywords match whole words only (`hi` will not match `this`). Use the Test panel, or a `regex` for partial matches |
| Meters did not move for old messages | Only new messages are read. Press **Rescan chat** |
| Nothing shows on screen | Check the master switch, "Meters panel", and that the rulebook is ticked for this chat |
| The AI ignores the meters | Make sure "Send meter info to the AI" is on and write clear influence `text` |

## Generate rulebooks with any AI

Paste this into an AI chat, then import the JSON it returns:

> Write a Runebook rulebook as JSON for: (describe your tracker). Use this format: `{"name", "meters": [{"id","name","type":"bar|pips|number","min","max","start"}], "rules": [{"name","meter","keywords":[],"on":"user|ai|both","change":number or dice like "1d6","frequency":"always|once_per_chat"}], "influences": [{"meter","min","max","status","text","description"}]}`. Keywords match whole words. Output only valid JSON.

## Making your own

Add **blank template** from the drawer's example list (or copy `examples/blank_template.json`), edit it, and import it. It has one of every meter and rule type with `_help` notes. Keys starting with `_` are ignored.

## Notes

- Rules run on each new message only. The greeting and earlier history are not scanned when you attach a rulebook; use **Rescan chat** to replay the whole chat. Swiping or deleting does not undo changes, so use Rescan (dice rules re-roll) or Reset meters.
- Tracking costs no AI calls. Each turn adds the current values and any matching influence `text` to the prompt (about 30-150 tokens per rulebook).
- AI-judged rules from SpicyChat are not implemented; rules are keyword/regex only.

## Development

`engine.js` is pure logic with tests: `node --test tests/engine.test.mjs`. `index.js` is the SillyTavern UI layer.

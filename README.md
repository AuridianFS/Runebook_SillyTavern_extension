# Runebook

Rulebooks for SillyTavern, inspired by the Rulebooks feature of SpicyChat (an independent, unofficial project; see [NOTICE.md](NOTICE.md)). A rulebook has:

- **Meters** that store a score (bar, pips or number).
- **Rules** that move a meter when keywords or a regex appear, conditions pass, or an optional AI condition matches.
- **Events and milestones** that record named rule occurrences and meter threshold crossings.
- **Influences** that give the character a status label and extra prompt text at different meter levels.

Meter values are injected into the prompt every turn so the character reacts to them.

## Install

SillyTavern -> Extensions -> Install extension -> `https://github.com/AuridianFS/Runebook_SillyTavern_extension`

Then open the **Runebook** drawer in the Extensions panel, add an example or import a `.json` file, and tick the rulebook to attach it to the current chat. Meters appear in a panel docked to the right or left of the chat (or floating); pick the dock and size in the drawer. Click a rulebook's title to minimize it. With 3+ rulebooks (or on narrow screens) they go compact automatically. Toggle the panel from the wand menu.

## Build a rulebook without writing JSON

- **Guided builder:** in the Runebook drawer press **New rulebook (guided)**, or the pencil next to an existing rulebook. Name your meters first, then add rules, milestones and influences. Errors are explained in plain language, and a live JSON preview shows exactly what will be saved.
- **Use an AI assistant:** describe your tracker in the drawer, press **Copy AI instructions**, and paste the result into any AI assistant. It contains the complete format, so the assistant can reply with valid JSON you import with **Import JSON** (or paste into the guided builder's raw JSON area under "Advanced").
- **Reference:** [RULEBOOK_SPEC.md](RULEBOOK_SPEC.md) is the same specification, written for AI agents. It is generated from `spec.js`; run `node tools/build-spec.mjs` after changing the format. Tests fail if it drifts from the engine.

## FAQ

**What does "No profile selected" do?** AI-assisted checks use the custom fallback API if you filled one in; otherwise they use the connection currently open in API Connections, sending only Runebook's own prompt (no character card or chat history).

**Is the Runebook connection profile the same as the one in API Connections?** No, they are separate settings. The Runebook profile only affects AI-assisted rule checks. Chat replies always use whatever is open in API Connections.

**Both seem to use the same model.** If two profiles point at the same local server, that server answers both, and many local servers use whichever model is loaded regardless of the model name in the request. To use a different model, point the profile at a different server or port, or a cloud API. Press **Test AI connection** and watch that server's log to confirm which one answered.

**Does the AI judge write into my chat?** No. It only returns rule ids to Runebook, and Runebook applies the rule's own action.

**A rule never fires.** Keywords match whole words only. Check frequency (`once_per_chat`), cooldown, conditions, and that rules with an `aiCondition` only fire when AI-assisted mode is on. Use **Test a message** in the drawer to see what would fire.

**Where is my data?** Rulebooks are stored in SillyTavern's extension settings; meter values are stored per chat.

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
      "on": "user", "change": 5, "frequency": "always", "cooldown": 2, "event": "kind_words" }
  ],
  "milestones": [
    { "name": "Trusting", "meter": "affection", "at": 75, "direction": "up" }
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
| rule `cooldown` | Optional number of subsequent non-system chat messages to wait before this rule can fire again |
| rule `conditions` | Optional `all`, `any` and `not` arrays. All `all` checks must pass, at least one `any` check must pass when present, and no `not` check may pass. Each check is a text matcher (`keywords`/`regex`) or meter comparison (`meter`, `operator`, `value`); operators are `eq`, `neq`, `gt`, `gte`, `lt`, `lte`. Top-level keywords/regex retain their existing OR behavior and are also required when supplied with `conditions`. |
| rule `event` | Optional name recorded in per-chat event counts and shown in change notes each time this rule fires |
| rule `aiCondition` | Optional natural-language condition evaluated only when AI-assisted mode is enabled |
| milestone `at` / `direction` | A meter threshold and crossing direction (`up`, `down` or `either`). Fires once per chat by default; set `repeat: true` to fire on every crossing. |
| influence `min`/`max` | inclusive range, defaults to the meter's full range |
| influence `status` / `text` / `description` | at least one. `status` and `description` show on screen; `text` is sent to the AI (`{{char}}`, `{{user}}` work) |
| influence `color` | optional, overrides the meter color while in range |

`meter` in rules and influences can be the meter's `id` or `name`.

## Animated visuals

Meters can have a gradient or a gentle animation. All of it is optional; without these fields a meter looks as before.

```json
{ "id": "luck", "name": "Luck", "type": "bar", "min": 0, "max": 100, "start": 50,
  "colors": ["#c62828", "#ffb300", "#43a047"], "fill": "animated", "effect": "shimmer" }
```

- `fill`: `solid` (default), `gradient`, `animated` (the gradient slowly flows), or `stepped` (the range is split into equal bands and the whole meter takes the current band's color, like a traffic light).
- `effect`: `none` (default), `shimmer`, `pulse`, or `glow`.
- `colors`: a list of up to 26 colors, spread evenly. One color is solid. `color` on its own still works. Pips step through the colors; emoji and icon pips cannot be tinted, so they use the first color.
- The guided builder has a **Preset look** dropdown (Fire, Ocean, Neon, Royal, Traffic light) and a single comma-separated Colors box.
- Drawer: **Animations** can be switched off, and a default look can be set for meters without their own. Animations are pure CSS and pause when your system asks for reduced motion.
- Several coin types (gold, silver, copper) work best as separate meters, each with its own color. See `examples/coin_purse.json`.
- Custom CSS can override `--rb-a`, `--rb-b`, `--rb-last` and `--rb-grad` on `.rb-bar`, `.rb-slider` or `.rb-pips`.

## How it works and what it costs

- **No AI calls by default.** Deterministic rules use plain text and meter conditions on each new message. AI calls happen only when AI-assisted mode is enabled and an active rule has `aiCondition`.
- **AI-assisted rules.** The AI returns IDs of matching configured rules; Runebook validates those IDs and applies only the rule's configured meter action. It does not accept AI-proposed meter changes. A selected Connection Profile is used through SillyTavern's profile-specific request service without activating/switching that profile. Without a selected profile, a configured custom OpenAI-compatible Chat Completions endpoint is used; if none is configured, Runebook uses the active SillyTavern connection. The active connection uses SillyTavern's raw generation with only Runebook's own prompt (no character card or chat history). AI rules are evaluated in the background and never block sending or receiving messages. Custom endpoints need CORS; their API key is held in memory only and is not saved.
- **Only new messages are read.** The greeting and earlier history are skipped unless you press **Rescan chat**.
- **Prompt cost.** Each turn adds current meter values plus matching influence `text`, usually 30-150 tokens per rulebook. AI-assisted evaluation adds a separate request only for messages with active AI-conditioned rules. The drawer preview shows the injected prompt and estimate.
- **Switches.** The master switch turns tracking and prompt injection off. Separate switches control the meters panel, change notes, prompt injection, and AI-assisted rule evaluation.
- **Storage.** Rulebooks live in SillyTavern's settings; meter values live in each chat's metadata.
- **Test panel.** Type a sample message in the drawer to see deterministic rule results and the resulting prompt, without changing anything. AI conditions are listed but not called from the test panel.

## Troubleshooting

| Problem | Fix |
|---|---|
| Import says "references unknown meter" | A rule or influence `meter` must match a meter `id` or `name` |
| A rule never fires | Keywords match whole words only (`hi` will not match `this`). Use the Test panel, or a `regex` for partial matches |
| An AI condition never fires | Enable AI-assisted mode and configure a profile or fallback. Rescans and the test panel do not call AI. |
| Meters did not move for old messages | Only new messages are read. Press **Rescan chat** |
| Nothing shows on screen | Check the master switch, "Meters panel", and that the rulebook is ticked for this chat |
| The AI ignores the meters | Make sure "Send meter info to the AI" is on and write clear influence `text` |

## Generate rulebooks with any AI

Paste this into an AI chat, then paste the JSON into the in-app editor or import it:

> Write a Runebook rulebook as JSON for: (describe your tracker). Use this format: `{"name","meters":[{"id","name","type":"bar|pips|number","min","max","start"}],"rules":[{"id","name","meter","keywords":[],"on":"user|ai|both","change":number or dice like "1d6","frequency":"always|once_per_chat","cooldown":number,"event":"event_id","conditions":{"all":[{"meter":"meter_id","operator":"gte","value":3}],"not":[{"keywords":["..."]}]},"aiCondition":"natural-language condition"}],"milestones":[{"name","meter","at","direction":"up|down|either"}],"influences":[{"meter","min","max","status","text","description"}]}`. Keywords match whole words. Output only valid JSON.

## Making your own

Use the **in-app rulebook editor** to create or edit a rulebook as JSON; Validate before saving. You can also add the **blank template** from the example list, edit it in the editor, or import/export `.json` files. The template includes `_help` notes; keys starting with `_` are ignored.

## Notes

- Rules run on each new message only. The greeting and earlier history are not scanned when you attach a rulebook; use **Rescan chat** to replay the whole chat. AI conditions are not replayed; rescan does not make AI calls. Swiping or deleting does not undo changes, so use Rescan (dice rules re-roll) or Reset meters.
- Deterministic tracking costs no AI calls. Each turn adds the current values and any matching influence `text` to the prompt (about 30-150 tokens per rulebook). AI-assisted mode makes separate calls only for active AI-conditioned rules.
- Custom API keys are session-only. Connection Profile selection does not switch SillyTavern's active connection.

## Development

`engine.js` is pure logic with tests: `node --test tests/engine.test.mjs`. `index.js` is the SillyTavern UI layer.

## Safety: only import rulebooks you trust

A rulebook's influence `text` is added to your AI's user-role prompt context every turn, and AI conditions are sent to the judge model. A shared rulebook could therefore contain instructions meant to steer your AI. Runebook shows the AI-facing rulebook text, with warnings for common red flags, **before** you import or save a new or changed rulebook. These warnings are hints, not a guarantee, and user-role placement does not prevent all prompt injection. You can always check what is being sent in **Prompt preview**, and untick a rulebook to stop it.

## Attribution and license

Runebook is an independent, unofficial project and is not affiliated with or endorsed by SpicyChat. The idea of Rulebooks comes from SpicyChat, which the author does not own; Runebook was built from SpicyChat's public documentation and contains none of its code, assets or documentation text. See [NOTICE.md](NOTICE.md).

Released under the [MIT License](LICENSE), which covers only this repository's original code and files.

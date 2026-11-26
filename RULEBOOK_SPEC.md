# Runebook rulebook format (spec for AI agents)

Runebook is a SillyTavern extension that tracks story values ("meters") from chat messages and tells the AI how the character should behave at different levels. A rulebook is ONE JSON object. Write it exactly as described here; the extension rejects anything invalid with an error message.

## How to answer

- Reply with ONLY one JSON object. No markdown fences, no comments, no explanation.
- Use double quotes, no trailing commas. Keys that start with an underscore (like "_help") are ignored.
- Use short snake_case ids ("trust", "kind_words"). Use only the fields listed below.

## How the extension works (read this before designing rules)

- Runebook reads each NEW chat message (from the user and from the AI character) and checks every rule, in order.
- A rule that matches changes ONE meter. Values are always clamped between the meter's min and max.
- Meters, their names and matching influence status/text are shown in user-role prompt context every turn. Keep influence text short (tokens cost money); imported and edited AI-facing text is reviewed before saving.
- The AI never edits meters directly. It can only help decide whether an "aiCondition" rule applied, and the rule's own action is what changes the meter.
- Text matching is whole-word and case-insensitive: "hi" does not match "this". Use phrases for precision.
- {{char}} and {{user}} work inside influence text.

## Top level

- "name" (required): text.
- "meters" (required): list with at least one meter.
- "rules" (optional): list of rules.
- "milestones" (optional): list of milestones.
- "influences" (optional): list of influences.
- "id" (optional): unique snake_case id. Defaults to the name.

## Meters

Each meter is an object:

- "name" (required): text.
- "id" (optional): unique snake_case id, defaults to the name. Rules refer to meters by id or name.
- "type": "bar" (default), "pips" or "number".
- "min" (default 0) and "max" (default 100, or 1000000000 for number). max must be greater than min.
- "start": starting value, default min. Clamped into range.
- "decay": optional {"after": whole number >= 1, "amount": number}. After that many messages in a row where the meter did not change, "amount" is added (use a negative amount to drift down).
- Look (all optional): "icon" (one emoji, or Font Awesome classes like "fa-solid fa-heart"), "color" ("#ff6b9d" or a color name), "style" ("bar" or "slider", for type bar), "pip" ("circle", "heart", "star" or "square", for type pips). Optional animated look: "colorB", "colorC", "colorD" (up to three more gradient colors after "color", which is Color A; stops are spread evenly), "fill" ("solid" default, "gradient" or "animated" for a moving gradient), "effect" ("none" default, "shimmer", "pulse" or "glow"). Gradient and effects are cosmetic only; leave them out for a plain meter.
- For type "pips", keep max small (20 or less); one pip is drawn per point.

## Rules

Each rule changes one meter when it matches. Required: "name", "meter", exactly one action, and at least one trigger.

Action (exactly one):
- "change": number or dice, added to the meter. Examples: 5, -3, "1d6", "-1d4", "2d6+1".
- "set": number or dice, replaces the meter value.

Triggers (a rule needs at least one; if you give several, ALL of them must pass):
- "keywords": list of words or phrases. The rule passes if ANY one is present.
- "regex": a JavaScript regular expression (case-insensitive). Combined with keywords as OR: either may match.
- "conditions": extra checks with up to three lists, "all" (every check must pass), "any" (at least one must pass) and "not" (none may pass). Each check is either a text check {"keywords": [...]} or {"regex": "..."}, or a meter check {"meter": "trust", "operator": "gte", "value": 3}. Operators: "eq", "neq", "gt", "gte", "lt", "lte".
- "aiCondition": a plain-English condition judged by an AI model, such as "The user sincerely apologizes". It ONLY works when the user has turned on AI-assisted mode; otherwise the rule never fires. Prefer keywords when they are enough.

Optional rule settings:
- "id": unique snake_case id. Defaults to rule_1, rule_2, ... by position.
- "on": "both" (default), "user" or "ai". Which side's messages the rule reads.
- "frequency": "always" (default) or "once_per_chat".
- "cooldown": whole number >= 1. Messages to wait before the rule can fire again.
- "event": a name recorded each time the rule fires and shown in on-screen notes.

## Milestones

Fire a notice when a meter crosses a value:

- "name" (required), "meter" (required), "at" (required, must be inside the meter's min..max).
- "direction": "up", "down" or "either" (default).
- "repeat": true or false (default false = only once per chat).
- "id" (optional).

## Influences

Tell the AI (and the player) what a meter level means. Each influence applies while the meter is in its range:

- "meter" (required).
- "min" and "max": inclusive range, default to the meter's full range.
- At least one of "status", "text" and "description":
  - "status": short label shown on screen, like "Wary".
  - "description": longer note shown on screen only (not sent to the AI).
  - "text": instruction sent to the AI in the prompt, like "{{char}} avoids sharing secrets with {{user}}."
- "color": optional color for the meter while in range.

Cover the meter's whole range with influences so there are no gaps. When several influences match, the first status and description win and every matching "text" is sent.

## Design checklist

1. Every rule references an existing meter and has a valid action and trigger.
2. Ids are unique. Meter names or ids in rules match exactly.
3. Keywords are specific; avoid very common words.
4. Use "on" to avoid the character's own words moving a meter they should not.
5. Use "cooldown" or "once_per_chat" for rules that could be spammed.
6. Influence ranges cover min..max, and texts are one short sentence each.
7. Do not invent fields. Do not use fields that are not listed above.

## Complete valid example

~~~json
{
  "name": "Companion Bond",
  "meters": [
    { "id": "trust", "name": "Trust", "type": "pips", "min": 0, "max": 5, "start": 1, "pip": "heart", "color": "#ff6b9d" },
    { "id": "mood", "name": "Mood", "type": "bar", "min": 0, "max": 100, "start": 50, "style": "slider", "icon": "🙂",
      "decay": { "after": 8, "amount": -1 } },
    { "id": "gold", "name": "Gold", "type": "number", "min": 0, "start": 10, "icon": "🪙" }
  ],
  "rules": [
    { "id": "kind_words", "name": "Kind words", "meter": "mood", "keywords": ["thank you", "great job"],
      "on": "user", "change": 5, "cooldown": 2, "event": "kind_words" },
    { "id": "shared_secret", "name": "Shared a secret", "meter": "trust", "keywords": ["secret", "promise"],
      "on": "user", "change": 1, "frequency": "once_per_chat" },
    { "id": "gift", "name": "Trusted gift", "meter": "trust", "keywords": ["gift"],
      "conditions": { "all": [{ "meter": "trust", "operator": "gte", "value": 2 }], "not": [{ "keywords": ["fake"] }] },
      "change": 1 },
    { "id": "apology", "name": "Sincere apology", "meter": "mood",
      "aiCondition": "The user sincerely apologizes, not just says the word sorry.", "change": 5 },
    { "id": "loot", "name": "Found loot", "meter": "gold", "regex": "\\bfinds? (a )?(coin|purse)\\b", "on": "ai", "change": "1d6" },
    { "id": "argument", "name": "Argument", "meter": "mood", "keywords": ["shut up"], "set": 10 }
  ],
  "milestones": [
    { "id": "mood_high", "name": "Mood high", "meter": "mood", "at": 70, "direction": "up" }
  ],
  "influences": [
    { "meter": "mood", "min": 0, "max": 30, "status": "Upset", "color": "#ff5252",
      "description": "Short-tempered right now.", "text": "{{char}} is irritable and short with {{user}}." },
    { "meter": "mood", "min": 31, "max": 70, "status": "Steady" },
    { "meter": "mood", "min": 71, "max": 100, "status": "Cheerful", "text": "{{char}} is upbeat and talkative." },
    { "meter": "trust", "min": 0, "max": 1, "text": "{{char}} does not share personal secrets yet." }
  ]
}
~~~

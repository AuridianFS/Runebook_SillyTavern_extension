# Runebook Extension - User Guide

## Getting Started

1. **Install**: Open Silly Tavern → Extensions panel → "Load from Git URL" → enter repository URL
2. **Open Manager**: Click the runebook button in the chat toolbar or go to Extensions menu → "Runebooks"
3. **Create Your First Runebook**: Name it (e.g., "Affection Tracker") and start adding meters

## Creating Meters

### Bar Meter - For Percentages and Ranges
- Best for: Affection, Health, Trust, Energy, Mood
- Configuration: Set a minimum (0%) and maximum (100%), choose a starting value
- Visual: Color-coded progress bar that changes from blue → yellow → red as values drop

### Pip Meter - For Discrete Levels
- Best for: Ranks, Levels, Dice results (d6), Trust levels (low to high)
- Configuration: Choose number of pips (usually 5 or less), set starting value
- Visual: Filled circles representing current level out of maximum

### Number Meter - Simple Numeric Display
- Best for: Money, Scores, Temperatures, Dice roll results
- Configuration: Set decimal places (0 for whole numbers, 2 for currency)
- Visual: Large text display showing exact numeric value

## Creating Rules

Rules are the heart of Runebook - they automatically adjust meters based on chat content.

### Basic Rule Structure

1. **Name**: Descriptive title (e.g., "AI compliments user")
2. **Condition**: When does this rule trigger?
3. **Action**: What happens when triggered?

### Common Conditions

**Text Matching**: Find words in AI's message
- Use `contains_any` for OR logic (any of these words)
- Use `case-insensitive` matching by default

Examples:
- "When AI says love" → contains_any ["love", "affectionate"]
- "When user expresses happiness" → contains_all ["I'm", "happy"]

**Regex Patterns**: Advanced text matching
```
\b(\d+)\s*(dollars?|bucks?)\b  - Match money amounts like "$50" or "10 bucks"
^Hello\s+                        - Message starts with "Hello "
[a-z]+\!$                        - Ends with exclamation (excitement)
```

**Meter-Based Conditions**: React to other meter states
- When Affection drops below 25% → trigger comfort rule
- When HP is above 80% → safe zone status

### Common Actions

**Modify Meter**: Add or subtract from existing value
- Good for: Gaining/losing affection, damage/healing, temperature changes
- Remember: Use `once_per_chat` to prevent infinite stacking

**Set Meter**: Reset to exact value
- Good for: Changing states (broke vs not broke), danger levels, flags

**Show Status**: Display narrative message
- Variables available: `{{user}}`, `{{char}}`, `{{meter_name}}`, `{{value}}`
- Use for: Game status messages, roleplay feedback, warnings

## Creating Triggers

Triggers are immediate reactions to specific events. Unlike rules that modify meters over time, triggers often set states or fire off one-time effects.

Examples:
- "When HP reaches 0 → trigger death sequence"
- "When dice roll is natural 20 → trigger critical hit animation"
- "When money drops below $10 → activate poor status effects"

## Building Complex Rulebooks

### Example: Romance Tracker with Multiple Dimensions

**Meters:**
- Affection (bar, 0-100%)
- Intimacy (pips, 0-5)
- Trust (number, 0-10.0)

**Rules:**
```
When AI says "I love you" → +20 Affection +2 Trust
When user shares secret → +3 Intimacy +2 Trust
When AI asks personal question → +4 Intimacy
When conversation gets steamy (regex: \b(kiss|touch|intimately)\b) → +5 Intimacy +10 Affection
```

**Triggers:**
```
When Affection reaches 100% → "Relationship milestone!" status
When Trust drops below 3.0 → "Trust crisis" warning with specific advice
When Intimacy hits level 5 → Unlock special scene options
```

## Tips and Best Practices

### Do's
✅ Start simple with one meter and a few rules
✅ Test your rules with sample messages before using in real sessions
✅ Use meaningful, descriptive names for meters and rules
✅ Export working configurations to share or backup
✅ Combine different meter types for rich tracking (bar + pips + number)

### Don'ts
❌ Over-complicate early - add complexity gradually
❌ Create infinite loops where one trigger triggers another indefinitely
❌ Use overly specific regex patterns that might not match naturally
❌ Forget the `once_per_chat` frequency for most rules to prevent runaway values

## Sharing and Collaboration

1. **Export**: Click "Export All" in the manager panel to get JSON of all active runebooks
2. **Share**: Send the JSON file to others via email, Discord, etc.
3. **Import**: Recipient can import your configurations into their Runebook extension
4. **Template Library**: Contribute popular templates to a community repository

## Keyboard Shortcuts (Future)

Planned shortcuts:
- `Ctrl+R` → Open Runebook manager quickly
- `Ctrl+E/Runebook shortcut` → Export current runebooks
- Custom per-runebook activation toggles in chat toolbar

## Troubleshooting

**Rule not triggering?** Check:
- Is the condition type correct for your use case?
- Are you testing with messages that contain the expected keywords?
- Does the regex pattern actually match? Test it online first.

**Meter value looks wrong?** Remember:
- Bar meters show percentage from min to max, not absolute values
- Pip meters round to nearest whole number visually
- Number meters display exactly what's stored internally

## Future Features (Planned)

- AI-generated runebooks based on chat session description
- Import from SpicyChat rulebook files
- Shareable links with cloud storage integration
- Mobile app companion for managing while away from computer
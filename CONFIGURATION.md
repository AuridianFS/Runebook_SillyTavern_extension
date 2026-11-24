# Creating Custom Runebook Configurations

This guide shows how to create and import custom runebook configurations from JSON files.

## Quick Start: Create Your Own Configuration File

1. **Create a file** with your custom configuration (e.g., `my_custom_tracker.json`)
2. **Import it in Silly Tavern**: Extensions menu → "Runebooks" → "Import Data"
3. **Edit existing configurations**: Click on an active runebook to edit its settings

## Configuration File Structure

```json
{
  "name": "My Custom Tracker",
  "meters": [
    {
      "id": "meter_1",
      "name": "Affection",
      "type": "bar",
      "startValue": 30,
      "min": 0,
      "max": 100
    }
  ],
  "rules": [
    {
      "id": "rule_1",
      "name": "Positive interaction",
      "condition": { "type": "contains_any", "words": ["love"] },
      "action": { "type": "modify_meter", "meterId": "meter_1", "change": 15 }
    }
  ],
  "triggers": []
}
```

## Meter Types

### Bar Meter
- Use for: Percentages, health, affection, energy levels
- Set `min` and `max` to define range (typically 0 and 100)
- Visual: Progress bar that changes color based on value

### Pip Meter  
- Use for: Discrete levels, dice rolls, ranks (low/med/high)
- Set `min` (usually 0) and `max` (number of pips)
- Visual: Filled circles representing current level

### Number Meter
- Use for: Scores, currency, temperatures, exact counts
- Optional: Set `decimalPlaces` to control display precision
- Visual: Large text showing numeric value

## Rule Conditions

### Text Matching

**contains_any** - True if message contains ANY of the words (OR logic):
```json
{ "type": "contains_any", "words": ["love", "care", "affection"] }
```

**contains_all** - True if message contains ALL words (AND logic):
```json
{ "type": "contains_all", "words": ["I", "love"] }
```

**regex** - JavaScript regular expression matching:
```json
{ "type": "regex", "pattern": "\\b(\\d+)\\s*(dollars?)\\b" }
```

### Meter-Based Conditions

**meter_above** - True when meter exceeds threshold:
```json
{ "type": "meter_above", "meterId": "meter_affection", "threshold": 50.0 }
```

**meter_below** - True when meter drops below threshold:
```json
{ "type": "meter_below", "meterId": "meter_hp", "threshold": 30.0 }
```

## Rule Actions

### Modify Meter
Adjust a meter's value (positive = add, negative = subtract):
```json
{ "type": "modify_meter", "meterId": "meter_affection", "change": 15.0 }
```

### Set Meter
Reset a meter to an exact value:
```json
{ "type": "set_meter", "meterId": "meter_broke_status", "value": 100.0 }
```

### Show Status
Display a narrative message (supports variables like `{{user}}`):
```json
{ "type": "show_status", "status": "{{char}} is feeling {{meter_name}}" }
```

## Trigger Conditions

Triggers use the same condition types as rules but fire more immediately for event-based reactions. Common uses:
- Detect special dice rolls (natural 1 or natural 20)
- Monitor meter thresholds crossing
- React to specific story events

## Example Configurations Included

The Runebook extension includes three example configuration files in the `examples/` directory:

1. **affection_tracker.json** - Tracks affection and trust levels with keyword-based rules
2. **wallet_tracker.json** - Monitors money spent/earned with regex patterns  
3. **dice_game.json** - Dice roll tracking with HP management and danger level indicators

## Tips for Creating Configurations

1. **Start Simple**: Begin with one meter and a few basic rules before adding complexity
2. **Test Before Importing**: Write your JSON file, validate syntax, then import into Silly Tavern
3. **Use Descriptive Names**: Clear meter names and rule descriptions make configurations easier to manage later
4. **Export Working Configurations**: Once you create something useful, export it for backup or sharing
5. **Combine Meter Types**: Use a bar for affection, pips for trust levels, number for HP - different meters serve different purposes

## Advanced: Extending the Extension API

If you're developing your own extensions or want to deeply integrate with Runebook, you can access these programmatic interfaces:

```javascript
// Create a new Runebook instance
let rb = new Runebook("Custom Tracker");

// Add meter with configuration
rb.addMeter(
    "Energy", 
    METER_BAR,
    { startValue: 100, min: 0, max: 100 }
);

// Add rule with custom condition function
rb.addRule({
    name: "AI compliments user",
    condition: (msg) => msg.text.includes("beautiful") || msg.text.includes("handsome"),
    action: { type: "modify_meter", meterId: "energy_meter", change: 5 }
});

// Export to JSON format for saving/sharing
let json = exportRunebooksToJson([rb]);
```

## Validating Your Configuration File

Before importing, you can validate your JSON configuration file programmatically using the loader utilities:

```javascript
import { parseRunebookConfig } from "./loader.js";

try {
    let config = parseRunebookConfig(jsonText);
    console.log("✓ Configuration is valid!");
} catch (error) {
    console.error("✗ Invalid configuration:", error.message);
}
```

The loader will check for:
- Required fields (name, meters array)
- Valid meter types (bar, pips, number)
- Proper numeric field values
- Correct structure of rules and triggers

## Sharing Your Runebooks

Once you've created a configuration file you're proud of:
1. Export it as JSON using the "Export All" button or programmatic export
2. Share via email, Discord, GitHub, etc.
3. Others can import your configurations into their Runebook extension instances
4. Consider contributing to a public repository of popular runebook templates

## Future Enhancement Ideas

- AI-generated rule conditions based on chat history analysis
- Cloud storage for saving and sharing configurations  
- Template marketplace with community-created runebooks
- Import from SpicyChat rulebook files directly
- Version control and change tracking for imported configurations
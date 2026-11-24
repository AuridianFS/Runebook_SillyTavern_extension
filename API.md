# Runebook Extension API Reference

This document describes the extension's public API and configuration structures.

## Configuration Objects

### Meter Definition

```json
{
  "id": "unique_meter_id",
  "name": "Affection",
  "type": "bar",           // Options: bar, pips, number
  "startValue": 50.0,      // Initial value
  "min": 0.0,             // Minimum bound (for bar/pip types)
  "max": 100.0,           // Maximum bound (for bar/pip types)
  "levels": [             // Optional: level thresholds
    {"threshold": 75, "label": "High Affection"},
    {"threshold": 25, "label": "Low Affection"}
  ],
  "visible": true         // Show/hide in UI
}
```

### Rule Definition

```json
{
  "id": "unique_rule_id",
  "name": "Positive interaction",
  "condition": {
    "type": "contains_any",   // See condition types below
    "words": ["love", "care"]
  },
  "action": {
    "type": "modify_meter",
    "meterId": "meter_affection",
    "change": 15.0
  },
  "frequency": "always"       // Options: always, once_per_chat, per_turn
}
```

### Trigger Definition

```json
{
  "id": "unique_trigger_id",
  "name": "Secret revealed",
  "condition": {
    "type": "contains_any",
    "words": ["secret"]
  },
  "action": {
    "type": "modify_meter",
    "meterId": "meter_trust",
    "change": 1.0
  }
}
```

## Condition Types

### Text Matching Conditions

**contains_any**: True if message contains any of the words
```json
{ "type": "contains_any", "words": ["love", "care"] }
```

**contains_all**: True if message contains all words (case-insensitive)
```json
{ "type": "contains_all", "words": ["I", "love"] }
```

**regex**: Uses JavaScript regular expression
```json
{ "type": "regex", "pattern": "^Hello\\s+" }
```

### Meter-Based Conditions

**meter_above**: True if meter value is above threshold
```json
{ "type": "meter_above", "meterId": "meter_affection", "threshold": 50.0 }
```

**meter_below**: True if meter value is below threshold
```json
{ "type": "meter_below", "meterId": "meter_hp", "threshold": 30.0 }
```

**dice_roll_exact**: True when dice roll matches exact value (from previous turn)
```json
{ "type": "dice_roll_exact", "value": 20 }
```

## Action Types

### Modify Meter

```json
{
  "type": "modify_meter",
  "meterId": "meter_affection",
  "change": 15.0,        // Amount to add/subtract
  "frequency": "always"
}
```

### Set Meter

```json
{
  "type": "set_meter",
  "meterId": "meter_broke_status",
  "value": 100.0
}
```

### Show Status Message

```json
{
  "type": "show_status",
  "status": "{{user}} is down!",
  "frequency": "once_per_chat"
}
```

**Note**: Variables like `{{user}}` and `{{char}}` are substituted with current chat context.

## Extension API (Developer)

### Creating a Runebook

```javascript
let rb = new Runebook("My Custom Tracker");

// Add meter
rb.addMeter("Affection", METER_BAR, { startValue: 30 });

// Add rule
rb.addRule({
    name: "Positive interaction",
    condition: (msg) => msg.text.includes("love"),
    action: { type: "modify_meter", meterId: "affection_meter", change: 15 }
});

// Add trigger  
rb.addTrigger({
    name: "Secret revealed",
    condition: (msg) => msg.text.includes("secret"),
    action: { type: "show_status", status: "Big reveal!" }
});
```

### Exporting Configuration

```javascript
let exportData = rb.export();
// Returns object with meters, rules, triggers arrays
```

### Importing Configuration

```javascript
rb.import({
    meters: [...],
    rules: [...],
    triggers: [...]
});
```

## Usage Examples

### Simple Affection Tracker

Create a meter that increases when AI expresses affection and decreases for negative interactions. Use text-matching conditions to detect keywords in chat messages, then modify the meter value accordingly.

### Wallet Management System

Track money spent/earned using regex patterns that match currency amounts in chat. Add triggers that activate special states (like "broke") when thresholds are crossed.

### Dice-Based Game Mechanics

Record dice rolls from previous turns and use them as conditions for future actions. Create status messages based on health thresholds to provide narrative feedback during gameplay sessions.
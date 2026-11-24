# Runebook Extension for Silly Tavern

A "Rulebooks" UI extension for Silly Tavern that tracks RP/ERP conditions using meters, rules, and triggers. Inspired by SpicyChat's Rulebooks feature.

## Quick Start

### Method 1: Install from GitHub (Recommended)

1. Open Silly Tavern
2. Go to **Settings → Extensions**
3. Click the **+ Add Extension** button
4. Enter this URL exactly: `https://github.com/FiretailStudios/Runebook`
5. Press Enter and wait for it to load
6. Toggle the extension **ON** in the extensions dropdown

### Method 2: Load from Local File (For Testing)

1. Open Silly Tavern's file browser or use the extension loader if available
2. Navigate to `G:\Documents\Runebook\Runebook\manifest.json`
3. Load it as an extension

## Features

- **Meter Tracking**: Visual meters for affection, trust, mood, dice rolls, currency, etc.
  - Bar meters (percentages)
  - Pip meters (discrete levels like hearts or stars)
  - Number meters (scores, money, points)

- **Rule System**: Automatically track chat content and trigger actions
  - Text-matching rules with regex support
  - Modify meter values when conditions are met
  - Set meter to specific values
  - Frequency controls (always, once per message, etc.)

- **Trigger System**: Immediate reactions to keywords/phrases
  - Simple text matching triggers
  - Auto-adjust meters when triggered

## How to Use

### Opening the Manager

1. Click the 📊 button in the chat toolbar (top-left of chat window)
2. This opens the Runebook manager panel
3. Toggle "Example Runebook" to see how it works

### Creating Custom Runebooks

The extension can load `.rune` configuration files or import JSON configs. Supported syntax:

**Meter Examples:**
```json
{
    "name": "Affection Tracker",
    "meters": [
        {
            "name": "Affection",
            "type": "bar",
            "startValue": 30,
            "min": 0,
            "max": 100
        },
        {
            "name": "Trust",
            "type": "pips",
            "startValue": 2,
            "min": 0,
            "max": 5
        }
    ]
}
```

**Rule Example:**
```json
{
    "name": "Positive interaction",
    "condition": "(msg) => msg.text.includes('love') || msg.text.includes('care')",
    "action": {
        "type": "modify_meter",
        "meterId": "{meter_id}",
        "change": 15
    }
}
```

## Troubleshooting

### Extension doesn't appear after installing from GitHub

**Solution**: Make sure you're using the exact URL: `https://github.com/FiretailStudios/Runebook`

If authentication prompts appear, this may be a browser cache issue. Try:
1. Clear your browser cache
2. Restart Silly Tavern completely
3. Try Method 2 (local file loading) to verify it works

### Nothing appears in chat toolbar or settings

The extension uses three UI hooks that all need to work:
- **Settings drawer** → Should appear in Extensions panel with a toggle
- **Toolbar button** → 📊 button should appear in top-left of chat window  
- **Manager panel** → Opens when you click the toolbar button

If none appear, check browser console for errors. The extension falls back to legacy script mode if ES modules aren't supported.

## Examples Directory

The `examples/` folder contains ready-to-import configurations:
- `affection_tracker.json` - Romance RP tracking
- `dice_game.json` - RPG dice roll tracking
- `wallet_tracker.json` - Currency/inventory management
- `mood_tracker.json` - Character mood states

## Support

Report issues on GitHub or contact the developer. Documentation is in:
- `docs/GUIDE.md` - Development guide for contributors
- `docs/API.md` - Technical API reference
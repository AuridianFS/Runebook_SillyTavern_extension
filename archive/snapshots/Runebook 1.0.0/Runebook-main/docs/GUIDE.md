# Runebook Extension Development Guide

## Overview

Runebook is a Silly Tavern extension that tracks RP/ERP conditions using meters, rules, and triggers. It's inspired by SpicyChat's Rulebooks feature and provides visual feedback on chat content analysis.

## Architecture

### Three UI Components

1. **Settings Drawer**: Appears in Extensions panel with toggle switch
2. **Toolbar Button**: 📊 button docked in chat toolbar (top-left)
3. **Manager Panel**: Opens when button clicked, docks at top-left of chat window

### File Structure

```
Runebook/
├── manifest.json              # Extension metadata + hooks definition
├── src/
│   ├── main.js               # Core extension class with UI registration
│   ├── constants.js          # Meter type definitions (bar/pips/number)
│   ├── settings.html         # Settings panel template (unused - inline instead)
│   └── styles.css            # Extension styling
├── examples/                  # Ready-to-import JSON configurations
├── docs/                      # Documentation files
└── test.html                  # ES module validation page
```

## Installation for Developers

### Method 1: GitHub URL (Recommended)

```bash
# Install in Silly Tavern
Settings → Extensions → + Add Extension
https://github.com/FiretailStudios/Runebook
```

### Method 2: Local File Testing

Navigate to `G:\Documents\Runebook\Runebook\manifest.json` and load as extension file.

## Development Workflow

### 1. Make Changes

Edit any source files in the repository.

### 2. Test Locally (Optional)

For quick iteration without GitHub push cycle:
- Navigate to `G:\Documents\Runebook\Runebook\manifest.json` from Silly Tavern's file browser
- Load as extension
- Toggle ON/OFF to test changes immediately

### 3. Push to GitHub

```bash
git add -A
git commit -m "Descriptive message"
git push origin main
```

### 4. Install in Silly Tavern

After pushing, install via Extensions → + Add Extension with GitHub URL.

## UI Registration Details

### Settings Drawer (Inline-Drawer Pattern)

The extension builds HTML and appends it directly to `#extensions_settings2`:

```javascript
let drawerHtml = `<div id="runebook-settings-drawer">...</div>`;
let container = document.getElementById("extensions_settings2");
container.insertAdjacentHTML("beforeend", drawerHtml);
```

This matches WorldTracker's approach and ensures the settings appear in the extensions panel dropdown.

### Toolbar Button (Direct DOM Append)

The button is created via JavaScript and appended to `#chat-toolbar`:

```javascript
let btn = document.createElement("button");
btn.id = "runebook-toolbar-btn";
toolbar.appendChild(btn);
```

This matches Extension-Dice's approach for docked toolbar positioning.

### Manager Panel (Body Append Pattern)

The panel is created dynamically and appended to `document.body`:

```javascript
let panel = document.createElement("div");
panel.id = "runebook-manager";
panel.style.cssText = "position:absolute;top:10px;left:10px;...";
document.body.appendChild(panel);
```

This matches world_state_alpha's approach and ensures Silly Tavern recognizes it as an openable element from the Extensions menu.

### Open Hook Registration

The `manifest.json` includes `"open": "openRunebookPanel"` which tells Silly Tavern to call this static method when rendering the extension dropdown:

```json
{
    "display_name": "Runebook",
    "hooks": {
        "enable": "onEnable",
        "disable": "onDisable",
        "open": "openRunebookPanel"
    }
}
```

## Meter System

### Three Meter Types

1. **Bar** (`type: "bar"`): Percentage-based, blue-to-red gradient (affection, health)
2. **Pips** (`type: "pips"`): Discrete levels 0-N, yellow-to-purple gradient (hearts, stars)
3. **Number** (`type: "number"`): Score/currency tracking, purple-to-red gradient

### Creating Meters

```javascript
let meter = rb.addMeter("Affection", "bar", {
    startValue: 30,
    min: 0,
    max: 100
});
```

## Rule System

### Text-Matching Rules

Rules detect specific text in chat messages and trigger actions:

```javascript
rb.addRule({
    name: "Positive interaction",
    condition: (msg) => msg.text.includes("love") || msg.text.includes("care"),
    action: {
        type: "modify_meter",
        meterId: affMeter.id,
        change: 15
    }
});
```

### Rule Actions

- `modify_meter`: Adjust value by amount (positive or negative)
- `set_meter`: Set exact value
- `show_status`: Log status message to console

## Trigger System

Triggers fire immediately when keywords/phrases are detected:

```javascript
rb.addTrigger({
    name: "Secret revealed",
    condition: (msg) => msg.text.includes("secret") && msg.text.includes("trust"),
    action: {
        type: "modify_meter",
        meterId: trustMeter.id,
        change: 2
    }
});
```

## Event Hooks

The extension registers for Silly Tavern events via `SillyTavern.getEventSource()`:

- `message_received`: User sends message → evaluate rules/triggers
- `ai_message_received`: AI responds → evaluate rules/triggers

Fallback uses input keypress as proxy trigger if event registration fails.

## Creating Custom Runebooks

### Import JSON Configuration

Example: `examples/affection_tracker.json`

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
        }
    ],
    "rules": [
        {
            "name": "Positive interaction",
            "condition": "(msg) => msg.text.includes(\"love\") || msg.text.includes(\"care\")",
            "action": {
                "type": "modify_meter",
                "meterId": "{meter_id}",
                "change": 15
            }
        }
    ]
}
```

### Using in Extension

Load JSON and rebuild Runebook instance from imported data. Rules reference meter IDs dynamically assigned when the Runebook is reconstructed.

## Example Use Cases

### Romance RP Tracker
- **Meters**: Affection (bar), Trust (pips)
- **Rules**: +15 affection for "love/care", -15 for "hate/disgust"
- **Triggers**: +2 trust when "secret" AND "trust" mentioned

### Dice Game Tracker  
- **Meters**: Current die value (bar), Total score (number)
- **Rules**: Set meter to roll result on dice mentions
- **Triggers**: Show status when specific faces appear

### Wallet/Inventory Tracker
- **Meters**: Gold (number), Items count (pips)
- **Rules**: Modify gold on currency mentions
- **Triggers**: Item acquisition events

## Troubleshooting

### Extension installs but nothing appears

**Solution 1**: Clear browser cache → Restart Silly Tavern → Reinstall from GitHub URL  
**Solution 2**: Check browser console (F12) for ES module loading errors  
**Solution 3**: Test with local file method to verify functionality

### Settings drawer appears but manager doesn't open

Check if toolbar button exists and is clickable. May indicate JavaScript error on click handler.

### Nothing in chat toolbar or settings panel

Verify exact GitHub URL: `https://github.com/FiretailStudios/Runebook`  
(No trailing slash, no extra characters)

## Color Scheme

- **Primary Purple**: #7c4dff (buttons, headers, active elements)
- **Secondary Blue**: #5ac8fa (bar meters, low values)
- **Alert Red**: #ff6b6b (high/low warnings, high meter values)
- **Warning Yellow**: #ffcc00 (pip meters)
- **Background Dark Slate**: #1e1e2f (manager panel)

## Future Enhancements

- Import/export JSON configurations with UI dialogs
- Drag-and-drop ruler configuration from chat history
- Customizable threshold triggers for meter changes
- Persistent storage of custom runebook definitions
- Advanced regex patterns in rule conditions
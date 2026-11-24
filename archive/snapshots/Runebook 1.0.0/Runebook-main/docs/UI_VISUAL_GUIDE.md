# Visual Guide: What You Should See After Installation

## Expected UI Elements

### 1. Extensions Panel (Settings → Extensions)

```
┌─ Runebook [ON] ────────────┐
│ 📊 Track RP conditions    │
│                             │
│ ☑ Enable Runebook          │
│                             │
│ [Open Manager] button       │
└────────────────────────────┘
```

When clicked, shows settings drawer inline (similar to WorldTracker extension).

### 2. Chat Toolbar (Top-left of chat window)

The toolbar should contain buttons like:
- 🎲 Dice roller
- ⚙️ Settings
- 📊 **Runebook button** ← You're looking for this one!

```
┌─────────────────────────────┐
│ 🎲 ⚙️ 📊 [Chat input]     │
└─────────────────────────────┘
```

### 3. Runebook Manager Panel (When you click the 📊 button)

The panel docks at top-left of chat window with purple styling:

```
┌────────────────────────────────────┐
│ Runebook Manager                   │
│ ────────────                       │
│                                   │
│ Toggle Example Runebook            │
│                                   │
│ [Active runebooks list]           │
│ • Affection Tracker               │
│   ♥ Affection: ███████░░ 70/100  │
│   ⭐ Trust: ████░░░░░ 4/5        │
└────────────────────────────────────┘
```

## Color Scheme

- **Primary**: Purple (#7c4dff) - Headers, buttons, active elements
- **Secondary**: Blue (#5ac8fa) - Bar meters
- **Alert**: Red (#ff6b6b) - High/low meter warnings
- **Warning**: Yellow (#ffcc00) - Pip meters
- **Background**: Dark slate (#1e1e2f) - Manager panel

## Meter Visual Styles

### Bar Meters (Affection, Health, etc.)
```
Progress: ████████░░░░ 80%
Color gradient from blue to red based on value
```

### Pip Meters (Trust levels, Hearts, Stars)
```
Progress: ████░░░░░░░ 4/5
Yellow-to-purple gradient
```

### Number Meters (Money, Score, Dice rolls)
```
Progress: ███████░░░░░ 70 points
Purple-to-red gradient
```

## Example Usage Flow

1. **Click 📊 button** → Manager opens
2. Click **"Toggle Example Runebook"** → Creates demo tracker
3. Chat with AI mentioning "love" or "care" → Affection meter increases automatically (visible in console)
4. Manager shows current meter values
5. Toggle off manager to hide panel

## Testing Without Creating Custom Runebooks

The example runebook demonstrates:
- **2 meters**: Affection bar, Trust pips
- **3 rules**: Positive/negative interaction detection, status reporting
- **1 trigger**: Secret revelation increases trust

This lets you verify the UI works before creating your own configurations.
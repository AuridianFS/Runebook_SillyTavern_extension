# Runebook Extension - Quick Start Guide

## Installation (5 minutes)

1. Open Silly Tavern → **Extensions Panel**
2. Click **"Install Extension"** → **"Load from Git URL"**
3. Enter: `https://github.com/YOUR_USERNAME/runebook-extension`
4. Download and load the extension JSON file
5. Enable the extension in the Extensions panel

## Your First Runebook (10 minutes)

### Option A: Use an Example Configuration
1. Open Extensions menu → **"Runebooks"**
2. Click **"Toggle Example Runebook"**
3. You'll see the "Affection Tracker" with built-in meters and rules
4. Chat normally - watch the affection meter change based on AI responses!

### Option B: Create Your Own Tracker
1. Open Extensions menu → **"Runebooks"**
2. Click **"Create New Runebook"**
3. Name it (e.g., "Energy Level", "Story Progress")
4. Choose a meter type:
   - **Bar** for percentages/health/affection
   - **Pips** for discrete levels/dice/energy bars  
   - **Number** for scores/currency/counters
5. Click **"Add Rule"** and define what should change the meter:
   - Condition example: "When AI says 'love'" 
   - Action example: "+10 affection"
6. Save and test by chatting with your character

## Understanding Rules vs Triggers

**Rules**: Automatically modify meters based on chat content over time
- Example: +5 energy when conversation stays positive

**Triggers**: Immediate reactions to specific events  
- Example: Show "Critical hit!" status when dice roll = 20

## Quick Tips

✅ Start simple - one meter, two rules
✅ Test with sample messages before using in real sessions
✅ Export working configurations for backup/sharing
✅ Combine different meter types (bar + pips + number) for rich tracking

## Next Steps

- Import an example configuration from `examples/` folder
- Read the [API Reference](API.md) to extend functionality
- Create custom configurations using JSON files
- Share your runebooks with the community!

## Need Help?

- [README](README.md): Overview and features
- [GUIDE](GUIDE.md): Detailed usage instructions  
- [CONFIGURATION](CONFIGURATION.md): Creating custom JSON configs
- [API Reference](API.md): Developer API documentation

---

**Enjoy tracking your RP sessions!** 📊✨
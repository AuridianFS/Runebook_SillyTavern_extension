# Runebook Extension for Silly Tavern

Track conditions, elements, and story progression in your RP/ERP sessions with interactive meters, rules, and triggers. Inspired by SpicyChat's Rulebooks feature.

## Features

- **Meters**: Visual tracking of values (bar, pips, number types)
- **Rules**: AI-driven conditions that modify meter values based on chat content
- **Triggers**: Event-based actions for special story moments
- **Levels & Status**: Threshold-based status messages and visual indicators
- **Import/Export**: Share your runebook configurations with others

## Installation

1. Open Silly Tavern's Extensions panel
2. Click "Install Extension" → "Load from Git URL"
3. Enter: `https://github.com/YOUR_USERNAME/runebook-extension`
4. Download and load the extension JSON file

Or install from the Silly Tavern extensions repository when added to their catalog.

## Usage Overview

### Creating a Runebook

1. Click the runebook icon in the chat toolbar or open the Extensions menu → "Runebooks"
2. Create a new runebook with a name (e.g., "Affection Tracker", "Trust Meter")
3. Add meters to track values you want to monitor
4. Define rules that respond to specific chat patterns
5. Set up triggers for special events

### Example: Affection Tracker

A simple runebook tracks how affection changes throughout your session:

- **Meters**: 
  - Affection (bar, 0-100%)
  - Trust (pips, 0-5)

- **Rules**:
  - When AI says "love" → +15 Affection
  - When AI says "hate" → -15 Affection
  
- **Triggers**:
  - Secret revealed when trust is high → +2 Trust

## Meter Types

### Bar Meter
Visual progress bar from min to max value. Great for percentages, health, affection, etc.

Configuration:
```json
{ "type": "bar", "startValue": 50, "min": 0, "max": 100 }
```

### Pip Meter
Discrete indicator using filled circles (pips). Good for levels, ranks, or countable items.

Configuration:
```json
{ "type": "pips", "startValue": 3, "min": 0, "max": 5 }
```

### Number Meter
Simple numeric display. Useful for scores, currency, temperatures, etc.

Configuration:
```json
{ "type": "number", "startValue": 100, "decimalPlaces": 2 }
```

## Rules

Rules evaluate chat messages and modify meters when conditions are met.

### Condition Types

- **Text matching**: Check if message contains specific words/phrases
- **Regex patterns**: Use regular expressions for flexible matching
- **Semantic detection**: Advanced NLP-based condition checking (future)

### Actions

- `modify_meter`: Add/subtract from a meter's value
- `set_meter`: Set a meter to a specific value
- `show_status`: Display status message in chat or UI
- `play_sound`: Trigger audio feedback

## Triggers

Triggers are event-based actions that respond to specific conditions, often acting more immediately than rules.

## Color Coding

Meters use color to indicate current state:
- **Green/Blue**: Healthy range (75-100% or above threshold)
- **Yellow**: Warning zone (25-74%)
- **Red**: Critical/danger zone (< 25%)

## Tips & Best Practices

- Start with a simple runebook before adding complexity
- Test your rules with sample messages
- Use meaningful names for meters and rules
- Combine multiple meter conditions in advanced rules
- Export successful configurations to share with others

## Future Enhancements

- Advanced expression parser for complex conditions
- AI-generated rulebooks from chat descriptions
- Shared library of popular runebook templates
- Mobile-responsive UI design
- Notification system for meter changes
- Integration with image generation based on meter states

## Contributing

This extension is open-source. Feel free to:
- Report bugs or suggest improvements
- Create new feature requests
- Share your custom runebooks and rule sets
- Contribute code to the GitHub repository

## Credits

Inspired by [SpicyChat's Rulebooks](https://spicychat.ai) feature, which pioneered meter-based RP tracking. Special thanks to Silly Tavern developers for their excellent extension system architecture.

## License

MIT License - feel free to use and modify as you see fit.
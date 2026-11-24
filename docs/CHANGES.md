# Recent Changes Log

## v1.0.3 (Latest) - March 2026
**Focus**: Proper UI hooks and cleaner architecture

### Breaking Changes
- None for end users; internal refactoring only

### Improvements
- Added `"open": "openRunebookPanel"` hook to manifest.json for proper menu integration  
- Refactored main.js to use class-based architecture with static methods
- Improved ES module vs legacy script loading compatibility
- Added try/catch blocks around all DOM manipulation operations  
- Enhanced logging with descriptive console messages
- Simplified toolbar button registration (no jQuery dependency)
- Fixed manager panel toggle functionality

### Technical Details
- Settings drawer now uses `insertAdjacentHTML` instead of manual append
- Toolbar button properly cleans up on reinstallation (removes existing first)
- Manager panel created via JS element creation (matches world_state_alpha pattern)
- All static methods prefixed with class name for namespacing
- Added fallback error handling throughout

### Files Changed
- `manifest.json`: Added open hook, updated version to 1.0.3  
- `src/main.js`: Complete architectural refactor
- `README.md`: Updated with troubleshooting and installation details

---

## v1.0.2 - February 2026
**Focus**: Hybrid ES module/legacy loading approach

### Key Changes
- Implemented dual-loading strategy for constants.js
- Fallback to global variables if ES modules fail
- Added test.html for validation page

### Technical Approach
```javascript
try {
    import("./constants.js").then(m => { /* ... */ })
} catch(e) {
    METER_BAR = "bar";  // fallback values
}
```

### Files Changed
- `src/main.js`: ES module import with try/catch  
- `docs/INSTALLATION_TEST.md`: Added verification guide
- `test.html`: ES module validation page created

---

## v1.0.1 - January 2026
**Focus**: UI registration troubleshooting

### Key Changes
- Implemented inline-drawer pattern for settings (WorldTracker approach)  
- Direct DOM append to chat-toolbar element (Extension-Dice approach)
- Body append panel creation matching world_state_alpha pattern

### Files Changed
- `src/main.js`: Three different UI registration approaches attempted
- `manifest.json`: Settings drawer reference added  
- `README.md`: Updated with troubleshooting sections

---

## v1.0.0 - Initial Release
**Focus**: Core feature implementation

### Features Shipped
- Three meter types: bar, pips, number
- Rule system with text-matching and regex support
- Trigger system for immediate reactions  
- Import/export JSON configurations
- Color-coded visual feedback (blue→yellow→red)

### Example Configurations Included
- `examples/affection_tracker.json`
- `examples/dice_game.json`
- `examples/wallet_tracker.json`
- `examples/mood_tracker.json`

---

## Documentation Evolution

### Early Docs
- Basic README with installation instructions
- API.md for developers  
- CONFIGURATION.md for meter/rule syntax

### Recent Additions (v1.0.3)
- GUIDE.md: Comprehensive development guide
- UI_VISUAL_GUIDE.md: Visual troubleshooting reference
- TROUBLESHOOTING.md: Quick fix checklist
- INSTALLATION_TEST.md: Verification steps

---

## GitHub Repository History

Latest commit: `3abb96c` - Add comprehensive development guide  
Repository: https://github.com/FiretailStudios/Runebook

### Push Commits Summary
1. Initial feature implementation (v1.0.0)
2. UI registration fixes (v1.0.1)
3. ES module loading approach (v1.0.2)
4. Proper hooks + cleaner architecture (v1.0.3 - current)

---

## Installation URLs by Version

- v1.0.3: `https://github.com/FiretailStudios/Runebook` (current main branch)
- All versions use same GitHub URL; Silly Tavern auto-downloads latest
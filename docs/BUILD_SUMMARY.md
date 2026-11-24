
## Latest Fix (v1.0.2): WorldTracker + Extension-Dice Hybrid Approach

### Problem Identified
After further analysis of working extensions, discovered that Silly Tavern does NOT support separate menu item registration via API. Extensions must append HTML directly to existing container divs to appear in the Extensions panel.

### Solution Implemented
**Hybrid approach following both WorldTracker and Extension-Dice patterns:**

1. **Settings Drawer** (WorldTracker-style): Append drawer HTML directly to `#extensions_settings2` container
   ```javascript
   // Like WorldTracker's buildSettingsDrawer()
   let container = document.getElementById("extensions_settings2");
   container.insertAdjacentHTML("beforeend", drawerHtml);
   
   // Uses inline-drawer pattern with toggle button
   // Checkbox toggles extension enabled/disabled state
   ```

2. **Toolbar Button** (Extension-Dice-style): Direct jQuery DOM append to `chat-toolbar`
   ```javascript
   let toolbar = document.getElementById("chat-toolbar");
   let btn = document.createElement("button");
   btn.id = "runebook-toolbar-btn";
   toolbar.appendChild(btn);
   ```

### Files Changed
- `src/main.js`: Complete rewrite (468 lines, -50 from previous version)
  - Removed manual menu button creation approach
  - Added settings drawer HTML construction and append logic  
  - Kept direct jQuery DOM manipulation for toolbar button
  - Simplified onDisable() to just remove DOM elements (no API unregister needed)

### Expected Behavior After This Fix

| UI Element | Location | Appearance | Notes |
|------------|----------|------------|-------|
| Settings Drawer | Extensions panel | Inline drawer with toggle checkbox | Appears automatically when HTML appended |
| Toolbar Button 📊 | Docked near chat input | Blue button with emoji | Click opens manager at top-left |
| Manager Panel | Top-left of chat window | Purple-accented (380×400px) | Opens from toolbar or settings drawer |

### Why This Should Work
- **Settings Drawer**: WorldTracker uses this exact pattern and it appears in Extensions panel ✓
- **Toolbar Button**: Extension-Dice uses direct DOM append and it works ✓  
- **Combined approach**: Both patterns proven to work individually, should work together

---
Built with love for RP/ERP enthusiasts tracking their story conditions! 📊✨
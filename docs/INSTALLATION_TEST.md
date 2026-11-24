# Installation Verification Guide

## Quick Test Checklist

After installing from GitHub (`https://github.com/FiretailStudios/Runebook`), verify:

### ✓ Extension loads
- Go to Settings → Extensions
- Find "Runebook" in the list (may require searching)

### ✓ Settings drawer appears
- Click on Runebook extension card
- Should show a toggle and description text
- Contains "Open Manager" button

### ✓ Toolbar button appears  
- Open chat window
- Look for 📊 button in top-left toolbar area (near dice, settings buttons)
- Button should be purple background with white icon

### ✓ Manager panel opens
- Click the 📊 button
- Panel should dock at top-left of chat window
- Shows "Runebook Manager" header
- Contains toggle for example runebook

## Common Issues & Fixes

### Issue: Browser cache preventing update
**Fix**: Press Ctrl+Shift+Delete in browser, clear cached files, restart Silly Tavern

### Issue: GitHub authentication prompt on install
**Fix**: This usually means your browser has old extension data. Try:
1. Completely close and reopen Silly Tavern
2. Uninstall from Extensions panel if possible
3. Re-install using the exact URL: `https://github.com/FiretailStudios/Runebook`

### Issue: Extension shows but nothing visible in UI
**Fix**: Check browser console (F12 → Console tab) for JavaScript errors. The extension uses hybrid ES module/legacy loading - errors there indicate a compatibility issue with your Silly Tavern version.

## Expected Behavior After Installation

The extension provides THREE visible elements:
1. **Settings entry** in Extensions panel with toggle
2. **Toolbar button** 📊 docked in chat window toolbar  
3. **Manager panel** that opens when you click the button

If none of these appear, the extension is not loading correctly. Try the local file method instead to confirm functionality.
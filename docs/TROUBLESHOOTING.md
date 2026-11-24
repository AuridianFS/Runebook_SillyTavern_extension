# Quick Troubleshooting Guide

## Issue: Extension installs but nothing appears in UI

### Test 1: Local file loading (proves extension works)
- Find the file browser in Silly Tavern or use extension loader
- Navigate to: `G:\Documents\Runebook\Runebook\manifest.json`  
- Load it as an extension
- If this works but GitHub URL doesn't → browser cache issue

### Test 2: Browser cache clear (fixes Git URL loading)
- Press Ctrl+Shift+Delete in your browser
- Clear "Cached images and files" for the last hour/day
- Restart Silly Tavern completely
- Reinstall from GitHub URL

### Test 3: Check browser console
- Open Developer Tools (F12) → Console tab  
- Toggle extension ON/OFF in Silly Tavern
- Look for JavaScript errors mentioning "Runebook" or ES module loading
- Common error: `Failed to load script as ES module` → use legacy file method

### Test 4: Verify exact GitHub URL
Make absolutely sure you're using:  
`https://github.com/FiretailStudios/Runebook`
(no trailing slash, no extra characters)

---

## Issue: Settings drawer appears but toolbar button doesn't

This means the extension loads partially. Check:
- Is JavaScript erroring in console when you enable it?
- Does `chat-toolbar` element exist? (F12 → Elements tab search for "chat-toolbar")
- Try clicking settings drawer's "Open Manager" as workaround

---

## Issue: Toolbar button appears but manager panel doesn't open

Likely a JavaScript error in the inline function. Check console for errors on button click. May need to reinstall latest version from GitHub.

---

## Quick verification checklist after installation:
☐ Extension name visible in Extensions list  
☐ Toggle switch shows as ON  
☐ Clicking extension card opens settings drawer  
☐ 📊 button appears in chat toolbar (top-left)  
☐ Clicking 📊 opens manager panel at top-left of chat window

If ☐ items don't work, check browser console for JavaScript errors.
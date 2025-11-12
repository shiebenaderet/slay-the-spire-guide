# Testing Guide for Slay the Spire Guide

## How to Test the Application

### Step 1: Open Browser Console
1. Navigate to http://localhost:5174 in your browser
2. Open Developer Tools (F12 or Right Click → Inspect)
3. Click on the **Console** tab

### Step 2: Test Shop Modal Issue

When you click the Shop button and see a blank screen:

1. Open the Console
2. Look for these log messages:
   ```
   ShopModal: Generating shop stock for character: [character name]
   ShopModal: Character cards available: [number]
   ShopModal: Colorless cards available: [number]
   ShopModal: Shop cards generated: [number]
   ShopModal: Shop relics generated: [number]
   ShopModal: Shop potions generated: [number]
   ShopModal: Rendering with stocks - cards: [number] relics: [number] potions: [number]
   ```

3. If you see "Character cards available: 0" - this means the cards.json isn't loading properly
4. If you see "Shop cards generated: 0" - this means the card filtering isn't working

### Step 3: Test Combat Preview Issue

When you select a monster from the dropdown and nothing appears:

1. Open the Console
2. Type this command and press Enter:
   ```javascript
   JSON.parse(localStorage.getItem('game-store'))
   ```

3. Look at the output - check these fields:
   - `state.deck` - should have cards in it
   - `state.relics` - should have at least 1 relic (starting relic)
   - `state.isRunActive` - should be `true`
   - `state.character` - should be 'ironclad', 'silent', 'defect', or 'watcher'

4. If `deck` is empty `[]` - the run wasn't initialized properly

### Step 4: Manual Testing Workflow

1. Start a fresh run:
   - Go to home page
   - Select a character (e.g., Ironclad)
   - Select starting relic
   - **Select a Neow blessing** (or skip)
   - Click "Begin Run"

2. Test Combat Preview:
   - Click "⚔️ Combat Preview" button
   - Select a monster from the dropdown (e.g., "Jaw Worm")
   - You should see:
     - Monster image and stats
     - Combat readiness badge (READY/CAUTION/DANGER)
     - Strengths section (green)
     - Concerns section (red)
     - Recommendations section (blue)

3. Test Shop:
   - Click "🏪 Shop" in Quick Floor Actions
   - You should see:
     - 6 cards for sale in a grid
     - 3 relics for sale
     - 3 potions for sale
     - Card removal section showing your deck

### Common Issues and Fixes

#### Shop Shows Blank Screen
**Problem**: No items appear in shop
**Likely Cause**: Game state not initialized properly
**Fix**:
1. Check browser console for errors
2. Verify you selected a character and blessing
3. Try refreshing the page and starting a new run

#### Combat Preview Shows Dropdown But No Advice
**Problem**: Can select monster but nothing shows below
**Likely Cause**: Missing deck or selectedMonster not being set
**Fix**:
1. Check console command from Step 3 above
2. Verify `deck` has cards
3. Try selecting a different monster
4. Check if there are any error messages in console

#### Neow Blessing Card Removal Shows No Cards
**Problem**: Modal appears but card grid is empty
**Status**: FIXED in latest code
**Solution**: The fix uses a temporary starter deck instead of the empty game store deck

## Debug Commands

### Check Game State
```javascript
// View entire game state
JSON.parse(localStorage.getItem('game-store'))

// View just the deck
JSON.parse(localStorage.getItem('game-store')).state.deck

// View character
JSON.parse(localStorage.getItem('game-store')).state.character

// Clear game state (resets everything)
localStorage.clear()
```

### Check Loaded Data
```javascript
// These won't work directly in console, but check Network tab:
// - cards.json should load
// - relics.json should load
// - potions.json should load
// - monsters.json should load
```

## Reporting Issues

When reporting an issue, please include:

1. **Steps to reproduce**:
   - Exact clicks you made
   - Which character you selected
   - Which floor you're on

2. **Console output**:
   - Any error messages (red text)
   - Any warning messages (yellow text)
   - The shop debug logs (if shop is blank)

3. **Game state** (run this and copy output):
   ```javascript
   const state = JSON.parse(localStorage.getItem('game-store')).state;
   console.log({
     character: state.character,
     floor: state.stats.floorNumber,
     deckSize: state.deck.length,
     relicsCount: state.relics.length,
     isRunActive: state.isRunActive
   });
   ```

4. **Screenshot** of the issue

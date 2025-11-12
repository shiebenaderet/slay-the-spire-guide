# Slay the Spire Run Tracker - Comprehensive Test Plan

## Overview
Testing all 4 characters across different ascension levels to verify:
1. Artwork displays correctly (cards, relics, potions)
2. Advisory logic provides clear, helpful guidance
3. Archetype steering is effective and well-explained
4. Game flow is smooth and intuitive

## Before Testing
- **Clear localStorage**: Visit `http://localhost:5174/debug-storage.html` and clear all storage
- **Hard refresh browser**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
- **Check console**: Open browser DevTools to monitor for errors

---

## Test 1: Ironclad - Ascension 0
**Goal**: Verify basic functionality and beginner-friendly guidance

### Setup
- Character: Ironclad
- Ascension: 0
- Starting Relic: Burning Blood

### Test Steps
1. **Character Select**
   - [ ] Character portrait displays correctly
   - [ ] Description is clear and helpful
   - [ ] Starting relic image shows

2. **Neow's Blessing**
   - [ ] Blessing options display properly
   - [ ] Card/relic images in blessings work
   - [ ] Workflow completes successfully

3. **Initial Deck View** (Floor 1)
   - [ ] All 5 Strikes display with correct artwork
   - [ ] All 4 Defends display with correct artwork
   - [ ] Bash displays with correct artwork
   - [ ] Burning Blood relic displays correctly
   - [ ] Deck stats show: 5 attacks, 4 skills

4. **First Card Reward**
   - [ ] 3 cards offered
   - [ ] Card images display correctly
   - [ ] Advisory panel shows recommendations
   - [ ] Recommendations explain WHY to pick/skip
   - [ ] Skip option works

5. **Archetype Steering** - Pick these cards in order:
   - Floor 2: Pick **Inflame** or **Limit Break** (strength scaling)
   - Floor 3: Pick **Heavy Blade** or **Sword Boomerang** (strength payoff)
   - Floor 4: Pick **Spot Weakness** or **Flex** (more strength)
   - Floor 6: Campfire - **Upgrade Inflame** (if you have it)
   - Floor 8: Pick **Whirlwind** or **Pummel** (multi-hit for strength)

   **Check**: Does the advisor recognize you're building strength scaling?
   - [ ] Advisory panel mentions "strength synergy"
   - [ ] Recommendations prioritize strength cards
   - [ ] "Look For" section suggests strength relics (e.g., Vajra, Girya)

6. **Relic Acquisition** (Floor 10+)
   - [ ] Relic images display correctly
   - [ ] Relic evaluations are contextual
   - [ ] High-value relics get "MUST-TAKE" or "GOOD-TAKE"
   - [ ] Bad relics get "SKIP" with explanation

7. **Potion System**
   - [ ] Potion icons display (or show placeholder)
   - [ ] Can add potions up to limit
   - [ ] Can use/discard potions
   - [ ] Character-specific potions filter correctly

### Expected Archetypes to Detect
- **Strength Scaling**: Inflame + Heavy Blade + strength cards
- **Exhaust Synergy**: If you pick Burning Pact + Feel No Pain
- **Block/Defensive**: If you pick Shrug It Off + Flame Barrier

---

## Test 2: Silent - Ascension 10
**Goal**: Test with Ascender's Bane curse, poison archetype detection

### Setup
- Character: Silent
- Ascension: 10 (adds Ascender's Bane to deck)
- Starting Relic: Ring of the Snake

### Test Steps
1. **Deck View** (Floor 1)
   - [ ] 5 Strikes, 5 Defends, Neutralize, Survivor all display
   - [ ] Ascender's Bane (curse) displays in deck
   - [ ] Curse is marked clearly (purple border/indicator)
   - [ ] Ring of the Snake relic displays

2. **Archetype Steering** - Build Poison:
   - Floor 2: Pick **Deadly Poison** or **Bouncing Flask**
   - Floor 3: Pick **Noxious Fumes** or **Poison cards
   - Floor 4: Pick **Catalyst** (poison multiplier)
   - Floor 6: Pick **Corpse Explosion** or **Burst**

   **Check**: Does the advisor detect poison build?
   - [ ] Advisory mentions "poison synergy"
   - [ ] Recommends Catalyst highly
   - [ ] Suggests poison-boosting relics (Snecko Skull, Toxic Egg)

3. **Alternative: Shiv Archetype**
   - If testing shiv build instead:
   - Floor 2: Pick **Blade Dance** or **Cloak and Dagger**
   - Floor 3: Pick **Accuracy** or **After Image**
   - Floor 4: Pick **Shuriken** (relic if available)

   **Check**: Does the advisor detect shiv build?
   - [ ] Advisory mentions "shiv synergy"
   - [ ] Recommends multi-shiv cards
   - [ ] Suggests Shuriken, Kunai, Ornamental Fan relics

4. **Curse Management**
   - [ ] Advisor suggests removing Ascender's Bane at shops
   - [ ] Curse is visible in deck stats

---

## Test 3: Defect - Ascension 15
**Goal**: Test orb-focused mechanics, higher difficulty

### Setup
- Character: Defect
- Ascension: 15
- Starting Relic: Cracked Core

### Test Steps
1. **Deck View** (Floor 1)
   - [ ] 4 Strikes, 4 Defends, Zap, Dualcast display
   - [ ] Ascender's Bane present
   - [ ] Cracked Core relic displays

2. **Archetype Steering** - Build Lightning:
   - Floor 2: Pick **Ball Lightning** or **Charge Battery**
   - Floor 3: Pick **Electrodynamics** (AoE lightning)
   - Floor 4: Pick **Defragment** (orb scaling)
   - Floor 6: Pick **Capacitor** or **Storm** (more orb slots)

   **Check**: Does the advisor detect lightning build?
   - [ ] Advisory mentions "lightning/orb synergy"
   - [ ] Recommends orb-focused cards
   - [ ] Suggests Electro Dynamics highly for AoE
   - [ ] Recommends orb relics (Gold-Plated Cables, Inserter)

3. **Alternative: Frost/Block Archetype**
   - Floor 2: Pick **Glacier** or **Coolheaded**
   - Floor 3: Pick **Blizzard** or **Frost** focus cards
   - Floor 4: Pick **Capacitor** (more frost orbs)

   **Check**: Does the advisor detect frost build?
   - [ ] Advisory mentions "frost/defensive synergy"
   - [ ] Recommends Frozen Eye, Ice Cream

4. **Artifact Interactions**
   - [ ] Advisory warns about focus-reducing effects
   - [ ] Recommends Biased Cognition carefully

---

## Test 4: Watcher - Ascension 20
**Goal**: Test stance mechanics, maximum difficulty

### Setup
- Character: Watcher
- Ascension: 20
- Starting Relic: Pure Water

### Test Steps
1. **Deck View** (Floor 1)
   - [ ] 4 Strikes, 4 Defends, Eruption, Vigilance display
   - [ ] Ascender's Bane present
   - [ ] Pure Water relic displays

2. **Archetype Steering** - Build Wrath/Divinity:
   - Floor 2: Pick **Tantrum** or **Ragnarok**
   - Floor 3: Pick **Wallop** or **Rushdown**
   - Floor 4: Pick **Mental Fortress** or **Talk to the Hand**
   - Floor 6: Pick **Blasphemy** or **Establishment**

   **Check**: Does the advisor detect stance-dance build?
   - [ ] Advisory mentions "stance synergy"
   - [ ] Warns about Wrath danger (double damage taken)
   - [ ] Recommends balance of Wrath/Calm cards
   - [ ] Suggests stance relics (Violet Lotus, Duality)

3. **Alternative: Infinite/Scry Build**
   - Floor 2: Pick **Cut Through Fate** or **Foresight**
   - Floor 3: Pick **Establishment**
   - Floor 4: Pick **Sanctity** or more 0-cost cards

   **Check**: Does the advisor detect scry/retention build?
   - [ ] Advisory mentions "scry/card manipulation"
   - [ ] Recommends Third Eye, Foreign Influence

4. **Ascension 20 Specifics**
   - [ ] HP management advice due to harder enemies
   - [ ] Advisory warns about risky plays

---

## General Issues to Track

### Artwork Issues
- [ ] Any missing card images (note which cards)
- [ ] Any missing relic images (note which relics)
- [ ] Any missing potion icons
- [ ] Image placeholders display correctly (gray "?" instead of black boxes)

### Logic/Advisory Issues
- [ ] Advisory gives contradictory advice
- [ ] Archetype detection fails to recognize obvious builds
- [ ] Recommendations don't explain reasoning
- [ ] "Look For" section doesn't update based on deck
- [ ] Relic evaluations seem random/incorrect

### Flow/UX Issues
- [ ] Navigation is confusing
- [ ] Can't easily add cards/relics/potions
- [ ] Can't remove items when needed
- [ ] Floor progression is unclear
- [ ] Combat preview doesn't work
- [ ] Campfire choices don't work

### Missing Features
- [ ] No way to track run completion (win/loss)
- [ ] No way to see final deck stats
- [ ] No way to restart run easily
- [ ] No way to abandon run mid-way

---

## Run Completion Tracking - Feature Analysis

### Current State
- Runs can be started
- Progress tracked through floors
- **No explicit end state** for runs (no win/loss tracking)

### Recommended Features
1. **Run Completion Modal**
   - Trigger: Manual "End Run" button or at Floor 52+ (Heart kill)
   - Shows: Final deck, relics, potions, floor reached, result (win/loss)
   - Options: "New Run" or "View Stats"

2. **Run History** (Optional)
   - Track past runs with character, ascension, result
   - Simple localStorage-based history
   - View trends (win rate by character)

3. **Abandon Run**
   - Button to abandon current run
   - Confirmation dialog
   - Returns to character select

### Priority
- **High**: Run completion modal and abandon button
- **Medium**: Basic run history
- **Low**: Detailed statistics

---

## Test Results Summary

### Ironclad A0
- **Status**: [ ] Pass / [ ] Fail
- **Issues Found**:
- **Archetype Detection**: [ ] Working / [ ] Needs improvement
- **Advisory Quality**: [ ] Good / [ ] Needs work

### Silent A10
- **Status**: [ ] Pass / [ ] Fail
- **Issues Found**:
- **Archetype Detection**: [ ] Working / [ ] Needs improvement
- **Advisory Quality**: [ ] Good / [ ] Needs work

### Defect A15
- **Status**: [ ] Pass / [ ] Fail
- **Issues Found**:
- **Archetype Detection**: [ ] Working / [ ] Needs improvement
- **Advisory Quality**: [ ] Good / [ ] Needs work

### Watcher A20
- **Status**: [ ] Pass / [ ] Fail
- **Issues Found**:
- **Archetype Detection**: [ ] Working / [ ] Needs improvement
- **Advisory Quality**: [ ] Good / [ ] Needs work

---

## Next Steps After Testing

1. Fix all artwork issues found
2. Improve advisory logic based on feedback
3. Implement run completion tracking
4. Add archetype definitions if detection is weak
5. Polish UX based on flow issues found

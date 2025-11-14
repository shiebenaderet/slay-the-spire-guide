# Changelog

All notable changes to the Slay the Spire Guide project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-14

### Changed - Complete Architecture Rebuild
- **BREAKING**: Rebuilt entire app as interactive coaching system instead of passive dashboard
- Changed from analytics-focused to education-focused approach
- Replaced MainRunTracker with RunCoach floor-by-floor coaching interface

### Added - Interactive Coaching System
- Floor-by-floor coaching flow with room type selection
- 5-step combat flow: enter enemies → enter hand → view strategy → record results → card rewards
- Interactive card reward evaluation with detailed explanations
- Shop flow with buy/removal recommendations
- Rest site flow with rest vs upgrade decision logic
- AutocompleteInput component with Tab/Enter support for fast data entry

### Added - Comprehensive Card Evaluation (All 352 Cards!)
- Tag-based evaluation system supporting all 352 cards including:
  - All character cards (Ironclad, Silent, Defect, Watcher)
  - All colorless cards
  - All curse cards
  - All status cards
- Elite-specific evaluation functions:
  - evaluateForNob (punishes skills, rewards damage)
  - evaluateForLagavulin (rewards wake-up attacks)
  - evaluateForSentries (rewards AOE)
  - evaluateForSlavers (rewards AOE and scaling)
  - evaluateForGremlinLeader (rewards AOE)
  - evaluateForBookOfStabbing (rewards scaling)
  - evaluateForReptomancer (critical AOE check)
- Boss-specific evaluation for all Act 1, 2, 3 bosses
- Act-aware priority system (Act 1: damage, Act 2: AOE+scaling, Act 3: mitigation)

### Added - 5-Point Checklist System
- Evaluates cards on 0-5 point scale:
  - Elite Points (0-3): How well card handles upcoming elites
  - Boss Points (0-1): How well card handles upcoming boss
  - Synergy Points (0-1): How well card synergizes with current deck/relics
- Recommendation tiers based on score:
  - must-pick (4-5 points)
  - strong-pick (3 points)
  - consider (2 points)
  - skip (0-1 points)
- "Problem solved" detection (warns when you already have enough of something)

### Added - Relic Evaluation System
- Comprehensive relic evaluation with tier ratings (S/A/B/C/D)
- Deck synergy detection (e.g., Dead Branch + exhaust cards)
- Energy relic priority (correctly values as game-changing)
- Character-specific bonus scoring
- Impact assessment (game-changing / strong / moderate / weak)

### Added - Shop Advisor
- Buy recommendations with cost-benefit analysis
- Removal priority system (critical / high / medium / low)
- Budget management warnings
- Act-specific shopping advice
- Evaluates cards and relics for sale using same 5-point checklist

### Added - Rest Site Advisor
- Rest vs Upgrade decision logic based on HP thresholds
- Act-specific HP danger zones:
  - Act 1: <50% HP
  - Act 2: <60% HP
  - Act 3: <70% HP
- Upgrade priority ranking for all unupgraded cards
- Peace Pipe support (card removal at rest sites)
- Girya support (lift for +1 Strength)

### Added - Detailed Synergy Explanations
- Character-specific synergies explained:
  - Ironclad: Strength scaling, exhaust synergies
  - Silent: Poison scaling, shiv generation, discard synergies
  - Defect: Orb synergies, focus scaling
  - Watcher: Stance dancing, mantra generation
- Exact synergy text (e.g., "Bash applies Vulnerable, Hemokinesis deals huge damage")
- Anti-synergy warnings (e.g., "Already have too many Strikes")

### Added - Combat Strategy Generation
- Enemy-specific strategies for all enemies
- HP-based recommendations
- Character-specific tips
- Hand-specific advice (when hand is entered)
- Detailed combat patterns and priorities

### Fixed
- Starting HP calculation now correctly reduces by 10 for Ascension 14+
- All characters now have accurate base HP:
  - Ironclad: 80 (70 at A14+)
  - Silent: 70 (60 at A14+)
  - Defect: 75 (65 at A14+)
  - Watcher: 72 (62 at A14+)

### Technical Improvements
- Created comprehensive card evaluator using tag-based system
- Metadata-driven approach scales automatically to new cards
- Separated coaching state (coachingStore) from legacy state (gameStore)
- Created coaching-specific type system (coaching.ts)
- Improved component organization with flow-based architecture

### Data Improvements
- All cards now have accurate tags (aoe, damage, block, scaling, poison, etc.)
- Cards.json includes tier ratings and synergy data
- Relics.json includes tier ratings and synergies

## [1.0.0] - 2024-12-XX

### Added - Initial Release
- Character selection (Ironclad, Silent, Defect, Watcher)
- Starting blessing selection
- Ascension level tracking
- Deck and relic tracking with visual display
- Card advisory system with archetype detection
- Combat advisor with enemy-specific strategies
- 16 archetype detectors across all characters
- 333+ cards with tier ratings
- All Act 1-3 enemies with strategies
- Monster images and attack patterns
- Persistent localStorage state
- GitHub Pages deployment support

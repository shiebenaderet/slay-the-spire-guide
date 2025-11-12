# Slay the Spire Guide - SpireGuide.app

An intelligent, interactive companion app for Slay the Spire that helps you reach Ascension 20 and defeat the Heart.

## Features

### 🎴 Smart Card Advisory System
- **Real-time card evaluation** - Get instant recommendations on whether to pick, skip, or prioritize cards
- **Archetype detection** - Automatically identifies your deck strategy (16 different archetypes across all characters!)
- **Synergy analysis** - Highlights cards that work perfectly with your current deck
- **Anti-synergy warnings** - Warns you about cards that conflict with your build
- **Tier ratings** - Every card rated on a 1-5 scale for quick decision-making
- **Visual card display** - See card images with counts (e.g., "Strike x5")

### ⚔️ Combat Advisor
- **Enemy-specific strategy** - Detailed advice for every enemy in Acts 1, 2, and 3
- **Readiness assessment** - Tells you if you're ready, should be cautious, or are in danger
- **Personalized recommendations** - Takes into account your exact cards AND relics for actionable advice
- **Attack pattern display** - See enemy attack sequences and abilities at a glance
- **Tutorial tips** - Learn game mechanics while you play (great for improving at higher ascensions!)
- **Monster images** - Visual reference for every enemy

### 🏺 Relic & Deck Tracking
- **Visual relic tracker** - See all your relics with images, descriptions, and synergy information
- **Comprehensive deck overview** - Card images with counts, sortable by type
- **Upgrade tracking** - Mark cards as upgraded directly from the interface
- **Card removal** - Track removed cards during events/shops
- **Persistent storage** - Your run progress is automatically saved to localStorage

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Zustand** for state management with localStorage persistence

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, or pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Deploy to GitHub Pages

```bash
# Build and deploy in one step
npm run deploy
```

This will build the project and push to the `gh-pages` branch.

### Custom Domain Setup

1. The `CNAME` file in `/public` is set to `spireguide.app`
2. Configure your DNS provider:
   - Type: CNAME
   - Name: @ (or your subdomain)
   - Value: `yourusername.github.io`
3. In GitHub repository settings, enable GitHub Pages and set custom domain
4. Wait for DNS propagation (can take up to 24 hours)

## Project Structure

```
src/
├── components/          # React components
│   ├── AdvisoryPanel.tsx       # Card recommendations with archetype detection
│   ├── CombatAdvisor.tsx       # Enemy-specific combat advice
│   ├── DeckView.tsx            # Deck display with card images
│   ├── RelicTracker.tsx        # Relic display with images
│   ├── CardPicker.tsx          # Interface for adding cards
│   ├── RunStats.tsx            # Run statistics editor
│   └── ...
├── data/                # Game data
│   ├── cards.json             # All 333+ cards with synergies and ratings
│   ├── relics.json            # All relics with tier ratings
│   ├── monsters.json          # All enemies (Acts 1-3) with strategies
│   └── blessings.json         # Neow's blessings
├── utils/               # Helper functions
│   ├── advisoryLogic.ts       # Card evaluation logic
│   ├── combatAdvisor.ts       # Enemy analysis with relic-aware advice
│   ├── archetypeDetection.ts  # 16 deck archetype detectors
│   └── imageHelpers.ts        # Image path resolution
├── store/               # State management
│   └── gameStore.ts           # Zustand store with localStorage persistence
├── pages/               # Main route pages
│   ├── CharacterSelect.tsx    # Character selection screen
│   ├── StartingChoice.tsx     # Starting relic/blessing selection
│   └── MainRunTracker.tsx     # Main run tracking interface
├── types/               # TypeScript types
│   └── index.ts               # All type definitions
├── App.tsx              # Main app with routing
├── main.tsx             # Application entry point
└── index.css            # Global styles with custom STS theme
```

## How to Use

### Starting a Run

1. **Select Character** - Choose from Ironclad, Silent, Defect, or Watcher
2. **Choose Starting Blessing** - Pick Neow's blessing (affects your starting deck)
3. **Set Ascension Level** - Track your current ascension (0-20)

### During Your Run

1. **Overview Tab** - See your complete deck (with card images and counts) and all relics at a glance
2. **Add Card Tab** - Browse all available cards with intelligent recommendations based on your build
3. **Add Relic Tab** - Track relics you acquire from elites, bosses, shops, and events
4. **Advisor Tab** - Get detailed card recommendations that evolve as your deck develops
5. **Combat Tab** - Prepare for specific enemies with personalized strategy advice

### Understanding the Advisor

**Priority Levels:**
- **MUST-PICK** (Green) - Take this card almost always
- **GOOD-PICK** (Blue) - Strong addition to your deck
- **SITUATIONAL** (Yellow) - Good in specific circumstances
- **SKIP** (Red) - Avoid or only take if desperate

**Readiness Ratings (Combat Advisor):**
- **Ready** (Green) - Your deck is well-suited for this fight
- **Caution** (Yellow) - Winnable but risky, follow the strategy carefully
- **Danger** (Red) - Your deck is poorly matched, consider avoiding or pathing differently

## Deck Archetypes

The app automatically detects 16 different deck archetypes:

### Ironclad
- **Strength Scaling** - Demon Form, Inflame, Limit Break, Spot Weakness
- **Exhaust Synergy** - Feel No Pain, Dark Embrace, Dead Branch combo
- **Block Stacking** - Barricade + Body Slam infinite block builds
- **Self-Damage** - Brutality, Rupture, Offering, Combust synergies

### Silent
- **Poison** - Catalyst, Noxious Fumes, Deadly Poison scaling
- **Shiv Generation** - Blade Dance, Accuracy, After Image
- **Discard Synergy** - Calculated Gamble, Acrobatics, Tactician
- **Defense Scaling** - Footwork Dexterity stacking

### Defect
- **Lightning Orbs** - Ball Lightning, Defragment, Electrodynamics
- **Frost Orbs** - Glacier, Coolheaded, passive block generation
- **Dark Orbs** - Darkness, Fusion, multi-orb evoke strategies
- **Focus Scaling** - Capacitor, Consume, Biased Cognition

### Watcher
- **Wrath Stance Dancing** - Eruption, Tantrum, Rushdown
- **Calm Energy Generation** - Tranquility, Inner Peace, Violet Lotus
- **Scry Control** - Third Eye, Cut Through Fate, deck manipulation
- **Divinity/Mantra** - Pray, Worship, Devotion for 3x damage stance

## Data Sources

All game data (cards, relics, enemies) is based on official Slay the Spire game information and community resources. Card tier ratings and synergies are based on high-ascension player consensus and meta analysis from:
- Spirelogs statistics
- Jorbs' tier lists and gameplay insights
- Community tier lists and discussions

## Roadmap

### Completed Features ✅
- Smart card advisory with archetype detection
- Combat advisor with enemy-specific strategies
- Relic-aware personalized advice
- Visual card and relic tracking
- Monster images and attack patterns
- All Acts 1-3 enemies with detailed strategies
- 333+ cards with synergies and tier ratings
- 16 archetype detectors across all characters

### Phase 2B (Future Enhancements)
- [ ] Interactive blessing modals with detailed comparisons
- [ ] Run history & statistics tracking
- [ ] Path planner with map visualization
- [ ] Card removal decision tracker
- [ ] Potion tracking and advice
- [ ] Boss relic swap recommendations
- [ ] Event outcome tracker
- [ ] Act 4 (Heart) specific advice
- [ ] Mobile-optimized version
- [ ] Export/import run data

## Contributing

Contributions are welcome! Areas for improvement:
- Additional archetype detectors
- More relic-card synergy mappings
- Extended enemy strategy tips
- Event tracking features
- Additional tutorial content

Feel free to submit issues and enhancement requests!

## Acknowledgments

- **MegaCrit** - For creating Slay the Spire
- **Spirelogs & Jorbs** - For high-level gameplay insights and tier lists
- **STS Community** - For synergy knowledge and meta analysis
- **You** - For trying to reach A20 Heart! After 1500 hours, victory awaits!

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

**Mission:** Defeat the Heart on Ascension 20. This app exists to make that dream a reality.

Good luck, Slayer! 🗡️

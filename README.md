# Slay the Spire Guide - SpireGuide.app

An intelligent, interactive coaching app for Slay the Spire that helps you learn A20 strategy and improve your decision-making through real-time guidance.

## Features

### 🎯 Interactive Coaching System
- **Floor-by-floor guidance** - Step through your run with personalized advice for every decision
- **Combat strategy** - Enter your enemies and hand, get specific play recommendations
- **Card evaluation** - Uses the 5-point checklist system (3pts Elites + 1pt Boss + 1pt Synergy)
- **Smart skip recommendations** - Knows when to say "skip" based on your current needs
- **Problem-first approach** - Prioritizes solving immediate problems before building synergies

### 🃏 Comprehensive Card System (All 352 Cards!)
- **Tag-based evaluation** - Analyzes all cards including colorless, curses, and status cards
- **Elite-specific recommendations** - Evaluates against specific elites (Nob, Lagavulin, Sentries, Slavers, etc.)
- **Boss preparation** - Knows what you need for each Act boss
- **Synergy explanations** - Tells you exactly WHY cards synergize (e.g., "Bash applies Vulnerable, Hemokinesis deals huge damage")
- **Act-aware priorities** - Changes recommendations based on Act 1/2/3 needs

### 🏺 Relic Evaluation & Synergies
- **Comprehensive relic ratings** - Every relic rated with tier (S/A/B/C/D) and score
- **Deck synergy detection** - Knows when Dead Branch synergizes with exhaust cards
- **Energy relic priority** - Properly values energy relics as game-changing
- **Character-specific bonuses** - Bonus scores for character-specific relics

### 🛒 Shop Advisor
- **Buy recommendations** - Evaluates cards and relics with cost-benefit analysis
- **Removal priority** - Critical/High/Medium priority system for card removal
- **Budget management** - Warns when you can't afford multiple must-buys
- **Act-specific advice** - Different priorities for Act 1/2/3 shops

### ⛺ Rest Site Advisor
- **Rest vs Upgrade decision** - Tells you when HP is critical vs when to upgrade
- **Upgrade priority system** - Ranks all unupgraded cards by upgrade value
- **HP thresholds** - Act-specific danger zones (Act 1: 50%, Act 2: 60%, Act 3: 70%)
- **Relic-aware options** - Supports Peace Pipe (removal) and Girya (lift) options

### 📚 Educational Focus
- **Learn while playing** - Every recommendation explains the reasoning
- **A20 strategy guides built-in** - Based on expert A20 strategy documents
- **Teaches decision-making** - Doesn't just say what to do, explains why

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling with custom STS theme
- **Zustand** for state management with localStorage persistence
- **Tag-based card evaluation** - Metadata-driven system for all 352 cards

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
├── components/              # React components
│   ├── CombatFlow.tsx              # Combat encounter flow (5 steps)
│   ├── CardRewardFlow.tsx          # Card reward recommendations
│   ├── ShopFlow.tsx                # Shop purchase/removal flow
│   ├── RestFlow.tsx                # Rest site decision flow
│   ├── AutocompleteInput.tsx       # Fast input with Tab/Enter support
│   └── ...
├── data/                    # Game data
│   ├── cards.json                  # All 352 cards with tags and synergies
│   ├── relics.json                 # All relics with tier ratings
│   ├── monsters.json               # All enemies with strategies
│   └── blessings.json              # Neow's blessings
├── utils/                   # Core evaluation engines
│   ├── comprehensiveCardEvaluator.ts   # Tag-based evaluation for all 352 cards
│   ├── cardRecommendationEngine.ts     # 5-point checklist system
│   ├── relicEvaluatorComprehensive.ts  # Relic evaluation with synergies
│   ├── shopAdvisor.ts                  # Shop buy/removal recommendations
│   ├── restSiteAdvisor.ts              # Rest vs upgrade logic
│   ├── combatAdvisor.ts                # Enemy-specific strategy generation
│   └── ...
├── store/                   # State management
│   ├── coachingStore.ts            # Coaching run state with persistence
│   └── gameStore.ts                # Legacy store (for compatibility)
├── pages/                   # Main route pages
│   ├── CharacterSelect.tsx         # Character selection screen
│   ├── StartingChoice.tsx          # Starting relic/blessing selection
│   └── RunCoach.tsx                # Main coaching interface
├── types/                   # TypeScript types
│   ├── coaching.ts                 # Coaching system types
│   └── index.ts                    # Legacy types
├── App.tsx                  # Main app with routing
├── main.tsx                 # Application entry point
└── index.css                # Global styles with custom STS theme
```

## How to Use

### Starting a Run

1. **Select Character** - Choose from Ironclad, Silent, Defect, or Watcher
2. **Choose Starting Gift** - Pick Neow's blessing (affects starting HP for A14+)
3. **Set Ascension Level** - Select your ascension (0-20)

### During Your Run

#### Floor Selection
Each floor, you'll:
1. Select room type (Combat, Elite, Shop, Rest Site, Event, Treasure, Boss)
2. Follow the interactive flow for that room type

#### Combat Flow (5 Steps)
1. **Enter enemies** - Type enemy names (autocomplete with Tab/Enter)
2. **Enter hand** (optional) - Your starting hand for specific advice
3. **View strategy** - Get personalized combat strategy
4. **Record results** - Enter win/loss, ending HP, gold received
5. **Card rewards** - Get recommendations on which card to pick (or skip!)

#### Card Reward Recommendations
- **Best Pick highlighted** - Green border with 🏆
- **Score breakdown** - Elites (0-3), Boss (0-1), Synergy (0-1)
- **Detailed reasoning** - Specific elite matchups explained
- **Synergy explanations** - Exact synergies listed with explanations
- **Skip option** - Recommended when no cards solve your problems

#### Shop Flow
1. **Enter shop contents** - Cards and relics for sale
2. **View recommendations** - Prioritized by value and cost-benefit
3. **Removal priority** - Critical > High > Medium removals listed
4. **Budget warnings** - Alerts when you can't afford multiple must-buys
5. **Track purchases** - Mark what you bought and removed

#### Rest Site Flow
1. **View recommendations** - Rest vs Upgrade prioritized by HP and value
2. **HP analysis** - Act-specific danger thresholds
3. **Upgrade priorities** - Top 5 upgrades ranked with reasoning
4. **Peace Pipe support** - Card removal if you have the relic
5. **Girya support** - Lift option for Ironclad

### Understanding Recommendations

#### Priority Levels (Cards)
- **must-pick** (🏆) - Score 4-5: Solves critical problems
- **strong-pick** (✓) - Score 3: Good addition
- **consider** - Score 2: Situational value
- **skip** - Score 0-1: Doesn't help your deck

#### Priority Levels (Shop)
- **must-buy** - Critical purchase, do this first
- **strong-buy** - High value for the cost
- **consider** - Good if you have spare gold
- **skip** - Not worth the cost or doesn't help

#### Priority Levels (Rest)
- **must-do** - Critical action (e.g., rest when HP is critical)
- **strong** - Recommended action
- **consider** - Viable option
- **avoid** - Don't do this

## The 5-Point Checklist System

Every card is evaluated on a 0-5 point scale:

### Elites (0-3 points)
- **Act 1**: Gremlin Nob, Lagavulin, Sentries
- **Act 2**: Three Slavers, Gremlin Leader, Book of Stabbing
- **Act 3**: Reptomancer (critical AOE check), Giant Head, Nemesis

+1 point for each elite the card helps with

### Boss (0-1 point)
- **Act 1**: Hexaghost, Slime Boss, Guardian
- **Act 2**: Bronze Automaton, Champ, Collector (needs scaling)
- **Act 3**: Awakened One, Time Eater, Donu & Deca (needs mitigation)

+1 point if card helps with the upcoming boss

### Synergy (0-1 point)
- Synergizes with current deck cards
- Synergizes with current relics
- Fits your emerging archetype

+1 point if card has meaningful synergies

### Total: 0-5 Points
- **4-5**: Must-pick
- **3**: Strong-pick
- **2**: Consider
- **0-1**: Skip

## Act-Specific Priorities

### Act 1: Front-Loaded Damage
**Problem:** Elites hit hard and fast, especially Gremlin Nob
**Solution:** High damage cards that work without setup
- Carnage, Bludgeon, Pummel (Ironclad)
- Dash, Predator, Skewer (Silent)
- Streamline, Bullseye, Ball Lightning (Defect)
- Flurry of Blows, Flying Sleeves, Bowling Bash (Watcher)

### Act 2: AOE + Scaling
**Problem:** Multi-enemy fights (Slavers, Gremlin Leader) and boss needs 350+ damage
**Solution:** Area-of-effect damage and damage scaling
- Immolate, Whirlwind (Ironclad)
- Dagger Spray, Die Die Die (Silent)
- Electrodynamics, Thunder Strike (Defect)
- Conclude, Ragnarok (Watcher)

### Act 3: Mitigation
**Problem:** Long fights require sustaining HP, Reptomancer is a DPS check
**Solution:** Block scaling and damage mitigation
- Feel No Pain, Flame Barrier, Impervious (Ironclad)
- Footwork, Wraith Form, Malaise (Silent)
- Defragment + Frost Orbs, Buffer (Defect)
- Mental Fortress, Talk to the Hand (Watcher)

## Data Sources

All game data and strategy advice based on:
- Official Slay the Spire game data
- Spirelogs win rate statistics
- Jorbs' A20 tier lists and gameplay analysis
- Community A20 strategy guides
- High-level player consensus

Card tier ratings reflect A20 Heart performance, not general gameplay.

## Roadmap

### Completed Features ✅
- Interactive coaching flow for combat, card rewards, shop, and rest sites
- Comprehensive card evaluation for all 352 cards (including colorless, curses, status)
- 5-point checklist system based on A20 strategy guides
- Elite-specific and boss-specific evaluations
- Relic evaluation with deck synergy detection
- Shop advisor with buy/removal recommendations
- Rest site advisor with rest vs upgrade logic
- Detailed synergy explanations for all recommendations
- Act-aware priority system
- Problem-first decision framework

### Future Enhancements 🚧
- [ ] Event advisor (event decision recommendations)
- [ ] Treasure room flow (relic evaluation)
- [ ] Boss relic swap recommendations
- [ ] Potion tracking and usage advice
- [ ] Path planner with Act map visualization
- [ ] Run statistics and history tracking
- [ ] Export/import run data
- [ ] Act 4 (Heart) specific strategies
- [ ] Mobile-optimized version
- [ ] Archetype detection and win condition tracking

## Contributing

Contributions are welcome! Areas for improvement:
- Elite and boss strategy refinements
- Additional card synergy mappings
- Event decision logic
- Mobile UI optimizations
- Performance improvements

Feel free to submit issues and enhancement requests!

## Acknowledgments

- **MegaCrit** - For creating Slay the Spire
- **Spirelogs & Jorbs** - For high-level gameplay insights and tier lists
- **STS Community** - For A20 strategy knowledge and meta analysis
- **A20 Strategy Guide Authors** - For the 5-point checklist framework
- **You** - For striving to master A20 and defeat the Heart!

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

**Mission:** Learn A20 strategy through interactive coaching. This app doesn't just tell you what to pick—it teaches you WHY.

Good luck, Slayer! 🗡️

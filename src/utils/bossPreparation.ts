import type { Card, CharacterType, Relic } from '../types';
import { analyzeDeck, type DeckAnalysis } from './deckAnalyzer';

export interface BossRequirement {
  name: string;
  met: boolean;
  importance: 'critical' | 'important' | 'recommended';
  description: string;
}

export interface BossPreparation {
  bossName: string;
  floorsUntilBoss: number;
  readiness: 'ready' | 'caution' | 'danger';
  overallScore: number; // 0-100
  requirements: BossRequirement[];
  topPriorities: string[];
  strategy: string;
  warnings: string[];
}

/**
 * Analyze deck readiness for upcoming boss
 * Critical for A20 preparation strategy
 */
export function analyzeBossReadiness(
  deck: Card[],
  relics: Relic[],
  character: CharacterType,
  floor: number,
  currentHP: number,
  maxHP: number
): BossPreparation | null {
  const analysis = analyzeDeck(deck);

  // Determine which boss is coming
  const bossInfo = getUpcomingBoss(floor);
  if (!bossInfo) return null;

  const { bossName, floorsUntilBoss, act } = bossInfo;

  // Get boss-specific requirements
  const requirements = getBossRequirements(bossName, deck, analysis, relics, character);

  // Calculate readiness score
  const score = calculateReadinessScore(requirements, floorsUntilBoss, currentHP, maxHP);
  const readiness = getReadinessLevel(score);

  // Generate priorities and warnings
  const topPriorities = getTopPriorities(requirements, floorsUntilBoss);
  const warnings = getWarnings(requirements, readiness, floorsUntilBoss);
  const strategy = getBossStrategy(bossName, character, analysis);

  return {
    bossName,
    floorsUntilBoss,
    readiness,
    overallScore: score,
    requirements,
    topPriorities,
    strategy,
    warnings
  };
}

function getUpcomingBoss(floor: number): {
  bossName: string;
  floorsUntilBoss: number;
  act: number;
} | null {
  // Act 1 boss (floors 48-51)
  if (floor <= 51) {
    const bossFloor = 51;
    return {
      bossName: 'Act 1 Boss',
      floorsUntilBoss: bossFloor - floor,
      act: 1
    };
  }

  // Act 2 boss (floors 82-85)
  if (floor <= 85) {
    const bossFloor = 85;
    return {
      bossName: 'Act 2 Boss',
      floorsUntilBoss: bossFloor - floor,
      act: 2
    };
  }

  // Act 3 boss (floors 116-119)
  if (floor <= 119) {
    const bossFloor = 119;
    return {
      bossName: 'Act 3 Boss',
      floorsUntilBoss: bossFloor - floor,
      act: 3
    };
  }

  // Act 4 - Heart (floor 126)
  if (floor <= 126) {
    return {
      bossName: 'Heart',
      floorsUntilBoss: 126 - floor,
      act: 4
    };
  }

  return null;
}

function getBossRequirements(
  bossName: string,
  deck: Card[],
  analysis: DeckAnalysis,
  relics: Relic[],
  character: CharacterType
): BossRequirement[] {
  const requirements: BossRequirement[] = [];

  // ACT 1 BOSSES
  if (bossName === 'Act 1 Boss') {
    // Could be Slime Boss, Guardian, or Hexaghost

    // SLIME BOSS requirements
    requirements.push({
      name: 'AOE Damage (Slime Boss)',
      met: hasAOE(deck, analysis, 2), // Need at least 2 AOE cards
      importance: 'critical',
      description: 'Slime Boss splits into smaller slimes - you NEED area damage or you will lose'
    });

    // GUARDIAN requirements
    requirements.push({
      name: 'Frontload Damage (Guardian)',
      met: hasFrontloadDamage(deck, analysis, 50), // Can deal 50+ turn 1-2
      importance: 'critical',
      description: 'Guardian has 9 thorns - weak hits hurt you. Need big damage fast.'
    });

    requirements.push({
      name: 'Defense Mode Awareness (Guardian)',
      met: hasMultiHit(deck, analysis) || analysis.scalingCards >= 2,
      importance: 'important',
      description: 'Guardian gets 20 block/turn in defensive mode. Need scaling or multi-hit.'
    });

    // HEXAGHOST requirements
    requirements.push({
      name: 'Scaling Damage (Hexaghost)',
      met: analysis.scalingCards >= 3,
      importance: 'critical',
      description: 'Hexaghost has 250 HP. Without scaling, you cannot win this fight.'
    });

    requirements.push({
      name: 'Multi-Target (Hexaghost)',
      met: hasAOE(deck, analysis, 1),
      importance: 'important',
      description: 'Hexaghost summons Inferno - AOE helps clear it quickly'
    });

    // GENERAL Act 1 requirements
    requirements.push({
      name: 'Basic Defense',
      met: analysis.blockCards >= 5,
      importance: 'critical',
      description: `You have ${analysis.blockCards} block cards. Need 5+ for Act 1 boss survivability.`
    });

    requirements.push({
      name: 'Deck Consistency',
      met: deck.length <= 25 || analysis.drawCards >= 2,
      importance: 'important',
      description: `Deck is ${deck.length} cards. If >25, you need draw cards for consistency.`
    });
  }

  // ACT 2 BOSSES
  if (bossName === 'Act 2 Boss') {
    // Could be Bronze Automaton, Champ, or Collector

    // BRONZE AUTOMATON requirements
    requirements.push({
      name: 'Multi-Target Damage (Automaton)',
      met: hasAOE(deck, analysis, 3),
      importance: 'critical',
      description: 'Automaton summons 2 orbs with 30-50 HP each. Without AOE, you will die.'
    });

    requirements.push({
      name: 'High Burst Damage (Automaton)',
      met: hasFrontloadDamage(deck, analysis, 70),
      importance: 'critical',
      description: 'Automaton HYPER BEAM hits for 45x3. You need to kill it fast or have 30+ block/turn.'
    });

    // CHAMP requirements
    requirements.push({
      name: 'Weak Application (Champ)',
      met: hasWeakSource(deck, analysis),
      importance: 'critical',
      description: 'Champ hits for 16-18 every turn. Weak (halves damage) is essential.'
    });

    requirements.push({
      name: 'Execute Counter (Champ)',
      met: hasBigDamage(deck, analysis, 40) || analysis.scalingCards >= 3,
      importance: 'important',
      description: 'Champ executes at 50% HP with 40 damage hits. Need big damage or strong scaling.'
    });

    requirements.push({
      name: 'Consistent Block (Champ)',
      met: analysis.blockCards >= 8,
      importance: 'critical',
      description: `${analysis.blockCards} block cards. Champ attacks every turn - need 8+ block sources.`
    });

    // COLLECTOR requirements
    requirements.push({
      name: 'Multi-Target Damage (Collector)',
      met: hasAOE(deck, analysis, 2),
      importance: 'critical',
      description: 'Collector summons minions constantly. Without AOE, you get overwhelmed.'
    });

    requirements.push({
      name: 'Scaling Solution (Collector)',
      met: analysis.scalingCards >= 2,
      importance: 'critical',
      description: 'Collector is a marathon fight. Without scaling, you run out of damage.'
    });
  }

  // ACT 3 BOSSES
  if (bossName === 'Act 3 Boss') {
    // Could be Awakened One, Time Eater, or Donu & Deca

    // AWAKENED ONE requirements
    requirements.push({
      name: 'Limit Powers (Awakened One)',
      met: analysis.powerCount <= 3,
      importance: 'critical',
      description: `You have ${analysis.powerCount} powers. Awakened One punishes powers - keep under 3!`
    });

    requirements.push({
      name: 'Strong Frontload (Awakened One)',
      met: hasFrontloadDamage(deck, analysis, 80),
      importance: 'important',
      description: 'Awakened One phase 2 gets 3 strength/turn. Kill phase 1 fast or you lose.'
    });

    // TIME EATER requirements
    const zeroCoastCards = deck.filter(c => c.cost === 0).length;
    requirements.push({
      name: 'Avoid 0-Cost Spam (Time Eater)',
      met: zeroCoastCards <= 5,
      importance: 'critical',
      description: `You have ${zeroCoastCards} zero-cost cards. Time Eater punishes playing 12 cards/turn!`
    });

    requirements.push({
      name: 'High Impact Cards (Time Eater)',
      met: analysis.avgCost >= 1.2 && hasBigDamage(deck, analysis, 35),
      importance: 'critical',
      description: 'Time Eater wants you to play fewer, bigger cards. Need high-impact plays.'
    });

    // DONU & DECA requirements
    requirements.push({
      name: 'Multi-Target Damage (Donu & Deca)',
      met: hasAOE(deck, analysis, 4),
      importance: 'critical',
      description: 'Donu & Deca must be damaged evenly. Without strong AOE, you lose.'
    });

    requirements.push({
      name: 'Strong Defense (Donu & Deca)',
      met: analysis.blockCards >= 10 || hasWeakSource(deck, analysis),
      importance: 'critical',
      description: 'Both bosses attack every turn. Need 10+ block cards or weak sources.'
    });

    // GENERAL Act 3
    requirements.push({
      name: 'Deck Maturity',
      met: analysis.scalingCards >= 3 && analysis.blockCards >= 8,
      importance: 'critical',
      description: 'Act 3 bosses are brutal. Need mature deck with scaling AND defense.'
    });
  }

  // ACT 4 - HEART
  if (bossName === 'Heart') {
    requirements.push({
      name: 'Massive Scaling',
      met: analysis.scalingCards >= 4,
      importance: 'critical',
      description: 'Heart has 800 HP. Without 4+ scaling cards, you cannot deal enough damage.'
    });

    requirements.push({
      name: 'Multi-Hit Management',
      met: !hasExcessiveMultiHit(deck),
      importance: 'critical',
      description: 'Heart punishes multi-hit with 15 damage back. Avoid excessive shiv/claw decks.'
    });

    requirements.push({
      name: 'Status Card Handling',
      met: analysis.drawCards >= 3 || hasPurgeEffects(deck),
      importance: 'critical',
      description: 'Heart adds 15+ status cards. Need draw cards or exhaust effects.'
    });

    requirements.push({
      name: 'Max HP Check',
      met: true, // This is checked separately with actual HP
      importance: 'critical',
      description: 'Heart fight is long. Should have 70+ max HP or excellent defense.'
    });
  }

  return requirements;
}

// Helper functions for requirement checking
function hasAOE(deck: Card[], analysis: DeckAnalysis, minCount: number): boolean {
  const aoeCards = deck.filter(c =>
    c.tags.includes('aoe') ||
    c.id === 'whirlwind' ||
    c.id === 'immolate' ||
    c.id === 'thunderclap' ||
    c.id === 'die_die_die' ||
    c.id === 'blade_dance' ||
    c.id === 'dagger_spray' ||
    c.id === 'bouncing_flask' ||
    c.id === 'corpse_explosion' ||
    c.id === 'electrodynamics' ||
    c.id === 'ball_lightning' ||
    c.id === 'barrage' ||
    c.id === 'flechettes' ||
    c.id === 'consecrate' ||
    c.id === 'reach_heaven'
  );
  return aoeCards.length >= minCount;
}

function hasFrontloadDamage(deck: Card[], analysis: DeckAnalysis, minDamage: number): boolean {
  // Check for high-damage cards that work early
  const frontloadCards = deck.filter(c =>
    (c.type === 'attack' && c.cost <= 2 && c.tierRating >= 4) ||
    c.tags.includes('frontload') ||
    c.id === 'carnage' ||
    c.id === 'pummel' ||
    c.id === 'bludgeon' ||
    c.id === 'glass_knife' ||
    c.id === 'predator' ||
    c.id === 'eviscerate' ||
    c.id === 'meteor_strike'
  );

  // Rough estimate: each good frontload card = 15-20 damage turn 1-2
  return frontloadCards.length * 18 >= minDamage;
}

function hasMultiHit(deck: Card[], analysis: DeckAnalysis): boolean {
  const multiHitCards = deck.filter(c =>
    c.tags.includes('multi-hit') ||
    c.id === 'pummel' ||
    c.id === 'sword_boomerang' ||
    c.id === 'glass_knife' ||
    c.id === 'claw' ||
    c.tags.includes('shiv')
  );
  return multiHitCards.length >= 2;
}

function hasWeakSource(deck: Card[], analysis: DeckAnalysis): boolean {
  const weakCards = deck.filter(c =>
    c.tags.includes('weak') ||
    c.id === 'bash' ||
    c.id === 'uppercut' ||
    c.id === 'neutralize' ||
    c.id === 'leg_sweep' ||
    c.id === 'wave_of_the_hand'
  );
  return weakCards.length >= 2;
}

function hasBigDamage(deck: Card[], analysis: DeckAnalysis, threshold: number): boolean {
  const bigDamageCards = deck.filter(c =>
    c.type === 'attack' && c.tierRating >= 4 &&
    (c.cost >= 2 || c.tags.includes('scaling'))
  );
  return bigDamageCards.length >= 2;
}

function hasExcessiveMultiHit(deck: Card[]): boolean {
  const multiHitCount = deck.filter(c =>
    c.tags.includes('multi-hit') ||
    c.tags.includes('shiv') ||
    c.id === 'claw'
  ).length;
  return multiHitCount > 8; // Too many multi-hit cards for Heart
}

function hasPurgeEffects(deck: Card[]): boolean {
  return deck.some(c =>
    c.tags.includes('exhaust') ||
    c.id === 'true_grit' ||
    c.id === 'second_wind' ||
    c.id === 'meditate' ||
    c.id === 'sanctity'
  );
}

function calculateReadinessScore(
  requirements: BossRequirement[],
  floorsUntilBoss: number,
  currentHP: number,
  maxHP: number
): number {
  let score = 0;
  let totalWeight = 0;

  requirements.forEach(req => {
    const weight = req.importance === 'critical' ? 3 :
                   req.importance === 'important' ? 2 : 1;

    if (req.met) {
      score += weight * 100;
    }

    totalWeight += weight;
  });

  // HP factor
  const hpPercent = (currentHP / maxHP) * 100;
  const hpScore = hpPercent > 70 ? 100 : hpPercent > 50 ? 70 : hpPercent > 30 ? 40 : 20;
  score += hpScore;
  totalWeight += 1;

  // Time factor (more floors = more chances to improve)
  const timeBonus = floorsUntilBoss > 5 ? 10 : 0;
  score += timeBonus;

  return Math.round(score / totalWeight);
}

function getReadinessLevel(score: number): 'ready' | 'caution' | 'danger' {
  if (score >= 75) return 'ready';
  if (score >= 50) return 'caution';
  return 'danger';
}

function getTopPriorities(
  requirements: BossRequirement[],
  floorsUntilBoss: number
): string[] {
  const unmet = requirements
    .filter(r => !r.met && r.importance !== 'recommended')
    .sort((a, b) => {
      const aScore = a.importance === 'critical' ? 3 : 2;
      const bScore = b.importance === 'critical' ? 3 : 2;
      return bScore - aScore;
    });

  const priorities: string[] = [];

  if (floorsUntilBoss <= 3 && unmet.length > 0) {
    priorities.push(`🚨 URGENT: ${floorsUntilBoss} floors left - critical gaps remain!`);
  }

  unmet.slice(0, 3).forEach(req => {
    priorities.push(`${req.importance === 'critical' ? '⚠️' : '!'} ${req.name}`);
  });

  return priorities;
}

function getWarnings(
  requirements: BossRequirement[],
  readiness: 'ready' | 'caution' | 'danger',
  floorsUntilBoss: number
): string[] {
  const warnings: string[] = [];

  const critical = requirements.filter(r => !r.met && r.importance === 'critical');

  if (readiness === 'danger') {
    warnings.push(`🚨 DECK NOT READY: ${critical.length} critical requirements unmet`);
    warnings.push('Consider alternate pathing or avoiding boss if possible');
  }

  if (readiness === 'caution') {
    warnings.push(`⚠️ Winnable but risky - ${critical.length} gaps in your deck`);
  }

  if (floorsUntilBoss <= 5 && critical.length > 0) {
    warnings.push(`Only ${floorsUntilBoss} floors to fix critical issues`);
  }

  return warnings;
}

function getBossStrategy(
  bossName: string,
  character: CharacterType,
  analysis: DeckAnalysis
): string {
  // Return condensed strategy based on boss and deck state
  if (bossName === 'Act 1 Boss') {
    return 'Be ready for any of: Slime Boss (need AOE), Guardian (need frontload), Hexaghost (need scaling)';
  }

  if (bossName === 'Act 2 Boss') {
    return 'Prep for: Automaton (AOE + burst), Champ (weak + block), Collector (AOE + scaling)';
  }

  if (bossName === 'Act 3 Boss') {
    return 'Could face: Awakened One (limit powers), Time Eater (avoid 0-cost spam), Donu & Deca (AOE damage)';
  }

  if (bossName === 'Heart') {
    return 'Final boss: 800 HP, punishes multi-hit, adds 15 status cards. Need scaling + draw + defense.';
  }

  return 'Prepare your deck for the upcoming boss fight';
}

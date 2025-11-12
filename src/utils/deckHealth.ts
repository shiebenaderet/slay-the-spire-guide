import type { Card, CharacterType, Relic } from '../types';
import { analyzeDeck, type DeckAnalysis } from './deckAnalyzer';

export interface DeckHealthCategory {
  name: string;
  score: number; // 0-100
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'excellent' | 'good' | 'adequate' | 'weak' | 'critical';
  issues: string[];
  recommendations: string[];
}

export interface DeckHealthReport {
  overallScore: number; // 0-100
  overallGrade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  overallStatus: 'excellent' | 'good' | 'adequate' | 'weak' | 'critical';
  categories: {
    damage: DeckHealthCategory;
    defense: DeckHealthCategory;
    scaling: DeckHealthCategory;
    consistency: DeckHealthCategory;
    efficiency: DeckHealthCategory;
  };
  criticalIssues: string[];
  topRecommendations: string[];
  projectedWinRate: number; // Rough estimate based on deck quality
}

/**
 * Comprehensive deck health analysis
 * Provides letter-grade scoring across all dimensions
 */
export function analyzeDeckHealth(
  deck: Card[],
  relics: Relic[],
  character: CharacterType,
  floor: number,
  ascensionLevel: number
): DeckHealthReport {
  const analysis = analyzeDeck(deck);

  // Analyze each category
  const damage = analyzeDamage(deck, analysis, relics, character, floor);
  const defense = analyzeDefense(deck, analysis, relics, character, floor);
  const scaling = analyzeScaling(deck, analysis, relics, floor);
  const consistency = analyzeConsistency(deck, analysis, relics, floor);
  const efficiency = analyzeEfficiency(deck, analysis, floor);

  // Calculate overall score (weighted)
  const overallScore = Math.round(
    damage.score * 0.25 +
    defense.score * 0.25 +
    scaling.score * 0.25 +
    consistency.score * 0.15 +
    efficiency.score * 0.10
  );

  const overallGrade = scoreToGrade(overallScore);
  const overallStatus = scoreToStatus(overallScore);

  // Collect critical issues
  const criticalIssues: string[] = [];
  [damage, defense, scaling, consistency, efficiency].forEach(cat => {
    if (cat.status === 'critical') {
      criticalIssues.push(`${cat.name}: ${cat.issues[0]}`);
    }
  });

  // Top recommendations (from worst categories)
  const categories = [damage, defense, scaling, consistency, efficiency];
  categories.sort((a, b) => a.score - b.score);
  const topRecommendations = categories
    .slice(0, 2)
    .flatMap(cat => cat.recommendations.slice(0, 1));

  // Projected win rate (very rough estimate)
  const projectedWinRate = estimateWinRate(overallScore, ascensionLevel, floor);

  return {
    overallScore,
    overallGrade,
    overallStatus,
    categories: {
      damage,
      defense,
      scaling,
      consistency,
      efficiency
    },
    criticalIssues,
    topRecommendations,
    projectedWinRate
  };
}

function analyzeDamage(
  deck: Card[],
  analysis: DeckAnalysis,
  relics: Relic[],
  character: CharacterType,
  floor: number
): DeckHealthCategory {
  let score = 50; // Base score
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Attack count
  const attackRatio = analysis.attackCount / deck.length;
  if (attackRatio < 0.25) {
    score -= 20;
    issues.push(`Only ${analysis.attackCount}/${deck.length} attacks - too few damage sources`);
    recommendations.push('Add 2-3 more attack cards to increase damage output');
  } else if (attackRatio < 0.35) {
    score -= 10;
    issues.push(`${analysis.attackCount} attacks is low - could use more damage`);
  } else if (attackRatio > 0.5) {
    score += 10;
  }

  // AOE damage (critical for multi-enemy fights)
  const aoeCount = deck.filter(c =>
    c.tags.includes('aoe') ||
    ['whirlwind', 'immolate', 'thunderclap', 'die_die_die', 'blade_dance',
     'dagger_spray', 'corpse_explosion', 'electrodynamics', 'barrage',
     'consecrate', 'reach_heaven'].includes(c.id)
  ).length;

  if (aoeCount === 0) {
    score -= 25;
    issues.push('NO AOE DAMAGE - you will struggle against multi-enemy fights');
    recommendations.push('Critical: Add AOE damage (Whirlwind, Immolate, Die Die Die, etc.)');
  } else if (aoeCount === 1) {
    score -= 10;
    issues.push('Only 1 AOE card - risky against multi-enemy encounters');
  } else if (aoeCount >= 3) {
    score += 10;
  }

  // Frontload damage (can you deal damage turn 1-2?)
  const frontloadCards = deck.filter(c =>
    c.type === 'attack' &&
    c.cost <= 2 &&
    c.tierRating >= 3 &&
    !c.tags.includes('scaling')
  );

  if (frontloadCards.length < 3) {
    score -= 15;
    issues.push('Weak frontload damage - you will take heavy damage early in fights');
    recommendations.push('Add cards that deal good damage without setup');
  } else if (frontloadCards.length >= 5) {
    score += 10;
  }

  // High-tier damage cards
  const goodAttacks = deck.filter(c =>
    c.type === 'attack' && c.tierRating >= 4
  ).length;

  if (goodAttacks >= 4) {
    score += 15;
  } else if (goodAttacks < 2) {
    score -= 10;
    issues.push(`Only ${goodAttacks} high-tier attacks - damage quality is low`);
    recommendations.push('Prioritize tier 4-5 attack cards in rewards');
  }

  // Floor-based expectations
  if (floor >= 17 && goodAttacks < 3) {
    score -= 10;
    issues.push('Act 2: Need more high-quality damage cards');
  }

  if (floor >= 34 && goodAttacks < 4) {
    score -= 15;
    issues.push('Act 3: Damage is below curve for late game');
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Damage',
    score,
    grade: scoreToGrade(score),
    status: scoreToStatus(score),
    issues,
    recommendations
  };
}

function analyzeDefense(
  deck: Card[],
  analysis: DeckAnalysis,
  relics: Relic[],
  character: CharacterType,
  floor: number
): DeckHealthCategory {
  let score = 50;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Block card count
  if (analysis.blockCards < 5) {
    score -= 30;
    issues.push(`CRITICAL: Only ${analysis.blockCards} block cards - you will die`);
    recommendations.push('Urgent: Add 3-5 block cards immediately');
  } else if (analysis.blockCards < 7) {
    score -= 15;
    issues.push(`${analysis.blockCards} block cards is risky - need more defense`);
    recommendations.push('Add 2-3 more defensive cards');
  } else if (analysis.blockCards >= 10) {
    score += 15;
  }

  // Block quality (are they good block cards?)
  const goodBlock = deck.filter(c =>
    c.tags.includes('block') &&
    c.tierRating >= 3
  ).length;

  if (goodBlock < 3) {
    score -= 10;
    issues.push('Block cards are low quality (mostly defends)');
    recommendations.push('Replace defends with better block cards');
  } else if (goodBlock >= 5) {
    score += 10;
  }

  // Weak sources (critical for reducing incoming damage)
  const weakSources = deck.filter(c =>
    c.tags.includes('weak') ||
    ['bash', 'uppercut', 'shockwave', 'neutralize', 'leg_sweep',
     'crippling_cloud', 'wave_of_the_hand'].includes(c.id)
  ).length;

  if (weakSources === 0 && character !== 'defect') { // Defect less reliant on weak
    score -= 20;
    issues.push('NO WEAK SOURCES - you are taking full damage every fight');
    recommendations.push('Add weak cards to halve enemy damage (Bash, Leg Sweep, etc.)');
  } else if (weakSources >= 2) {
    score += 10;
  }

  // Defensive relics
  const hasDefensiveRelic = relics.some(r =>
    ['ornamental_fan', 'orichalcum', 'thread_and_needle', 'sundial',
     'tough_bandages', 'bronze_scales', 'after_image'].includes(r.id)
  );
  if (hasDefensiveRelic) {
    score += 5;
  }

  // Character-specific
  if (character === 'ironclad') {
    // Ironclad has more HP, slightly more forgiving
    score += 5;
  }

  if (character === 'silent') {
    // Silent needs more block (low HP)
    if (analysis.blockCards < 8) {
      score -= 10;
      issues.push('Silent has low HP - you need 8+ block cards');
    }
  }

  // Floor expectations
  if (floor >= 17 && analysis.blockCards < 7) {
    score -= 15;
    issues.push('Act 2: Defense is insufficient for harder enemies');
  }

  if (floor >= 34 && analysis.blockCards < 9) {
    score -= 20;
    issues.push('Act 3: Defense is critically weak for late game');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Defense',
    score,
    grade: scoreToGrade(score),
    status: scoreToStatus(score),
    issues,
    recommendations
  };
}

function analyzeScaling(
  deck: Card[],
  analysis: DeckAnalysis,
  relics: Relic[],
  floor: number
): DeckHealthCategory {
  let score = 50;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Scaling card count
  if (analysis.scalingCards === 0) {
    score -= 40;
    issues.push('NO SCALING - you cannot win boss fights or long hallways');
    recommendations.push('CRITICAL: Add scaling cards (Demon Form, Footwork, Defragment, etc.)');
  } else if (analysis.scalingCards < 2) {
    score -= 20;
    issues.push('Only 1 scaling card - not enough for harder fights');
    recommendations.push('Add 1-2 more scaling sources');
  } else if (analysis.scalingCards >= 4) {
    score += 20;
  }

  // Power cards (often scaling sources)
  if (analysis.powerCount === 0 && analysis.scalingCards < 3) {
    score -= 15;
    issues.push('No power cards and weak scaling - deck has low ceiling');
  } else if (analysis.powerCount >= 3) {
    score += 10;
  }

  // Floor-based scaling requirements
  if (floor >= 17 && analysis.scalingCards < 2) {
    score -= 20;
    issues.push('Act 2: Must have scaling for boss fights');
  }

  if (floor >= 34 && analysis.scalingCards < 3) {
    score -= 30;
    issues.push('Act 3: Insufficient scaling for late game bosses');
  }

  // Archetype synergy (do scaling cards work together?)
  if (analysis.archetypes.length >= 2) {
    score += 10; // Deck has clear strategy
  } else if (analysis.archetypes.length === 0 && deck.length > 20) {
    score -= 10;
    issues.push('No clear archetype - scaling is unfocused');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Scaling',
    score,
    grade: scoreToGrade(score),
    status: scoreToStatus(score),
    issues,
    recommendations
  };
}

function analyzeConsistency(
  deck: Card[],
  analysis: DeckAnalysis,
  relics: Relic[],
  floor: number
): DeckHealthCategory {
  let score = 50;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Deck size
  const deckSize = deck.length;

  if (deckSize <= 20) {
    score += 15; // Thin deck = consistency
  } else if (deckSize <= 25) {
    score += 5;
  } else if (deckSize > 30) {
    score -= 10;
    issues.push(`Deck is ${deckSize} cards - too bloated, reducing consistency`);
    recommendations.push('Remove weak cards (strikes, defends, curses)');
  } else if (deckSize > 35) {
    score -= 20;
    issues.push(`Deck is ${deckSize} cards - extremely bloated`);
  }

  // Draw cards (critical for consistency)
  if (analysis.drawCards === 0 && deckSize > 20) {
    score -= 25;
    issues.push('NO DRAW CARDS - large deck will be inconsistent');
    recommendations.push('Add draw cards (Offering, Battle Trance, Acrobatics, etc.)');
  } else if (analysis.drawCards < 2 && deckSize > 25) {
    score -= 15;
    issues.push('Need more draw cards for deck size');
    recommendations.push('Add 1-2 draw sources');
  } else if (analysis.drawCards >= 3) {
    score += 15;
  }

  // Energy sources (more energy = more consistent powerful turns)
  if (analysis.energyCards >= 2) {
    score += 10;
  } else if (analysis.energyCards === 0 && floor >= 17) {
    score -= 5;
    issues.push('No energy generation - limits turn potential');
  }

  // Curse/status pollution
  const pollution = analysis.curseCount + analysis.statusCount;
  if (pollution >= 3) {
    score -= 20;
    issues.push(`${pollution} curses/status cards polluting your deck`);
    recommendations.push('Remove curses ASAP (shop, events, Peace Pipe)');
  } else if (pollution >= 1) {
    score -= 10;
    issues.push(`${pollution} curse/status in deck`);
  }

  // Cost curve
  if (analysis.avgCost > 1.8) {
    score -= 10;
    issues.push(`High avg cost (${analysis.avgCost.toFixed(1)}) - deck may be clunky`);
  } else if (analysis.avgCost < 1.0) {
    score += 5; // Low-cost deck is smooth
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Consistency',
    score,
    grade: scoreToGrade(score),
    status: scoreToStatus(score),
    issues,
    recommendations
  };
}

function analyzeEfficiency(
  deck: Card[],
  analysis: DeckAnalysis,
  floor: number
): DeckHealthCategory {
  let score = 50;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Average card tier
  const avgTier = deck.reduce((sum, c) => sum + c.tierRating, 0) / deck.length;

  if (avgTier >= 3.5) {
    score += 20; // High-quality deck
  } else if (avgTier >= 3.0) {
    score += 10;
  } else if (avgTier < 2.5) {
    score -= 15;
    issues.push(`Low card quality (avg tier ${avgTier.toFixed(1)}/5)`);
    recommendations.push('Remove low-tier cards, add high-tier cards');
  }

  // Strike/defend count (inefficient basics)
  const basicCount = deck.filter(c =>
    c.id.startsWith('strike_') || c.id.startsWith('defend_')
  ).length;

  if (basicCount >= 8 && floor >= 17) {
    score -= 20;
    issues.push(`${basicCount} strikes/defends in Act 2+ - very inefficient`);
    recommendations.push('Remove strikes and defends at shops/events');
  } else if (basicCount >= 6 && floor >= 17) {
    score -= 10;
    issues.push(`${basicCount} basics is high for mid-game`);
  }

  // Synergy density (do cards work together?)
  let synergyCount = 0;
  deck.forEach(card => {
    if (card.synergies) {
      const synergiesPresent = card.synergies.filter(synId =>
        analysis.cardIds.includes(synId)
      ).length;
      synergyCount += synergiesPresent;
    }
  });

  if (synergyCount >= 15) {
    score += 15; // Highly synergistic deck
  } else if (synergyCount < 5 && deck.length > 20) {
    score -= 10;
    issues.push('Low synergy between cards - deck lacks coherence');
  }

  // Dead cards (cards that are tier 1-2 in late game)
  const deadCards = deck.filter(c =>
    c.tierRating <= 2 && floor >= 25
  ).length;

  if (deadCards >= 4) {
    score -= 15;
    issues.push(`${deadCards} dead cards in late game`);
    recommendations.push('Remove or transform weak cards');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Efficiency',
    score,
    grade: scoreToGrade(score),
    status: scoreToStatus(score),
    issues,
    recommendations
  };
}

function scoreToGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function scoreToStatus(score: number): 'excellent' | 'good' | 'adequate' | 'weak' | 'critical' {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 55) return 'adequate';
  if (score >= 40) return 'weak';
  return 'critical';
}

function estimateWinRate(score: number, ascensionLevel: number, floor: number): number {
  // Very rough estimation
  let baseWinRate = score * 0.7; // 70% max win rate at perfect score

  // Ascension penalty
  const ascensionPenalty = ascensionLevel * 2; // -2% per ascension
  baseWinRate -= ascensionPenalty;

  // Floor progression (being further means you're doing something right)
  if (floor >= 34) baseWinRate += 10;
  else if (floor >= 17) baseWinRate += 5;

  return Math.max(5, Math.min(70, Math.round(baseWinRate)));
}

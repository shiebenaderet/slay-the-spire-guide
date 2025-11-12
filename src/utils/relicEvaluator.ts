import type { Relic, Card, CharacterType } from '../types';
import { analyzeDeck } from './deckAnalyzer';

export interface RelicEvaluation {
  relic: Relic;
  rating: number; // 1-5 scale
  recommendation: 'must-take' | 'good-take' | 'situational' | 'skip';
  reason: string;
  synergies: string[];
  antiSynergies: string[];
}

/**
 * Evaluates a relic based on current deck composition and relics
 */
export function evaluateRelic(
  relic: Relic,
  currentDeck: Card[],
  currentRelics: Relic[],
  character: CharacterType
): RelicEvaluation {
  let rating = (relic as any).tierRating || 3; // Start with base tier rating (use tierRating number, not tier letter)
  const synergies: string[] = [];
  const antiSynergies: string[] = [];
  let recommendation: RelicEvaluation['recommendation'] = 'good-take';

  // Count card types in deck
  const baseAnalysis = analyzeDeck(currentDeck);

  // Add properties specific to relic evaluation
  const deckAnalysis = {
    ...baseAnalysis,
    avgDeckHP: 80, // Placeholder - would need actual HP tracking from game state
    cardPlayCount: baseAnalysis.skillCount, // Rough estimate of cards played per turn
  };

  // Check if we already have this relic
  if (currentRelics.some(r => r.id === relic.id)) {
    return {
      relic,
      rating: 1,
      recommendation: 'skip',
      reason: 'You already have this relic',
      synergies: [],
      antiSynergies: [],
    };
  }

  // Relic-specific evaluations
  const relicId = relic.id;

  // ===== STARTER RELICS =====
  if (relicId === 'burning_blood') {
    if (deckAnalysis.avgDeckHP < 60) {
      rating += 1;
      synergies.push('Low HP builds benefit from healing');
    }
  }

  // ===== ENERGY RELICS =====
  if (relicId === 'lantern' || relicId === 'happy_flower' || relicId === 'ice_cream') {
    rating += 2;
    recommendation = 'must-take';
    synergies.push('Energy is always valuable');
  }

  // ===== CARD DRAW RELICS =====
  if (relicId === 'snecko_eye') {
    if (deckAnalysis.avgCost >= 1.5) {
      rating += 2;
      recommendation = 'must-take';
      synergies.push(`High cost deck (avg: ${deckAnalysis.avgCost.toFixed(1)} energy)`);
    } else {
      rating -= 1;
      antiSynergies.push('Works best with expensive cards');
    }
  }

  // ===== ATTACK-FOCUSED RELICS =====
  if (relicId === 'pen_nib') {
    if (deckAnalysis.attackCount >= 8) {
      rating += 1;
      synergies.push(`${deckAnalysis.attackCount} attacks in deck`);
    }
  }

  if (relicId === 'ornamental_fan') {
    if (deckAnalysis.attackCount >= 10) {
      rating += 1;
      synergies.push(`Block generation for attack-heavy deck`);
    }
  }

  // ===== SKILL-FOCUSED RELICS =====
  if (relicId === 'kunai' || relicId === 'shuriken' || relicId === 'ninja_scroll') {
    if (character === 'silent' || deckAnalysis.cardPlayCount >= 12) {
      rating += 1;
      synergies.push('Works well with card spam strategies');
    }
  }

  if (relicId === 'bird_faced_urn') {
    if (deckAnalysis.powerCount >= 3) {
      rating += 1;
      synergies.push(`${deckAnalysis.powerCount} powers in deck`);
    } else {
      rating -= 1;
      antiSynergies.push('Requires powers to trigger');
    }
  }

  // ===== POWER-FOCUSED RELICS =====
  if (relicId === 'inserter' || relicId === 'cable_car') {
    if (character === 'defect') {
      rating += 1;
      synergies.push('Orb synergy for Defect');
    }
  }

  // ===== POTION RELICS =====
  if (relicId === 'potion_belt' || relicId === 'white_beast_statue') {
    if (currentRelics.some(r => r.id === 'potion_belt' || r.id === 'white_beast_statue')) {
      rating += 1;
      synergies.push('Stacks with other potion slot relics');
    }
  }

  // ===== HEALING RELICS =====
  if (relicId === 'bloody_idol' || relicId === 'magic_flower' || relicId === 'meat_on_the_bone') {
    if (deckAnalysis.avgDeckHP < 70) {
      rating += 1;
      synergies.push('Good for sustain in longer runs');
    }
  }

  // ===== EXHAUST SYNERGIES =====
  if (relicId === 'strange_spoon' || relicId === 'dead_branch' || relicId === 'dark_embrace') {
    const exhaustCards = deckAnalysis.cardIds.filter(id =>
      id.includes('offering') || id.includes('corruption') || id.includes('fiend_fire') ||
      id.includes('true_grit') || id.includes('second_wind') || id.includes('burning_pact')
    ).length;

    if (exhaustCards >= 3) {
      rating += 2;
      recommendation = 'must-take';
      synergies.push(`${exhaustCards} exhaust cards in deck`);
    } else if (exhaustCards >= 1) {
      rating += 1;
      synergies.push('Some exhaust synergy');
    }
  }

  // ===== DISCARD SYNERGIES =====
  if (relicId === 'tough_bandages' || relicId === 'gambling_chip') {
    const discardCards = deckAnalysis.cardIds.filter(id =>
      id.includes('acrobatics') || id.includes('calculated_gamble') || id.includes('storm_of_steel')
    ).length;

    if (discardCards >= 2) {
      rating += 1;
      synergies.push(`${discardCards} discard cards in deck`);
    }
  }

  // ===== CURSE/STATUS SYNERGIES =====
  if (relicId === 'blue_candle' || relicId === 'medical_kit' || relicId === 'darkstone_periapt') {
    if (deckAnalysis.curseCount >= 3 || deckAnalysis.statusCount >= 3) {
      rating += 1;
      synergies.push('Helps mitigate curses/statuses');
    }
  }

  // Determine recommendation based on rating
  if (rating >= 5) {
    recommendation = 'must-take';
  } else if (rating >= 3.5) {
    recommendation = 'good-take';
  } else if (rating >= 2.5) {
    recommendation = 'situational';
  } else {
    recommendation = 'skip';
  }

  // Generate reason
  const reason = generateRecommendationReason(relic, rating, synergies, antiSynergies, recommendation);

  return {
    relic,
    rating: Math.min(5, Math.max(1, rating)),
    recommendation,
    reason,
    synergies,
    antiSynergies,
  };
}


function generateRecommendationReason(
  relic: Relic,
  rating: number,
  synergies: string[],
  antiSynergies: string[],
  recommendation: RelicEvaluation['recommendation']
): string {
  if (synergies.length > 0) {
    return `${synergies[0]}. ${relic.description.split('.')[0]}.`;
  }

  if (antiSynergies.length > 0) {
    return `${antiSynergies[0]}.`;
  }

  switch (recommendation) {
    case 'must-take':
      return `Extremely powerful relic (${rating.toFixed(1)}/5 rating). ${relic.description.split('.')[0]}.`;
    case 'good-take':
      return `Solid choice (${rating.toFixed(1)}/5 rating). ${relic.description.split('.')[0]}.`;
    case 'situational':
      return `Decent but situational (${rating.toFixed(1)}/5 rating). ${relic.description.split('.')[0]}.`;
    default:
      return `Not recommended for your current deck (${rating.toFixed(1)}/5 rating).`;
  }
}

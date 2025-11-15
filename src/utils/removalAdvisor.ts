import type { Card, CharacterType, Relic } from '../types';
import { analyzeDeck } from './deckAnalyzer';

export interface RemovalAdvice {
  card: Card;
  priority: number; // 1-10, where 10 = remove this ASAP
  reason: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Cards that CANNOT be removed from your deck
 */
const UNREMOVABLE_CARDS = [
  'ascenders_bane',  // Cannot be removed (Ascension 10+ starting curse)
  'necronomicurse',  // Cannot be removed (spawns copies)
];

/**
 * Generate prioritized card removal recommendations
 * Critical for A20 deck thinning strategy
 */
export function generateRemovalPriority(
  deck: Card[],
  relics: Relic[],
  character: CharacterType,
  floor: number,
  gold: number
): RemovalAdvice[] {
  const analysis = analyzeDeck(deck);
  const advice: RemovalAdvice[] = [];

  // Analyze each card in deck for removal priority
  deck.forEach(card => {
    // Skip unremovable cards - don't even include them in recommendations
    if (UNREMOVABLE_CARDS.includes(card.id)) {
      return;
    }

    const priority = calculateRemovalPriority(card, deck, analysis, relics, character, floor);
    const reason = getRemovalReason(card, deck, analysis, relics, character, floor);
    const urgency = getRemovalUrgency(priority);

    advice.push({
      card,
      priority,
      reason,
      urgency
    });
  });

  // Sort by priority (highest first)
  advice.sort((a, b) => b.priority - a.priority);

  return advice;
}

function calculateRemovalPriority(
  card: Card,
  deck: Card[],
  analysis: any,
  relics: Relic[],
  character: CharacterType,
  floor: number
): number {
  let priority = 0;

  // CURSES: Always highest priority
  if (card.type === 'curse') {
    if (card.id === 'ascenders_bane') return 10; // Remove ASAP
    if (card.id === 'clumsy' || card.id === 'parasite') return 9;
    return 8; // Other curses
  }

  // STATUS CARDS: Very high priority
  if (card.type === 'status') {
    if (card.id === 'wound' || card.id === 'dazed') return 8;
    if (card.id === 'burn' || card.id === 'slimed') return 7;
    return 6;
  }

  // BASIC STRIKES: High priority in mid-late game
  if (card.id === 'strike_r' || card.id === 'strike_g' || card.id === 'strike_b' || card.id === 'strike_p') {
    const strikeCount = deck.filter(c => c.id.startsWith('strike_')).length;

    // Early game (floors 1-8): Keep at least 3 strikes for consistency
    if (floor <= 8) {
      if (strikeCount <= 3) return 2;
      return 5; // Remove excess strikes
    }

    // Mid game (floors 9-25): Remove most strikes
    if (floor <= 25) {
      if (strikeCount === 1 && analysis.attackCount < 8) return 3; // Keep last strike if low attacks
      return 7; // Remove strikes
    }

    // Late game (floors 26+): Remove ALL strikes
    return 9;
  }

  // BASIC DEFENDS: Context-dependent
  if (card.id === 'defend_r' || card.id === 'defend_g' || card.id === 'defend_b' || card.id === 'defend_p') {
    const defendCount = deck.filter(c => c.id.startsWith('defend_')).length;

    // Don't over-remove defends - you need some defense
    if (defendCount <= 3 && analysis.blockCards < 6) {
      return 2; // Keep defends if you're defense-poor
    }

    // Early game: Keep defends
    if (floor <= 8) return 3;

    // Mid game: Start removing
    if (floor <= 25) return 6;

    // Late game: Remove if you have better defense
    if (analysis.blockCards >= 8) return 8;
    return 5;
  }

  // BAD UNCOMMON/RARE CARDS: Higher priority than basics if they're truly bad
  if (card.tierRating <= 2 && (card.rarity === 'uncommon' || card.rarity === 'rare')) {
    // Low tier cards that don't fit your archetype
    const fitsArchetype = card.tags.some(tag =>
      analysis.archetypes.some((arch: string) => tag.includes(arch))
    );

    if (!fitsArchetype) {
      return 7; // Remove bad cards that don't fit your build
    }
  }

  // ANTI-SYNERGY CARDS: Cards that actively hurt your deck
  if (card.antiSynergies && card.antiSynergies.length > 0) {
    const hasAntiSynergy = card.antiSynergies.some(antiId =>
      analysis.cardIds.includes(antiId)
    );

    if (hasAntiSynergy) {
      return 6; // Remove cards that conflict with your build
    }
  }

  // DECK BLOAT: If deck is too large, remove mediocre cards
  if (deck.length > 30) {
    if (card.tierRating <= 3) {
      return 5; // Trim deck size with mediocre cards
    }
  }

  // CHARACTER-SPECIFIC REMOVALS
  if (character === 'ironclad') {
    if (card.id === 'bash' && floor > 15 && analysis.cardIds.includes('thunderclap')) {
      return 6; // Bash becomes bad with better vulnerable sources
    }
  }

  if (character === 'silent') {
    if (card.id === 'survivor' && floor > 10) {
      return 5; // Survivor is weak in late game
    }
    if (card.id === 'neutralize' && floor > 20 && analysis.cardIds.includes('leg_sweep')) {
      return 4; // Neutralize redundant with better weak sources
    }
  }

  if (character === 'defect') {
    if (card.id === 'zap' && floor > 15 && analysis.cardIds.includes('ball_lightning')) {
      return 5; // Zap becomes weak
    }
  }

  if (character === 'watcher') {
    // Watcher starter cards are generally better
    if (card.id === 'eruption' || card.id === 'vigilance') {
      return 1; // Keep these
    }
  }

  // RELIC-SPECIFIC CONSIDERATIONS
  const hasPandorasBox = relics.some(r => r.id === 'pandoras_box');
  if (hasPandorasBox) {
    // Already transformed starters, don't prioritize removal as highly
    return Math.max(0, priority - 2);
  }

  // DEFAULT: Low priority
  return priority || 2;
}

function getRemovalReason(
  card: Card,
  deck: Card[],
  analysis: any,
  relics: Relic[],
  character: CharacterType,
  floor: number
): string {
  // CURSES
  if (card.type === 'curse') {
    if (card.id === 'ascenders_bane') {
      return '🚨 CRITICAL: Ascender\'s Bane is pure deck bloat - remove at ANY cost';
    }
    return '⚠️ HIGH PRIORITY: Curses actively hurt your deck, remove ASAP';
  }

  // STATUS CARDS
  if (card.type === 'status') {
    return '⚠️ Status cards dilute your deck and provide no value';
  }

  // STRIKES
  if (card.id.startsWith('strike_')) {
    const strikeCount = deck.filter(c => c.id.startsWith('strike_')).length;

    if (floor <= 8) {
      return `Early game: Keep ${strikeCount} strikes for consistency, but start removing soon`;
    }

    if (floor <= 25) {
      return `Mid game: Strikes are weak, replace with better damage cards (${analysis.attackCount} attacks total)`;
    }

    return '🔥 LATE GAME: Strikes are 6 damage for 1 energy - far below curve, remove immediately';
  }

  // DEFENDS
  if (card.id.startsWith('defend_')) {
    const defendCount = deck.filter(c => c.id.startsWith('defend_')).length;

    if (defendCount <= 3 && analysis.blockCards < 6) {
      return `⚠️ Low priority: Only ${analysis.blockCards} block cards, keep some defends`;
    }

    if (analysis.blockCards >= 8) {
      return `Defense covered: ${analysis.blockCards} block cards means defends are redundant`;
    }

    return 'Defends are weak (5 block for 1 energy), but better than nothing';
  }

  // LOW TIER CARDS
  if (card.tierRating <= 2) {
    const fitsArchetype = card.tags.some(tag =>
      analysis.archetypes.some((arch: string) => tag.includes(arch))
    );

    if (!fitsArchetype) {
      return `Tier ${card.tierRating}/5 card that doesn't fit your ${analysis.archetypes.join(', ')} build`;
    }

    return `Low tier card (${card.tierRating}/5) - consider removing for deck efficiency`;
  }

  // ANTI-SYNERGIES
  if (card.antiSynergies && card.antiSynergies.length > 0) {
    const conflicts = card.antiSynergies.filter(antiId =>
      analysis.cardIds.includes(antiId)
    );

    if (conflicts.length > 0) {
      return `⚠️ CONFLICT: This card anti-synergizes with ${conflicts.length} cards in your deck`;
    }
  }

  // DECK BLOAT
  if (deck.length > 30) {
    if (card.tierRating <= 3) {
      return `Deck bloat: ${deck.length} cards is too many, remove mediocre cards`;
    }
  }

  // CHARACTER SPECIFIC
  if (character === 'ironclad' && card.id === 'bash') {
    if (analysis.cardIds.includes('thunderclap') || analysis.cardIds.includes('uppercut')) {
      return 'Bash is weak late game when you have better vulnerable sources';
    }
  }

  if (character === 'silent' && card.id === 'survivor') {
    if (floor > 10) {
      return 'Survivor is a weak defensive card - replace with better block';
    }
  }

  if (character === 'defect' && card.id === 'zap') {
    if (floor > 15) {
      return 'Zap becomes weak in late game - replace with better lightning generation';
    }
  }

  return 'Low priority removal - keep if nothing better to remove';
}

function getRemovalUrgency(priority: number): 'critical' | 'high' | 'medium' | 'low' {
  if (priority >= 9) return 'critical';
  if (priority >= 7) return 'high';
  if (priority >= 5) return 'medium';
  return 'low';
}

/**
 * Calculate optimal gold spending for removal vs other purchases
 */
export function shouldRemoveAtShop(
  deck: Card[],
  gold: number,
  floor: number,
  removalCost: number = 75
): {
  recommend: boolean;
  reason: string;
  alternativeUse?: string;
} {
  const topRemovals = generateRemovalPriority(deck, [], 'ironclad', floor, gold);
  const highestPriority = topRemovals[0];

  // Always remove curses if you can afford it
  if (highestPriority?.urgency === 'critical' && gold >= removalCost) {
    return {
      recommend: true,
      reason: `${highestPriority.card.name}: ${highestPriority.reason}`
    };
  }

  // High priority removals worth the gold
  if (highestPriority?.urgency === 'high' && gold >= removalCost) {
    if (gold >= 200) {
      return {
        recommend: true,
        reason: `Remove ${highestPriority.card.name}, you have enough gold for other purchases too`
      };
    }

    return {
      recommend: true,
      reason: `${highestPriority.card.name} - ${highestPriority.reason}`,
      alternativeUse: 'Consider if a key card/relic is available for 150-200g'
    };
  }

  // Medium priority - only if you have spare gold
  if (highestPriority?.urgency === 'medium' && gold >= 250) {
    return {
      recommend: true,
      reason: `You have spare gold (${gold}g) - remove ${highestPriority.card.name}`,
      alternativeUse: 'Only if no critical purchases available'
    };
  }

  // Don't remove if gold is tight
  return {
    recommend: false,
    reason: 'Save gold for cards/relics unless urgent removal needed',
    alternativeUse: 'Removal is a luxury - prioritize build-enabling cards and relics'
  };
}

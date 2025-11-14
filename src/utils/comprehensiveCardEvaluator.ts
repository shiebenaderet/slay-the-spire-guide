/**
 * Comprehensive Card Evaluator
 * Uses tags and card metadata to evaluate all 352 cards intelligently
 */

import cardsData from '../data/cards.json';

interface CardData {
  id: string;
  name: string;
  character: string;
  rarity: string;
  type: string;
  cost: number;
  upgraded: boolean;
  description: string;
  tier?: string;
  tierRating: number;
  synergies: string[];
  antiSynergies: string[];
  tags: string[];
}

const cards: CardData[] = cardsData as CardData[];

// Create lookup maps
const cardsByName = new Map<string, CardData>();
cards.forEach(card => {
  cardsByName.set(card.name.toLowerCase(), card);
  if (card.upgraded) {
    cardsByName.set((card.name + '+').toLowerCase(), card);
  }
});

export function getCardData(cardName: string): CardData | null {
  return cardsByName.get(cardName.toLowerCase()) || null;
}

export function hasTag(cardName: string, tag: string): boolean {
  const card = getCardData(cardName);
  return card ? card.tags.includes(tag) : false;
}

export function hasTags(cardName: string, tags: string[]): boolean {
  const card = getCardData(cardName);
  if (!card) return false;
  return tags.every(tag => card.tags.includes(tag));
}

export function hasAnyTag(cardName: string, tags: string[]): boolean {
  const card = getCardData(cardName);
  if (!card) return false;
  return tags.some(tag => card.tags.includes(tag));
}

// Card categorization using tags
export function isFrontloadDamageCard(cardName: string): boolean {
  const card = getCardData(cardName);
  if (!card) return false;

  // High damage attacks
  if (card.type === 'attack' && card.tierRating >= 4) return true;

  // Specific tags
  if (hasTag(cardName, 'damage') && !hasTag(cardName, 'scaling')) return true;

  // Big damage cards
  const bigDamage = ['carnage', 'immolate', 'bludgeon', 'glass knife', 'sunder', 'ragnarok',
    'hyperbeam', 'ball lightning', 'meteor strike', 'whirlwind', 'sword boomerang'];
  return bigDamage.some(c => cardName.toLowerCase().includes(c));
}

export function isScalingDamageCard(cardName: string): boolean {
  const card = getCardData(cardName);
  if (!card) return false;

  // Powers that scale damage
  if (card.type === 'power' && hasAnyTag(cardName, ['scaling', 'strength', 'focus', 'wrath'])) {
    return true;
  }

  // Poison (scaling DOT)
  if (hasTag(cardName, 'poison')) return true;

  // Specific scaling effects
  const scaling = ['demon form', 'inflame', 'limit break', 'spot weakness', 'defragment',
    'loop', 'noxious fumes', 'catalyst', 'envenom', 'wreath of flame'];
  return scaling.some(c => cardName.toLowerCase().includes(c));
}

export function isAOECard(cardName: string): boolean {
  return hasTag(cardName, 'aoe');
}

export function isMitigationCard(cardName: string): boolean {
  const card = getCardData(cardName);
  if (!card) return false;

  // Block cards
  if (hasTag(cardName, 'block')) return true;

  // Defensive powers
  if (card.type === 'power' && hasAnyTag(cardName, ['block-scaling', 'defense'])) return true;

  // Weak/vulnerable (mitigation through debuffs)
  if (hasTag(cardName, 'weak')) return true;

  return false;
}

export function isScalingMitigationCard(cardName: string): boolean {
  const card = getCardData(cardName);
  if (!card) return false;

  // Scaling block/defense
  const scalingDefense = ['footwork', 'barricade', 'calipers', 'after image',
    'talk to the hand', 'mental fortress', 'like water'];
  return scalingDefense.some(c => cardName.toLowerCase().includes(c));
}

export function isCardManipulationCard(cardName: string): boolean {
  return hasAnyTag(cardName, ['draw', 'discard', 'exhaust', 'retain', 'innate', 'scry']);
}

export function isRemovalPriority(cardName: string, floor: number): 'critical' | 'high' | 'medium' | 'low' | 'never' {
  const card = getCardData(cardName);
  if (!card) return 'never';

  // Curses are always top priority
  if (card.type === 'curse') return 'critical';

  // Strikes/Defends (context-dependent)
  const isStrike = cardName.toLowerCase().includes('strike') && !cardName.includes('+');
  const isDefend = cardName.toLowerCase().includes('defend') && !cardName.includes('+');

  if (floor <= 5) {
    // Early game: don't remove yet
    if (isStrike || isDefend) return 'low';
  } else if (floor <= 20) {
    // Mid game: remove if deck is shaping up
    if (isStrike) return 'medium';
    if (isDefend) return 'low';
  } else {
    // Late game: definitely remove
    if (isStrike) return 'high';
    if (isDefend) return 'medium';
  }

  // Status cards
  if (card.type === 'status') return 'high';

  // Low-value cards
  if (card.tierRating === 1) return 'medium';

  return 'low';
}

// Evaluate card against specific encounters
export function evaluateForNob(cardName: string): { score: number; reason: string } {
  const card = getCardData(cardName);
  if (!card) return { score: 0, reason: 'Unknown card' };

  // Nob punishes skills (except Neutralize which is manageable)
  if (card.type === 'skill' && !cardName.toLowerCase().includes('neutralize')) {
    return { score: -1, reason: 'Skill - Nob gains strength when you play skills' };
  }

  // High frontload damage is great
  if (isFrontloadDamageCard(cardName) && card.tierRating >= 4) {
    return { score: 3, reason: 'High damage - kills Nob in 3-4 turns' };
  }

  if (isFrontloadDamageCard(cardName) && card.tierRating >= 3) {
    return { score: 2, reason: 'Good damage for bursting Nob down' };
  }

  return { score: 0, reason: 'Doesn\'t significantly help with Nob' };
}

export function evaluateForLagavulin(cardName: string): { score: number; reason: string } {
  const card = getCardData(cardName);
  if (!card) return { score: 0, reason: 'Unknown card' };

  // High damage to kill before debuffs
  if (isFrontloadDamageCard(cardName) && card.tierRating >= 4) {
    return { score: 3, reason: 'High damage - kill before debuffs hit' };
  }

  // Powers that can be set up during sleep
  if (card.type === 'power' && isScalingDamageCard(cardName)) {
    return { score: 2, reason: 'Can set up during 3-turn sleep' };
  }

  if (isFrontloadDamageCard(cardName)) {
    return { score: 1, reason: 'Helps kill before debuffs' };
  }

  return { score: 0, reason: 'Not enough burst' };
}

export function evaluateForSentries(cardName: string): { score: number; reason: string } {
  // AOE or high single-target to kill quickly
  if (isAOECard(cardName)) {
    return { score: 3, reason: 'AOE - kills all Sentries quickly' };
  }

  if (isFrontloadDamageCard(cardName)) {
    return { score: 2, reason: 'Fast damage - kills Sentries one by one' };
  }

  return { score: 0, reason: 'Not enough burst to kill quickly' };
}

export function evaluateForSlavers(cardName: string): { score: number; reason: string } {
  // Need burst or heavy block for turn 1-2
  if (isFrontloadDamageCard(cardName)) {
    const card = getCardData(cardName);
    if (card && card.tierRating >= 4) {
      return { score: 3, reason: 'Burst down Red Slaver fast' };
    }
    return { score: 2, reason: 'Good damage for Slavers' };
  }

  if (isMitigationCard(cardName)) {
    const card = getCardData(cardName);
    if (card && card.tierRating >= 3) {
      return { score: 2, reason: 'Block heavy Turn 1-2 damage' };
    }
  }

  return { score: 0, reason: 'Need burst damage or heavy block' };
}

export function evaluateForGremlinLeader(cardName: string, hasAOE: boolean): { score: number; reason: string } {
  if (!hasAOE && isAOECard(cardName)) {
    return { score: 3, reason: 'AOE - kill minions to prevent Leader attacks' };
  }

  if (isFrontloadDamageCard(cardName)) {
    return { score: 2, reason: 'Burst minions to manipulate AI' };
  }

  return { score: 0, reason: 'Need to control minions' };
}

export function evaluateForBookOfStabbing(cardName: string, hasScaling: boolean): { score: number; reason: string } {
  const cardLower = cardName.toLowerCase();

  // Strength down counters his scaling
  if (cardLower.includes('shockwave') || cardLower.includes('disarm') || cardLower.includes('malaise')) {
    return { score: 3, reason: 'Strength down - counters his scaling' };
  }

  if (!hasScaling && isScalingDamageCard(cardName)) {
    return { score: 2, reason: 'Scaling - kill before shuffle' };
  }

  return { score: 0, reason: 'Need fast scaling or strength down' };
}

export function evaluateForReptomancer(cardName: string, hasAOE: boolean): { score: number; reason: string } {
  if (!hasAOE && isAOECard(cardName)) {
    return { score: 3, reason: '🔥 CRITICAL: AOE for swords - without this, she will kill you' };
  }

  if (isAOECard(cardName)) {
    return { score: 2, reason: 'More AOE helps with swords' };
  }

  return { score: 0, reason: 'Doesn\'t help with Reptomancer' };
}

// Boss evaluations
export function evaluateForActBoss(cardName: string, boss: string, act: number): { score: number; reason: string } {
  const bossLower = boss.toLowerCase();

  if (act === 1) {
    if (bossLower.includes('hexaghost')) {
      if (isScalingDamageCard(cardName)) {
        return { score: 2, reason: 'Scaling damage for 250 HP pool' };
      }
    }
    if (bossLower.includes('slime')) {
      if (isAOECard(cardName) || isFrontloadDamageCard(cardName)) {
        return { score: 2, reason: 'Good for splitting slime efficiently' };
      }
    }
    if (bossLower.includes('guardian')) {
      if (isMitigationCard(cardName)) {
        return { score: 2, reason: 'Block during shell phase' };
      }
    }
  }

  if (act === 2) {
    // All Act 2 bosses need scaling
    if (isScalingDamageCard(cardName)) {
      return { score: 2, reason: 'Scaling needed for 350+ damage' };
    }
  }

  if (act === 3) {
    if (isMitigationCard(cardName) || isScalingMitigationCard(cardName)) {
      return { score: 2, reason: 'Mitigation for long Act 3 fights' };
    }
    if (isScalingDamageCard(cardName)) {
      return { score: 1, reason: 'Sustained damage for Act 3' };
    }
  }

  return { score: 0, reason: 'Doesn\'t significantly help with boss' };
}

/**
 * Card Recommendation Engine
 * Based on A20 strategy guides emphasizing:
 * - Solve immediate problems first (they snowball)
 * - 5-point checklist: Elites (3pts), Boss (1pt), Synergy (1pt)
 * - Act-specific priorities
 */

import {
  getCardData,
  hasTag,
  hasAnyTag,
  isFrontloadDamageCard,
  isScalingDamageCard,
  isAOECard,
  isMitigationCard,
  isScalingMitigationCard,
  evaluateForNob,
  evaluateForLagavulin,
  evaluateForSentries,
  evaluateForSlavers,
  evaluateForGremlinLeader,
  evaluateForBookOfStabbing,
  evaluateForReptomancer,
  evaluateForActBoss,
} from './comprehensiveCardEvaluator';

interface CardEvaluation {
  card: string;
  score: number; // 0-5 using the checklist
  breakdown: {
    elitePoints: number; // 0-3
    bossPoints: number; // 0-1
    synergyPoints: number; // 0-1
  };
  recommendation: 'must-pick' | 'strong-pick' | 'consider' | 'skip';
  reasoning: string[];
  synergies: Array<{ with: string; explanation: string }>;
  antiSynergies: Array<{ with: string; explanation: string }>;
  warnings: string[];
}

interface DeckContext {
  character: string;
  act: number; // 1, 2, 3
  floor: number;
  deck: string[];
  relics: string[];
  currentHP: number;
  maxHP: number;
  gold: number;
  ascension: number;
  upcomingElites: number; // Elites left in this act
  upcomingBoss: string; // Boss name for this act
}

export function evaluateCardPick(
  cardsOffered: string[],
  context: DeckContext
): CardEvaluation[] {
  return cardsOffered.map(card => evaluateCard(card, context));
}

function evaluateCard(card: string, context: DeckContext): CardEvaluation {
  const act = context.act;
  const deck = context.deck;
  const relics = context.relics;
  const character = context.character.toLowerCase();

  let elitePoints = 0;
  let bossPoints = 0;
  let synergyPoints = 0;

  const reasoning: string[] = [];
  const synergies: Array<{ with: string; explanation: string }> = [];
  const antiSynergies: Array<{ with: string; explanation: string }> = [];
  const warnings: string[] = [];

  // Normalize card name
  const cardLower = card.toLowerCase();

  // Act 1: Priority is FRONT-LOADED DAMAGE for elites
  if (act === 1) {
    // Check if we already have enough damage
    const hasFrontLoadedDamage = checkHasSufficientDamage(deck, 'frontload');

    // Evaluate against Act 1 elites using comprehensive evaluator
    const nob = evaluateForNob(card);
    const laga = evaluateForLagavulin(card);
    const sentries = evaluateForSentries(card);

    if (nob.score > 0) {
      elitePoints += 1;
      reasoning.push(`✓ Gremlin Nob: ${nob.reason}`);
    } else if (nob.score < 0) {
      warnings.push(`⚠️ ${nob.reason}`);
    }

    if (laga.score > 0) {
      elitePoints += 1;
      reasoning.push(`✓ Lagavulin: ${laga.reason}`);
    }

    if (sentries.score > 0) {
      elitePoints += 1;
      reasoning.push(`✓ Sentries: ${sentries.reason}`);
    }

    // Evaluate against Act 1 boss
    const boss = evaluateForActBoss(card, context.upcomingBoss, 1);
    if (boss.score > 0) {
      bossPoints = 1;
      reasoning.push(`✓ ${context.upcomingBoss}: ${boss.reason}`);
    }

    // Check if we already solved the damage problem
    if (hasFrontLoadedDamage && elitePoints > 0) {
      reasoning.push('⚠️ You already have good front-loaded damage. Consider focusing on other needs unless this is exceptional.');
    }
  }

  // Act 2: Priority is AOE + Scaling + Mitigation
  if (act === 2) {
    const hasAOE = checkHasAOE(deck, relics);
    const hasScaling = checkHasScaling(deck, relics);
    const hasMitigation = checkHasMitigation(deck);

    // Evaluate against Act 2 elites using comprehensive evaluator
    const slavers = evaluateForSlavers(card);
    const leader = evaluateForGremlinLeader(card, hasAOE);
    const book = evaluateForBookOfStabbing(card, hasScaling);

    if (slavers.score > 0) {
      elitePoints += 1;
      reasoning.push(`✓ Three Slavers: ${slavers.reason}`);
    }
    if (leader.score > 0) {
      elitePoints += 1;
      reasoning.push(`✓ Gremlin Leader: ${leader.reason}`);
    }
    if (book.score > 0) {
      elitePoints += 1;
      reasoning.push(`✓ Book of Stabbing: ${book.reason}`);
    }

    // Act 2 boss check (needs scaling for 350+ damage)
    const boss = evaluateForActBoss(card, context.upcomingBoss, 2);
    if (boss.score > 0) {
      bossPoints = 1;
      reasoning.push(`✓ ${context.upcomingBoss}: ${boss.reason}`);
    }

    // Priority warnings
    if (!hasAOE && isAOECard(card)) {
      reasoning.push('🔥 PRIORITY: You need AOE for multi-enemy fights!');
    }
    if (!hasScaling && isScalingDamageCard(card)) {
      reasoning.push('🔥 PRIORITY: You need scaling for the boss!');
    }
  }

  // Act 3: Priority is MITIGATION for long fights
  if (act === 3) {
    const hasSufficientMitigation = checkHasSufficientMitigation(deck, relics);

    // Reptomancer check (life or death)
    const hasAOE = checkHasAOE(deck, relics);
    const reptomancer = evaluateForReptomancer(card, hasAOE);
    if (reptomancer.score > 0) {
      if (!hasAOE) {
        reasoning.push('🔥 CRITICAL: ' + reptomancer.reason);
        elitePoints = 3; // Override - this is life or death
      } else {
        elitePoints += 1;
        reasoning.push('✓ Reptomancer: ' + reptomancer.reason);
      }
    }

    // Act 3 mitigation needs
    if (isMitigationCard(card) || isScalingMitigationCard(card)) {
      elitePoints += 1;
      reasoning.push('✓ Mitigation for long Act 3 fights');
    }

    // Act 3 boss
    const boss = evaluateForActBoss(card, context.upcomingBoss, 3);
    if (boss.score > 0) {
      bossPoints = 1;
      reasoning.push(`✓ ${context.upcomingBoss}: ${boss.reason}`);
    }

    // Mitigation priority
    if (!hasSufficientMitigation && isMitigationCard(card)) {
      reasoning.push('🔥 PRIORITY: You need more mitigation for long fights!');
    }
  }

  // Synergy evaluation (works with current deck/relics)
  const synergyResult = evaluateSynergies(card, deck, relics, character);
  if (synergyResult.score > 0) {
    synergyPoints = 1;
    synergies.push(...synergyResult.synergies);

    if (synergies.length > 0) {
      reasoning.push(`✓ Synergy: ${synergies.map(s => s.with).join(', ')}`);
    }
  }

  // Anti-synergies
  const antiSynergyResult = evaluateAntiSynergies(card, deck, relics, character);
  antiSynergies.push(...antiSynergyResult);
  if (antiSynergies.length > 0) {
    warnings.push(`⚠️ Anti-synergy: ${antiSynergies.map(a => a.with).join(', ')}`);
  }

  // Calculate total score
  const score = elitePoints + bossPoints + synergyPoints;

  // Determine recommendation
  let recommendation: 'must-pick' | 'strong-pick' | 'consider' | 'skip';
  if (score >= 4) {
    recommendation = 'must-pick';
  } else if (score === 3) {
    recommendation = 'strong-pick';
  } else if (score >= 2) {
    recommendation = 'consider';
  } else {
    recommendation = 'skip';
  }

  // Override for cards that are actively bad
  if (isActiveBad(card, context)) {
    recommendation = 'skip';
    warnings.push('🚫 This card actively hurts your deck right now.');
  }

  return {
    card,
    score,
    breakdown: { elitePoints, bossPoints, synergyPoints },
    recommendation,
    reasoning,
    synergies,
    antiSynergies,
    warnings,
  };
}


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function checkHasSufficientDamage(deck: string[], type: 'frontload' | 'scaling'): boolean {
  if (type === 'frontload') {
    const count = deck.filter(c => isFrontloadDamageCard(c)).length;
    return count >= 2;
  } else {
    return deck.some(c => isScalingDamageCard(c));
  }
}

function checkHasAOE(deck: string[], relics: string[]): boolean {
  return deck.some(c => isAOECard(c)) || relics.some(r => r.toLowerCase().includes('gremlin horn'));
}

function checkHasScaling(deck: string[], relics: string[]): boolean {
  return deck.some(c => isScalingDamageCard(c));
}

function checkHasMitigation(deck: string[]): boolean {
  return deck.filter(c => isMitigationCard(c)).length >= 5;
}

function checkHasSufficientMitigation(deck: string[], relics: string[]): boolean {
  const blockCount = deck.filter(c => isMitigationCard(c)).length;
  const hasScaling = deck.some(c => isScalingMitigationCard(c));
  return blockCount >= 8 || hasScaling;
}

function evaluateSynergies(card: string, deck: string[], relics: string[], character: string): { score: number; synergies: Array<{ with: string; explanation: string }> } {
  const synergies: Array<{ with: string; explanation: string }> = [];
  const cardData = getCardData(card);
  if (!cardData) return { score: 0, synergies: [] };

  // Use tags-based synergy detection
  const cardLower = card.toLowerCase();

  // Ironclad synergies
  if (character.toLowerCase() === 'ironclad') {
    if (cardLower.includes('hemokinesis') && relics.includes('Burning Blood')) {
      synergies.push({ with: 'Burning Blood', explanation: 'Burning Blood heals back the HP cost' });
    }
    if (cardLower.includes('hemokinesis') && deck.some(c => c.toLowerCase().includes('bash'))) {
      synergies.push({ with: 'Bash', explanation: 'Bash applies Vulnerable, Hemokinesis deals huge damage' });
    }
    if (cardLower.includes('spot weakness') && deck.some(c => c.toLowerCase().includes('bash'))) {
      synergies.push({ with: 'Bash', explanation: 'Both apply/use Vulnerable for strength scaling' });
    }
    if (cardLower.includes('limit break') && deck.some(c => c.toLowerCase().includes('demon form') || c.toLowerCase().includes('inflame'))) {
      synergies.push({ with: 'Strength powers', explanation: 'Limit Break doubles your strength scaling' });
    }
  }

  // Silent synergies
  if (character.toLowerCase() === 'silent') {
    if (cardLower.includes('footwork') && deck.some(c => c.toLowerCase().includes('dodge'))) {
      synergies.push({ with: 'Dodge and Roll', explanation: 'Footwork scales your block from Dodge' });
    }
    if (cardLower.includes('catalyst') && deck.some(c => hasTag(c, 'poison'))) {
      synergies.push({ with: 'Poison cards', explanation: 'Catalyst doubles/triples your poison damage' });
    }
    if (hasTag(card, 'poison') && deck.some(c => c.toLowerCase().includes('catalyst'))) {
      synergies.push({ with: 'Catalyst', explanation: 'Poison scales with Catalyst' });
    }
  }

  // Defect synergies
  if (character.toLowerCase() === 'defect') {
    if (cardLower.includes('defragment') && deck.some(c => hasAnyTag(c, ['orb', 'frost', 'lightning']))) {
      synergies.push({ with: 'Orb cards', explanation: 'Defragment increases all orb effectiveness' });
    }
    if (cardLower.includes('electrodynamics') && deck.some(c => hasTag(c, 'lightning'))) {
      synergies.push({ with: 'Lightning orbs', explanation: 'Electrodynamics makes Lightning hit all enemies' });
    }
  }

  // Watcher synergies
  if (character.toLowerCase() === 'watcher') {
    if (hasTag(card, 'wrath') && deck.some(c => hasTag(c, 'calm'))) {
      synergies.push({ with: 'Stance cards', explanation: 'Wrath/Calm cycling for damage and energy' });
    }
  }

  // Universal synergies
  if (cardData.synergies.length > 0) {
    cardData.synergies.forEach(synergyId => {
      const synergyCard = deck.find(c => c.toLowerCase().includes(synergyId.replace('_', ' ')));
      if (synergyCard) {
        synergies.push({ with: synergyCard, explanation: 'Listed synergy in card data' });
      }
    });
  }

  return {
    score: synergies.length > 0 ? 1 : 0,
    synergies,
  };
}

function evaluateAntiSynergies(card: string, deck: string[], relics: string[], character: string): Array<{ with: string; explanation: string }> {
  const antiSynergies: Array<{ with: string; explanation: string }> = [];
  const cardData = getCardData(card);
  if (!cardData) return [];

  // Too many of the same type
  if (cardData.name.toLowerCase().includes('strike') && deck.filter(c => c.toLowerCase().includes('strike')).length >= 5) {
    antiSynergies.push({ with: 'Strikes', explanation: 'Already have too many Strikes - they dilute your deck' });
  }

  // Check listed anti-synergies
  if (cardData.antiSynergies.length > 0) {
    cardData.antiSynergies.forEach(antiId => {
      const antiCard = deck.find(c => c.toLowerCase().includes(antiId.replace('_', ' ')));
      if (antiCard) {
        antiSynergies.push({ with: antiCard, explanation: 'Listed anti-synergy' });
      }
    });
  }

  return antiSynergies;
}

function isActiveBad(card: string, context: DeckContext): boolean {
  const cardData = getCardData(card);
  if (!cardData) return false;

  // Cards that are bad early
  if (context.act === 1 && context.floor <= 5) {
    const badEarly = ['barricade', 'creative ai', 'nightmare', 'echo form', 'wraith form'];
    if (badEarly.some(c => card.toLowerCase().includes(c))) {
      return true; // Too slow for early Act 1
    }
  }

  return false;
}

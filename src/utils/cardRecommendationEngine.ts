/**
 * Card Recommendation Engine
 * Based on A20 strategy guides emphasizing:
 * - Solve immediate problems first (they snowball)
 * - 5-point checklist: Elites (3pts), Boss (1pt), Synergy (1pt)
 * - Act-specific priorities
 */

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

    // Evaluate against Act 1 elites
    const nob = evaluateAgainstNob(card, deck, character);
    const laga = evaluateAgainstLagavulin(card, deck, character);
    const sentries = evaluateAgainstSentries(card, deck, character);

    if (nob.helps) {
      elitePoints += 1;
      reasoning.push(`✓ Gremlin Nob: ${nob.reason}`);
    }
    if (laga.helps) {
      elitePoints += 1;
      reasoning.push(`✓ Lagavulin: ${laga.reason}`);
    }
    if (sentries.helps) {
      elitePoints += 1;
      reasoning.push(`✓ Sentries: ${sentries.reason}`);
    }

    // Evaluate against Act 1 boss
    const boss = evaluateAgainstAct1Boss(card, context.upcomingBoss, deck, character);
    if (boss.helps) {
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

    // Evaluate against Act 2 elites
    const slavers = evaluateAgainstSlavers(card, deck, character);
    const leader = evaluateAgainstGremlinLeader(card, deck, character, hasAOE);
    const book = evaluateAgainstBookOfStabbing(card, deck, character, hasScaling);

    if (slavers.helps) {
      elitePoints += 1;
      reasoning.push(`✓ Three Slavers: ${slavers.reason}`);
    }
    if (leader.helps) {
      elitePoints += 1;
      reasoning.push(`✓ Gremlin Leader: ${leader.reason}`);
    }
    if (book.helps) {
      elitePoints += 1;
      reasoning.push(`✓ Book of Stabbing: ${book.reason}`);
    }

    // Act 2 boss check (needs scaling for 350+ damage)
    const boss = evaluateAgainstAct2Boss(card, context.upcomingBoss, deck, character);
    if (boss.helps) {
      bossPoints = 1;
      reasoning.push(`✓ ${context.upcomingBoss}: ${boss.reason}`);
    }

    // Priority warnings
    if (!hasAOE && isAOECard(card)) {
      reasoning.push('🔥 PRIORITY: You need AOE for multi-enemy fights!');
    }
    if (!hasScaling && isScalingDamage(card)) {
      reasoning.push('🔥 PRIORITY: You need scaling for the boss!');
    }
  }

  // Act 3: Priority is MITIGATION for long fights
  if (act === 3) {
    const hasSufficientMitigation = checkHasSufficientMitigation(deck, relics);

    // Reptomancer check
    const hasAOE = checkHasAOE(deck, relics);
    if (!hasAOE && isAOECard(card)) {
      reasoning.push('🔥 CRITICAL: Without AOE, Reptomancer will kill you!');
      elitePoints = 3; // Override - this is life or death
    }

    // Act 3 elites (mostly Reptomancer concern)
    if (evaluateForAct3Elites(card, deck, character)) {
      elitePoints += 2;
      reasoning.push('✓ Helps with Act 3 elites');
    }

    // Act 3 boss
    const boss = evaluateAgainstAct3Boss(card, context.upcomingBoss, deck, character);
    if (boss.helps) {
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
// ELITE EVALUATIONS
// ============================================================================

function evaluateAgainstNob(card: string, deck: string[], character: string): { helps: boolean; reason: string } {
  const cardLower = card.toLowerCase();

  // Nob needs: Fast damage, avoid skills
  const isBigDamage = ['carnage', 'immolate', 'glass knife', 'sunder', 'ragnarok', 'bludgeon', 'hyperbeam'].some(c => cardLower.includes(c));
  const isDecentDamage = ['pommel strike', 'sword boomerang', 'blade dance', 'flying knee', 'sweeping beam', 'empty fist', 'hemokinesis'].some(c => cardLower.includes(c));
  const isSkill = cardLower.includes('defend') || ['prepared', 'backflip', 'leap', 'shrug'].some(c => cardLower.includes(c));

  if (isBigDamage) {
    return { helps: true, reason: 'High damage - kills Nob in 3-4 turns' };
  }
  if (isDecentDamage) {
    return { helps: true, reason: 'Good damage for bursting Nob down' };
  }
  if (isSkill && !cardLower.includes('neutralize')) {
    return { helps: false, reason: 'Skill - Nob gains strength when you play skills' };
  }

  return { helps: false, reason: 'Doesn\'t help burst Nob down quickly' };
}

function evaluateAgainstLagavulin(card: string, deck: string[], character: string): { helps: boolean; reason: string } {
  const cardLower = card.toLowerCase();

  // Lagavulin needs: Damage before debuffs hit (turn 4)
  const isBigDamage = ['carnage', 'immolate', 'glass knife', 'sunder', 'hemokinesis', 'bludgeon'].some(c => cardLower.includes(c));
  const isPower = cardLower.includes('demon form') || cardLower.includes('inflame');

  if (isBigDamage) {
    return { helps: true, reason: 'High damage - kill before debuffs hit' };
  }
  if (isPower && cardLower.includes('demon form')) {
    return { helps: true, reason: 'Can set up during 3-turn sleep' };
  }

  return { helps: false, reason: 'Not enough burst to kill before debuffs' };
}

function evaluateAgainstSentries(card: string, deck: string[], character: string): { helps: boolean; reason: string } {
  const cardLower = card.toLowerCase();

  // Sentries need: Fast damage to kill quickly, limit dazes
  const isAOE = ['immolate', 'whirlwind', 'electrodynamics', 'conclude'].some(c => cardLower.includes(c));
  const isBigDamage = ['carnage', 'glass knife', 'sunder'].some(c => cardLower.includes(c));

  if (isAOE) {
    return { helps: true, reason: 'AOE - kills all Sentries quickly' };
  }
  if (isBigDamage) {
    return { helps: true, reason: 'Fast damage - kills Sentries one by one' };
  }

  return { helps: false, reason: 'Not enough burst to kill Sentries quickly' };
}

// ============================================================================
// BOSS EVALUATIONS
// ============================================================================

function evaluateAgainstAct1Boss(card: string, boss: string, deck: string[], character: string): { helps: boolean; reason: string } {
  const cardLower = card.toLowerCase();
  const bossLower = boss.toLowerCase();

  if (bossLower.includes('hexaghost')) {
    // Hexaghost needs scaling for high HP
    if (isScalingDamage(card)) {
      return { helps: true, reason: 'Scaling damage for 250 HP' };
    }
  }

  if (bossLower.includes('slime')) {
    // Slime Boss needs big damage + AOE for good split
    if (isAOECard(card) || isBigFrontloadDamage(card)) {
      return { helps: true, reason: 'Good for splitting slime efficiently' };
    }
  }

  if (bossLower.includes('guardian')) {
    // Guardian needs mitigation for shell phase
    if (isMitigationCard(card)) {
      return { helps: true, reason: 'Block during shell phase' };
    }
  }

  return { helps: false, reason: 'Doesn\'t significantly help with this boss' };
}

function evaluateAgainstAct2Boss(card: string, boss: string, deck: string[], character: string): { helps: boolean; reason: string } {
  // All Act 2 bosses need scaling to deal 350+ damage
  if (isScalingDamage(card)) {
    return { helps: true, reason: 'Scaling needed for 350+ damage' };
  }

  return { helps: false, reason: 'Act 2 bosses need scaling damage' };
}

function evaluateAgainstAct3Boss(card: string, boss: string, deck: string[], character: string): { helps: boolean; reason: string } {
  const cardLower = card.toLowerCase();

  // Time Eater: avoid excessive card draw/play
  // Awakened One: powers are okay but trigger multi-attack
  // Donu/Deca: need high sustained output

  if (isMitigationCard(card)) {
    return { helps: true, reason: 'Mitigation for long Act 3 fights' };
  }

  if (isScalingDamage(card) || isScalingMitigation(card)) {
    return { helps: true, reason: 'Scaling for sustained fights' };
  }

  return { helps: false, reason: 'Doesn\'t help with Act 3 boss requirements' };
}

// ============================================================================
// ACT 2 ELITES
// ============================================================================

function evaluateAgainstSlavers(card: string, deck: string[], character: string): { helps: boolean; reason: string } {
  // Need to burst Red Slaver (50+ damage) or block 40
  if (isBigFrontloadDamage(card)) {
    return { helps: true, reason: 'Burst down Red Slaver fast' };
  }
  if (isBigFrontloadBlock(card)) {
    return { helps: true, reason: 'Block heavy Turn 1-2 damage' };
  }

  return { helps: false, reason: 'Need burst damage or heavy block' };
}

function evaluateAgainstGremlinLeader(card: string, deck: string[], character: string, hasAOE: boolean): { helps: boolean; reason: string } {
  if (!hasAOE && isAOECard(card)) {
    return { helps: true, reason: 'AOE - kill minions to prevent Leader attacks' };
  }

  if (isBurstDamage(card)) {
    return { helps: true, reason: 'Burst minions to manipulate AI' };
  }

  return { helps: false, reason: 'Need to control minions' };
}

function evaluateAgainstBookOfStabbing(card: string, deck: string[], character: string, hasScaling: boolean): { helps: boolean; reason: string } {
  const cardLower = card.toLowerCase();

  // Book needs fast scaling or strength down
  if (cardLower.includes('shockwave') || cardLower.includes('disarm') || cardLower.includes('malaise')) {
    return { helps: true, reason: 'Strength down - counters his scaling' };
  }

  if (!hasScaling && isScalingDamage(card)) {
    return { helps: true, reason: 'Scaling - kill before shuffle' };
  }

  return { helps: false, reason: 'Need fast scaling or strength down' };
}

// ============================================================================
// ACT 3
// ============================================================================

function evaluateForAct3Elites(card: string, deck: string[], character: string): boolean {
  // Reptomancer is the main concern
  if (isAOECard(card)) {
    return true; // AOE for swords
  }

  if (isMitigationCard(card)) {
    return true; // Survive the onslaught
  }

  return false;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isAOECard(card: string): boolean {
  const cardLower = card.toLowerCase();
  return ['immolate', 'whirlwind', 'electrodynamics', 'conclude', 'corpse explosion', 'bouncing flask'].some(c => cardLower.includes(c));
}

function isBigFrontloadDamage(card: string): boolean {
  const cardLower = card.toLowerCase();
  return ['carnage', 'immolate', 'glass knife', 'sunder', 'ragnarok', 'bludgeon', 'hemokinesis'].some(c => cardLower.includes(c));
}

function isBigFrontloadBlock(card: string): boolean {
  const cardLower = card.toLowerCase();
  return ['impervious', 'entrench', 'reinforced body'].some(c => cardLower.includes(c));
}

function isBurstDamage(card: string): boolean {
  return isBigFrontloadDamage(card);
}

function isScalingDamage(card: string): boolean {
  const cardLower = card.toLowerCase();
  return [
    'demon form', 'inflame', 'limit break', 'spot weakness', // Strength
    'noxious fumes', 'catalyst', 'bouncing flask', 'poison', // Poison
    'defragment', 'loop', 'electrodynamics', // Orbs
    'devotion', 'master reality', 'wrath' // Watcher
  ].some(c => cardLower.includes(c)) || cardLower.includes('vulnerable');
}

function isScalingMitigation(card: string): boolean {
  const cardLower = card.toLowerCase();
  return [
    'barricade', 'calipers', // Block retention
    'footwork', 'after image', // Dex scaling
    'frost orb', 'defragment', // Frost orbs
    'talk to the hand', 'wallop' // Watcher
  ].some(c => cardLower.includes(c)) || cardLower.includes('weak');
}

function isMitigationCard(card: string): boolean {
  const cardLower = card.toLowerCase();
  return cardLower.includes('defend') ||
    cardLower.includes('block') ||
    isScalingMitigation(card) ||
    ['dodge and roll', 'leap', 'blur', 'backflip'].some(c => cardLower.includes(c));
}

function checkHasSufficientDamage(deck: string[], type: 'frontload' | 'scaling'): boolean {
  if (type === 'frontload') {
    const count = deck.filter(c => isBigFrontloadDamage(c)).length;
    return count >= 2;
  } else {
    return deck.some(c => isScalingDamage(c));
  }
}

function checkHasAOE(deck: string[], relics: string[]): boolean {
  return deck.some(c => isAOECard(c)) || relics.some(r => r.toLowerCase().includes('gremlin horn'));
}

function checkHasScaling(deck: string[], relics: string[]): boolean {
  return deck.some(c => isScalingDamage(c));
}

function checkHasMitigation(deck: string[]): boolean {
  return deck.filter(c => isMitigationCard(c)).length >= 5;
}

function checkHasSufficientMitigation(deck: string[], relics: string[]): boolean {
  const blockCount = deck.filter(c => isMitigationCard(c)).length;
  const hasScaling = deck.some(c => isScalingMitigation(c));
  return blockCount >= 8 || hasScaling;
}

function evaluateSynergies(card: string, deck: string[], relics: string[], character: string): { score: number; synergies: Array<{ with: string; explanation: string }> } {
  const synergies: Array<{ with: string; explanation: string }> = [];
  const cardLower = card.toLowerCase();

  // Ironclad synergies
  if (character === 'ironclad') {
    if (cardLower.includes('hemokinesis') && relics.includes('Burning Blood')) {
      synergies.push({ with: 'Burning Blood', explanation: 'Burning Blood heals back the HP cost' });
    }
    if (cardLower.includes('hemokinesis') && deck.some(c => c.toLowerCase().includes('bash'))) {
      synergies.push({ with: 'Bash', explanation: 'Bash applies Vulnerable, Hemokinesis deals huge damage' });
    }
    if (cardLower.includes('spot weakness') && deck.some(c => c.toLowerCase().includes('bash'))) {
      synergies.push({ with: 'Bash', explanation: 'Both apply/use Vulnerable for strength scaling' });
    }
  }

  // Silent synergies
  if (character === 'silent') {
    if (cardLower.includes('footwork') && deck.some(c => c.toLowerCase().includes('dodge'))) {
      synergies.push({ with: 'Dodge and Roll', explanation: 'Footwork scales your block from Dodge' });
    }
    if (cardLower.includes('catalyst') && deck.some(c => c.toLowerCase().includes('poison'))) {
      synergies.push({ with: 'Poison cards', explanation: 'Catalyst doubles/triples your poison damage' });
    }
  }

  return {
    score: synergies.length > 0 ? 1 : 0,
    synergies,
  };
}

function evaluateAntiSynergies(card: string, deck: string[], relics: string[], character: string): Array<{ with: string; explanation: string }> {
  const antiSynergies: Array<{ with: string; explanation: string }> = [];
  const cardLower = card.toLowerCase();

  // Too many of the same type
  const deckStr = deck.join(' ').toLowerCase();
  if (cardLower.includes('strike') && deck.filter(c => c.toLowerCase().includes('strike')).length >= 5) {
    antiSynergies.push({ with: 'Strikes', explanation: 'Already have too many Strikes - they dilute your deck' });
  }

  return antiSynergies;
}

function isActiveBad(card: string, context: DeckContext): boolean {
  const cardLower = card.toLowerCase();

  // Cards that are bad early
  if (context.act === 1 && context.floor <= 5) {
    if (['barricade', 'creative ai', 'nightmare'].some(c => cardLower.includes(c))) {
      return true; // Too slow for early Act 1
    }
  }

  return false;
}

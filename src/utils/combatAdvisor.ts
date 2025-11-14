interface CombatContext {
  enemies: string[];
  hand?: string[];
  deck: string[];
  relics: string[];
  character: string;
  floor: number;
  currentHP: number;
  maxHP: number;
}

export function generateCombatStrategy(context: CombatContext): string {
  const {
    enemies,
    hand = [],
    deck,
    relics,
    character,
    floor,
    currentHP,
    maxHP,
  } = context;

  const strategy: string[] = [];
  const hpPercent = (currentHP / maxHP) * 100;

  // Analyze enemies
  const enemyInfo = analyzeEnemies(enemies);

  // General strategy based on enemies
  if (enemyInfo.hasCultist) {
    strategy.push('🎯 PRIORITY: Kill Cultist ASAP before it buffs!');
  }

  if (enemyInfo.hasLagavulin) {
    strategy.push('🎯 Lagavulin will sleep for 3 turns. Use this time to set up!');
  }

  if (enemyInfo.hasGremlinNob) {
    strategy.push('⚠️ Gremlin Nob: Avoid playing Skills! Use Attacks only.');
  }

  if (enemyInfo.hasSentries) {
    strategy.push('🛡️ Sentries generate Dazed. Keep your deck lean and kill them quickly.');
  }

  if (enemyInfo.multipleEnemies) {
    strategy.push('📊 Multiple enemies: Consider AoE damage if you have it.');
  } else {
    strategy.push('🎯 Single target: Focus all damage on the enemy.');
  }

  // HP-based advice
  if (hpPercent < 40) {
    strategy.push('⚠️ LOW HP: Play defensively! Prioritize blocking over damage.');
  } else if (hpPercent < 70) {
    strategy.push('💛 MODERATE HP: Balance offense and defense.');
  } else {
    strategy.push('✅ GOOD HP: You can afford to be aggressive.');
  }

  // Floor-based advice
  if (floor <= 3) {
    strategy.push('🌱 Early game: Focus on efficient damage, save HP for later.');
  } else if (floor <= 15) {
    strategy.push('💪 Mid game: Your deck should be taking shape now.');
  } else {
    strategy.push('🔥 Late Act 1: Boss is coming! Make sure you can win this efficiently.');
  }

  // Character-specific advice
  const characterAdvice = getCharacterSpecificAdvice(character, deck, relics, enemies);
  if (characterAdvice) {
    strategy.push(characterAdvice);
  }

  // Hand-specific advice
  if (hand.length > 0) {
    const handAdvice = analyzeHand(hand, enemies, character);
    if (handAdvice) {
      strategy.push('\n' + handAdvice);
    }
  }

  return strategy.join('\n\n');
}

interface EnemyAnalysis {
  hasCultist: boolean;
  hasLagavulin: boolean;
  hasGremlinNob: boolean;
  hasSentries: boolean;
  multipleEnemies: boolean;
}

function analyzeEnemies(enemies: string[]): EnemyAnalysis {
  const combined = enemies.join(' ').toLowerCase();

  return {
    hasCultist: combined.includes('cultist'),
    hasLagavulin: combined.includes('lagavulin'),
    hasGremlinNob: combined.includes('gremlin nob') || combined.includes('nob'),
    hasSentries: combined.includes('sentries') || combined.includes('sentry'),
    multipleEnemies: enemies.length > 1 || /\d+x/.test(combined),
  };
}

function getCharacterSpecificAdvice(
  character: string,
  deck: string[],
  relics: string[],
  enemies: string[]
): string | null {
  const char = character.toLowerCase();
  const deckStr = deck.join(' ').toLowerCase();

  if (char === 'ironclad') {
    if (deckStr.includes('bash')) {
      return '🔨 Ironclad: Use Bash early for Vulnerable (50% more damage!).';
    }
    if (deckStr.includes('flex') || deckStr.includes('limit break')) {
      return '💪 Ironclad: Stack Strength for big damage.';
    }
    return '💪 Ironclad: Build Strength for scaling damage.';
  }

  if (char === 'silent') {
    if (deckStr.includes('poison')) {
      return '☠️ Silent: Apply Poison early, then block and let it kill.';
    }
    if (deckStr.includes('shiv')) {
      return '🗡️ Silent: Play Shivs to trigger effects and deal chip damage.';
    }
    return '🗡️ Silent: Front-load damage early or build Poison for scaling.';
  }

  if (char === 'defect') {
    if (deckStr.includes('frost')) {
      return '❄️ Defect: Channel Frost orbs for passive block.';
    }
    if (deckStr.includes('lightning')) {
      return '⚡ Defect: Channel Lightning for passive damage each turn.';
    }
    return '🔮 Defect: Channel orbs early to start scaling.';
  }

  if (char === 'watcher') {
    if (deckStr.includes('wrath') || deckStr.includes('eruption')) {
      return '😡 Watcher: Enter Wrath for 2x damage, then exit to Calm for energy.';
    }
    return '🧘 Watcher: Use Stances! Wrath = 2x damage, Calm = 2 energy.';
  }

  return null;
}

function analyzeHand(hand: string[], enemies: string[], character: string): string | null {
  const handStr = hand.join(' ').toLowerCase();

  const advice: string[] = ['🃏 HAND ADVICE:'];

  // Count card types
  const attacks = hand.filter((c) =>
    c.toLowerCase().includes('strike') ||
    c.toLowerCase().includes('bash') ||
    c.toLowerCase().includes('slice') ||
    c.toLowerCase().includes('carnage')
  ).length;

  const defends = hand.filter((c) => c.toLowerCase().includes('defend')).length;

  if (attacks > 3) {
    advice.push('• High attack density - be aggressive this turn!');
  } else if (attacks === 0) {
    advice.push('• No attacks - focus on defense/setup this turn.');
  }

  if (defends > 2) {
    advice.push('• Good defensive hand - you can tank some damage.');
  }

  // Specific card advice
  if (handStr.includes('bash')) {
    advice.push('• Play Bash first to apply Vulnerable!');
  }

  if (handStr.includes('eruption')) {
    advice.push('• Eruption enters Wrath stance (2x damage).');
  }

  if (handStr.includes('neutralize') && enemies.some(e => e.toLowerCase().includes('nob'))) {
    advice.push('• ⚠️ DO NOT play Neutralize vs Gremlin Nob!');
  }

  return advice.length > 1 ? advice.join('\n') : null;
}

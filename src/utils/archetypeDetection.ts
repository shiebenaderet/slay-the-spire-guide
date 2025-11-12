import type { Card, CharacterType } from '../types';

export interface DeckArchetype {
  name: string;
  strength: number; // 0-100 score
  description: string;
  keyCards: string[];
  recommendedCards: string[];
}

export function detectDeckArchetypes(deck: Card[], character: CharacterType): DeckArchetype[] {
  const archetypes: DeckArchetype[] = [];

  // Ironclad archetypes
  if (character === 'ironclad') {
    archetypes.push(detectStrengthScaling(deck));
    archetypes.push(detectExhaustSynergy(deck));
    archetypes.push(detectBlockStack(deck));
    archetypes.push(detectSelfDamage(deck));
  }

  // Silent archetypes
  if (character === 'silent') {
    archetypes.push(detectPoisonBuild(deck));
    archetypes.push(detectShivGeneration(deck));
    archetypes.push(detectDiscardSynergy(deck));
    archetypes.push(detectZeroCostSpam(deck));
  }

  // Defect archetypes
  if (character === 'defect') {
    archetypes.push(detectFrostFocus(deck));
    archetypes.push(detectLightningFocus(deck));
    archetypes.push(detectDarkOrbs(deck));
    archetypes.push(detectPowerSpam(deck));
  }

  // Watcher archetypes
  if (character === 'watcher') {
    archetypes.push(detectStanceDancing(deck));
    archetypes.push(detectScryManipulation(deck));
    archetypes.push(detectMantraGeneration(deck));
    archetypes.push(detectRetainStrategy(deck));
  }

  // Sort by strength and filter out weak archetypes
  return archetypes
    .filter(arch => arch.strength >= 20)
    .sort((a, b) => b.strength - a.strength);
}

/**
 * Simplified archetype detection for shop advisor - returns primary and secondary archetype names
 */
export function detectArchetype(deck: Card[], _relics: any, character: CharacterType): { primary: string | null; secondary: string | null } {
  const archetypes = detectDeckArchetypes(deck, character);

  return {
    primary: archetypes[0]?.name || null,
    secondary: archetypes[1]?.name || null
  };
}

// Ironclad Archetypes

function detectStrengthScaling(deck: Card[]): DeckArchetype {
  const strengthCards = ['limit_break', 'heavy_blade', 'spot_weakness', 'demon_form', 'inflame', 'flex'];
  const scalingAttacks = ['heavy_blade', 'sword_boomerang', 'whirlwind', 'pummel', 'twin_strike'];

  let score = 0;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (strengthCards.includes(card.id)) {
      score += 15;
      foundCards.push(card.name);
    }
    if (scalingAttacks.includes(card.id)) {
      score += 10;
      foundCards.push(card.name);
    }
  });

  return {
    name: 'Strength Scaling',
    strength: Math.min(score, 100),
    description: 'Focus on building strength and using attacks that scale with it',
    keyCards: foundCards,
    recommendedCards: ['Limit Break', 'Heavy Blade', 'Demon Form', 'Spot Weakness', 'Reaper']
  };
}

function detectExhaustSynergy(deck: Card[]): DeckArchetype {
  const exhaustPayoffs = ['feel_no_pain', 'dark_embrace', 'corruption', 'dead_branch'];
  const exhaustCards = ['true_grit', 'burning_pact', 'offering', 'fiend_fire', 'immolate', 'sentinel'];

  let score = 0;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (exhaustPayoffs.includes(card.id)) {
      score += 20;
      foundCards.push(card.name);
    }
    if (exhaustCards.includes(card.id)) {
      score += 8;
      foundCards.push(card.name);
    }
    if (card.tags?.includes('exhaust')) {
      score += 5;
    }
  });

  return {
    name: 'Exhaust Synergy',
    strength: Math.min(score, 100),
    description: 'Benefit from exhausting cards with Feel No Pain, Dark Embrace, or Dead Branch',
    keyCards: foundCards,
    recommendedCards: ['Feel No Pain', 'Dark Embrace', 'Corruption', 'True Grit', 'Burning Pact']
  };
}

function detectBlockStack(deck: Card[]): DeckArchetype {
  const blockPayoffs = ['barricade', 'entrench', 'body_slam'];
  const blockCards = ['shrug_it_off', 'flame_barrier', 'impervious', 'metallicize'];

  let score = 0;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (blockPayoffs.includes(card.id)) {
      score += 25;
      foundCards.push(card.name);
    }
    if (blockCards.includes(card.id)) {
      score += 10;
      foundCards.push(card.name);
    }
  });

  return {
    name: 'Block Stacking',
    strength: Math.min(score, 100),
    description: 'Build massive block with Barricade and convert it to damage with Body Slam',
    keyCards: foundCards,
    recommendedCards: ['Barricade', 'Body Slam', 'Entrench', 'Impervious', 'Metallicize']
  };
}

function detectSelfDamage(deck: Card[]): DeckArchetype {
  const payoffs = ['rupture', 'brutality'];
  const selfDamageCards = ['bloodletting', 'offering', 'hemokinesis', 'combust'];

  let score = 0;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (payoffs.includes(card.id)) {
      score += 30;
      foundCards.push(card.name);
    }
    if (selfDamageCards.includes(card.id)) {
      score += 12;
      foundCards.push(card.name);
    }
  });

  return {
    name: 'Self-Damage Synergy',
    strength: Math.min(score, 100),
    description: 'Use Rupture to gain strength from self-inflicted damage',
    keyCards: foundCards,
    recommendedCards: ['Rupture', 'Brutality', 'Offering', 'Bloodletting', 'Reaper']
  };
}

// Silent Archetypes

function detectPoisonBuild(deck: Card[]): DeckArchetype {
  const poisonPayoffs = ['catalyst', 'noxious_fumes', 'envenom'];
  const poisonCards = ['bouncing_flask', 'deadly_poison', 'poisoned_stab', 'crippling_cloud'];

  let score = 0;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (poisonPayoffs.includes(card.id)) {
      score += 25;
      foundCards.push(card.name);
    }
    if (poisonCards.includes(card.id)) {
      score += 10;
      foundCards.push(card.name);
    }
    if (card.tags?.includes('poison')) {
      score += 5;
    }
  });

  return {
    name: 'Poison Build',
    strength: Math.min(score, 100),
    description: 'Stack poison and multiply it with Catalyst for massive damage',
    keyCards: foundCards,
    recommendedCards: ['Catalyst', 'Noxious Fumes', 'Bouncing Flask', 'Corpse Explosion', 'Envenom']
  };
}

function detectShivGeneration(deck: Card[]): DeckArchetype {
  const shivPayoffs = ['accuracy', 'after_image', 'a_thousand_cuts', 'storm_of_steel'];
  const shivGenerators = ['blade_dance', 'cloak_and_dagger', 'infinite_blades'];

  let score = 0;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (shivPayoffs.includes(card.id)) {
      score += 20;
      foundCards.push(card.name);
    }
    if (shivGenerators.includes(card.id)) {
      score += 15;
      foundCards.push(card.name);
    }
  });

  return {
    name: 'Shiv Generation',
    strength: Math.min(score, 100),
    description: 'Generate shivs and benefit from playing many 0-cost attacks',
    keyCards: foundCards,
    recommendedCards: ['Accuracy', 'After Image', 'Blade Dance', 'Infinite Blades', 'Storm of Steel']
  };
}

function detectDiscardSynergy(deck: Card[]): DeckArchetype {
  const discardPayoffs = ['reflex', 'eviscerate', 'sneaky_strike', 'tactician'];
  const discardCards = ['prepared', 'acrobatics', 'calculated_gamble'];

  let score = 0;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (discardPayoffs.includes(card.id)) {
      score += 18;
      foundCards.push(card.name);
    }
    if (discardCards.includes(card.id)) {
      score += 12;
      foundCards.push(card.name);
    }
  });

  return {
    name: 'Discard Synergy',
    strength: Math.min(score, 100),
    description: 'Discard cards for benefits with Reflex, Tactician, and Eviscerate',
    keyCards: foundCards,
    recommendedCards: ['Eviscerate', 'Reflex', 'Tactician', 'Calculated Gamble', 'Prepared']
  };
}

function detectZeroCostSpam(deck: Card[]): DeckArchetype {
  const zeroCostCards = deck.filter(card => card.cost === 0).length;
  const payoffs = ['grand_finale', 'panache', 'backstab'];

  let score = zeroCostCards * 8;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (payoffs.includes(card.id)) {
      score += 20;
      foundCards.push(card.name);
    }
  });

  return {
    name: '0-Cost Spam',
    strength: Math.min(score, 100),
    description: 'Fill deck with 0-cost cards for Grand Finale and consistent plays',
    keyCards: foundCards,
    recommendedCards: ['Grand Finale', 'Backstab', 'Blade Dance', 'Prepared', 'Concentrate']
  };
}

// Defect Archetypes

function detectFrostFocus(deck: Card[]): DeckArchetype {
  const frostCards = ['glacier', 'blizzard', 'coolheaded', 'cold_snap', 'freeze'];
  const focusCards = ['defragment', 'capacitor', 'consume'];

  let score = 0;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (frostCards.includes(card.id)) {
      score += 12;
      foundCards.push(card.name);
    }
    if (focusCards.includes(card.id)) {
      score += 18;
      foundCards.push(card.name);
    }
  });

  return {
    name: 'Frost Focus',
    strength: Math.min(score, 100),
    description: 'Stack frost orbs with high focus for massive block generation',
    keyCards: foundCards,
    recommendedCards: ['Defragment', 'Glacier', 'Blizzard', 'Coolheaded', 'Capacitor']
  };
}

function detectLightningFocus(deck: Card[]): DeckArchetype {
  const lightningCards = ['ball_lightning', 'electrodynamics', 'thunder_strike', 'static_discharge'];
  const focusCards = ['defragment', 'capacitor'];

  let score = 0;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (lightningCards.includes(card.id)) {
      score += 12;
      foundCards.push(card.name);
    }
    if (focusCards.includes(card.id)) {
      score += 18;
      foundCards.push(card.name);
    }
  });

  return {
    name: 'Lightning Focus',
    strength: Math.min(score, 100),
    description: 'Channel lightning orbs and scale with focus for AoE damage',
    keyCards: foundCards,
    recommendedCards: ['Defragment', 'Electrodynamics', 'Ball Lightning', 'Thunder Strike', 'Capacitor']
  };
}

function detectDarkOrbs(deck: Card[]): DeckArchetype {
  const darkCards = ['darkness', 'dark_impulse', 'dualcast', 'multi_cast'];

  let score = 0;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (darkCards.includes(card.id)) {
      score += 15;
      foundCards.push(card.name);
    }
  });

  return {
    name: 'Dark Orb Build',
    strength: Math.min(score, 100),
    description: 'Build up dark orbs for massive single-target burst damage',
    keyCards: foundCards,
    recommendedCards: ['Darkness', 'Multi-Cast', 'Dualcast', 'Loop', 'Meteor Strike']
  };
}

function detectPowerSpam(deck: Card[]): DeckArchetype {
  const powerSpammers = ['echo_form', 'creative_ai', 'amplify'];
  const powers = deck.filter(card => card.type === 'power').length;

  let score = powers * 10;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (powerSpammers.includes(card.id)) {
      score += 25;
      foundCards.push(card.name);
    }
  });

  return {
    name: 'Power Spam',
    strength: Math.min(score, 100),
    description: 'Play many powers and duplicate them with Echo Form or Creative AI',
    keyCards: foundCards,
    recommendedCards: ['Echo Form', 'Creative AI', 'Defragment', 'Storm', 'Capacitor']
  };
}

// Watcher Archetypes

function detectStanceDancing(deck: Card[]): DeckArchetype {
  const stanceDancers = ['rushdown', 'mental_fortress', 'like_water'];
  const stanceCards = ['tantrum', 'tranquility', 'calm', 'fear_no_evil', 'inner_peace'];

  let score = 0;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (stanceDancers.includes(card.id)) {
      score += 25;
      foundCards.push(card.name);
    }
    if (stanceCards.includes(card.id)) {
      score += 10;
      foundCards.push(card.name);
    }
    if (card.tags?.includes('stance')) {
      score += 8;
    }
  });

  return {
    name: 'Stance Dancing',
    strength: Math.min(score, 100),
    description: 'Rapidly switch between Calm and Wrath for Rushdown and Mental Fortress',
    keyCards: foundCards,
    recommendedCards: ['Rushdown', 'Mental Fortress', 'Tantrum', 'Tranquility', 'Fear No Evil']
  };
}

function detectScryManipulation(deck: Card[]): DeckArchetype {
  const scryPayoffs = ['third_eye', 'just_lucky', 'foreign_influence'];
  const scryCards = ['cut_through_fate', 'foresight', 'evaluate'];

  let score = 0;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (scryPayoffs.includes(card.id)) {
      score += 20;
      foundCards.push(card.name);
    }
    if (scryCards.includes(card.id)) {
      score += 12;
      foundCards.push(card.name);
    }
    if (card.tags?.includes('scry')) {
      score += 6;
    }
  });

  return {
    name: 'Scry Manipulation',
    strength: Math.min(score, 100),
    description: 'Use scry to control your draw and benefit from Third Eye',
    keyCards: foundCards,
    recommendedCards: ['Third Eye', 'Just Lucky', 'Cut Through Fate', 'Foresight', 'Foreign Influence']
  };
}

function detectMantraGeneration(deck: Card[]): DeckArchetype {
  const mantraCards = ['pray', 'prostrate', 'devotion', 'worship'];
  const divinity = deck.some(card => card.id === 'devotion');

  let score = 0;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (mantraCards.includes(card.id)) {
      score += 18;
      foundCards.push(card.name);
    }
  });

  if (divinity) score += 30;

  return {
    name: 'Mantra/Divinity',
    strength: Math.min(score, 100),
    description: 'Generate mantra to enter Divinity stance for triple damage',
    keyCards: foundCards,
    recommendedCards: ['Devotion', 'Pray', 'Prostrate', 'Worship', 'Deus Ex Machina']
  };
}

function detectRetainStrategy(deck: Card[]): DeckArchetype {
  const retainPayoffs = ['establishment', 'study', 'meditate'];
  const retainCards = ['halt', 'protect', 'cut_through_fate'];

  let score = 0;
  const foundCards: string[] = [];

  deck.forEach(card => {
    if (retainPayoffs.includes(card.id)) {
      score += 20;
      foundCards.push(card.name);
    }
    if (retainCards.includes(card.id) || card.tags?.includes('retain')) {
      score += 10;
      foundCards.push(card.name);
    }
  });

  return {
    name: 'Retain Strategy',
    strength: Math.min(score, 100),
    description: 'Hold onto cards with retain and reduce their cost with Establishment',
    keyCards: foundCards,
    recommendedCards: ['Establishment', 'Study', 'Meditate', 'Halt', 'Cut Through Fate']
  };
}

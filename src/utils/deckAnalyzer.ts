import type { Card } from '../types';

/**
 * Centralized deck analysis interface
 * Used by advisoryLogic, relicEvaluator, combatAdvisor, and other advisory systems
 */
export interface DeckAnalysis {
  size: number;
  // Type distribution
  attackCount: number;
  skillCount: number;
  powerCount: number;
  statusCount: number;
  curseCount: number;
  // Cost distribution
  costDistribution: Record<number, number>;
  avgCost: number;
  // Tag analysis
  blockCards: number;
  drawCards: number;
  scalingCards: number;
  energyCards: number;
  exhaustCards: number;
  // Specific card IDs
  cardIds: string[];
  // Archetype detection
  archetypes: string[];
}

/**
 * Analyzes a deck and returns comprehensive statistics
 * This is the canonical deck analysis function - use this instead of creating your own
 */
export function analyzeDeck(deck: Card[]): DeckAnalysis {
  const analysis: DeckAnalysis = {
    size: deck.length,
    attackCount: 0,
    skillCount: 0,
    powerCount: 0,
    statusCount: 0,
    curseCount: 0,
    costDistribution: {},
    avgCost: 0,
    blockCards: 0,
    drawCards: 0,
    scalingCards: 0,
    energyCards: 0,
    exhaustCards: 0,
    cardIds: [],
    archetypes: [],
  };

  let totalCost = 0;

  deck.forEach((card) => {
    // Type counts
    if (card.type === 'attack') analysis.attackCount++;
    else if (card.type === 'skill') analysis.skillCount++;
    else if (card.type === 'power') analysis.powerCount++;
    else if (card.type === 'status') analysis.statusCount++;
    else if (card.type === 'curse') analysis.curseCount++;

    // Cost distribution
    analysis.costDistribution[card.cost] = (analysis.costDistribution[card.cost] || 0) + 1;
    totalCost += card.cost;

    // Tag analysis
    if (card.tags.includes('block')) analysis.blockCards++;
    if (card.tags.includes('draw') || card.tags.includes('cycle')) analysis.drawCards++;
    if (card.tags.includes('scaling')) analysis.scalingCards++;
    if (card.tags.includes('energy')) analysis.energyCards++;
    if (card.tags.includes('exhaust')) analysis.exhaustCards++;

    // Store card IDs
    analysis.cardIds.push(card.id);
  });

  analysis.avgCost = deck.length > 0 ? totalCost / deck.length : 0;

  // Detect archetypes
  analysis.archetypes = detectArchetypes(deck, analysis);

  return analysis;
}

function detectArchetypes(deck: Card[], analysis: DeckAnalysis): string[] {
  const archetypes: string[] = [];

  // Corruption archetype
  if (analysis.cardIds.includes('corruption')) {
    archetypes.push('corruption');
  }

  // Barricade archetype
  if (analysis.cardIds.includes('barricade')) {
    archetypes.push('barricade');
  }

  // Dead Branch archetype
  if (analysis.cardIds.includes('dead_branch')) {
    archetypes.push('dead_branch');
  }

  // Rupture/Self-damage archetype
  if (analysis.cardIds.includes('rupture')) {
    archetypes.push('rupture');
  }

  // Strength scaling (Ironclad)
  const strengthCards = deck.filter((c) =>
    c.tags.includes('strength') || c.id === 'demon_form' || c.id === 'limit_break'
  );
  if (strengthCards.length >= 3) {
    archetypes.push('strength');
  }

  // SILENT ARCHETYPES

  // Poison archetype
  const poisonCards = deck.filter((c) => c.tags.includes('poison'));
  if (poisonCards.length >= 2) {
    archetypes.push('poison');
  }

  // Shiv archetype
  const shivCards = deck.filter((c) =>
    c.tags.includes('shiv') || c.id === 'accuracy' || c.id === 'after_image'
  );
  if (shivCards.length >= 3) {
    archetypes.push('shiv');
  }

  // Discard archetype
  const discardCards = deck.filter((c) =>
    c.tags.includes('discard') || c.id === 'tactician' || c.id === 'reflex'
  );
  if (discardCards.length >= 3) {
    archetypes.push('discard');
  }

  // DEFECT ARCHETYPES

  // Orb/Focus archetype
  const focusCards = deck.filter((c) =>
    c.tags.includes('focus') || c.id === 'defragment' || c.id === 'consume'
  );
  const orbCards = deck.filter((c) =>
    c.tags.includes('orb') || c.tags.includes('channel') || c.tags.includes('evoke')
  );
  if (focusCards.length >= 2 || orbCards.length >= 6) {
    archetypes.push('orb-focus');
  }

  // Lightning archetype (specific orb type)
  const lightningCards = deck.filter((c) =>
    c.tags.includes('lightning') || c.id === 'electrodynamics' || c.id === 'ball_lightning'
  );
  if (lightningCards.length >= 3) {
    archetypes.push('lightning');
  }

  // Frost archetype (specific orb type)
  const frostCards = deck.filter((c) =>
    c.tags.includes('frost') || c.id === 'glacier' || c.id === 'blizzard' || c.id === 'coolheaded'
  );
  if (frostCards.length >= 3) {
    archetypes.push('frost');
  }

  // Claw archetype
  const clawCards = deck.filter((c) => c.id === 'claw');
  const recursionCards = deck.filter((c) =>
    c.id === 'all_for_one' || c.id === 'hologram' || c.id === 'equilibrium'
  );
  if (clawCards.length >= 3 || (clawCards.length >= 2 && recursionCards.length >= 1)) {
    archetypes.push('claw');
  }

  // WATCHER ARCHETYPES

  // Stance Dance archetype
  const stanceCards = deck.filter((c) =>
    c.tags.includes('stance') || c.tags.includes('wrath') || c.tags.includes('calm') ||
    c.id === 'mental_fortress' || c.id === 'rushdown'
  );
  if (stanceCards.length >= 4) {
    archetypes.push('stance-dance');
  }

  // Divinity/Mantra archetype
  const mantraCards = deck.filter((c) =>
    c.tags.includes('mantra') || c.tags.includes('divinity') ||
    c.id === 'worship' || c.id === 'pray' || c.id === 'blasphemy'
  );
  if (mantraCards.length >= 3) {
    archetypes.push('divinity');
  }

  // Scry archetype
  const scryCards = deck.filter((c) =>
    c.tags.includes('scry') || c.id === 'foresight' || c.id === 'third_eye'
  );
  if (scryCards.length >= 4) {
    archetypes.push('scry');
  }

  // GENERAL ARCHETYPES (All characters)

  // Exhaust archetype
  if (analysis.exhaustCards >= 5) {
    archetypes.push('exhaust');
  }

  // Block/defensive archetype
  if (analysis.blockCards >= 8) {
    archetypes.push('defensive');
  }

  // Scaling/Long fight archetype
  if (analysis.scalingCards >= 4) {
    archetypes.push('scaling');
  }

  return archetypes;
}

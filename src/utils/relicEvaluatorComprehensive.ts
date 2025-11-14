/**
 * Comprehensive Relic Evaluator
 * Evaluates relics based on deck synergy, character fit, and act needs
 */

import relicsData from '../data/relics.json';
import { hasTag, hasAnyTag } from './comprehensiveCardEvaluator';

interface RelicData {
  id: string;
  name: string;
  rarity: string;
  character: string;
  description: string;
  tier?: string;
  tierRating: number;
  synergies: string[];
}

const relics: RelicData[] = relicsData as RelicData[];

const relicsByName = new Map<string, RelicData>();
relics.forEach(relic => {
  relicsByName.set(relic.name.toLowerCase(), relic);
});

export function getRelicData(relicName: string): RelicData | null {
  return relicsByName.get(relicName.toLowerCase()) || null;
}

interface RelicEvaluation {
  relic: string;
  score: number; // 1-10
  rating: 'S-tier' | 'A-tier' | 'B-tier' | 'C-tier' | 'D-tier';
  reasoning: string[];
  synergies: Array<{ with: string; explanation: string }>;
  impact: 'game-changing' | 'strong' | 'moderate' | 'weak';
}

interface RelicContext {
  character: string;
  act: number;
  floor: number;
  deck: string[];
  relics: string[];
  currentHP: number;
  maxHP: number;
  gold: number;
}

export function evaluateRelic(relicName: string, context: RelicContext): RelicEvaluation {
  const relic = getRelicData(relicName);
  if (!relic) {
    return {
      relic: relicName,
      score: 5,
      rating: 'C-tier',
      reasoning: ['Unknown relic'],
      synergies: [],
      impact: 'moderate',
    };
  }

  let score = relic.tierRating * 2; // Base: 2-10
  const reasoning: string[] = [];
  const synergies: Array<{ with: string; explanation: string }> = [];

  // Character-specific relics get bonus
  if (relic.character === context.character.toLowerCase()) {
    score += 1;
    reasoning.push('✓ Character-specific relic');
  }

  // Evaluate based on relic type and current needs
  const relicLower = relicName.toLowerCase();
  const { deck, character } = context;

  // Energy relics (always high value)
  if (relicLower.includes('cursed key') || relicLower.includes('coffee dripper') ||
      relicLower.includes('busted crown') || relicLower.includes('fusion hammer')) {
    score += 3;
    reasoning.push('🔥 Energy relic - extremely powerful');
  }

  // Boss relics evaluation
  if (relic.rarity === 'boss') {
    score += 1;
    reasoning.push('Boss relic - high impact');
  }

  // Synergy-based evaluations
  if (relicLower.includes('dead branch')) {
    if (deck.some(c => hasTag(c, 'exhaust'))) {
      score += 2;
      synergies.push({ with: 'Exhaust cards', explanation: 'Dead Branch generates cards when you exhaust' });
    }
  }

  if (relicLower.includes('kunai') || relicLower.includes('shuriken')) {
    const attackCount = deck.filter(c => hasTag(c, '0-cost') || c.toLowerCase().includes('shiv')).length;
    if (attackCount >= 3) {
      score += 2;
      synergies.push({ with: '0-cost/Shiv cards', explanation: 'Triggers on playing 3 attacks in one turn' });
    }
  }

  if (relicLower.includes('ornamental fan')) {
    const attackCount = deck.filter(c => hasTag(c, '0-cost')).length;
    if (attackCount >= 3) {
      score += 1;
      synergies.push({ with: '0-cost attacks', explanation: 'Gives block when you play attacks' });
    }
  }

  if (relicLower.includes('chemical x')) {
    if (deck.some(c => c.toLowerCase().includes('whirlwind') || c.toLowerCase().includes('blade dance'))) {
      score += 2;
      synergies.push({ with: 'X-cost cards', explanation: 'Chemical X adds 2 to X-cost cards' });
    }
  }

  if (relicLower.includes('runic pyramid')) {
    score += 2;
    reasoning.push('✓ Runic Pyramid - exceptional card control');
  }

  if (relicLower.includes('ice cream')) {
    score += 2;
    reasoning.push('✓ Ice Cream - energy efficiency game-changer');
  }

  // Determine rating
  let rating: 'S-tier' | 'A-tier' | 'B-tier' | 'C-tier' | 'D-tier';
  if (score >= 9) rating = 'S-tier';
  else if (score >= 7) rating = 'A-tier';
  else if (score >= 5) rating = 'B-tier';
  else if (score >= 3) rating = 'C-tier';
  else rating = 'D-tier';

  // Determine impact
  let impact: 'game-changing' | 'strong' | 'moderate' | 'weak';
  if (score >= 9) impact = 'game-changing';
  else if (score >= 7) impact = 'strong';
  else if (score >= 5) impact = 'moderate';
  else impact = 'weak';

  // Add base reasoning if none
  if (reasoning.length === 0) {
    reasoning.push(relic.description);
  }

  return {
    relic: relicName,
    score,
    rating,
    reasoning,
    synergies,
    impact,
  };
}

export function evaluateRelicChoice(
  relicsOffered: string[],
  context: RelicContext
): RelicEvaluation[] {
  return relicsOffered.map(relic => evaluateRelic(relic, context));
}

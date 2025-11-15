/**
 * Shop Advisor
 * Recommends what to buy and what to remove based on deck state and strategy
 */

import { getCardData, isRemovalPriority } from './comprehensiveCardEvaluator';
import { evaluateCardPick } from './cardRecommendationEngine';
import { evaluateRelicChoice } from './relicEvaluatorComprehensive';

interface ShopContext {
  character: string;
  act: number;
  floor: number;
  deck: string[];
  relics: string[];
  currentHP: number;
  maxHP: number;
  gold: number;
  ascension: number;
  upcomingElites: number;
  upcomingBoss: string;
}

export interface CardForSale {
  card: string;
  cost: number;
  upgraded?: boolean;
}

export interface RelicForSale {
  relic: string;
  cost: number;
}

export interface ShopRecommendation {
  action: 'buy-card' | 'buy-relic' | 'remove-card' | 'skip';
  item?: string;
  cost: number;
  priority: 'must-buy' | 'strong-buy' | 'consider' | 'skip';
  reasoning: string[];
  value: number; // Cost-benefit score
}

export interface RemovalRecommendation {
  card: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string;
  costWorth: boolean; // Is the removal cost worth it?
}

/**
 * Cards that CANNOT be removed from your deck
 */
const UNREMOVABLE_CARDS = [
  'ascenders_bane',  // Cannot be removed (Ascension 10+ starting curse)
  'necronomicurse',  // Cannot be removed (spawns copies)
];

/**
 * Get card removal priority
 */
export function getRemovalPriority(deck: string[], relics: string[], gold: number, act: number): RemovalRecommendation[] {
  const removals: RemovalRecommendation[] = [];
  const removalCost = 75; // Base removal cost at shops

  // Strikes and Defends
  const strikes = deck.filter(c => c.toLowerCase().includes('strike') && !c.includes('+'));
  const defends = deck.filter(c => c.toLowerCase().includes('defend') && !c.includes('+'));

  // Critical removals (remove even if expensive) - but exclude unremovable cards
  const curses = deck.filter(c => {
    const card = getCardData(c);
    if (!card || card.type !== 'curse') return false;

    // Skip unremovable curses
    const cardId = card.id.toLowerCase().replace(/[^a-z_]/g, '_');
    return !UNREMOVABLE_CARDS.includes(cardId);
  });

  curses.forEach(curse => {
    removals.push({
      card: curse,
      priority: 'critical',
      reasoning: 'Curse - actively hurts your deck every time drawn',
      costWorth: gold >= removalCost,
    });
  });

  // High priority removals
  if (act >= 2 && strikes.length > 0) {
    strikes.forEach(strike => {
      removals.push({
        card: strike,
        priority: 'high',
        reasoning: 'Strike - weak damage, dilutes your deck',
        costWorth: gold >= removalCost + 100, // Only if you have gold to spare
      });
    });
  }

  // Medium priority
  if (act >= 2 && defends.length > 3) {
    defends.slice(0, 2).forEach(defend => {
      removals.push({
        card: defend,
        priority: 'medium',
        reasoning: 'Defend - you have too many, dilutes good cards',
        costWorth: gold >= removalCost + 200,
      });
    });
  }

  // Cards that don't fit archetype
  deck.forEach(card => {
    if (isRemovalPriority(card, deck, relics)) {
      const cardData = getCardData(card);
      if (cardData && !curses.includes(card) && !strikes.includes(card) && !defends.includes(card)) {
        removals.push({
          card,
          priority: 'medium',
          reasoning: 'Doesn\'t synergize with your current deck strategy',
          costWorth: gold >= removalCost + 150,
        });
      }
    }
  });

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  removals.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return removals;
}

/**
 * Evaluate shop purchases
 */
export function evaluateShopPurchases(
  cardsForSale: CardForSale[],
  relicsForSale: RelicForSale[],
  context: ShopContext
): ShopRecommendation[] {
  const recommendations: ShopRecommendation[] = [];
  const { gold, deck, relics } = context;

  // Evaluate card removals first (often highest priority)
  const removalCost = 75;
  const removals = getRemovalPriority(deck, relics, gold, context.act);

  if (removals.length > 0 && removals[0].costWorth && gold >= removalCost) {
    const topRemoval = removals[0];
    recommendations.push({
      action: 'remove-card',
      item: topRemoval.card,
      cost: removalCost,
      priority: topRemoval.priority === 'critical' ? 'must-buy' : topRemoval.priority === 'high' ? 'strong-buy' : 'consider',
      reasoning: [
        `Remove ${topRemoval.card}`,
        topRemoval.reasoning,
        topRemoval.priority === 'critical' ? '🔥 CRITICAL: Do this before buying anything else!' : '',
      ].filter(Boolean),
      value: topRemoval.priority === 'critical' ? 10 : topRemoval.priority === 'high' ? 7 : 5,
    });
  }

  // Evaluate cards for sale
  const cardEvaluations = evaluateCardPick(
    cardsForSale.map(c => c.card),
    {
      character: context.character,
      act: context.act,
      floor: context.floor,
      deck: context.deck,
      relics: context.relics,
      currentHP: context.currentHP,
      maxHP: context.maxHP,
      gold: context.gold,
      ascension: context.ascension,
      upcomingElites: context.upcomingElites,
      upcomingBoss: context.upcomingBoss,
    }
  );

  cardsForSale.forEach((cardForSale, idx) => {
    const evaluation = cardEvaluations[idx];
    const canAfford = gold >= cardForSale.cost;

    // Value calculation: score vs cost
    const baseValue = evaluation.score; // 0-5
    const costEfficiency = canAfford ? (1 - cardForSale.cost / Math.max(gold, 1)) * 5 : -10;
    const value = baseValue + costEfficiency;

    let priority: 'must-buy' | 'strong-buy' | 'consider' | 'skip';
    if (!canAfford) {
      priority = 'skip';
    } else if (evaluation.recommendation === 'must-pick') {
      priority = 'must-buy';
    } else if (evaluation.recommendation === 'strong-pick') {
      priority = 'strong-buy';
    } else if (evaluation.recommendation === 'consider' && cardForSale.cost <= gold * 0.3) {
      priority = 'consider';
    } else {
      priority = 'skip';
    }

    const reasoning = [
      `${cardForSale.card}${cardForSale.upgraded ? '+' : ''} - ${cardForSale.cost} gold`,
      ...evaluation.reasoning,
      !canAfford ? '⚠️ Cannot afford this' : '',
      canAfford && cardForSale.cost > gold * 0.5 ? '⚠️ Very expensive - will leave you broke' : '',
    ].filter(Boolean);

    recommendations.push({
      action: 'buy-card',
      item: cardForSale.card,
      cost: cardForSale.cost,
      priority,
      reasoning,
      value,
    });
  });

  // Evaluate relics for sale
  const relicEvaluations = evaluateRelicChoice(
    relicsForSale.map(r => r.relic),
    {
      character: context.character,
      act: context.act,
      floor: context.floor,
      deck: context.deck,
      relics: context.relics,
      currentHP: context.currentHP,
      maxHP: context.maxHP,
      gold: context.gold,
    }
  );

  relicsForSale.forEach((relicForSale, idx) => {
    const evaluation = relicEvaluations[idx];
    const canAfford = gold >= relicForSale.cost;

    // Relics are generally more valuable than cards
    const baseValue = evaluation.score * 1.5; // Relics score 1-10, multiply by 1.5
    const costEfficiency = canAfford ? (1 - relicForSale.cost / Math.max(gold, 1)) * 5 : -10;
    const value = baseValue + costEfficiency;

    let priority: 'must-buy' | 'strong-buy' | 'consider' | 'skip';
    if (!canAfford) {
      priority = 'skip';
    } else if (evaluation.rating === 'S-tier' || evaluation.rating === 'A-tier') {
      priority = 'must-buy';
    } else if (evaluation.rating === 'B-tier' && relicForSale.cost <= gold * 0.4) {
      priority = 'strong-buy';
    } else if (evaluation.rating === 'C-tier' && relicForSale.cost <= gold * 0.2) {
      priority = 'consider';
    } else {
      priority = 'skip';
    }

    const reasoning = [
      `${relicForSale.relic} - ${relicForSale.cost} gold`,
      `Rating: ${evaluation.rating}`,
      ...evaluation.reasoning,
      !canAfford ? '⚠️ Cannot afford this' : '',
      canAfford && relicForSale.cost > gold * 0.6 ? '⚠️ Very expensive - consider if it solves a critical problem' : '',
    ].filter(Boolean);

    recommendations.push({
      action: 'buy-relic',
      item: relicForSale.relic,
      cost: relicForSale.cost,
      priority,
      reasoning,
      value,
    });
  });

  // Sort by value (highest first)
  recommendations.sort((a, b) => b.value - a.value);

  return recommendations;
}

/**
 * Generate shop strategy summary
 */
export function generateShopStrategy(
  recommendations: ShopRecommendation[],
  gold: number,
  act: number
): string {
  const strategy: string[] = [];

  // Top recommendation
  const topRec = recommendations.find(r => r.priority === 'must-buy');
  if (topRec) {
    strategy.push(`🔥 PRIORITY: ${topRec.action === 'remove-card' ? 'Remove' : 'Buy'} ${topRec.item} (${topRec.cost}g)`);
    strategy.push(topRec.reasoning[0]);
  }

  // Budget management
  const mustBuys = recommendations.filter(r => r.priority === 'must-buy');
  const totalMustBuyCost = mustBuys.reduce((sum, r) => sum + r.cost, 0);

  if (totalMustBuyCost > gold) {
    strategy.push('');
    strategy.push('⚠️ BUDGET WARNING: You have multiple must-buys but not enough gold!');
    strategy.push('Prioritize the one that solves your biggest immediate problem.');
  }

  // General advice by act
  strategy.push('');
  if (act === 1) {
    strategy.push('💡 Act 1 Shop: Prioritize damage for elites. Only remove if you have gold to spare.');
  } else if (act === 2) {
    strategy.push('💡 Act 2 Shop: Look for AOE and scaling. Remove Strikes if affordable.');
  } else {
    strategy.push('💡 Act 3 Shop: Prioritize mitigation and deck refinement. Remove aggressively.');
  }

  return strategy.join('\n');
}

/**
 * Rest Site Advisor
 * Recommends whether to rest, upgrade, or smith based on HP, deck, and act
 */

import { getCardData } from './comprehensiveCardEvaluator';

interface RestSiteContext {
  character: string;
  act: number;
  floor: number;
  deck: string[];
  relics: string[];
  currentHP: number;
  maxHP: number;
  gold: number;
  upcomingElites: number;
  upcomingBoss: string;
}

export interface RestSiteRecommendation {
  action: 'rest' | 'upgrade' | 'smith' | 'lift' | 'toke' | 'dig';
  priority: 'must-do' | 'strong' | 'consider' | 'avoid';
  reasoning: string[];
  hpGain?: number;
  upgradeTarget?: string; // For upgrade action
  cardToRemove?: string; // For smith action (if available)
}

/**
 * Determine if HP is in danger zone
 */
function isHPCritical(currentHP: number, maxHP: number, act: number): boolean {
  const hpPercent = (currentHP / maxHP) * 100;

  // Act-specific thresholds
  if (act === 1) {
    return hpPercent < 50; // Act 1 elites hit hard
  } else if (act === 2) {
    return hpPercent < 60; // Act 2 fights are longer
  } else {
    return hpPercent < 70; // Act 3 you need high HP
  }
}

/**
 * Get upgrade priority for each card
 */
export function getUpgradePriority(deck: string[], relics: string[], character: string, act: number): Array<{ card: string; priority: number; reason: string }> {
  const upgradePriorities: Array<{ card: string; priority: number; reason: string }> = [];

  // Get unupgraded cards
  const unupgradedCards = deck.filter(c => !c.includes('+'));

  unupgradedCards.forEach(card => {
    const cardData = getCardData(card);
    if (!cardData) return;

    let priority = 5; // Base priority
    let reason = 'Upgrade improves effectiveness';

    // High priority upgrades (10 = must upgrade)
    const highPriorityUpgrades = [
      'bash', 'neutralize', 'survivor', 'pommel strike', 'anger',
      'seeing red', 'offering', 'spot weakness', 'limit break',
      'dark shackles', 'deflect', 'prepared', 'backflip', 'footwork',
      'dagger spray', 'terror', 'catalyst', 'wraith form',
      'zap', 'dualcast', 'coolheaded', 'seek', 'defragment',
      'echo form', 'eruption', 'vigilance', 'conclude', 'scrawl'
    ];

    if (highPriorityUpgrades.some(c => card.toLowerCase().includes(c))) {
      priority = 10;
      reason = 'Critical upgrade - significantly improves card';
    }

    // Powers get high priority
    if (cardData.type === 'power') {
      priority = Math.max(priority, 8);
      reason = 'Power upgrade - lasts entire combat';
    }

    // Starter cards in Act 1
    if (act === 1 && (card.toLowerCase().includes('strike') || card.toLowerCase().includes('defend'))) {
      priority = 6;
      reason = 'Starter card - upgrade before replacing';
    }

    // Cards you play every combat
    const coreCards = ['bash', 'neutralize', 'survivor', 'zap', 'dualcast', 'eruption', 'vigilance'];
    if (coreCards.some(c => card.toLowerCase().includes(c))) {
      priority = Math.max(priority, 9);
      reason = 'Core card - played every fight';
    }

    // Energy cost reduction upgrades
    const costReductionCards = ['seeing red', 'offering', 'dagger throw', 'prepared', 'coolheaded'];
    if (costReductionCards.some(c => card.toLowerCase().includes(c))) {
      priority = Math.max(priority, 9);
      reason = 'Reduces energy cost - huge value';
    }

    upgradePriorities.push({ card, priority, reason });
  });

  // Sort by priority (highest first)
  upgradePriorities.sort((a, b) => b.priority - a.priority);

  return upgradePriorities;
}

/**
 * Evaluate rest site options
 */
export function evaluateRestSite(context: RestSiteContext): RestSiteRecommendation[] {
  const recommendations: RestSiteRecommendation[] = [];
  const { currentHP, maxHP, act, upcomingElites, deck, relics, character } = context;

  const hpPercent = (currentHP / maxHP) * 100;
  const hpCritical = isHPCritical(currentHP, maxHP, act);

  // REST evaluation
  const restHeal = Math.floor(maxHP * 0.3);
  let restPriority: 'must-do' | 'strong' | 'consider' | 'avoid';
  const restReasoning: string[] = [];

  if (hpCritical) {
    restPriority = 'must-do';
    restReasoning.push(`🔥 CRITICAL HP: ${currentHP}/${maxHP} (${Math.floor(hpPercent)}%)`);
    restReasoning.push(`Heal ${restHeal} HP to survive upcoming fights`);
    if (upcomingElites > 0) {
      restReasoning.push(`${upcomingElites} elite(s) remaining - you need HP!`);
    }
  } else if (hpPercent < 80) {
    restPriority = 'strong';
    restReasoning.push(`Good HP: ${currentHP}/${maxHP} (${Math.floor(hpPercent)}%)`);
    restReasoning.push(`Heal ${restHeal} HP for safety`);
  } else {
    restPriority = 'avoid';
    restReasoning.push(`High HP: ${currentHP}/${maxHP} (${Math.floor(hpPercent)}%)`);
    restReasoning.push(`Don't waste this rest site - upgrade instead`);
  }

  recommendations.push({
    action: 'rest',
    priority: restPriority,
    reasoning: restReasoning,
    hpGain: restHeal,
  });

  // UPGRADE evaluation
  const upgradePriorities = getUpgradePriority(deck, relics, character, act);
  const bestUpgrade = upgradePriorities[0];

  let upgradePriority: 'must-do' | 'strong' | 'consider' | 'avoid';
  const upgradeReasoning: string[] = [];

  if (!bestUpgrade) {
    upgradePriority = 'avoid';
    upgradeReasoning.push('No cards to upgrade');
  } else if (hpCritical) {
    upgradePriority = 'avoid';
    upgradeReasoning.push('HP is too low - rest instead');
    upgradeReasoning.push(`Best upgrade would be: ${bestUpgrade.card}`);
  } else if (hpPercent >= 80) {
    upgradePriority = 'must-do';
    upgradeReasoning.push(`HP is safe (${Math.floor(hpPercent)}%) - upgrade for value`);
    upgradeReasoning.push(`Best: ${bestUpgrade.card} - ${bestUpgrade.reason}`);
  } else if (hpPercent >= 60) {
    if (bestUpgrade.priority >= 9) {
      upgradePriority = 'strong';
      upgradeReasoning.push(`High-value upgrade available`);
      upgradeReasoning.push(`Best: ${bestUpgrade.card} - ${bestUpgrade.reason}`);
    } else {
      upgradePriority = 'consider';
      upgradeReasoning.push(`HP: ${currentHP}/${maxHP} - upgrade if you feel safe`);
      upgradeReasoning.push(`Best: ${bestUpgrade.card}`);
    }
  } else {
    upgradePriority = 'consider';
    upgradeReasoning.push(`HP: ${currentHP}/${maxHP} - risky but might be worth`);
    upgradeReasoning.push(`Best: ${bestUpgrade.card} - ${bestUpgrade.reason}`);
  }

  recommendations.push({
    action: 'upgrade',
    priority: upgradePriority,
    reasoning: upgradeReasoning,
    upgradeTarget: bestUpgrade?.card,
  });

  // SMITH evaluation (if available via relic)
  const hasPeacePipe = relics.some(r => r.toLowerCase().includes('peace pipe'));
  const hasSmith = relics.some(r => r.toLowerCase().includes('shovel')); // Shovel lets you dig

  if (hasPeacePipe) {
    // Peace Pipe: Can remove a card at rest sites
    const strikes = deck.filter(c => c.toLowerCase().includes('strike') && !c.includes('+')).length;
    const defends = deck.filter(c => c.toLowerCase().includes('defend') && !c.includes('+')).length;
    const curses = deck.filter(c => {
      const card = getCardData(c);
      return card?.type === 'curse';
    });

    let smithPriority: 'must-do' | 'strong' | 'consider' | 'avoid';
    const smithReasoning: string[] = [];
    let cardToRemove: string | undefined;

    if (curses.length > 0) {
      smithPriority = hpCritical ? 'strong' : 'must-do';
      smithReasoning.push('Peace Pipe: Remove curse');
      cardToRemove = curses[0];
    } else if (act >= 2 && strikes > 0) {
      smithPriority = hpCritical ? 'consider' : 'strong';
      smithReasoning.push('Peace Pipe: Remove Strike');
      cardToRemove = deck.find(c => c.toLowerCase().includes('strike'));
    } else if (act >= 3 && defends > 3) {
      smithPriority = hpCritical ? 'consider' : 'consider';
      smithReasoning.push('Peace Pipe: Remove extra Defend');
      cardToRemove = deck.find(c => c.toLowerCase().includes('defend'));
    } else {
      smithPriority = 'avoid';
      smithReasoning.push('Peace Pipe: No priority removals');
    }

    recommendations.push({
      action: 'smith',
      priority: smithPriority,
      reasoning: smithReasoning,
      cardToRemove,
    });
  }

  // LIFT evaluation (Girya relic)
  const hasGirya = relics.some(r => r.toLowerCase().includes('girya'));
  if (hasGirya && character.toLowerCase() === 'ironclad') {
    const liftPriority = hpCritical ? 'consider' : 'strong';
    recommendations.push({
      action: 'lift',
      priority: liftPriority,
      reasoning: [
        'Girya: Gain +1 Strength',
        hpCritical ? 'HP is low - might want to rest instead' : 'Permanent strength scaling',
      ],
    });
  }

  // Sort by priority
  const priorityOrder = { 'must-do': 0, strong: 1, consider: 2, avoid: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

/**
 * Generate rest site strategy
 */
export function generateRestSiteStrategy(recommendations: RestSiteRecommendation[]): string {
  const strategy: string[] = [];

  const topRec = recommendations[0];

  if (topRec.priority === 'must-do') {
    if (topRec.action === 'rest') {
      strategy.push(`🔥 PRIORITY: REST (heal ${topRec.hpGain} HP)`);
    } else if (topRec.action === 'upgrade') {
      strategy.push(`🔥 PRIORITY: UPGRADE ${topRec.upgradeTarget}`);
    } else if (topRec.action === 'smith') {
      strategy.push(`🔥 PRIORITY: SMITH (remove ${topRec.cardToRemove})`);
    }
    strategy.push(topRec.reasoning[0]);
  } else {
    strategy.push('💡 Rest Site Options:');
    recommendations.slice(0, 2).forEach(rec => {
      if (rec.priority !== 'avoid') {
        strategy.push(`• ${rec.action.toUpperCase()}: ${rec.reasoning[0]}`);
      }
    });
  }

  return strategy.join('\n');
}

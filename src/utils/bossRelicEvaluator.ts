import type { Card, Relic, CharacterType } from '../types';

export interface BossRelicEvaluation {
  rating: 'must-take' | 'good-take' | 'situational' | 'skip';
  reason: string;
}

/**
 * Evaluates a boss relic based on current deck and run state
 * Boss relics have powerful effects but significant drawbacks
 */
export function evaluateBossRelic(
  relic: Relic,
  deck: Card[],
  currentRelics: Relic[],
  character: CharacterType
): BossRelicEvaluation {
  const deckSize = deck.length;
  const avgCost = deck.reduce((sum, c) => sum + c.cost, 0) / Math.max(deckSize, 1);
  const attackCount = deck.filter(c => c.type === 'attack').length;
  const powerCount = deck.filter(c => c.type === 'power').length;

  // Snecko Eye - Randomize costs, draw 2 extra cards
  if (relic.id === 'snecko_eye') {
    if (avgCost >= 1.5) {
      return {
        rating: 'must-take',
        reason: `High avg cost (${avgCost.toFixed(1)}) - Snecko Eye makes expensive cards playable. Draw 2 extra = huge value.`
      };
    }
    if (avgCost >= 1.2) {
      return {
        rating: 'good-take',
        reason: `Decent avg cost (${avgCost.toFixed(1)}). Draw 2 extra cards is powerful, randomized costs manageable.`
      };
    }
    return {
      rating: 'situational',
      reason: `Low avg cost (${avgCost.toFixed(1)}) - might make cheap cards worse. Draw power is good but risky.`
    };
  }

  // Runic Pyramid - Retain all cards between turns
  if (relic.id === 'runic_pyramid') {
    const drawCards = deck.filter(c => c.tags.includes('draw')).length;
    const statusCards = deck.filter(c => c.type === 'status').length;

    if (drawCards >= 3 && statusCards === 0) {
      return {
        rating: 'must-take',
        reason: `${drawCards} draw cards + no statuses = perfect for Pyramid. Infinite hand size is broken.`
      };
    }
    if (statusCards >= 3) {
      return {
        rating: 'skip',
        reason: `${statusCards} status cards - Pyramid will clog your hand. Very dangerous.`
      };
    }
    return {
      rating: 'good-take',
      reason: 'Retain hand between turns is very strong. Requires careful discard management.'
    };
  }

  // Velvet Choker - Gain 1 energy, can only play 6 cards per turn
  if (relic.id === 'velvet_choker') {
    const zeroOrOneCostCards = deck.filter(c => c.cost <= 1).length;
    const ratio = zeroOrOneCostCards / Math.max(deckSize, 1);

    if (ratio > 0.6) {
      return {
        rating: 'skip',
        reason: `${Math.round(ratio * 100)}% low-cost cards - you'll hit 6-card limit often. Choker hurts.`
      };
    }
    if (avgCost >= 1.5) {
      return {
        rating: 'good-take',
        reason: `High avg cost (${avgCost.toFixed(1)}) - you rarely play 6+ cards. Energy boss relic!`
      };
    }
    return {
      rating: 'situational',
      reason: `Avg cost ${avgCost.toFixed(1)}. +1 energy is great but 6-card limit can hurt.`
    };
  }

  // Runic Dome - Gain 1 energy, cannot see enemy intents
  if (relic.id === 'runic_dome') {
    return {
      rating: 'situational',
      reason: '+1 energy is massive, but blind play is very risky. Only take if you know all enemy patterns.'
    };
  }

  // Philosopher's Stone - Gain 1 energy, enemies start with +1 Strength
  if (relic.id === 'philosophers_stone') {
    const blockCards = deck.filter(c => c.tags.includes('block')).length;
    const blockRatio = blockCards / Math.max(deckSize, 1);

    if (blockRatio >= 0.3) {
      return {
        rating: 'good-take',
        reason: `${blockCards} block cards (${Math.round(blockRatio * 100)}%) - you can handle +1 enemy Strength. Energy is worth it.`
      };
    }
    return {
      rating: 'situational',
      reason: `Low block (${blockCards} cards). +1 enemy Strength hurts. Energy is tempting but risky.`
    };
  }

  // Ectoplasm - Gain 1 energy, cannot gain gold
  if (relic.id === 'ectoplasm') {
    const act = Math.floor((deckSize - 10) / 10) + 1; // Rough act estimate
    if (act >= 3) {
      return {
        rating: 'good-take',
        reason: 'Act 3 - shops less important. +1 energy for rest of run is huge value.'
      };
    }
    return {
      rating: 'situational',
      reason: 'Early game - no gold means no shops/removals. +1 energy is great but limits options.'
    };
  }

  // Sozu - Gain 1 energy, cannot obtain potions
  if (relic.id === 'sozu') {
    return {
      rating: 'good-take',
      reason: '+1 energy is worth losing potions. Potions are nice but energy wins games.'
    };
  }

  // Fusion Hammer - Gain 1 energy, cannot smith (upgrade) at campfires
  if (relic.id === 'fusion_hammer') {
    const upgradedCards = deck.filter(c => c.upgraded).length;
    const upgradeRatio = upgradedCards / Math.max(deckSize, 1);

    if (upgradeRatio >= 0.5) {
      return {
        rating: 'good-take',
        reason: `${Math.round(upgradeRatio * 100)}% deck upgraded - you don't need more smithing. Energy is king.`
      };
    }
    return {
      rating: 'situational',
      reason: `Only ${Math.round(upgradeRatio * 100)}% upgraded. Losing smithing hurts but +1 energy is strong.`
    };
  }

  // Cursed Key - Gain 1 energy, gain 1 curse on chest/boss
  if (relic.id === 'cursed_key') {
    return {
      rating: 'good-take',
      reason: '+1 energy, curses are manageable. Remove at shops or just deal with bloat. Worth it.'
    };
  }

  // Champion Belt - Ironclad only, apply Weak on Heavy Blade kill
  if (relic.id === 'champs_belt') {
    if (character === 'ironclad') {
      const heavyBlades = deck.filter(c => c.id === 'heavy_blade').length;
      if (heavyBlades > 0) {
        return {
          rating: 'good-take',
          reason: `${heavyBlades} Heavy Blade(s) - Belt gives vulnerability on kill. Good sustain.`
        };
      }
      return {
        rating: 'situational',
        reason: 'No Heavy Blade yet, but Belt is decent Ironclad boss relic.'
      };
    }
    return {
      rating: 'skip',
      reason: 'Wrong character - Champion Belt only works for Ironclad.'
    };
  }

  // Default evaluation
  return {
    rating: 'situational',
    reason: 'Boss relic with unique effect. Evaluate based on your specific situation.'
  };
}

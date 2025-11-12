import type { Card, Relic, CharacterType } from '../types';

export interface EventChoice {
  id: string;
  description: string;
  outcome: string;
  goldCost?: number;
  hpCost?: number;
  maxHpCost?: number;
}

export interface EventAdvice {
  recommendedChoice: string;
  rating: 'highly-recommended' | 'recommended' | 'situational' | 'avoid';
  reason: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  choices: EventChoice[];
  image?: string;
}

/**
 * Helper function to get event image path
 */
export function getEventImagePath(eventId: string): string {
  const imageMap: Record<string, string> = {
    'golden_shrine': 'goldShrine.jpg',
    'wing_statue': 'goldenWing.jpg',
    'shining_light': 'fountain.jpg',
    'world_of_goop': 'goopPuddle.jpg',
    'big_fish': 'fishing.jpg',
    'scrap_ooze': 'goopPuddle.jpg',
    'old_beggar': 'beggar.jpg',
    'match_and_keep': 'ballAndCup.jpg',
    'the_moai_head': 'forgottenAltar.jpg',
    'knowing_skull': 'knowingSkull.jpg',
    'cursed_tome': 'cursedTome.jpg',
    'neow_event': 'neow.jpg',
    'face_trader': 'facelessTrader.jpg',
    'drug_dealer': 'drugDealer.jpg',
    'the_library': 'lab.jpg',
    'bonfire_spirits': 'bonfire.jpg',
    'upgrade_shrine': 'shrine1.jpg',
    'purifier': 'cleric.jpg',
    'golden_idol': 'goldenIdol.jpg',
    'ghost_in_a_jar': 'ghost.jpg',
    'designer': 'designer2.jpg',
    'the_colosseum': 'colosseum.jpg',
    'masked_bandits': 'falling.jpg',
    'living_wall': 'forgottenAltar.jpg',
    'council_of_ghosts': 'ghost.jpg',
  };

  return `/images/events/${imageMap[eventId] || 'forgottenAltar.jpg'}`;
}

/**
 * Common Slay the Spire events from ? rooms
 */
export const EVENTS: Event[] = [
  {
    id: 'golden_shrine',
    name: 'Golden Shrine',
    description: 'A shrine radiates golden light. You may make an offering.',
    choices: [
      {
        id: 'pray',
        description: 'Pray',
        outcome: 'Gain 100 gold',
      },
      {
        id: 'desecrate',
        description: 'Desecrate',
        outcome: 'Lose 50 gold, gain 275 gold',
        goldCost: 50,
      },
      {
        id: 'leave',
        description: 'Leave',
        outcome: 'Nothing happens',
      },
    ],
  },
  {
    id: 'wing_statue',
    name: 'Wing Statue',
    description: 'A statue with outstretched wings. You may pray for removal.',
    choices: [
      {
        id: 'remove',
        description: 'Remove a card',
        outcome: 'Remove 1 card from your deck (free)',
      },
      {
        id: 'leave',
        description: 'Leave',
        outcome: 'Nothing happens',
      },
    ],
  },
  {
    id: 'shining_light',
    name: 'Shining Light',
    description: 'Two beams of light illuminate cards in your deck.',
    choices: [
      {
        id: 'upgrade_two',
        description: 'Enter the light',
        outcome: 'Upgrade 2 random cards',
      },
      {
        id: 'leave',
        description: 'Leave',
        outcome: 'Nothing happens',
      },
    ],
  },
  {
    id: 'world_of_goop',
    name: 'World of Goop',
    description: 'Everything is covered in slime. A strange portal beckons.',
    choices: [
      {
        id: 'gold',
        description: 'Take gold',
        outcome: 'Gain 75 gold',
      },
      {
        id: 'curse',
        description: 'Take curse for relic',
        outcome: 'Gain 1 curse, gain 1 random relic',
      },
      {
        id: 'leave',
        description: 'Leave',
        outcome: 'Nothing happens',
      },
    ],
  },
  {
    id: 'big_fish',
    name: 'Big Fish',
    description: 'A massive fish offers you a choice.',
    choices: [
      {
        id: 'banana',
        description: 'Banana (Max HP)',
        outcome: 'Gain 5 Max HP',
      },
      {
        id: 'donut',
        description: 'Donut (Heal)',
        outcome: 'Heal 33% of Max HP',
      },
      {
        id: 'box',
        description: 'Box (Relic)',
        outcome: 'Gain 1 random relic',
      },
    ],
  },
  {
    id: 'scrap_ooze',
    name: 'Scrap Ooze',
    description: 'A pile of scrap and ooze. You can dig through it.',
    choices: [
      {
        id: 'dig',
        description: 'Dig',
        outcome: 'Lose 3 HP, gain 1 random relic',
        hpCost: 3,
      },
      {
        id: 'leave',
        description: 'Leave',
        outcome: 'Nothing happens',
      },
    ],
  },
  {
    id: 'golden_idol',
    name: 'Golden Idol',
    description: 'A golden idol sits on a pedestal. Obtain it?',
    choices: [
      {
        id: 'take',
        description: 'Take the idol',
        outcome: 'Gain 250 gold, obtain Curse of the Idol',
      },
      {
        id: 'leave',
        description: 'Leave',
        outcome: 'Nothing happens',
      },
    ],
  },
  {
    id: 'wheel_of_change',
    name: 'Wheel of Change',
    description: 'Spin the wheel for a random transformation.',
    choices: [
      {
        id: 'spin',
        description: 'Spin the wheel',
        outcome: 'Transform 2 random cards (random rarity)',
      },
      {
        id: 'leave',
        description: 'Leave',
        outcome: 'Nothing happens',
      },
    ],
  },
  {
    id: 'match_and_keep',
    name: 'Match and Keep!',
    description: 'A strange game show! Match cards to win prizes.',
    choices: [
      {
        id: 'play',
        description: 'Play the game',
        outcome: 'Matching game (can win relics, gold, or lose HP)',
        goldCost: 50,
      },
      {
        id: 'leave',
        description: 'Leave',
        outcome: 'Nothing happens',
      },
    ],
  },
  {
    id: 'mushrooms',
    name: 'Mushrooms',
    description: 'Colorful mushrooms grow here. Eat one?',
    choices: [
      {
        id: 'eat',
        description: 'Eat a mushroom',
        outcome: 'Random effect (heal, damage, max HP change)',
      },
      {
        id: 'leave',
        description: 'Leave',
        outcome: 'Nothing happens',
      },
    ],
  },
  {
    id: 'old_beggar',
    name: 'Old Beggar',
    description: 'An old beggar asks for gold.',
    choices: [
      {
        id: 'give_75',
        description: 'Give 75 gold',
        outcome: 'Gain 1 random relic',
        goldCost: 75,
      },
      {
        id: 'give_all',
        description: 'Give all gold',
        outcome: 'Purge (remove) 2 cards from your deck',
        goldCost: -1, // Special: all gold
      },
      {
        id: 'refuse',
        description: 'Refuse',
        outcome: 'Obtain a curse',
      },
    ],
  },
  {
    id: 'lab',
    name: 'The Laboratory',
    description: 'A mysterious laboratory with strange apparatus.',
    choices: [
      {
        id: 'drink',
        description: 'Drink the potion',
        outcome: 'Random effect (gain 3 random potions)',
      },
      {
        id: 'leave',
        description: 'Leave',
        outcome: 'Nothing happens',
      },
    ],
  },
  {
    id: 'nest',
    name: 'Nest',
    description: 'A bird nest with a golden egg.',
    choices: [
      {
        id: 'take',
        description: 'Take the egg',
        outcome: 'Gain 250 gold, fight 3 Byrds',
      },
      {
        id: 'leave',
        description: 'Leave',
        outcome: 'Gain 1 random relic',
      },
    ],
  },
  {
    id: 'cursed_tome',
    name: 'Cursed Tome',
    description: 'A book emanates dark energy.',
    choices: [
      {
        id: 'read',
        description: 'Read the book',
        outcome: 'Gain 1-3 curses, obtain 1-2 random relics',
      },
      {
        id: 'leave',
        description: 'Leave',
        outcome: 'Nothing happens',
      },
    ],
  },
  {
    id: 'face_trader',
    name: 'Face Trader',
    description: 'A mysterious figure offers to trade faces.',
    choices: [
      {
        id: 'trade',
        description: 'Trade faces',
        outcome: 'Lose all gold, transform 2 random cards, gain 1 random relic',
      },
      {
        id: 'refuse',
        description: 'Refuse',
        outcome: 'Nothing happens',
      },
    ],
  },
  {
    id: 'vampire',
    name: 'Vampires',
    description: 'Mysterious vampires offer power at a price.',
    choices: [
      {
        id: 'accept',
        description: 'Accept their gift',
        outcome: 'Lose 30% Max HP, remove all Strikes, gain 5 Bite cards',
        maxHpCost: 0.3,
      },
      {
        id: 'refuse',
        description: 'Refuse',
        outcome: 'Gain 5 Max HP',
      },
    ],
  },
];

/**
 * Evaluates event choices based on current run state
 */
export function evaluateEventChoice(
  event: Event,
  choice: EventChoice,
  currentHp: number,
  maxHp: number,
  gold: number,
  deck: Card[],
  relics: Relic[],
  character: CharacterType
): EventAdvice {
  const hpPercent = currentHp / Math.max(maxHp, 1);
  const deckSize = deck.length;

  // Golden Shrine
  if (event.id === 'golden_shrine') {
    if (choice.id === 'desecrate' && gold >= 50) {
      return {
        recommendedChoice: choice.id,
        rating: 'highly-recommended',
        reason: 'Net +225 gold profit is excellent value. Always take this.',
      };
    }
    if (choice.id === 'pray') {
      return {
        recommendedChoice: choice.id,
        rating: 'recommended',
        reason: '+100 gold is decent if you can\'t afford Desecrate.',
      };
    }
    return {
      recommendedChoice: choice.id,
      rating: 'avoid',
      reason: 'Free gold is always valuable. Don\'t skip this event.',
    };
  }

  // Wing Statue
  if (event.id === 'wing_statue') {
    if (choice.id === 'remove') {
      const hasCurse = deck.some(c => c.type === 'curse');
      const hasStrike = deck.some(c => c.id.includes('strike'));

      if (hasCurse) {
        return {
          recommendedChoice: choice.id,
          rating: 'highly-recommended',
          reason: 'Free removal! Remove curses first, then Strikes/Defends.',
        };
      }
      if (hasStrike || deckSize > 20) {
        return {
          recommendedChoice: choice.id,
          rating: 'highly-recommended',
          reason: 'Free removal is always valuable. Slim your deck.',
        };
      }
      return {
        recommendedChoice: choice.id,
        rating: 'recommended',
        reason: 'Free removal is good. Consider removing basic cards.',
      };
    }
  }

  // Shining Light
  if (event.id === 'shining_light') {
    if (choice.id === 'upgrade_two') {
      const unupgradedCards = deck.filter(c => !c.upgraded).length;
      if (unupgradedCards >= 5) {
        return {
          recommendedChoice: choice.id,
          rating: 'highly-recommended',
          reason: `${unupgradedCards} unupgraded cards. Free upgrades are excellent.`,
        };
      }
      return {
        recommendedChoice: choice.id,
        rating: 'recommended',
        reason: 'Free upgrades are always good. Take this.',
      };
    }
  }

  // World of Goop
  if (event.id === 'world_of_goop') {
    if (choice.id === 'curse') {
      const relicCount = relics.length;
      if (relicCount < 5) {
        return {
          recommendedChoice: choice.id,
          rating: 'highly-recommended',
          reason: 'Early game: relics outweigh curse cost. Remove curse at shops.',
        };
      }
      return {
        recommendedChoice: choice.id,
        rating: 'situational',
        reason: 'Relic is good but curse hurts. Only if you can remove it soon.',
      };
    }
    if (choice.id === 'gold') {
      return {
        recommendedChoice: choice.id,
        rating: 'recommended',
        reason: '75 gold is solid. Safe choice if you don\'t want curse.',
      };
    }
  }

  // Big Fish
  if (event.id === 'big_fish') {
    if (choice.id === 'box') {
      return {
        recommendedChoice: choice.id,
        rating: 'highly-recommended',
        reason: 'Free relic is almost always best choice. Relics win runs.',
      };
    }
    if (choice.id === 'banana' && maxHp < 60) {
      return {
        recommendedChoice: choice.id,
        rating: 'recommended',
        reason: 'Low max HP build. +5 Max HP is valuable.',
      };
    }
    if (choice.id === 'donut' && hpPercent < 0.5) {
      return {
        recommendedChoice: choice.id,
        rating: 'situational',
        reason: `Low HP (${Math.round(hpPercent * 100)}%). Heal is tempting but relic usually better.`,
      };
    }
  }

  // Scrap Ooze
  if (event.id === 'scrap_ooze') {
    if (choice.id === 'dig') {
      if (currentHp > 10) {
        return {
          recommendedChoice: choice.id,
          rating: 'highly-recommended',
          reason: `You have ${currentHp} HP. Lose 3 HP for relic is excellent value.`,
        };
      }
      return {
        recommendedChoice: choice.id,
        rating: 'avoid',
        reason: `Only ${currentHp} HP. Too risky to lose 3 HP.`,
      };
    }
  }

  // Golden Idol
  if (event.id === 'golden_idol') {
    if (choice.id === 'take') {
      return {
        recommendedChoice: choice.id,
        rating: 'recommended',
        reason: '250 gold is huge. Curse hurts but gold can remove it at shop.',
      };
    }
  }

  // Wheel of Change
  if (event.id === 'wheel_of_change') {
    if (choice.id === 'spin') {
      const weakCards = deck.filter(c => c.tier === 'D' || c.tier === 'F' || c.id.includes('strike') || c.id.includes('defend')).length;
      if (weakCards >= 8) {
        return {
          recommendedChoice: choice.id,
          rating: 'highly-recommended',
          reason: `${weakCards} weak cards. High chance to transform into better cards.`,
        };
      }
      if (weakCards >= 5) {
        return {
          recommendedChoice: choice.id,
          rating: 'recommended',
          reason: 'Some weak cards. Wheel is a gamble but usually beneficial.',
        };
      }
      return {
        recommendedChoice: choice.id,
        rating: 'situational',
        reason: 'Good deck already. Wheel is risky. Only if you feel lucky.',
      };
    }
  }

  // Old Beggar
  if (event.id === 'old_beggar') {
    const hasCurses = deck.filter(c => c.type === 'curse').length;
    const hasBasics = deck.filter(c => c.id.includes('strike') || c.id.includes('defend')).length;

    if (choice.id === 'give_all' && (hasCurses >= 2 || hasBasics >= 8)) {
      return {
        recommendedChoice: choice.id,
        rating: 'highly-recommended',
        reason: `${hasCurses} curses + ${hasBasics} basics. Remove 2 cards worth all your gold!`,
      };
    }
    if (choice.id === 'give_75' && gold >= 75) {
      return {
        recommendedChoice: choice.id,
        rating: 'recommended',
        reason: '75 gold for relic is fair trade. Only if you have spare gold.',
      };
    }
    if (choice.id === 'refuse') {
      return {
        recommendedChoice: choice.id,
        rating: 'avoid',
        reason: 'Getting a curse is bad. Better to give something.',
      };
    }
  }

  // Nest
  if (event.id === 'nest') {
    if (choice.id === 'leave') {
      return {
        recommendedChoice: choice.id,
        rating: 'highly-recommended',
        reason: 'Free relic is amazing! Leave the egg - 3 Byrds are tough.',
      };
    }
    if (choice.id === 'take' && currentHp > 40 && hpPercent > 0.6) {
      return {
        recommendedChoice: choice.id,
        rating: 'situational',
        reason: `Strong deck + high HP (${currentHp}). Can fight Byrds for 250 gold.`,
      };
    }
  }

  // Vampires
  if (event.id === 'vampire') {
    if (choice.id === 'accept') {
      const strikes = deck.filter(c => c.id.includes('strike')).length;
      if (strikes >= 4 && maxHp >= 60) {
        return {
          recommendedChoice: choice.id,
          rating: 'highly-recommended',
          reason: `${strikes} Strikes removed, gain 5 Bite cards (heal on hit). Max HP cost manageable.`,
        };
      }
      if (maxHp < 50) {
        return {
          recommendedChoice: choice.id,
          rating: 'avoid',
          reason: `Max HP too low (${maxHp}). -30% would cripple you.`,
        };
      }
      return {
        recommendedChoice: choice.id,
        rating: 'situational',
        reason: 'Bite cards are strong but -30% Max HP is steep. Risky.',
      };
    }
    if (choice.id === 'refuse') {
      return {
        recommendedChoice: choice.id,
        rating: 'recommended',
        reason: '+5 Max HP is safe and always good. Vampires are risky.',
      };
    }
  }

  // Cursed Tome
  if (event.id === 'cursed_tome') {
    if (choice.id === 'read') {
      return {
        recommendedChoice: choice.id,
        rating: 'situational',
        reason: '1-3 curses for 1-2 relics. High risk, high reward. Only if desperate for relics.',
      };
    }
  }

  // Face Trader
  if (event.id === 'face_trader') {
    if (choice.id === 'trade') {
      const weakCards = deck.filter(c => c.tier === 'D' || c.tier === 'F').length;
      if (gold > 200 && weakCards >= 4) {
        return {
          recommendedChoice: choice.id,
          rating: 'situational',
          reason: 'Lots of gold + weak cards. Trading can be worth it for transforms + relic.',
        };
      }
      return {
        recommendedChoice: choice.id,
        rating: 'avoid',
        reason: 'Lose ALL gold. Very risky. Only if you have excess gold.',
      };
    }
  }

  // Default: safe/leave choices
  return {
    recommendedChoice: choice.id,
    rating: 'situational',
    reason: 'Evaluate based on your current situation.',
  };
}

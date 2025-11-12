import type { Card, Relic, CharacterType } from '../types';
import { detectArchetype } from './archetypeDetection';

export interface ShopAdvice {
  cardPriorities: string[];
  relicPriorities: string[];
  removalPriorities: string[];
  generalAdvice: string;
  recommendedCardIds: string[]; // Card IDs to show with images
  cardsToAvoid: string[]; // Card IDs to avoid
}

/**
 * Generates shop advice based on current deck and archetype
 */
export function generateShopAdvice(
  deck: Card[],
  relics: Relic[],
  character: CharacterType,
  gold: number
): ShopAdvice {
  const archetype = detectArchetype(deck, relics, character);
  const deckSize = deck.length;

  const cardPriorities: string[] = [];
  const relicPriorities: string[] = [];
  const removalPriorities: string[] = [];
  const recommendedCardIds: string[] = [];
  const cardsToAvoid: string[] = [];
  let generalAdvice = '';

  // Helper to check archetype names
  const hasArchetype = (name: string) =>
    archetype.primary?.includes(name) || archetype.secondary?.includes(name);

  // Card priorities based on archetype
  if (hasArchetype('Poison')) {
    cardPriorities.push('Catalyst, Noxious Fumes, or other poison cards');
    cardPriorities.push('Card draw to cycle through poison faster');
    recommendedCardIds.push('catalyst', 'noxious_fumes', 'bouncing_flask', 'corpse_explosion', 'envenom', 'deadly_poison');
    cardsToAvoid.push('blade_dance', 'accuracy', 'finisher', 'grand_finale');
  } else if (hasArchetype('Shiv')) {
    cardPriorities.push('Accuracy, After Image, or A Thousand Cuts');
    cardPriorities.push('More shiv generators (Blade Dance, Cloak and Dagger)');
    recommendedCardIds.push('accuracy', 'after_image', 'a_thousand_cuts', 'blade_dance', 'cloak_and_dagger', 'infinite_blades', 'storm_of_steel');
    cardsToAvoid.push('deadly_poison', 'noxious_fumes', 'catalyst', 'grand_finale');
  } else if (hasArchetype('Strength')) {
    cardPriorities.push('Limit Break, Spot Weakness, or Inflame');
    cardPriorities.push('Heavy-hitting attacks (Heavy Blade, Sword Boomerang)');
    recommendedCardIds.push('limit_break', 'spot_weakness', 'inflame', 'demon_form', 'heavy_blade', 'sword_boomerang', 'reaper');
    cardsToAvoid.push('clash', 'rampage', 'wild_strike', 'reckless_charge');
  } else if (hasArchetype('Block')) {
    cardPriorities.push('Barricade, Entrench, or Body Slam');
    cardPriorities.push('More block generation (Impervious, Glacier)');
    recommendedCardIds.push('barricade', 'entrench', 'body_slam', 'impervious', 'metallicize', 'flame_barrier');
    cardsToAvoid.push('rampage', 'heavy_blade', 'bludgeon', 'carnage');
  } else if (hasArchetype('Frost')) {
    cardPriorities.push('Glacier, Blizzard, or Frost orb generation');
    cardPriorities.push('Focus-scaling cards (Defragment, Capacitor)');
    recommendedCardIds.push('glacier', 'blizzard', 'coolheaded', 'defragment', 'capacitor', 'consume', 'loop');
    cardsToAvoid.push('claw', 'all_for_one', 'scrape', 'go_for_the_eyes');
  } else if (hasArchetype('Lightning')) {
    cardPriorities.push('Electrodynamics, Thunder Strike, or Lightning orbs');
    cardPriorities.push('Focus and orb slots (Defragment, Capacitor)');
    recommendedCardIds.push('electrodynamics', 'ball_lightning', 'thunder_strike', 'defragment', 'capacitor', 'static_discharge');
    cardsToAvoid.push('coolheaded', 'glacier', 'blizzard', 'darkness');
  } else if (hasArchetype('Stance')) {
    cardPriorities.push('Rushdown, Mental Fortress, or stance cards');
    cardPriorities.push('Divinity enablers (Worship, Devotion)');
    recommendedCardIds.push('rushdown', 'mental_fortress', 'tantrum', 'tranquility', 'fear_no_evil', 'worship', 'devotion');
    cardsToAvoid.push('conclude', 'judgement', 'sands_of_time');
  } else {
    // Generic advice by character
    cardPriorities.push('Damage scaling (powers or synergistic attacks)');
    cardPriorities.push('AOE for hallway fights');
    cardPriorities.push('Frontloaded damage or card draw');

    if (character === 'ironclad') {
      recommendedCardIds.push('offering', 'battle_trance', 'immolate', 'whirlwind', 'shrug_it_off', 'spot_weakness');
      cardsToAvoid.push('cleave', 'clash', 'wild_strike', 'reckless_charge');
    } else if (character === 'silent') {
      recommendedCardIds.push('footwork', 'backflip', 'dash', 'piercing_wail', 'malaise', 'wraith_form');
      cardsToAvoid.push('quick_slash', 'sneaky_strike', 'all_out_attack', 'slice');
    } else if (character === 'defect') {
      recommendedCardIds.push('defragment', 'biased_cognition', 'echo_form', 'seek', 'skim', 'aggregate');
      cardsToAvoid.push('beam_cell', 'go_for_the_eyes', 'charge_battery', 'doom_and_gloom');
    } else if (character === 'watcher') {
      recommendedCardIds.push('scrawl', 'talk_to_the_hand', 'flurry_of_blows', 'third_eye', 'empty_fist', 'inner_peace');
      cardsToAvoid.push('follow_up', 'just_lucky', 'carve_reality', 'consecrate');
    }
  }

  // Relic priorities
  relicPriorities.push('Energy relics (Lantern, Happy Flower, Ice Cream)');

  if (hasArchetype('Poison')) {
    relicPriorities.push('Snecko Eye (for expensive poison cards)');
    relicPriorities.push('Runic Pyramid (keep Catalyst in hand)');
  } else if (hasArchetype('Shiv')) {
    relicPriorities.push('Kunai, Shuriken, or Ornamental Fan');
    relicPriorities.push('Tough Bandages (for discards)');
  } else if (hasArchetype('Strength')) {
    relicPriorities.push('Girya, Vajra, or damage-boosting relics');
  } else if (hasArchetype('Frost') || hasArchetype('Lightning')) {
    relicPriorities.push('Cracked Core, Frozen Core, or Focus relics');
    relicPriorities.push('Gold-plated Cables (more orb slots)');
  }

  // Removal priorities
  const strikes = deck.filter(c => c.id.includes('strike')).length;
  const defends = deck.filter(c => c.id.includes('defend')).length;
  const curses = deck.filter(c => c.type === 'curse').length;

  if (curses > 0) {
    removalPriorities.push(`Remove curses first (${curses} in deck)`);
  }
  if (strikes > 3 && deckSize > 15) {
    removalPriorities.push(`Remove Strikes (${strikes} remaining)`);
  }
  if (defends > 3 && deckSize > 20) {
    removalPriorities.push(`Consider removing Defends (${defends} remaining)`);
  }

  removalPriorities.push('Remove situational cards with no synergies');

  // General advice based on gold
  if (gold < 100) {
    generalAdvice = 'Low on gold - prioritize card removal over purchases if you have dead cards.';
  } else if (gold < 200) {
    generalAdvice = 'Moderate gold - look for 1-2 impactful purchases (cards or relics).';
  } else if (gold >= 300) {
    generalAdvice = 'High gold - you can afford multiple purchases. Prioritize relics and rare cards.';
  } else {
    generalAdvice = 'Browse carefully - focus on cards/relics that fit your archetype.';
  }

  return {
    cardPriorities,
    relicPriorities,
    removalPriorities,
    generalAdvice,
    recommendedCardIds,
    cardsToAvoid,
  };
}

export interface CardRemovalEvaluation {
  priority: 'must-remove' | 'should-remove' | 'keep';
  reason: string;
}

/**
 * Evaluates whether a card should be removed from the deck
 */
export function evaluateCardRemoval(
  card: Card,
  deck: Card[],
  relics: Relic[]
): CardRemovalEvaluation {
  // Curses are always must-remove
  if (card.type === 'curse') {
    return {
      priority: 'must-remove',
      reason: 'Curse - always remove when possible',
    };
  }

  // Strikes - generally want to remove
  if (card.id.includes('strike')) {
    const strikeCount = deck.filter(c => c.id.includes('strike')).length;
    if (strikeCount > 3) {
      return {
        priority: 'should-remove',
        reason: `Strike - ${strikeCount} remaining, thin deck`,
      };
    }
    return {
      priority: 'keep',
      reason: 'Strike - keep some for early fights',
    };
  }

  // Defends - situational
  if (card.id.includes('defend')) {
    const defendCount = deck.filter(c => c.id.includes('defend')).length;
    const deckSize = deck.length;

    if (defendCount > 4 && deckSize > 20) {
      return {
        priority: 'should-remove',
        reason: `Defend - ${defendCount} remaining, too many`,
      };
    }
    return {
      priority: 'keep',
      reason: 'Defend - needed for blocking',
    };
  }

  // Low-tier cards
  if (card.tierRating <= 2) {
    return {
      priority: 'should-remove',
      reason: 'Low-value card with better alternatives',
    };
  }

  return {
    priority: 'keep',
    reason: 'Useful card - keep',
  };
}

import type { Blessing, BlessingActionType, CardRarity, RelicRarity } from '../types';

/**
 * Determines if a blessing adds a curse
 */
export function blessingAddsCurse(blessing: Blessing): boolean {
  const desc = blessing.description.toLowerCase();
  return desc.includes('obtain a curse') || desc.includes('gain a curse') || desc.includes('curse.');
}

/**
 * Determines the action type needed for a blessing based on its ID and description
 */
export function getBlessingActionType(blessing: Blessing): BlessingActionType {
  const desc = blessing.description.toLowerCase();

  // Card selection blessings (including those with curses)
  if (desc.includes('choose a rare card') || (desc.includes('curse') && desc.includes('rare card'))) {
    return 'choose_rare_card';
  }
  if (desc.includes('choose a card') && desc.includes('colorless')) {
    return 'choose_colorless_card';
  }
  if (desc.includes('choose a card')) {
    return 'choose_card';
  }

  // Potion blessings
  if (desc.includes('3 random potions') || desc.includes('obtain 3 random potions')) {
    return 'choose_potions';
  }

  // Relic selection blessings
  if (desc.includes('obtain a random rare relic') || desc.includes('rare relic')) {
    return 'choose_rare_relic';
  }
  if (desc.includes('obtain a random common relic') || desc.includes('common relic')) {
    return 'choose_common_relic';
  }

  // Card removal blessings
  if (desc.includes('remove 2 cards')) {
    return 'remove_2_cards';
  }
  if (desc.includes('remove a card')) {
    return 'remove_card';
  }

  // Card upgrade
  if (desc.includes('upgrade any card')) {
    return 'upgrade_card';
  }

  // Card transformation
  if (desc.includes('transform 2 cards')) {
    return 'transform_2_cards';
  }
  if (desc.includes('transform a card')) {
    return 'transform_card';
  }

  // Default: no interaction needed (stat changes only)
  return 'none';
}

/**
 * Gets the number of cards to offer for a card selection blessing
 */
export function getCardSelectionCount(actionType: BlessingActionType): number {
  switch (actionType) {
    case 'choose_rare_card':
      return 3; // Show 3 rare cards to choose from
    case 'choose_colorless_card':
      return 3; // Show 3 colorless cards
    case 'choose_card':
      return 3; // Show 3 cards
    default:
      return 0;
  }
}

/**
 * Gets the card rarity for a blessing
 */
export function getCardRarity(actionType: BlessingActionType): CardRarity | null {
  switch (actionType) {
    case 'choose_rare_card':
      return 'rare';
    case 'choose_colorless_card':
      return 'special'; // Colorless cards are typically marked as special
    default:
      return null;
  }
}

/**
 * Gets the relic rarity for a blessing
 */
export function getRelicRarity(actionType: BlessingActionType): RelicRarity | null {
  switch (actionType) {
    case 'choose_rare_relic':
      return 'rare';
    case 'choose_common_relic':
      return 'common';
    default:
      return null;
  }
}

/**
 * Gets the number of relics to offer
 */
export function getRelicSelectionCount(actionType: BlessingActionType): number {
  switch (actionType) {
    case 'choose_rare_relic':
    case 'choose_common_relic':
      return 3; // Show 3 relics to choose from
    default:
      return 0;
  }
}

/**
 * Gets a user-friendly description of what the user needs to do
 */
export function getBlessingActionDescription(actionType: BlessingActionType): string {
  switch (actionType) {
    case 'choose_rare_card':
      return 'Choose 1 rare card to add to your deck';
    case 'choose_colorless_card':
      return 'Choose 1 colorless card to add to your deck';
    case 'choose_card':
      return 'Choose 1 card to add to your deck';
    case 'choose_rare_relic':
      return 'Choose 1 rare relic to obtain';
    case 'choose_common_relic':
      return 'Choose 1 common relic to obtain';
    case 'choose_potions':
      return 'Choose 3 potions to obtain';
    case 'remove_card':
      return 'Choose 1 card to remove from your deck';
    case 'remove_2_cards':
      return 'Choose 2 cards to remove from your deck';
    case 'upgrade_card':
      return 'Choose 1 card to upgrade';
    case 'transform_card':
      return 'Choose 1 card to transform into a random card of the same rarity';
    case 'transform_2_cards':
      return 'Choose 2 cards to transform into random cards of the same rarity';
    case 'none':
      return 'No action required - effects applied automatically';
    default:
      return 'Complete your blessing selection';
  }
}

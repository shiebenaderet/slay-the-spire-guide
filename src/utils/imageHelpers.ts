import type { CharacterType } from '../types';

/**
 * Generates the image path for a card based on character and card ID
 * Handles special cases like strike_r -> strike, defend_r -> defend, etc.
 * Also handles curse and status cards which are in separate folders
 */
export function getCardImagePath(character: CharacterType | 'colorless', cardId: string): string {
  // Strip any index suffix first (e.g., -0, -1, -transformed-123)
  let baseCardId = cardId;
  if (baseCardId.includes('-')) {
    baseCardId = baseCardId.substring(0, baseCardId.indexOf('-'));
  }

  // Curse cards are in /images/cards/curse/
  const curseCards = ['ascenders_bane', 'clumsy', 'curse_of_the_bell', 'decay', 'doubt', 'injury', 'necronomicurse', 'normality', 'pain', 'parasite', 'pride', 'regret', 'shame', 'writhe'];
  if (curseCards.includes(baseCardId)) {
    return `/images/cards/curse/${baseCardId}.png`;
  }

  // Status cards are in /images/cards/status/
  const statusCards = ['burn', 'dazed', 'slimed', 'void', 'wound'];
  if (statusCards.includes(baseCardId)) {
    return `/images/cards/status/${baseCardId}.png`;
  }

  // Remove character suffix from starter cards
  // strike_r, strike_g, strike_b, strike_p -> strike
  // defend_r, defend_g, defend_b, defend_p -> defend
  let imageId = baseCardId;

  // Remove character suffix from starter cards
  if (imageId.match(/^(strike|defend)_[rgbp]$/)) {
    imageId = imageId.substring(0, imageId.lastIndexOf('_'));
  }

  return `/images/cards/${character}/${imageId}.png`;
}

/**
 * Converts snake_case to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Special mapping for relics that don't follow the standard naming convention
 */
const RELIC_NAME_MAPPINGS: Record<string, string> = {
  // Starter relics
  'burning_blood': 'burningBlood',
  'ring_of_the_snake': 'serpent_ring',
  'cracked_core': 'crackedOrb',
  'pure_water': 'clean_water',

  // Common relics
  'art_of_war': 'artOfWar',
  'bag_of_preparation': 'bag_of_prep',
  'bag_of_marbles': 'marbles',
  'ancient_tea_set': 'tea_set',
  'bronze_scales': 'bronzeScales',
  'centennial_puzzle': 'centennialPuzzle',
  'ceramic_fish': 'ceramic_fish',
  'oddly_smooth_stone': 'smooth_stone',
  'pen_nib': 'penNib',
  'preserved_insect': 'insect',
  'blood_vial': 'bloodVial',
  'meal_ticket': 'mealTicket',
  'red_skull': 'red_skull',
  'war_paint': 'warPaint',

  // Uncommon relics
  'bottled_flame': 'bottledFlame',
  'bottled_lightning': 'bottledLightning',
  'bottled_tornado': 'bottledTornado',
  'dark_stone_periapt': 'darkstone',
  'eternal_feather': 'eternal_feather',
  'frozen_egg': 'frozenEgg',
  'horn_cleat': 'horn_cleat',
  'ink_bottle': 'ink_bottle',
  'letter_opener': 'letterOpener',
  'mummified_hand': 'mummifiedHand',
  'ornamental_fan': 'ornamentalFan',
  'paper_crane': 'paperCrane',
  'paper_frog': 'paperFrog',
  'question_card': 'questionCard',
  'singing_bowl': 'singingBowl',
  'strike_dummy': 'dummy',
  'symbiotic_virus': 'virus',
  'the_boot': 'boot',
  'toxic_egg': 'toxicEgg',

  // Rare relics
  'bird_faced_urn': 'bird_urn',
  'dead_branch': 'deadBranch',
  'du_vu_doll': 'duvuDoll',
  'fossilized_helix': 'helix',
  'gambling_chip': 'gamblingChip',
  'gremlin_horn': 'gremlin_horn',
  'ice_cream': 'iceCream',
  'incense_burner': 'incenseBurner',
  'lizard_tail': 'lizardTail',
  'old_coin': 'oldCoin',
  'orange_pellets': 'pellets',
  'peace_pipe': 'peacePipe',
  'prayer_wheel': 'prayerWheel',
  'stone_calendar': 'calendar',
  'tough_bandages': 'tough_bandages',
  'tungsten_rod': 'tungsten',
  'warped_tongs': 'tongs',

  // Boss relics
  'champs_belt': 'championBelt',
  'cursed_key': 'cursedKey',
  'fusion_hammer': 'burnHammer',
  'philosophers_stone': 'philosopherStone',
  'runic_dome': 'runicDome',
  'runic_pyramid': 'runicPyramid',
  'snecko_eye': 'sneckoEye',
  'velvet_choker': 'redChoker',
};

/**
 * Generates the image path for a relic based on relic ID
 * Handles special naming cases and converts snake_case to camelCase
 */
export function getRelicImagePath(relicId: string): string {
  // Check if there's a special mapping
  let imageName = RELIC_NAME_MAPPINGS[relicId];

  // If no special mapping, convert snake_case to camelCase
  if (!imageName) {
    imageName = snakeToCamel(relicId);
  }

  return `/images/relics/${imageName}.png`;
}

/**
 * Monster ID to image folder/file mapping
 */
const MONSTER_IMAGE_MAPPINGS: Record<number, Record<string, { path: string; filename: string }>> = {
  1: { // Act 1 (theForest)
    // Game's internal folder names don't match monster names:
    // maw = Jaw Worm, mage = Cultist, spiker = Louse, spaghetti = Slimes
    'jaw_worm': { path: 'theForest/maw', filename: 'skeleton.png' }, // Jaw Worm
    'cultist': { path: 'theForest/mage', filename: 'snakeMage.png' }, // Cultist
    'louse_red': { path: 'theForest/spiker', filename: 'skeleton.png' }, // Red Louse
    'louse_green': { path: 'theForest/spiker', filename: 'skeleton.png' }, // Green Louse
    'small_slime': { path: 'theForest/spaghetti', filename: 'writhingMass.png' }, // Acid Slime (S)
    'medium_slime': { path: 'theForest/spaghetti', filename: 'writhingMass.png' }, // Acid Slime (M)
    'large_slime': { path: 'theForest/spaghetti', filename: 'writhingMass.png' }, // Acid Slime (L)
    'slime_s': { path: 'theForest/spaghetti', filename: 'writhingMass.png' }, // Acid Slime (S)
    'slime_m': { path: 'theForest/spaghetti', filename: 'writhingMass.png' }, // Acid Slime (M)
    'slime_l': { path: 'theForest/spaghetti', filename: 'writhingMass.png' }, // Acid Slime (L)
    'gremlin_nob': { path: 'theForest/nemesis', filename: 'Nemesis.png' }, // Gremlin Nob (elite)
    'lagavulin': { path: 'theForest/boss', filename: 'skeleton.png' }, // Lagavulin (elite)
    'sentry': { path: 'theForest/exploder', filename: 'skeleton.png' }, // Sentry (elite)
    'slime_boss': { path: 'theForest/boss', filename: 'skeleton.png' }, // Slime Boss
    'guardian': { path: 'theForest/boss', filename: 'skeleton.png' }, // Guardian (boss)
    'hexaghost': { path: 'theForest/boss', filename: 'skeleton.png' }, // Hexaghost (boss)
  },
  2: { // Act 2 (theCity)
    'byrd': { path: 'theCity/byrd', filename: 'flying.png' },
    'chosen': { path: 'theCity/chosen', filename: 'chosen.png' },
    'centurion': { path: 'theCity/chosen', filename: 'chosen.png' },
    'mystic': { path: 'theCity/chosen', filename: 'chosen.png' },
    'snake_plant': { path: 'theCity/snakePlant', filename: 'SnakePlant.png' },
    'fungus_beast': { path: 'theCity/reptile', filename: 'Snecko.png' },
    'spheric_guardian': { path: 'theCity/sphere', filename: 'sphericGuardian.png' },
    'snecko': { path: 'theCity/reptile', filename: 'Snecko.png' },
    'taskmaster': { path: 'theCity/slaverMaster', filename: 'skeleton.png' },
    'slaver_blue': { path: 'theCity/slaverMaster', filename: 'skeleton.png' },
    'slaver_red': { path: 'theCity/slaverMaster', filename: 'skeleton.png' },
    'gremlin_leader': { path: 'theCity/gremlinleader', filename: 'GremlinLeader.png' },
    'mad_gremlin': { path: 'theCity/gremlinleader', filename: 'GremlinLeader.png' },
    'fat_gremlin': { path: 'theCity/gremlinleader', filename: 'GremlinLeader.png' },
    'shield_gremlin': { path: 'theCity/gremlinleader', filename: 'GremlinLeader.png' },
    'sneaky_gremlin': { path: 'theCity/gremlinleader', filename: 'GremlinLeader.png' },
    'wizened_gremlin': { path: 'theCity/gremlinleader', filename: 'GremlinLeader.png' },
    'bronze_automaton': { path: 'theCity/automaton', filename: 'skeleton.png' },
    'bronze_orb': { path: 'theCity/automaton', filename: 'orb.png' },
    'champ': { path: 'theCity/champ', filename: 'Champ.png' },
    'collector': { path: 'theCity/collector', filename: 'skeleton.png' },
  },
  3: { // Act 3 (theEnding)
    'darklings': { path: 'theForest/darkling', filename: 'Darkling.png' },
    'orb_walker': { path: 'theForest/orbWalker', filename: 'OrbWalker.png' },
    'spire_growth': { path: 'theForest/spireGrowth', filename: 'spireGrowth.png' },
    'transient': { path: 'theForest/transient', filename: 'transient.png' },
    'spire_shield': { path: 'theEnding/shield', filename: 'shield.png' },
    'spire_spear': { path: 'theEnding/spear', filename: 'spear.png' },
    'jaw_worm_horde': { path: 'theForest/maw', filename: 'skeleton.png' },
    'reptomancer': { path: 'theForest/repulser', filename: 'skeleton.png' },
    'dagger': { path: 'theForest/mage_dagger', filename: 'dagger.png' },
    'giant_head': { path: 'theForest/head', filename: 'skeleton.png' },
    'awakened_one': { path: 'theForest/awakenedOne', filename: 'AwakenedOne.png' },
    'time_eater': { path: 'theForest/timeEater', filename: 'TimeEater.png' },
    'donu': { path: 'theForest/donu', filename: 'Donu.png' },
    'deca': { path: 'theForest/deca', filename: 'Deca.png' },
  }
};

/**
 * Generates the image path for a monster based on act and monster ID
 */
export function getMonsterImagePath(act: number, monsterId: string): string {
  const mapping = MONSTER_IMAGE_MAPPINGS[act]?.[monsterId];
  if (mapping) {
    return `/images/monsters/${mapping.path}/${mapping.filename}`;
  }
  // Fallback to a default silhouette or placeholder
  return `/images/monsters/placeholder.png`;
}

/**
 * Handles image loading errors by providing a fallback
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>): void {
  const img = event.currentTarget;
  // Use a data URL for a simple gray placeholder instead of empty src
  // This prevents the black box issue
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" text-anchor="middle" dominant-baseline="middle" fill="%23666"%3E?%3C/text%3E%3C/svg%3E';
  img.style.objectFit = 'contain';
}

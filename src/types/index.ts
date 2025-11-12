export type CharacterType = 'ironclad' | 'silent' | 'defect' | 'watcher';

export type CardRarity = 'starter' | 'common' | 'uncommon' | 'rare' | 'special' | 'curse';

export type CardType = 'attack' | 'skill' | 'power' | 'status' | 'curse';

export type RelicRarity = 'starter' | 'common' | 'uncommon' | 'rare' | 'boss' | 'shop' | 'event';

export interface Card {
  id: string;
  name: string;
  character: CharacterType | 'colorless';
  rarity: CardRarity;
  type: CardType;
  cost: number;
  upgraded: boolean;
  description: string;
  // Advisory metadata
  tierRating: number; // 1-5 scale
  synergies: string[]; // IDs of cards that synergize well
  antiSynergies: string[]; // IDs of cards that don't work well together
  tags: string[]; // e.g., 'scaling', 'aoe', 'draw', 'energy', 'defensive'
}

export interface Relic {
  id: string;
  name: string;
  rarity: RelicRarity;
  character: CharacterType | 'shared';
  description: string;
  tier: string; // Letter grade: S, A, B, C, D
  tierRating?: number; // Numeric rating 1-5 (optional, may not exist on all relics)
  synergies: string[]; // Card IDs that work well with this relic
}

export type BlessingActionType =
  | 'none' // Simple stat changes (HP, gold, etc.)
  | 'choose_card' // Choose a card from options
  | 'choose_rare_card' // Choose a rare card
  | 'choose_colorless_card' // Choose a colorless card
  | 'choose_relic' // Choose a relic from options
  | 'choose_rare_relic' // Choose a rare relic
  | 'choose_common_relic' // Choose a common relic
  | 'choose_potions' // Choose potions (3 random potions blessing)
  | 'remove_card' // Remove a card from deck
  | 'remove_2_cards' // Remove 2 cards from deck
  | 'upgrade_card' // Upgrade a card from deck
  | 'transform_card' // Transform a card
  | 'transform_2_cards'; // Transform 2 cards

export interface Blessing {
  id: string;
  name: string;
  description: string;
  character: CharacterType;
  actionType?: BlessingActionType; // What interaction is needed
  cardRarity?: CardRarity; // For card selection blessings
  relicRarity?: RelicRarity; // For relic selection blessings
  cardCount?: number; // How many cards to show in selection
}

export type PotionRarity = 'common' | 'uncommon' | 'rare';

export interface Potion {
  id: string;
  name: string;
  rarity: PotionRarity;
  character: CharacterType | 'shared';
  description: string;
  effect: string; // Short description of effect (e.g., "Deal 20 damage", "Gain 12 Block")
  useCase: string; // When to use it (e.g., "Elite fights", "Multi-enemy hallways")
}

export interface RunStats {
  floorNumber: number;
  currentHP: number;
  maxHP: number;
  gold: number;
  ascensionLevel: number;
  keysObtained?: {
    emerald: boolean;  // Campfire key
    ruby: boolean;     // Chest key
    sapphire: boolean; // Elite key
  };
}

export interface GameState {
  // Character and run setup
  character: CharacterType | null;
  startingRelic: Relic | null;
  startingBlessing: Blessing | null;

  // Current run state
  deck: Card[];
  relics: Relic[];
  potions: Potion[];
  stats: RunStats;

  // UI state
  isRunActive: boolean;
}

export interface CardAdvice {
  card: Card;
  rating: number; // 1-5, how good this card is for current deck
  reason: string; // Primary reason to show
  allReasons?: string[]; // All reasons for detailed view
  priority: 'must-pick' | 'good-pick' | 'situational' | 'skip';
}

export interface CharacterStats {
  highestAscension: number;
  totalRuns: number;
  wins: number;
  losses: number;
  winRate: number; // Calculated percentage
  highestFloorReached: number;
}

export interface PlayerStatistics {
  ironclad: CharacterStats;
  silent: CharacterStats;
  defect: CharacterStats;
  watcher: CharacterStats;
}

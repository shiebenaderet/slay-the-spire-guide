// New coaching-focused type system

export type FloorType = 'combat' | 'elite' | 'shop' | 'rest' | 'event' | 'boss' | 'treasure';

export type DecisionType =
  | 'combat-start'      // Entering combat, need strategy
  | 'combat-end'        // Combat finished, record results
  | 'card-reward'       // Choose from card rewards
  | 'relic-reward'      // Choose relic (boss/elite)
  | 'shop'              // In shop, what to buy
  | 'rest'              // Rest site (upgrade/rest/smith/toke/dig/lift)
  | 'event'             // Event encounter
  | 'potion-reward';    // Potion drops

export interface CombatEncounter {
  floor: number;
  enemies: string[];  // Enemy names
  currentHand?: string[];  // Card names in hand
  strategy?: string;  // AI-generated strategy
  won?: boolean;
  endingHP?: number;
  goldReceived?: number;
}

export interface CardRewardDecision {
  floor: number;
  cardsOffered: string[];  // Card names
  recommendation?: {
    pick: string | 'skip';
    reason: string;
    synergies: string[];  // What it synergizes with
    antiSynergies: string[];
    priority: 'must-pick' | 'strong-pick' | 'consider' | 'skip';
  };
  picked?: string | 'skip';
}

export interface RelicRewardDecision {
  floor: number;
  relicsOffered: string[];
  recommendation?: {
    pick: string;
    reason: string;
    synergies: string[];
    impact: 'game-changing' | 'strong' | 'moderate' | 'weak';
  };
  picked?: string;
}

export interface ShopDecision {
  floor: number;
  cardsAvailable?: string[];
  relicsAvailable?: string[];
  potionsAvailable?: string[];
  removalCost: number;  // Usually 75g
  recommendations?: {
    buyCards: Array<{ card: string; reason: string; priority: number }>;
    buyRelics: Array<{ relic: string; reason: string; priority: number }>;
    removeCard?: { card: string; reason: string; worthIt: boolean };
  };
  purchased?: {
    cards: string[];
    relics: string[];
    potions: string[];
    removedCard?: string;
  };
}

export interface RestDecision {
  floor: number;
  currentHP: number;
  maxHP: number;
  options: Array<'rest' | 'upgrade' | 'smith' | 'toke' | 'dig' | 'lift'>;  // Depends on relics
  recommendation?: {
    choice: 'rest' | 'upgrade' | 'smith' | 'toke' | 'dig' | 'lift';
    reason: string;
    upgradeTarget?: string;  // Which card to upgrade
  };
  chosen?: 'rest' | 'upgrade' | 'smith' | 'toke' | 'dig' | 'lift';
  upgradedCard?: string;
}

export interface FloorState {
  floorNumber: number;
  floorType: FloorType;
  currentDecision: DecisionType;
  combat?: CombatEncounter;
  cardReward?: CardRewardDecision;
  relicReward?: RelicRewardDecision;
  shop?: ShopDecision;
  rest?: RestDecision;
  completed: boolean;
}

export interface CoachingRunState {
  character: string;
  ascensionLevel: number;
  startingRelic: string;
  currentFloor: number;
  currentHP: number;
  maxHP: number;
  gold: number;

  // Tracked throughout run
  deck: string[];  // Card names
  relics: string[];  // Relic names
  potions: string[];  // Potion names

  // Floor history
  floors: FloorState[];

  // Active floor
  activeFloor?: FloorState;

  // Coaching insights
  detectedArchetype?: string;
  winCondition?: string;
  weaknesses: string[];
  nextPriorities: string[];
}

export interface StrategyAdvice {
  general: string;  // Overall strategy
  enemyPriority: string[];  // Which enemy to focus
  handAdvice?: string;  // Specific to current hand
  warnings: string[];  // "Low HP, play safe"
}

export interface SynergyExplanation {
  card1: string;
  card2: string;
  explanation: string;
  strength: 'strong' | 'moderate' | 'weak';
}

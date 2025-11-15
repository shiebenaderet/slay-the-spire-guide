import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CoachingRunState, FloorState, DecisionType, FloorType } from '../types/coaching';

interface CoachingStore extends CoachingRunState {
  // Actions
  startRun: (character: string, ascension: number, startingRelic: string, hpLoss?: number) => void;
  startFloor: (floorType: FloorType) => void;
  setDecision: (decision: DecisionType) => void;
  updateFloorData: (data: Partial<FloorState>) => void;
  completeFloor: () => void;
  addCardToDeck: (card: string) => void;
  removeCardFromDeck: (card: string) => void;
  upgradeCardInDeck: (card: string) => void;
  addRelic: (relic: string) => void;
  removeRelic: (relic: string) => void;
  setDeck: (deck: string[]) => void;
  setRelics: (relics: string[]) => void;
  updateHP: (current: number, max?: number) => void;
  updateGold: (amount: number) => void;
  resetRun: () => void;
}

const initialState: CoachingRunState = {
  character: '',
  ascensionLevel: 0,
  startingRelic: '',
  currentFloor: 0,
  currentHP: 0,
  maxHP: 0,
  gold: 99,
  deck: [],
  relics: [],
  potions: [],
  floors: [],
  weaknesses: [],
  nextPriorities: [],
};

export const useCoachingStore = create<CoachingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      startRun: (character, ascension, startingRelic, hpLoss = 0) => {
        const starterDeck = getStarterDeck(character, ascension);
        const { currentHP, maxHP } = getStartingHP(character, ascension);

        // Apply HP loss from Neow's blessing (if any)
        const actualCurrentHP = Math.max(1, currentHP - hpLoss);

        set({
          character,
          ascensionLevel: ascension,
          startingRelic,
          currentFloor: 1,
          currentHP: actualCurrentHP,
          maxHP,
          gold: 99,
          deck: starterDeck,
          relics: [startingRelic],
          potions: [],
          floors: [],
          activeFloor: undefined,
        });
      },

      startFloor: (floorType) => {
        const state = get();
        const newFloor: FloorState = {
          floorNumber: state.currentFloor,
          floorType,
          currentDecision: getInitialDecision(floorType),
          completed: false,
        };

        set({
          activeFloor: newFloor,
        });
      },

      setDecision: (decision) => {
        set((state) => ({
          activeFloor: state.activeFloor
            ? { ...state.activeFloor, currentDecision: decision }
            : undefined,
        }));
      },

      updateFloorData: (data) => {
        set((state) => ({
          activeFloor: state.activeFloor
            ? { ...state.activeFloor, ...data }
            : undefined,
        }));
      },

      completeFloor: () => {
        set((state) => {
          if (!state.activeFloor) return state;

          const completedFloor = { ...state.activeFloor, completed: true };

          return {
            floors: [...state.floors, completedFloor],
            activeFloor: undefined,
            currentFloor: state.currentFloor + 1,
          };
        });
      },

      addCardToDeck: (card) => {
        set((state) => ({
          deck: [...state.deck, card],
        }));
      },

      removeCardFromDeck: (card) => {
        set((state) => ({
          deck: state.deck.filter((c) => c !== card),
        }));
      },

      upgradeCardInDeck: (card) => {
        // Mark card as upgraded (add + suffix if not present)
        set((state) => {
          const index = state.deck.indexOf(card);
          if (index === -1) return state;

          const newDeck = [...state.deck];
          newDeck[index] = card.endsWith('+') ? card : card + '+';

          return { deck: newDeck };
        });
      },

      addRelic: (relic) => {
        set((state) => ({
          relics: [...state.relics, relic],
        }));
      },

      removeRelic: (relic) => {
        set((state) => ({
          relics: state.relics.filter((r) => r !== relic),
        }));
      },

      setDeck: (deck) => {
        set({ deck });
      },

      setRelics: (relics) => {
        set({ relics });
      },

      updateHP: (current, max) => {
        set((state) => ({
          currentHP: current,
          maxHP: max !== undefined ? max : state.maxHP,
        }));
      },

      updateGold: (amount) => {
        set({ gold: amount });
      },

      resetRun: () => {
        set(initialState);
      },
    }),
    {
      name: 'coaching-storage',
    }
  )
);

// Helper functions
function getInitialDecision(floorType: FloorType): DecisionType {
  switch (floorType) {
    case 'combat':
    case 'elite':
    case 'boss':
      return 'combat-start';
    case 'shop':
      return 'shop';
    case 'rest':
      return 'rest';
    case 'event':
      return 'event';
    case 'treasure':
      return 'relic-reward';
    default:
      return 'combat-start';
  }
}

function getStarterDeck(character: string, ascension: number): string[] {
  let deck: string[] = [];

  switch (character.toLowerCase()) {
    case 'ironclad':
      deck = [
        'Strike', 'Strike', 'Strike', 'Strike', 'Strike',
        'Defend', 'Defend', 'Defend', 'Defend',
        'Bash',
      ];
      break;
    case 'silent':
      deck = [
        'Strike', 'Strike', 'Strike', 'Strike', 'Strike',
        'Defend', 'Defend', 'Defend', 'Defend', 'Defend',
        'Neutralize', 'Survivor',
      ];
      break;
    case 'defect':
      deck = [
        'Strike', 'Strike', 'Strike', 'Strike',
        'Defend', 'Defend', 'Defend', 'Defend',
        'Zap', 'Dualcast',
      ];
      break;
    case 'watcher':
      deck = [
        'Strike', 'Strike', 'Strike', 'Strike',
        'Defend', 'Defend', 'Defend', 'Defend',
        'Eruption', 'Vigilance',
      ];
      break;
    default:
      deck = [];
  }

  // Ascension 10+ adds Ascender's Bane (curse)
  if (ascension >= 10) {
    deck.push("Ascender's Bane");
  }

  return deck;
}

function getStartingHP(character: string, ascension: number): { currentHP: number; maxHP: number } {
  let baseHP: number;

  switch (character.toLowerCase()) {
    case 'ironclad':
      baseHP = 80;
      break;
    case 'silent':
      baseHP = 70;
      break;
    case 'defect':
      baseHP = 75;
      break;
    case 'watcher':
      baseHP = 72;
      break;
    default:
      baseHP = 80;
  }

  // Ascension 14+ reduces starting HP by 5
  if (ascension >= 14) {
    baseHP -= 5;
  }

  return { currentHP: baseHP, maxHP: baseHP };
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import type { GameState, Card, Relic, Blessing, Potion, CharacterType, RunStats, PlayerStatistics, CharacterStats } from '../types';
import type { BlessingWorkflowResult } from '../components/BlessingWorkflow';
import cardsDataRaw from '../data/cards.json';

const cardsDataForTransform = cardsDataRaw as Card[];

interface GameStore extends GameState {
  // Actions
  setCharacter: (character: CharacterType) => void;
  setAscension: (level: number) => void;
  setStartingRelic: (relic: Relic) => void;
  setStartingBlessing: (blessing: Blessing | null) => void;
  setBlessingWorkflowResult: (result: BlessingWorkflowResult | null) => void;
  startRun: () => void;
  addCard: (card: Card) => void;
  removeCard: (cardId: string) => void;
  upgradeCard: (cardId: string) => void;
  addRelic: (relic: Relic) => void;
  removeRelic: (relicId: string) => void;
  addPotion: (potion: Potion) => void;
  removePotion: (potionId: string) => void;
  updateStats: (stats: Partial<RunStats>) => void;
  resetRun: () => void;
  // Helper
  getPotionSlots: () => number;
  // Temporary storage for blessing workflow
  blessingWorkflowResult: BlessingWorkflowResult | null;
  // Statistics
  statistics: PlayerStatistics;
  recordRunCompletion: (isWin: boolean) => void;
  getCharacterStats: (character: CharacterType) => CharacterStats;
}

const initialCharacterStats: CharacterStats = {
  highestAscension: 0,
  totalRuns: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  highestFloorReached: 0,
};

const initialState: GameState = {
  character: null,
  startingRelic: null,
  startingBlessing: null,
  deck: [],
  relics: [],
  potions: [],
  stats: {
    floorNumber: 1,
    currentHP: 80,
    maxHP: 80,
    gold: 99,
    ascensionLevel: 0,
    keysObtained: {
      emerald: false,
      ruby: false,
      sapphire: false,
    },
  },
  isRunActive: false,
};

const initialStatistics: PlayerStatistics = {
  ironclad: { ...initialCharacterStats },
  silent: { ...initialCharacterStats },
  defect: { ...initialCharacterStats },
  watcher: { ...initialCharacterStats },
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      blessingWorkflowResult: null,
      statistics: initialStatistics,

      setCharacter: (character) => set({ character }),

      setAscension: (level) =>
        set((state) => ({
          stats: { ...state.stats, ascensionLevel: level },
        })),

      setStartingRelic: (relic) => set({ startingRelic: relic }),

      setStartingBlessing: (blessing) => set({ startingBlessing: blessing }),

      setBlessingWorkflowResult: (result) => set({ blessingWorkflowResult: result }),

      startRun: () =>
        set((state) => {
          const ascension = state.stats.ascensionLevel;
          let starterDeck = getStarterDeck(state.character!, ascension);
          let relics = state.startingRelic ? [state.startingRelic] : [];
          let stats = getInitialStats(state.character!, ascension);

          // Apply blessing effects if one was selected
          if (state.startingBlessing) {
            const blessingEffects = applyBlessingEffects(
              state.startingBlessing,
              starterDeck,
              relics,
              stats,
              state.character!
            );
            starterDeck = blessingEffects.deck;
            relics = blessingEffects.relics;
            stats = blessingEffects.stats;
          }

          // Apply blessing workflow results (card/relic selections, removals, etc.)
          if (state.blessingWorkflowResult) {
            const result = state.blessingWorkflowResult;

            // Add selected cards
            if (result.cardsToAdd.length > 0) {
              starterDeck = [...starterDeck, ...result.cardsToAdd];
            }

            // Add selected curse
            if (result.curseToAdd) {
              starterDeck = [...starterDeck, result.curseToAdd];
            }

            // Remove cards
            if (result.cardsToRemove.length > 0) {
              starterDeck = starterDeck.filter(
                (card) => !result.cardsToRemove.includes(card.id)
              );
            }

            // Upgrade cards
            if (result.cardsToUpgrade.length > 0) {
              starterDeck = starterDeck.map((card) =>
                result.cardsToUpgrade.includes(card.id)
                  ? { ...card, upgraded: true }
                  : card
              );
            }

            // Transform cards (replace with random cards of same rarity)
            if (result.cardsToTransform.length > 0) {
              starterDeck = transformCards(
                starterDeck,
                result.cardsToTransform,
                state.character!
              );
            }

            // Add selected relics
            if (result.relicsToAdd.length > 0) {
              relics = [...relics, ...result.relicsToAdd];
            }

            // Add selected potions
            if (result.potionsToAdd.length > 0) {
              // Potions will be added separately after run starts
              // Store them temporarily in the state
            }
          }

          return {
            deck: starterDeck,
            relics,
            stats,
            isRunActive: true,
            blessingWorkflowResult: null, // Clear the workflow result
            potions: state.blessingWorkflowResult?.potionsToAdd || [],
          };
        }),

      addCard: (card) =>
        set((state) => ({
          deck: [...state.deck, card],
        })),

      removeCard: (cardId) =>
        set((state) => ({
          deck: state.deck.filter((card) => card.id !== cardId),
        })),

      upgradeCard: (cardId) =>
        set((state) => ({
          deck: state.deck.map((card) =>
            card.id === cardId ? { ...card, upgraded: true } : card
          ),
        })),

      addRelic: (relic) =>
        set((state) => ({
          relics: [...state.relics, relic],
        })),

      removeRelic: (relicId) =>
        set((state) => ({
          relics: state.relics.filter((relic) => relic.id !== relicId),
        })),

      addPotion: (potion) =>
        set((state) => ({
          potions: [...state.potions, potion],
        })),

      removePotion: (potionId) =>
        set((state) => ({
          potions: state.potions.filter((potion) => potion.id !== potionId),
        })),

      updateStats: (newStats) =>
        set((state) => ({
          stats: { ...state.stats, ...newStats },
        })),

      getPotionSlots: () => {
        const state = useGameStore.getState();
        let slots = 3; // Base potion slots

        // Ascension 11+: Reduced to 2 slots
        if (state.stats.ascensionLevel >= 11) {
          slots = 2;
        }

        // Potion Belt: +2 slots
        if (state.relics.some(r => r.id === 'potion_belt')) {
          slots += 2;
        }

        // White Beast Statue: +5 slots (boss relic)
        if (state.relics.some(r => r.id === 'white_beast_statue')) {
          slots += 5;
        }

        return slots;
      },

      resetRun: () => set(initialState),

      recordRunCompletion: (isWin: boolean) => {
        const state = get();
        if (!state.character) return;

        const charStats = state.statistics[state.character];
        const floorReached = state.stats.floorNumber;
        const ascension = state.stats.ascensionLevel;

        const updatedStats: CharacterStats = {
          ...charStats,
          totalRuns: charStats.totalRuns + 1,
          wins: isWin ? charStats.wins + 1 : charStats.wins,
          losses: !isWin ? charStats.losses + 1 : charStats.losses,
          highestAscension: Math.max(charStats.highestAscension, isWin ? ascension : charStats.highestAscension),
          highestFloorReached: Math.max(charStats.highestFloorReached, floorReached),
          winRate: 0, // Will be calculated below
        };

        // Calculate win rate
        updatedStats.winRate = updatedStats.totalRuns > 0
          ? Math.round((updatedStats.wins / updatedStats.totalRuns) * 100)
          : 0;

        set((state) => ({
          statistics: {
            ...state.statistics,
            [state.character!]: updatedStats,
          },
        }));
      },

      getCharacterStats: (character: CharacterType) => {
        return get().statistics[character];
      },
    }),
    {
      name: 'sts-run-tracker',
    }
  )
);

// Helper to provide default descriptions for starter cards
function getDefaultCardDescription(cardId: string): string {
  const descriptions: Record<string, string> = {
    'strike_r': 'Deal 6 damage.',
    'strike_g': 'Deal 6 damage.',
    'strike_b': 'Deal 6 damage.',
    'strike_p': 'Deal 6 damage.',
    'defend_r': 'Gain 5 Block.',
    'defend_g': 'Gain 5 Block.',
    'defend_b': 'Gain 5 Block.',
    'defend_p': 'Gain 5 Block.',
    'bash': 'Deal 8 damage. Apply 2 Vulnerable.',
    'neutralize': 'Deal 3 damage. Apply 1 Weak.',
    'survivor': 'Gain 8 Block. Discard 1 card.',
    'zap': 'Channel 1 Lightning.',
    'dualcast': 'Evoke your next Orb twice.',
    'eruption': 'Deal 9 damage. Enter Wrath.',
    'vigilance': 'Gain 8 Block. Enter Calm.',
  };
  return descriptions[cardId] || '';
}

// Helper function to get starter deck for each character
function getStarterDeck(character: CharacterType, ascension: number): Card[] {
  const starterDecks: Record<CharacterType, Array<Partial<Card> & { id: string }>> = {
    ironclad: [
      { id: 'strike_r', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'strike_r', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'strike_r', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'strike_r', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'strike_r', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'defend_r', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'defend_r', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'defend_r', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'defend_r', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'bash', name: 'Bash', cost: 2, type: 'attack' },
    ],
    silent: [
      { id: 'strike_g', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'strike_g', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'strike_g', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'strike_g', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'strike_g', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'defend_g', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'defend_g', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'defend_g', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'defend_g', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'defend_g', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'neutralize', name: 'Neutralize', cost: 0, type: 'attack' },
      { id: 'survivor', name: 'Survivor', cost: 1, type: 'skill' },
    ],
    defect: [
      { id: 'strike_b', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'strike_b', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'strike_b', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'strike_b', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'defend_b', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'defend_b', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'defend_b', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'defend_b', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'zap', name: 'Zap', cost: 1, type: 'skill' },
      { id: 'dualcast', name: 'Dualcast', cost: 1, type: 'skill' },
    ],
    watcher: [
      { id: 'strike_p', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'strike_p', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'strike_p', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'strike_p', name: 'Strike', cost: 1, type: 'attack' },
      { id: 'defend_p', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'defend_p', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'defend_p', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'defend_p', name: 'Defend', cost: 1, type: 'skill' },
      { id: 'eruption', name: 'Eruption', cost: 2, type: 'attack' },
      { id: 'vigilance', name: 'Vigilance', cost: 2, type: 'skill' },
    ],
  };

  let deck: Card[] = starterDecks[character].map((card, index) => {
    // Look up the full card data to get description
    const fullCardData = cardsDataForTransform.find(c => c.id === card.id.replace(/_[rgbp]$/, ''));

    return {
      id: `${card.id}-${index}`,
      name: card.name!,
      character: character as CharacterType,
      rarity: 'starter' as const,
      type: card.type!,
      cost: card.cost!,
      upgraded: false,
      description: fullCardData?.description || getDefaultCardDescription(card.id),
      tierRating: fullCardData?.tierRating || 2,
      synergies: fullCardData?.synergies || [],
      antiSynergies: fullCardData?.antiSynergies || [],
      tags: fullCardData?.tags || [],
    };
  });

  // Ascension 10+: Add Ascender's Bane curse to deck
  if (ascension >= 10) {
    const curse: Card = {
      id: `ascenders_bane`,
      name: "Ascender's Bane",
      character: 'colorless' as const,
      rarity: 'curse' as const,
      type: 'curse' as const,
      cost: 0,
      upgraded: false,
      description: 'Unplayable. Ethereal.',
      tierRating: 1,
      synergies: [],
      antiSynergies: [],
      tags: ['curse', 'ethereal', 'unplayable'],
    };
    deck.push(curse);
  }

  return deck;
}

function getInitialStats(character: CharacterType, ascension: number): RunStats {
  const baseHP: Record<CharacterType, number> = {
    ironclad: 80,
    silent: 70,
    defect: 75,
    watcher: 72,
  };

  // Ascension 14: -10% max HP (rounded down)
  let maxHP = baseHP[character];
  if (ascension >= 14) {
    maxHP = Math.floor(maxHP * 0.9);
  }

  // Ascension 13+: Starting gold reduced from 99 to 95
  let gold = 99;
  if (ascension >= 13) {
    gold = 95;
  }

  return {
    floorNumber: 1,
    currentHP: maxHP,
    maxHP: maxHP,
    gold: gold,
    ascensionLevel: ascension,
  };
}

// Helper function to apply blessing effects to the run
function applyBlessingEffects(
  blessing: Blessing,
  deck: Card[],
  relics: Relic[],
  stats: RunStats,
  character: CharacterType
): { deck: Card[]; relics: Relic[]; stats: RunStats } {
  // Clone the inputs to avoid mutations
  let newDeck = [...deck];
  let newRelics = [...relics];
  let newStats = { ...stats };

  const blessingId = blessing.id;

  // Max HP blessings
  if (blessingId.includes('blessing_max_hp')) {
    newStats.maxHP += 6;
    newStats.currentHP += 6;
  }

  // Heal HP blessings
  else if (blessingId.includes('blessing_heal_hp')) {
    newStats.maxHP += 5;
    newStats.currentHP = newStats.maxHP; // Full heal
  }

  // Gold blessings
  else if (blessingId.includes('blessing_gold') && !blessingId.includes('lose')) {
    newStats.gold += 100;
  }

  // Upgrade Strikes and Defends
  else if (blessingId.includes('blessing_upgrade_strikes')) {
    newDeck = newDeck.map(card => {
      if (card.name === 'Strike' || card.name === 'Defend') {
        return { ...card, upgraded: true };
      }
      return card;
    });
  }

  // Lose HP, Gain Gold (character-specific HP loss)
  else if (blessingId.includes('blessing_lose_hp_gain_gold')) {
    const hpLoss = character === 'silent' ? 6 : 7;
    newStats.maxHP -= hpLoss;
    newStats.currentHP = Math.min(newStats.currentHP, newStats.maxHP);
    newStats.gold += 250;
  }

  // Lose HP, Gain Rare Relic (10% max HP)
  else if (blessingId.includes('blessing_lose_hp_rare_relic')) {
    const hpLoss = Math.floor(newStats.maxHP * 0.1);
    newStats.maxHP -= hpLoss;
    newStats.currentHP = Math.min(newStats.currentHP, newStats.maxHP);
    // Note: Random rare relic would need to be selected - for now just marked
  }

  // Lose HP, Gain Rare Colorless Card
  else if (blessingId.includes('blessing_lose_hp_colorless')) {
    newStats.maxHP -= 5;
    newStats.currentHP = Math.min(newStats.currentHP, newStats.maxHP);
    // Note: Random colorless card would need to be selected
  }

  // Lose Gold, Gain Rare Relic
  else if (blessingId.includes('blessing_lose_gold_rare_relic')) {
    newStats.gold = 0;
    // Note: Random rare relic would need to be selected
  }

  // Note: Blessings that require card selection or other interactive choices
  // (like "Choose a Rare Card", "Remove a Card", etc.) are now handled by
  // the BlessingWorkflow component and applied via blessingWorkflowResult

  return { deck: newDeck, relics: newRelics, stats: newStats };
}

// Helper function to transform cards into random cards of the same rarity
function transformCards(
  deck: Card[],
  cardIdsToTransform: string[],
  character: CharacterType
): Card[] {
  return deck.map((card) => {
    if (cardIdsToTransform.includes(card.id)) {
      // Find replacement cards of the same rarity
      const replacementPool = cardsDataForTransform.filter(
        (c) =>
          c.rarity === card.rarity &&
          (c.character === character || c.character === 'colorless')
      );

      if (replacementPool.length > 0) {
        // Pick a random replacement
        const randomCard = replacementPool[Math.floor(Math.random() * replacementPool.length)];
        return {
          ...randomCard,
          id: `${randomCard.id}-transformed-${Date.now()}`,
        };
      }
    }
    return card;
  });
}

/**
 * Hook to check if Zustand store has finished hydrating from localStorage
 * Use this to prevent accessing state before it's loaded
 */
export const useHasHydrated = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = useGameStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Set to true if already hydrated
    setHydrated(useGameStore.persist.hasHydrated());

    return unsubscribe;
  }, []);

  return hydrated;
};

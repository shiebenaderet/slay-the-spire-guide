import { useState, useMemo } from 'react';
import type { Card, Relic, CharacterType, Potion } from '../types';
import { analyzeCombatReadiness, type Monster, type CombatAdvice } from '../utils/combatAdvisor';
import monstersData from '../data/monsters.json';

type EncounterType = 'fight' | 'elite' | 'boss' | 'shop' | 'event' | 'rest' | 'treasure';
type WizardStep = 'select-encounter' | 'select-enemies' | 'combat-advice' | 'victory' | 'rewards' | 'complete';

interface Enemy {
  id: string;
  name: string;
  act: number;
  isElite?: boolean;
  isBoss?: boolean;
}

interface FloorWizardProps {
  currentFloor: number;
  character: CharacterType;
  currentDeck: Card[];
  currentGold: number;
  relics: Relic[];
  potions: Potion[];
  currentHP: number;
  maxHP: number;
  ascensionLevel: number;
  onFloorComplete: (data: {
    goldGained: number;
    cardsAdded: Card[];
    relicsAdded: Relic[];
    enemiesDefeated: string[];
  }) => void;
  onOpenCardReward: () => void;
  onOpenRelicReward: () => void;
  onOpenShop: () => void;
  onOpenEvent: () => void;
  onOpenRest: () => void;
  onOpenTreasure: () => void;
}

// Enemy definitions for each act
const ENEMIES = {
  act1: {
    normal: [
      { id: 'cultist', name: 'Cultist' },
      { id: 'jaw_worm', name: 'Jaw Worm' },
      { id: 'louse_red', name: 'Red Louse' },
      { id: 'louse_green', name: 'Green Louse' },
      { id: 'slime_small', name: 'Small Slime' },
      { id: 'slime_medium', name: 'Medium Slime' },
      { id: 'slime_large', name: 'Large Slime' },
      { id: 'fungi_beast', name: 'Fungi Beast' },
      { id: 'acid_slime_m', name: 'Acid Slime (M)' },
      { id: 'acid_slime_s', name: 'Acid Slime (S)' },
      { id: 'spike_slime_m', name: 'Spike Slime (M)' },
      { id: 'spike_slime_s', name: 'Spike Slime (S)' },
    ],
    elite: [
      { id: 'gremlin_nob', name: 'Gremlin Nob', isElite: true },
      { id: 'lagavulin', name: 'Lagavulin', isElite: true },
      { id: 'sentry', name: 'Sentry', isElite: true },
    ],
    boss: [
      { id: 'slime_boss', name: 'Slime Boss', isBoss: true },
      { id: 'guardian', name: 'The Guardian', isBoss: true },
      { id: 'hexaghost', name: 'Hexaghost', isBoss: true },
    ],
  },
  act2: {
    normal: [
      { id: 'spheric_guardian', name: 'Spheric Guardian' },
      { id: 'chosen', name: 'Chosen' },
      { id: 'byrd', name: 'Byrd' },
      { id: 'sentry_2', name: 'Sentry' },
      { id: 'cultist_2', name: 'Cultist' },
      { id: 'mystic', name: 'Mystic' },
      { id: 'snake_plant', name: 'Snake Plant' },
      { id: 'parasite', name: 'Parasite' },
      { id: 'fungi_beast_2', name: 'Fungi Beast' },
      { id: 'shelled_parasite', name: 'Shelled Parasite' },
    ],
    elite: [
      { id: 'gremlin_leader', name: 'Gremlin Leader', isElite: true },
      { id: 'book_of_stabbing', name: 'Book of Stabbing', isElite: true },
      { id: 'slavers', name: 'Slavers', isElite: true },
    ],
    boss: [
      { id: 'automaton', name: 'Bronze Automaton', isBoss: true },
      { id: 'collector', name: 'The Collector', isBoss: true },
      { id: 'champ', name: 'The Champ', isBoss: true },
    ],
  },
  act3: {
    normal: [
      { id: 'orb_walker', name: 'Orb Walker' },
      { id: 'maw', name: 'Maw' },
      { id: 'jaw_worm_horde', name: 'Jaw Worm Horde' },
      { id: 'darklings', name: 'Darklings' },
      { id: 'spiker', name: 'Spiker' },
      { id: 'exploder', name: 'Exploder' },
      { id: 'repulsor', name: 'Repulsor' },
      { id: 'sphere_guardian_2', name: 'Spheric Guardian' },
      { id: 'writhing_mass', name: 'Writhing Mass' },
    ],
    elite: [
      { id: 'giant_head', name: 'Giant Head', isElite: true },
      { id: 'nemesis', name: 'Nemesis', isElite: true },
      { id: 'reptomancer', name: 'Reptomancer', isElite: true },
    ],
    boss: [
      { id: 'awakened_one', name: 'Awakened One', isBoss: true },
      { id: 'time_eater', name: 'Time Eater', isBoss: true },
      { id: 'donu_deca', name: 'Donu & Deca', isBoss: true },
    ],
  },
};

// Gold reward ranges
const GOLD_REWARDS = {
  fight: { min: 10, max: 20 },
  elite: { min: 25, max: 35 },
  boss: { min: 95, max: 105 },
};

function getRandomGold(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function FloorWizard({
  currentFloor,
  character,
  currentDeck,
  currentGold,
  relics,
  potions,
  currentHP,
  maxHP,
  ascensionLevel,
  onFloorComplete,
  onOpenCardReward,
  onOpenRelicReward,
  onOpenShop,
  onOpenEvent,
  onOpenRest,
  onOpenTreasure,
}: FloorWizardProps) {
  const [step, setStep] = useState<WizardStep>('select-encounter');
  const [encounterType, setEncounterType] = useState<EncounterType | null>(null);
  const [selectedEnemies, setSelectedEnemies] = useState<Enemy[]>([]);
  const [goldGained, setGoldGained] = useState(0);

  // Determine current act based on floor
  const currentAct = currentFloor <= 16 ? 1 : currentFloor <= 33 ? 2 : 3;

  // Generate combat advice for selected enemies
  const combatAdviceList = useMemo(() => {
    if (selectedEnemies.length === 0) return [];

    return selectedEnemies.map(enemy => {
      // Find full monster data from monsters.json
      const monsterData = (monstersData as Monster[]).find(m => m.id === enemy.id);

      if (!monsterData) {
        // Fallback if monster not found in data
        return null;
      }

      // Generate combat advice for this enemy
      const advice = analyzeCombatReadiness(
        monsterData,
        currentDeck,
        relics,
        potions,
        ascensionLevel,
        currentHP,
        maxHP
      );

      return advice;
    }).filter(Boolean) as CombatAdvice[];
  }, [selectedEnemies, currentDeck, relics, potions, ascensionLevel, currentHP, maxHP]);

  const handleSelectEncounter = (type: EncounterType) => {
    setEncounterType(type);

    // Handle non-combat encounters immediately
    if (type === 'shop') {
      onOpenShop();
      return;
    }
    if (type === 'event') {
      onOpenEvent();
      return;
    }
    if (type === 'rest') {
      onOpenRest();
      return;
    }
    if (type === 'treasure') {
      onOpenTreasure();
      return;
    }

    // Combat encounters go to enemy selection
    setStep('select-enemies');
  };

  const handleSelectEnemy = (enemy: Enemy) => {
    setSelectedEnemies(prev => {
      const isSelected = prev.some(e => e.id === enemy.id);
      if (isSelected) {
        // Deselect enemy
        return prev.filter(e => e.id !== enemy.id);
      } else {
        // Add enemy (allow up to 3 enemies)
        if (prev.length < 3) {
          return [...prev, enemy];
        }
      }
      return prev;
    });
  };

  const handleConfirmEnemies = () => {
    if (selectedEnemies.length === 0) return;

    // Calculate gold reward
    let gold = 0;
    if (encounterType === 'fight') {
      gold = getRandomGold(GOLD_REWARDS.fight.min, GOLD_REWARDS.fight.max);
    } else if (encounterType === 'elite') {
      gold = getRandomGold(GOLD_REWARDS.elite.min, GOLD_REWARDS.elite.max);
    } else if (encounterType === 'boss') {
      gold = getRandomGold(GOLD_REWARDS.boss.min, GOLD_REWARDS.boss.max);
    }

    setGoldGained(gold);
    setStep('combat-advice'); // Show combat advice before victory
  };

  const handleProceedToBattle = () => {
    setStep('victory');
  };

  const handleProceedToRewards = () => {
    setStep('rewards');
  };

  const handleSkipRewards = () => {
    // Complete floor with no rewards
    onFloorComplete({
      goldGained,
      cardsAdded: [],
      relicsAdded: [],
      enemiesDefeated: selectedEnemies.map((e) => e.id),
    });
    resetWizard();
  };

  const handleOpenCardReward = () => {
    // Award gold immediately when opening rewards
    onFloorComplete({
      goldGained,
      cardsAdded: [],
      relicsAdded: [],
      enemiesDefeated: selectedEnemies.map((e) => e.id),
    });
    onOpenCardReward();
  };

  const handleOpenRelicReward = () => {
    if (encounterType === 'elite' || encounterType === 'boss') {
      // Award gold immediately when opening rewards
      onFloorComplete({
        goldGained,
        cardsAdded: [],
        relicsAdded: [],
        enemiesDefeated: selectedEnemies.map((e) => e.id),
      });
      onOpenRelicReward();
    }
  };

  const resetWizard = () => {
    setStep('select-encounter');
    setEncounterType(null);
    setSelectedEnemies([]);
    setGoldGained(0);
  };

  // Get available enemies based on encounter type and act
  const getAvailableEnemies = (): Enemy[] => {
    const actKey = `act${currentAct}` as keyof typeof ENEMIES;
    if (encounterType === 'fight') {
      return ENEMIES[actKey].normal;
    } else if (encounterType === 'elite') {
      return ENEMIES[actKey].elite;
    } else if (encounterType === 'boss') {
      return ENEMIES[actKey].boss;
    }
    return [];
  };

  return (
    <div className="bg-sts-darker rounded p-4 border-2 border-sts-light/20">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-sts-light/30">
        <h3 className="text-xl font-bold text-sts-light">
          Floor {currentFloor} - Act {currentAct}
        </h3>
        <p className="text-sm text-sts-light/80 mt-1">
          {step === 'select-encounter' && 'Choose an encounter type'}
          {step === 'select-enemies' && `Select ${encounterType} enemies`}
          {step === 'combat-advice' && 'Combat Strategy & Deck Analysis'}
          {step === 'victory' && 'Victory!'}
          {step === 'rewards' && 'Claim your rewards'}
        </p>
      </div>

      {/* Step 1: Select Encounter Type */}
      {step === 'select-encounter' && (
        <div className="space-y-3">
          <button
            onClick={() => handleSelectEncounter('fight')}
            className="w-full py-4 px-5 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold text-base transition-colors flex items-center justify-between shadow-lg"
          >
            <span className="text-lg">⚔️ Fight</span>
            <span className="text-sm opacity-90">Normal Enemy</span>
          </button>
          <button
            onClick={() => handleSelectEncounter('elite')}
            className="w-full py-4 px-5 bg-yellow-700 hover:bg-yellow-800 text-white rounded-lg font-bold text-base transition-colors flex items-center justify-between shadow-lg"
          >
            <span className="text-lg">💀 Elite</span>
            <span className="text-sm opacity-90">Harder Fight + Relic</span>
          </button>
          <button
            onClick={() => handleSelectEncounter('boss')}
            className="w-full py-4 px-5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-base transition-colors flex items-center justify-between shadow-lg"
          >
            <span className="text-lg">👑 Boss</span>
            <span className="text-sm opacity-90">Boss Fight + Relic</span>
          </button>
          <button
            onClick={() => handleSelectEncounter('shop')}
            className="w-full py-4 px-5 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold text-base transition-colors flex items-center justify-between shadow-lg"
          >
            <span className="text-lg">🛒 Shop</span>
            <span className="text-sm opacity-90">Buy Cards/Relics</span>
          </button>
          <button
            onClick={() => handleSelectEncounter('event')}
            className="w-full py-4 px-5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-base transition-colors flex items-center justify-between shadow-lg"
          >
            <span className="text-lg">❓ Event</span>
            <span className="text-sm opacity-90">Random Event</span>
          </button>
          <button
            onClick={() => handleSelectEncounter('rest')}
            className="w-full py-4 px-5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg font-bold text-base transition-colors flex items-center justify-between shadow-lg"
          >
            <span className="text-lg">🔥 Rest Site</span>
            <span className="text-sm opacity-90">Heal or Upgrade</span>
          </button>
          <button
            onClick={() => handleSelectEncounter('treasure')}
            className="w-full py-4 px-5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-base transition-colors flex items-center justify-between shadow-lg"
          >
            <span className="text-lg">💎 Treasure</span>
            <span className="text-sm opacity-90">Free Relic</span>
          </button>
        </div>
      )}

      {/* Step 2: Select Enemies */}
      {step === 'select-enemies' && (
        <div className="space-y-3">
          {/* Instructions */}
          <p className="text-sm text-sts-light/70">
            Select enemies for this fight ({selectedEnemies.length} selected, max 3)
          </p>

          <div className="grid grid-cols-2 gap-2">
            {getAvailableEnemies().map((enemy) => {
              const isSelected = selectedEnemies.some((e) => e.id === enemy.id);
              return (
                <button
                  key={enemy.id}
                  onClick={() => handleSelectEnemy(enemy)}
                  className={`py-2 px-3 rounded font-semibold text-sm transition-colors ${
                    isSelected
                      ? 'bg-red-600 text-white ring-2 ring-red-400'
                      : 'bg-sts-dark text-sts-light border border-sts-light/20 hover:bg-sts-dark/70'
                  }`}
                >
                  {isSelected && '✓ '}{enemy.name}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep('select-encounter')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold text-sm"
            >
              ← Back
            </button>
            <button
              onClick={handleConfirmEnemies}
              disabled={selectedEnemies.length === 0}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Fight →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Combat Advice */}
      {step === 'combat-advice' && combatAdviceList.length > 0 && (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {combatAdviceList.map((advice, index) => (
            <div key={advice.monster.id + index} className="bg-sts-dark rounded-lg p-4 border-2 border-sts-light/30">
              {/* Enemy Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-sts-light/20">
                <h4 className="text-lg font-bold text-sts-light">{advice.monster.name}</h4>
                <div className={`px-3 py-1 rounded text-sm font-bold ${
                  advice.readiness === 'ready' ? 'bg-green-600 text-white' :
                  advice.readiness === 'caution' ? 'bg-yellow-600 text-black' :
                  'bg-red-600 text-white'
                }`}>
                  {advice.readiness === 'ready' ? '✓ READY' :
                   advice.readiness === 'caution' ? '⚠ CAUTION' :
                   '⚠️ DANGER'}
                </div>
              </div>

              {/* HP and Attack Pattern */}
              <div className="mb-3 bg-sts-darker p-3 rounded">
                <div className="text-sm font-bold text-sts-light mb-2">📊 Enemy Stats</div>
                <div className="text-sm text-sts-light/90 mb-2">
                  <span className="font-semibold">HP:</span> {advice.monster.hp}
                </div>
                <div className="text-sm font-bold text-red-400 mb-1">Attack Pattern:</div>
                {advice.monster.attacks.map((attack, i) => (
                  <div key={i} className="text-sm text-sts-light/80 ml-2">
                    • <span className="font-semibold">{attack.name}:</span> {attack.damage} damage
                    {attack.hits > 1 && <span className="text-yellow-400"> × {attack.hits} hits</span>}
                    {attack.effect && <span className="text-purple-400"> ({attack.effect})</span>}
                  </div>
                ))}
                {advice.monster.abilities.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-bold text-blue-400 mb-1">Special Abilities:</div>
                    {advice.monster.abilities.map((ability, i) => (
                      <div key={i} className="text-sm text-sts-light/80 ml-2">• {ability}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Strategy */}
              <div className="mb-3 bg-blue-900/20 border border-blue-500/30 rounded p-3">
                <div className="text-sm font-bold text-blue-300 mb-1">💡 Core Strategy</div>
                <div className="text-sm text-sts-light/90">{advice.monster.strategy}</div>
              </div>

              {/* Strengths */}
              {advice.strengthAnalysis.length > 0 && (
                <div className="mb-3 bg-green-900/20 border border-green-500/30 rounded p-3">
                  <div className="text-sm font-bold text-green-400 mb-2">✓ Your Strengths</div>
                  <ul className="text-sm text-sts-light/90 space-y-1">
                    {advice.strengthAnalysis.map((strength, i) => (
                      <li key={i}>• {strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {advice.weaknessAnalysis.length > 0 && (
                <div className="mb-3 bg-red-900/20 border border-red-500/30 rounded p-3">
                  <div className="text-sm font-bold text-red-400 mb-2">⚠️ Concerns</div>
                  <ul className="text-sm text-sts-light/90 space-y-1">
                    {advice.weaknessAnalysis.map((weakness, i) => (
                      <li key={i}>• {weakness}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {advice.recommendations.length > 0 && (
                <div className="mb-3 bg-yellow-900/20 border border-yellow-500/30 rounded p-3">
                  <div className="text-sm font-bold text-yellow-400 mb-2">💬 Recommendations</div>
                  <ul className="text-sm text-sts-light/90 space-y-1">
                    {advice.recommendations.slice(0, 5).map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Potion Advice */}
              {advice.potionAdvice.length > 0 && (
                <div className="mb-3 bg-purple-900/20 border border-purple-500/30 rounded p-3">
                  <div className="text-sm font-bold text-purple-400 mb-2">🧪 Potion Usage</div>
                  {advice.potionAdvice.map((potionAdv, i) => (
                    <div key={i} className="text-sm text-sts-light/90 mb-2">
                      <span className="font-semibold text-purple-300">{potionAdv.potion.name}:</span>{' '}
                      <span className="text-yellow-300">{potionAdv.timing}</span>
                      <div className="text-xs text-sts-light/70 ml-2">{potionAdv.reason}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tutorial Tips */}
              {advice.tutorialTips.length > 0 && (
                <div className="bg-cyan-900/20 border border-cyan-500/30 rounded p-3">
                  <div className="text-sm font-bold text-cyan-400 mb-2">📚 How to Play This Fight</div>
                  <ul className="text-sm text-sts-light/90 space-y-1.5">
                    {advice.tutorialTips.slice(0, 4).map((tip, i) => (
                      <li key={i} className="leading-relaxed">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep('select-enemies')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold text-base"
            >
              ← Back to Enemy Selection
            </button>
            <button
              onClick={handleProceedToBattle}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-base shadow-lg"
            >
              ⚔️ Proceed to Battle →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Victory Screen */}
      {step === 'victory' && (
        <div className="space-y-4">
          <div className="text-center py-6">
            <h3 className="text-3xl font-bold text-green-400 mb-2">Victory!</h3>
            <p className="text-sm text-sts-light/70 mb-4">
              Defeated: {selectedEnemies.map((e) => e.name).join(', ')}
            </p>
            <div className="inline-block bg-yellow-600 px-6 py-3 rounded-lg">
              <p className="text-xs text-yellow-100 mb-1">Gold Gained</p>
              <div className="flex items-center justify-center gap-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => setGoldGained(Math.max(0, goldGained - 10))}
                    className="w-8 h-7 flex items-center justify-center bg-yellow-700 hover:bg-yellow-800 text-white rounded font-bold transition-colors text-xs"
                    title="Remove 10 gold"
                  >
                    −10
                  </button>
                  <button
                    onClick={() => setGoldGained(Math.max(0, goldGained - 5))}
                    className="w-7 h-7 flex items-center justify-center bg-yellow-700 hover:bg-yellow-800 text-white rounded font-bold transition-colors text-xs"
                    title="Remove 5 gold"
                  >
                    −5
                  </button>
                  <button
                    onClick={() => setGoldGained(Math.max(0, goldGained - 1))}
                    className="w-6 h-7 flex items-center justify-center bg-yellow-700 hover:bg-yellow-800 text-white rounded font-bold transition-colors text-xs"
                    title="Remove 1 gold"
                  >
                    −1
                  </button>
                </div>
                <p className="text-2xl font-bold text-white min-w-[4ch] text-center">+{goldGained}g</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setGoldGained(goldGained + 1)}
                    className="w-6 h-7 flex items-center justify-center bg-yellow-700 hover:bg-yellow-800 text-white rounded font-bold transition-colors text-xs"
                    title="Add 1 gold"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => setGoldGained(goldGained + 5)}
                    className="w-7 h-7 flex items-center justify-center bg-yellow-700 hover:bg-yellow-800 text-white rounded font-bold transition-colors text-xs"
                    title="Add 5 gold"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => setGoldGained(goldGained + 10)}
                    className="w-8 h-7 flex items-center justify-center bg-yellow-700 hover:bg-yellow-800 text-white rounded font-bold transition-colors text-xs"
                    title="Add 10 gold"
                  >
                    +10
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleProceedToRewards}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-sm"
          >
            Claim Rewards →
          </button>
        </div>
      )}

      {/* Step 5: Rewards */}
      {step === 'rewards' && (
        <div className="space-y-3">
          <p className="text-sm text-sts-light/70 mb-3">Choose your rewards:</p>

          <button
            onClick={handleOpenCardReward}
            className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded font-semibold text-sm transition-colors"
          >
            🃏 Choose a Card
          </button>

          {(encounterType === 'elite' || encounterType === 'boss') && (
            <button
              onClick={handleOpenRelicReward}
              className="w-full py-3 px-4 bg-purple-700 hover:bg-purple-800 text-white rounded font-semibold text-sm transition-colors"
            >
              💎 Choose a Relic
            </button>
          )}

          <button
            onClick={handleSkipRewards}
            className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold text-sm transition-colors"
          >
            Skip Rewards (Proceed to Next Floor)
          </button>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import type { Card } from '../types';
import monstersData from '../data/monsters.json';
import { getMonsterImagePath } from '../utils/imageHelpers';

interface Monster {
  id: string;
  name: string;
  act: number;
  hp: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'elite';
  attacks: Array<{ name: string; damage: string; hits: number }>;
  abilities: string[];
  strategy: string;
  weaknesses: string[];
  dangers: string[];
  deckRequirements: {
    damage: string;
    block: string;
    scaling: string;
  };
}

interface HallwayFightModalProps {
  act: number;
  deck: Card[];
  currentHp: number;
  maxHp: number;
  gold: number;
  onComplete: (result: {
    won: boolean;
    hpLost: number;
    goldGained: number;
    showCardReward: boolean;
  }) => void;
  onCancel: () => void;
}

type CombatPhase = 'select-enemy' | 'combat-strategy' | 'post-combat';

export function HallwayFightModal({
  act,
  deck,
  currentHp,
  maxHp,
  gold,
  onComplete,
  onCancel,
}: HallwayFightModalProps) {
  const [phase, setPhase] = useState<CombatPhase>('select-enemy');
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [combatResult, setCombatResult] = useState({
    won: true,
    finalHp: currentHp,
    goldGained: 0,
  });

  // Filter monsters by current act and difficulty (hallway = easy/normal)
  const hallwayMonsters = (monstersData as Monster[]).filter(
    (m) => m.act === act && (m.difficulty === 'easy' || m.difficulty === 'normal')
  );

  const handleSelectMonster = (monster: Monster) => {
    setSelectedMonster(monster);
    setPhase('combat-strategy');
  };

  const handleStartCombat = () => {
    // Combat happens (in the actual game)
    // For now, we just show the strategy and wait for results
  };

  const handleCombatComplete = () => {
    const hpLost = currentHp - combatResult.finalHp;
    onComplete({
      won: combatResult.won,
      hpLost: hpLost,
      goldGained: combatResult.goldGained,
      showCardReward: combatResult.won, // Show card rewards if won
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-400';
      case 'normal':
        return 'text-yellow-400';
      case 'hard':
        return 'text-orange-400';
      case 'elite':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-sts-dark rounded-lg border-2 border-red-500/50 w-full max-h-full overflow-y-auto">
        {/* PHASE 1: Select Enemy */}
        {phase === 'select-enemy' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4">⚔️ Choose Your Opponent</h2>
            <p className="text-sts-light/80 mb-6">Select which enemy you're facing in this hallway fight:</p>

            <div className="grid grid-cols-2 gap-4">
              {hallwayMonsters.map((monster) => (
                <button
                  key={monster.id}
                  onClick={() => handleSelectMonster(monster)}
                  className="bg-sts-darker border-2 border-red-900/50 hover:border-red-500 rounded-lg p-4 transition-all hover:scale-105 text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 bg-black rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={getMonsterImagePath(act, monster.id)}
                        alt={monster.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-sts-light mb-1">{monster.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm font-semibold ${getDifficultyColor(monster.difficulty)}`}>
                          {monster.difficulty.toUpperCase()}
                        </span>
                        <span className="text-sm text-sts-light/60">HP: {monster.hp}</span>
                      </div>
                      <p className="text-xs text-sts-light/70 line-clamp-2">{monster.strategy}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* PHASE 2: Combat Strategy */}
        {phase === 'combat-strategy' && selectedMonster && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-red-400 flex items-center gap-2">
                <span>⚔️</span>
                <span>Combat: {selectedMonster.name}</span>
              </h2>
              <button
                onClick={() => setPhase('select-enemy')}
                className="text-sts-light/60 hover:text-sts-light transition-colors text-sm"
              >
                ← Change Enemy
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              {/* Enemy Image & Info */}
              <div className="col-span-1 bg-sts-darker rounded-lg p-4 border-2 border-red-900/50">
                <div className="w-full aspect-square bg-black rounded-lg overflow-hidden mb-3">
                  <img
                    src={getMonsterImagePath(act, selectedMonster.id)}
                    alt={selectedMonster.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-sts-light/60">HP:</span>
                    <span className="text-red-400 font-semibold">{selectedMonster.hp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sts-light/60">Difficulty:</span>
                    <span className={getDifficultyColor(selectedMonster.difficulty)}>
                      {selectedMonster.difficulty.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Strategy & Tips */}
              <div className="col-span-2 space-y-4">
                {/* Attack Pattern */}
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                    <span>⚡</span>
                    <span>Attack Pattern</span>
                  </h3>
                  <div className="space-y-1">
                    {selectedMonster.attacks.map((attack, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="text-sts-light font-medium">{attack.name}:</span>{' '}
                        <span className="text-red-300">
                          {attack.damage} damage {attack.hits > 1 ? `× ${attack.hits}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Abilities */}
                {selectedMonster.abilities.length > 0 && (
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                    <h3 className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
                      <span>✨</span>
                      <span>Special Abilities</span>
                    </h3>
                    <ul className="space-y-1">
                      {selectedMonster.abilities.map((ability, idx) => (
                        <li key={idx} className="text-sm text-sts-light/80">
                          • {ability}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Strategy */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                    <span>💡</span>
                    <span>Strategy</span>
                  </h3>
                  <p className="text-sm text-sts-light/80">{selectedMonster.strategy}</p>
                </div>

                {/* Weaknesses & Dangers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                    <h4 className="text-green-400 font-semibold text-sm mb-2">✓ Weaknesses</h4>
                    <ul className="space-y-1">
                      {selectedMonster.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-xs text-sts-light/70">
                          • {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                    <h4 className="text-orange-400 font-semibold text-sm mb-2">⚠️ Dangers</h4>
                    <ul className="space-y-1">
                      {selectedMonster.dangers.map((danger, idx) => (
                        <li key={idx} className="text-xs text-sts-light/70">
                          • {danger}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-700">
              <button
                onClick={() => setPhase('select-enemy')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setPhase('post-combat')}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded transition-colors"
              >
                Enter Combat Results →
              </button>
            </div>
          </div>
        )}

        {/* PHASE 3: Post-Combat Results */}
        {phase === 'post-combat' && selectedMonster && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">📊 Combat Results</h2>

            <div className="space-y-4">
              {/* Win/Loss */}
              <div className="bg-sts-darker rounded-lg p-4 border-2 border-gray-700">
                <label className="block text-sts-light font-semibold mb-2">Combat Outcome:</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setCombatResult({ ...combatResult, won: true })}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      combatResult.won
                        ? 'bg-green-600 text-white border-2 border-green-400'
                        : 'bg-gray-700 text-gray-400 border-2 border-gray-600 hover:border-green-400/50'
                    }`}
                  >
                    ✓ Victory
                  </button>
                  <button
                    onClick={() => setCombatResult({ ...combatResult, won: false })}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      !combatResult.won
                        ? 'bg-red-600 text-white border-2 border-red-400'
                        : 'bg-gray-700 text-gray-400 border-2 border-gray-600 hover:border-red-400/50'
                    }`}
                  >
                    ✗ Defeat
                  </button>
                </div>
              </div>

              {/* HP After Combat */}
              <div className="bg-sts-darker rounded-lg p-4 border-2 border-gray-700">
                <label className="block text-sts-light font-semibold mb-2">
                  Your HP After Combat: <span className="text-red-400">{combatResult.finalHp}</span> / {maxHp}
                </label>
                <input
                  type="range"
                  min="0"
                  max={maxHp}
                  value={combatResult.finalHp}
                  onChange={(e) =>
                    setCombatResult({ ...combatResult, finalHp: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-sts-light/60 mt-1">
                  <span>0 HP</span>
                  <span className="text-orange-400">
                    HP Lost: {currentHp - combatResult.finalHp}
                  </span>
                  <span>{maxHp} HP</span>
                </div>
              </div>

              {/* Gold Gained (if won) */}
              {combatResult.won && (
                <div className="bg-sts-darker rounded-lg p-4 border-2 border-gray-700">
                  <label className="block text-sts-light font-semibold mb-2">
                    Gold Gained: <span className="text-yellow-400">{combatResult.goldGained}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={combatResult.goldGained}
                    onChange={(e) =>
                      setCombatResult({ ...combatResult, goldGained: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-sts-darkest border border-gray-600 rounded px-3 py-2 text-sts-light"
                    placeholder="Enter gold amount..."
                  />
                  <p className="text-xs text-sts-light/60 mt-1">
                    Typical hallway fights give 10-25 gold
                  </p>
                </div>
              )}

              {combatResult.won && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-300 text-sm">
                    💡 After confirming, you'll be shown card rewards to choose from
                  </p>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-700 mt-6">
              <button
                onClick={() => setPhase('combat-strategy')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                ← Back to Strategy
              </button>
              <button
                onClick={handleCombatComplete}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded transition-colors"
              >
                Confirm Results →
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

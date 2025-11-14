import { useState } from 'react';
import { AutocompleteInput } from './AutocompleteInput';
import {
  evaluateRestSite,
  generateRestSiteStrategy,
  getUpgradePriority,
  type RestSiteRecommendation,
} from '../utils/restSiteAdvisor';

interface RestFlowProps {
  floor: number;
  deck: string[];
  relics: string[];
  character: string;
  currentHP: number;
  maxHP: number;
  gold: number;
  ascension: number;
  onComplete: (action: 'rest' | 'upgrade' | 'smith' | 'lift', cardUpgraded?: string, cardRemoved?: string) => void;
}

export function RestFlow({
  floor,
  deck,
  relics,
  character,
  currentHP,
  maxHP,
  gold,
  onComplete,
}: RestFlowProps) {
  const [selectedAction, setSelectedAction] = useState<'rest' | 'upgrade' | 'smith' | 'lift' | null>(null);
  const [cardToUpgrade, setCardToUpgrade] = useState<string>('');
  const [cardToRemove, setCardToRemove] = useState<string>('');

  const act = floor <= 16 ? 1 : floor <= 33 ? 2 : 3;
  const upcomingBoss = act === 1 ? 'Hexaghost' : act === 2 ? 'Bronze Automaton' : 'Time Eater';
  let upcomingElites = 3;
  if (act === 1) {
    if (floor >= 14) upcomingElites = 0;
    else if (floor >= 10) upcomingElites = 1;
    else if (floor >= 6) upcomingElites = 2;
  } else if (act === 2) {
    if (floor >= 30) upcomingElites = 0;
    else if (floor >= 26) upcomingElites = 1;
    else if (floor >= 22) upcomingElites = 2;
  } else {
    if (floor >= 48) upcomingElites = 0;
    else if (floor >= 44) upcomingElites = 1;
    else if (floor >= 40) upcomingElites = 2;
  }

  const recommendations = evaluateRestSite({
    character,
    act,
    floor,
    deck,
    relics,
    currentHP,
    maxHP,
    gold,
    upcomingElites,
    upcomingBoss,
  });

  const strategy = generateRestSiteStrategy(recommendations);
  const upgradePriorities = getUpgradePriority(deck, relics, character, act);

  const restRec = recommendations.find(r => r.action === 'rest');
  const upgradeRec = recommendations.find(r => r.action === 'upgrade');
  const smithRec = recommendations.find(r => r.action === 'smith');
  const liftRec = recommendations.find(r => r.action === 'lift');

  const handleConfirm = () => {
    if (selectedAction === 'rest') {
      onComplete('rest');
    } else if (selectedAction === 'upgrade') {
      onComplete('upgrade', cardToUpgrade || upgradeRec?.upgradeTarget);
    } else if (selectedAction === 'smith') {
      onComplete('smith', undefined, cardToRemove || smithRec?.cardToRemove);
    } else if (selectedAction === 'lift') {
      onComplete('lift');
    }
  };

  const hpPercent = (currentHP / maxHP) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-sts-gold mb-2">Rest Site</h2>
        <div className="text-sm text-sts-light/70 mb-4">
          HP: {currentHP}/{maxHP} ({Math.floor(hpPercent)}%)
        </div>

        {/* Strategy Summary */}
        <div className="mb-6 p-4 bg-blue-900/30 border-2 border-blue-500/60 rounded-lg">
          <h3 className="text-lg font-bold text-blue-400 mb-2">💡 Recommendation</h3>
          <div className="text-sm text-sts-light whitespace-pre-line">{strategy}</div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Rest Option */}
          {restRec && restRec.priority !== 'avoid' && (
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedAction === 'rest'
                  ? 'border-sts-gold bg-sts-gold/20'
                  : restRec.priority === 'must-do'
                  ? 'border-red-500/60 bg-red-900/20 hover:border-red-500'
                  : 'border-sts-light/20 bg-sts-darker hover:border-sts-light/40'
              }`}
              onClick={() => setSelectedAction('rest')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-sts-light">
                  🔥 Rest
                  {restRec.priority === 'must-do' && (
                    <span className="ml-2 px-2 py-1 bg-red-900/40 text-red-300 text-xs rounded font-semibold">
                      RECOMMENDED
                    </span>
                  )}
                </h3>
                <div className="text-lg font-bold text-green-400">+{restRec.hpGain} HP</div>
              </div>
              <div className="text-sm text-sts-light/80 space-y-1">
                {restRec.reasoning.map((reason, i) => (
                  <div key={i}>{reason}</div>
                ))}
              </div>
            </div>
          )}

          {/* Upgrade Option */}
          {upgradeRec && upgradeRec.priority !== 'avoid' && (
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedAction === 'upgrade'
                  ? 'border-sts-gold bg-sts-gold/20'
                  : upgradeRec.priority === 'must-do'
                  ? 'border-green-500/60 bg-green-900/20 hover:border-green-500'
                  : 'border-sts-light/20 bg-sts-darker hover:border-sts-light/40'
              }`}
              onClick={() => setSelectedAction('upgrade')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-sts-light">
                  ⚡ Upgrade
                  {upgradeRec.priority === 'must-do' && (
                    <span className="ml-2 px-2 py-1 bg-green-900/40 text-green-300 text-xs rounded font-semibold">
                      RECOMMENDED
                    </span>
                  )}
                </h3>
              </div>
              <div className="text-sm text-sts-light/80 space-y-1 mb-3">
                {upgradeRec.reasoning.map((reason, i) => (
                  <div key={i}>{reason}</div>
                ))}
              </div>

              {selectedAction === 'upgrade' && (
                <div className="mt-3 pt-3 border-t border-sts-light/20">
                  <label className="block text-sm font-semibold text-sts-light mb-2">
                    Which card did you upgrade?
                  </label>
                  <AutocompleteInput
                    type="card"
                    values={cardToUpgrade ? [cardToUpgrade] : []}
                    onChange={(cards) => setCardToUpgrade(cards[0] || '')}
                    placeholder="Type card name..."
                    suggestions={upgradePriorities.slice(0, 10).map(u => u.card)}
                  />

                  {/* Top upgrade suggestions */}
                  <div className="mt-3 space-y-1">
                    <div className="text-xs font-semibold text-sts-light/70">Top upgrades:</div>
                    {upgradePriorities.slice(0, 5).map((upgrade, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardToUpgrade(upgrade.card);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                          cardToUpgrade === upgrade.card
                            ? 'bg-sts-gold/20 text-sts-gold'
                            : 'bg-sts-dark/50 text-sts-light/70 hover:bg-sts-dark'
                        }`}
                      >
                        <span className="font-semibold">{upgrade.card}</span>
                        <span className="ml-2 text-sts-light/50">- {upgrade.reason}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Smith Option (Peace Pipe) */}
          {smithRec && smithRec.priority !== 'avoid' && (
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedAction === 'smith'
                  ? 'border-sts-gold bg-sts-gold/20'
                  : 'border-sts-light/20 bg-sts-darker hover:border-sts-light/40'
              }`}
              onClick={() => setSelectedAction('smith')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-sts-light">🔨 Smith (Peace Pipe)</h3>
              </div>
              <div className="text-sm text-sts-light/80 space-y-1">
                {smithRec.reasoning.map((reason, i) => (
                  <div key={i}>{reason}</div>
                ))}
              </div>

              {selectedAction === 'smith' && (
                <div className="mt-3 pt-3 border-t border-sts-light/20">
                  <label className="block text-sm font-semibold text-sts-light mb-2">
                    Which card did you remove?
                  </label>
                  <AutocompleteInput
                    type="card"
                    values={cardToRemove ? [cardToRemove] : []}
                    onChange={(cards) => setCardToRemove(cards[0] || '')}
                    placeholder="Type card name..."
                    suggestions={deck}
                  />
                </div>
              )}
            </div>
          )}

          {/* Lift Option (Girya) */}
          {liftRec && liftRec.priority !== 'avoid' && (
            <div
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedAction === 'lift'
                  ? 'border-sts-gold bg-sts-gold/20'
                  : 'border-sts-light/20 bg-sts-darker hover:border-sts-light/40'
              }`}
              onClick={() => setSelectedAction('lift')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-sts-light">💪 Lift (Girya)</h3>
                <div className="text-lg font-bold text-red-400">+1 STR</div>
              </div>
              <div className="text-sm text-sts-light/80 space-y-1">
                {liftRec.reasoning.map((reason, i) => (
                  <div key={i}>{reason}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={!selectedAction}
        className="w-full py-3 bg-sts-gold hover:bg-sts-gold/80 disabled:bg-sts-gold/30 text-sts-dark font-bold rounded transition-colors disabled:cursor-not-allowed"
      >
        {selectedAction ? `Confirm: ${selectedAction.toUpperCase()}` : 'Select an action'}
      </button>
    </div>
  );
}

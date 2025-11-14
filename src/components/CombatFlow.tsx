import { useState } from 'react';
import type { CombatEncounter, CardRewardDecision } from '../types/coaching';
import { AutocompleteInput } from './AutocompleteInput';
import { CardRewardFlow } from './CardRewardFlow';
import { generateCombatStrategy } from '../utils/combatAdvisor';

interface CombatFlowProps {
  floor: number;
  deck: string[];
  relics: string[];
  character: string;
  currentHP: number;
  maxHP: number;
  gold: number;
  ascension: number;
  onComplete: (combat: CombatEncounter, cardReward?: CardRewardDecision) => void;
}

type CombatStep = 'enter-enemies' | 'enter-hand' | 'show-strategy' | 'record-results' | 'card-reward';

export function CombatFlow({
  floor,
  deck,
  relics,
  character,
  currentHP,
  maxHP,
  gold,
  ascension,
  onComplete,
}: CombatFlowProps) {
  const [step, setStep] = useState<CombatStep>('enter-enemies');
  const [enemies, setEnemies] = useState<string[]>([]);
  const [currentHand, setCurrentHand] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<string>('');
  const [won, setWon] = useState<boolean | null>(null);
  const [endingHP, setEndingHP] = useState(currentHP);
  const [goldReceived, setGoldReceived] = useState(0);
  const [combatData, setCombatData] = useState<CombatEncounter | null>(null);

  const handleEnemiesEntered = () => {
    setStep('enter-hand');
  };

  const handleHandEntered = () => {
    // Generate strategy based on enemies, hand, deck, relics
    const generatedStrategy = generateCombatStrategy({
      enemies,
      hand: currentHand,
      deck,
      relics,
      character,
      floor,
      currentHP,
      maxHP,
    });

    setStrategy(generatedStrategy);
    setStep('show-strategy');
  };

  const handleStrategyAcknowledged = () => {
    setStep('record-results');
  };

  const handleResultsSubmitted = () => {
    const combat: CombatEncounter = {
      floor,
      enemies,
      currentHand,
      strategy,
      won: won!,
      endingHP,
      goldReceived,
    };

    setCombatData(combat);

    // Only show card rewards if they won
    if (won) {
      setStep('card-reward');
    } else {
      onComplete(combat);
    }
  };

  const handleCardRewardComplete = (cardReward: CardRewardDecision) => {
    onComplete(combatData!, cardReward);
  };

  // Step 1: Enter enemies
  if (step === 'enter-enemies') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-sts-gold mb-2">Who are you facing?</h2>
          <p className="text-sm text-sts-light/70 mb-4">
            Enter the enemies in this combat (e.g., "Cultist", "2x Louse", "Jaw Worm")
          </p>

          <AutocompleteInput
            type="enemy"
            values={enemies}
            onChange={setEnemies}
            placeholder="Type enemy name..."
          />

          <div className="mt-4 text-sm text-sts-light/70">
            {enemies.length === 0 ? (
              <p>No enemies entered yet</p>
            ) : (
              <p>Facing: {enemies.join(', ')}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleEnemiesEntered}
          disabled={enemies.length === 0}
          className="w-full py-3 bg-sts-gold hover:bg-sts-gold/80 disabled:bg-sts-gold/30 text-sts-dark font-bold rounded transition-colors disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    );
  }

  // Step 2: Enter current hand
  if (step === 'enter-hand') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-sts-gold mb-2">What's in your hand?</h2>
          <p className="text-sm text-sts-light/70 mb-4">
            Enter the cards in your starting hand (optional but helps with strategy)
          </p>

          <AutocompleteInput
            type="card"
            values={currentHand}
            onChange={setCurrentHand}
            placeholder="Type card name..."
            suggestions={deck}
          />

          <div className="mt-4 text-sm text-sts-light/70">
            {currentHand.length === 0 ? (
              <p>No cards entered</p>
            ) : (
              <p>Hand: {currentHand.join(', ')}</p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setStep('enter-enemies')}
            className="flex-1 py-3 bg-sts-darker hover:bg-sts-dark border-2 border-sts-light/20 text-sts-light font-semibold rounded transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleHandEntered}
            className="flex-1 py-3 bg-sts-gold hover:bg-sts-gold/80 text-sts-dark font-bold rounded transition-colors"
          >
            {currentHand.length === 0 ? 'Skip (General Strategy)' : 'Get Strategy'}
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Show strategy
  if (step === 'show-strategy') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-sts-gold mb-2">Combat Strategy</h2>
          <p className="text-sm text-sts-light/70 mb-4">
            Facing: {enemies.join(', ')}
          </p>

          <div className="bg-sts-darker border-2 border-blue-500/40 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-400 mb-3">💡 Recommended Strategy</h3>
            <div className="text-sts-light whitespace-pre-line">
              {strategy}
            </div>
          </div>

          {currentHand.length > 0 && (
            <div className="mt-4 text-sm text-sts-light/70">
              <strong>Your hand:</strong> {currentHand.join(', ')}
            </div>
          )}
        </div>

        <button
          onClick={handleStrategyAcknowledged}
          className="w-full py-3 bg-sts-gold hover:bg-sts-gold/80 text-sts-dark font-bold rounded transition-colors"
        >
          Fight!
        </button>
      </div>
    );
  }

  // Step 4: Record results
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-sts-gold mb-4">How did it go?</h2>

        {/* Win/Loss */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-sts-light mb-2">Result</label>
          <div className="flex gap-4">
            <button
              onClick={() => setWon(true)}
              className={`flex-1 py-3 rounded border-2 font-semibold transition-all ${
                won === true
                  ? 'bg-green-900/40 border-green-500 text-green-400'
                  : 'bg-sts-darker border-sts-light/20 text-sts-light hover:border-sts-light/40'
              }`}
            >
              ✓ Won
            </button>
            <button
              onClick={() => setWon(false)}
              className={`flex-1 py-3 rounded border-2 font-semibold transition-all ${
                won === false
                  ? 'bg-red-900/40 border-red-500 text-red-400'
                  : 'bg-sts-darker border-sts-light/20 text-sts-light hover:border-sts-light/40'
              }`}
            >
              ✗ Lost
            </button>
          </div>
        </div>

        {/* Ending HP */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-sts-light mb-2">
            Ending HP (was {currentHP})
          </label>
          <input
            type="number"
            value={endingHP}
            onChange={(e) => setEndingHP(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 bg-sts-darker border-2 border-sts-light/20 rounded text-sts-light focus:border-sts-gold focus:outline-none"
            min={0}
            max={maxHP}
          />
        </div>

        {/* Gold Received */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-sts-light mb-2">
            Gold Received
          </label>
          <input
            type="number"
            value={goldReceived}
            onChange={(e) => setGoldReceived(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 bg-sts-darker border-2 border-sts-light/20 rounded text-sts-light focus:border-sts-gold focus:outline-none"
            min={0}
          />
        </div>
      </div>

      <button
        onClick={handleResultsSubmitted}
        disabled={won === null}
        className="w-full py-3 bg-sts-gold hover:bg-sts-gold/80 disabled:bg-sts-gold/30 text-sts-dark font-bold rounded transition-colors disabled:cursor-not-allowed"
      >
        {won === null ? 'Select Win or Loss' : 'Continue to Rewards'}
      </button>
    </div>
  );

  // Step 5: Card Reward
  if (step === 'card-reward') {
    return (
      <CardRewardFlow
        floor={floor}
        deck={deck}
        relics={relics}
        character={character}
        currentHP={endingHP}
        maxHP={maxHP}
        gold={gold + goldReceived}
        ascension={ascension}
        onComplete={handleCardRewardComplete}
      />
    );
  }

  return null;
}

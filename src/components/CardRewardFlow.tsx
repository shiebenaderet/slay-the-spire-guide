import { useState, useMemo } from 'react';
import { AutocompleteInput } from './AutocompleteInput';
import { evaluateCardPick } from '../utils/cardRecommendationEngine';
import type { CardRewardDecision } from '../types/coaching';
import cardsData from '../data/cards.json';

interface CardRewardFlowProps {
  floor: number;
  deck: string[];
  relics: string[];
  character: string;
  currentHP: number;
  maxHP: number;
  gold: number;
  ascension: number;
  onComplete: (reward: CardRewardDecision) => void;
}

export function CardRewardFlow({
  floor,
  deck,
  relics,
  character,
  currentHP,
  maxHP,
  gold,
  ascension,
  onComplete,
}: CardRewardFlowProps) {
  const [cardsOffered, setCardsOffered] = useState<string[]>([]);
  const [showingRecommendations, setShowingRecommendations] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | 'skip' | null>(null);

  // Get all card names for autocomplete suggestions
  const availableCards = useMemo(() => {
    const characterCards = cardsData
      .filter((c: any) =>
        (c.character === character.toLowerCase() || c.character === 'colorless') &&
        c.rarity !== 'starter' && c.rarity !== 'curse'
      )
      .map((c: any) => c.name);
    return characterCards;
  }, [character]);

  // Determine act and upcoming boss based on floor
  const act = floor <= 16 ? 1 : floor <= 33 ? 2 : 3;
  let upcomingBoss = 'Unknown';
  let upcomingElites = 3;

  if (act === 1) {
    upcomingBoss = floor <= 16 ? 'Hexaghost' : 'Unknown';
    if (floor >= 14) upcomingElites = 0;
    else if (floor >= 10) upcomingElites = 1;
    else if (floor >= 6) upcomingElites = 2;
  } else if (act === 2) {
    upcomingBoss = 'Bronze Automaton';
    if (floor >= 30) upcomingElites = 0;
    else if (floor >= 26) upcomingElites = 1;
    else if (floor >= 22) upcomingElites = 2;
  } else {
    upcomingBoss = 'Time Eater';
    if (floor >= 48) upcomingElites = 0;
    else if (floor >= 44) upcomingElites = 1;
    else if (floor >= 40) upcomingElites = 2;
  }

  const handleCardsEntered = () => {
    if (cardsOffered.length > 0) {
      setShowingRecommendations(true);
    }
  };

  const handleCardSelected = () => {
    if (selectedCard !== null) {
      const reward: CardRewardDecision = {
        floor,
        cardsOffered,
        picked: selectedCard,
      };
      onComplete(reward);
    }
  };

  // Enter cards offered
  if (!showingRecommendations) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-sts-gold mb-2">What cards were offered?</h2>
          <p className="text-sm text-sts-light/70 mb-4">
            Enter the 3 cards you can choose from (or fewer if it's a boss/event reward)
          </p>

          <AutocompleteInput
            type="card"
            values={cardsOffered}
            onChange={setCardsOffered}
            placeholder="Type card name..."
            suggestions={availableCards}
          />

          <div className="mt-4 text-sm text-sts-light/70">
            {cardsOffered.length === 0 ? (
              <p>No cards entered yet</p>
            ) : (
              <p>Cards: {cardsOffered.join(', ')}</p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => onComplete({ floor, cardsOffered: [], picked: 'SKIP' })}
            className="flex-1 py-3 bg-sts-darker hover:bg-sts-dark border-2 border-sts-light/20 text-sts-light font-semibold rounded transition-colors"
          >
            Skip Reward
          </button>
          <button
            onClick={handleCardsEntered}
            disabled={cardsOffered.length === 0}
            className="flex-1 py-3 bg-sts-gold hover:bg-sts-gold/80 disabled:bg-sts-gold/30 text-sts-dark font-bold rounded transition-colors disabled:cursor-not-allowed"
          >
            Get Recommendations
          </button>
        </div>
      </div>
    );
  }

  // Show recommendations
  const evaluations = evaluateCardPick(cardsOffered, {
    character,
    act,
    floor,
    deck,
    relics,
    currentHP,
    maxHP,
    gold,
    ascension,
    upcomingElites,
    upcomingBoss,
  });

  // Sort by score (best first)
  const sortedEvaluations = [...evaluations].sort((a, b) => b.score - a.score);
  const bestPick = sortedEvaluations[0];

  // Check if all cards are weak
  const allCardsWeak = sortedEvaluations.every(e => e.recommendation === 'skip');
  const allCardsLowScore = sortedEvaluations.every(e => e.score < 2);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-sts-gold mb-4">Card Recommendations</h2>

        {/* Warning if all cards are weak */}
        {(allCardsWeak || allCardsLowScore) && (
          <div className="mb-6 p-4 bg-red-900/30 border-2 border-red-500/60 rounded-lg">
            <h3 className="text-xl font-bold text-red-400 mb-2">
              ⚠️ All cards are weak - Consider skipping
            </h3>
            <p className="text-sm text-red-300">
              None of these cards solve your immediate problems. Skipping is often correct when cards don't help with upcoming elites/boss.
            </p>
          </div>
        )}

        {/* Best Pick Highlight */}
        <div className={`mb-6 p-4 border-2 rounded-lg ${
          bestPick.recommendation === 'skip'
            ? 'bg-yellow-900/30 border-yellow-500/60'
            : bestPick.recommendation === 'must-pick'
            ? 'bg-green-900/30 border-green-500/60'
            : 'bg-blue-900/30 border-blue-500/60'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-xl font-bold ${
              bestPick.recommendation === 'skip'
                ? 'text-yellow-400'
                : bestPick.recommendation === 'must-pick'
                ? 'text-green-400'
                : 'text-blue-400'
            }`}>
              {bestPick.recommendation === 'must-pick' ? '🏆' : bestPick.recommendation === 'skip' ? '⚠️' : '✓'}
              {bestPick.recommendation === 'skip' ? 'Least Bad Option' : 'Best Pick'}: {bestPick.card}
            </h3>
            <div className={`text-2xl font-bold ${
              bestPick.recommendation === 'skip'
                ? 'text-yellow-400'
                : 'text-green-400'
            }`}>{bestPick.score}/5</div>
          </div>

          <div className="mb-3 flex gap-2 text-sm">
            <span className="px-2 py-1 bg-blue-900/40 border border-blue-500/40 rounded text-blue-300">
              Elites: {bestPick.breakdown.elitePoints}/3
            </span>
            <span className="px-2 py-1 bg-purple-900/40 border border-purple-500/40 rounded text-purple-300">
              Boss: {bestPick.breakdown.bossPoints}/1
            </span>
            <span className="px-2 py-1 bg-yellow-900/40 border border-yellow-500/40 rounded text-yellow-300">
              Synergy: {bestPick.breakdown.synergyPoints}/1
            </span>
          </div>

          {/* Reasoning */}
          <div className="space-y-1 text-sm text-sts-light">
            {bestPick.reasoning.map((reason, i) => (
              <div key={i}>{reason}</div>
            ))}
          </div>

          {/* Synergies */}
          {bestPick.synergies.length > 0 && (
            <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded">
              <div className="text-sm font-semibold text-yellow-400 mb-1">💡 Synergies:</div>
              {bestPick.synergies.map((syn, i) => (
                <div key={i} className="text-xs text-yellow-200 ml-2">
                  • <strong>{syn.with}</strong>: {syn.explanation}
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {bestPick.warnings.length > 0 && (
            <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded">
              {bestPick.warnings.map((warning, i) => (
                <div key={i} className="text-xs text-red-300">{warning}</div>
              ))}
            </div>
          )}
        </div>

        {/* Other Options */}
        {sortedEvaluations.length > 1 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-sts-light">Other Options:</h3>
            {sortedEvaluations.slice(1).map((evaluation, idx) => (
              <div
                key={idx}
                className={`p-3 rounded border-2 ${
                  evaluation.recommendation === 'skip'
                    ? 'bg-red-900/20 border-red-500/30'
                    : 'bg-sts-darker border-sts-light/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sts-light">{evaluation.card}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-sts-light/70">{evaluation.score}/5</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        evaluation.recommendation === 'skip'
                          ? 'bg-red-900/40 text-red-300'
                          : evaluation.recommendation === 'consider'
                          ? 'bg-yellow-900/40 text-yellow-300'
                          : 'bg-blue-900/40 text-blue-300'
                      }`}
                    >
                      {evaluation.recommendation === 'skip' ? 'SKIP' : evaluation.recommendation === 'consider' ? 'MAYBE' : 'GOOD'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-sts-light/80 space-y-1">
                  {evaluation.reasoning.slice(0, 2).map((reason, i) => (
                    <div key={i}>{reason}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skip Option */}
        <div className="mt-6 p-3 bg-sts-darker border border-sts-light/20 rounded">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sts-light">Skip</h4>
              <p className="text-xs text-sts-light/70">
                Don't take any of these cards if they don't solve your problems
              </p>
            </div>
            <button
              onClick={() => setSelectedCard('skip')}
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                selectedCard === 'skip'
                  ? 'bg-sts-gold text-sts-dark'
                  : 'bg-sts-dark border-2 border-sts-light/40 text-sts-light hover:border-sts-gold'
              }`}
            >
              {selectedCard === 'skip' ? '✓ Selected' : 'Select'}
            </button>
          </div>
        </div>

        {/* Selection Buttons */}
        <div className="mt-6 space-y-2">
          {sortedEvaluations.map((evaluation, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedCard(evaluation.card)}
              className={`w-full p-3 rounded border-2 font-semibold text-left transition-colors ${
                selectedCard === evaluation.card
                  ? 'bg-sts-gold/20 border-sts-gold text-sts-gold'
                  : 'bg-sts-darker border-sts-light/20 text-sts-light hover:border-sts-gold/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Pick: {evaluation.card}</span>
                {selectedCard === evaluation.card && <span>✓</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setShowingRecommendations(false)}
          className="flex-1 py-3 bg-sts-darker hover:bg-sts-dark border-2 border-sts-light/20 text-sts-light font-semibold rounded transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleCardSelected}
          disabled={selectedCard === null}
          className="flex-1 py-3 bg-sts-gold hover:bg-sts-gold/80 disabled:bg-sts-gold/30 text-sts-dark font-bold rounded transition-colors disabled:cursor-not-allowed"
        >
          Confirm Choice
        </button>
      </div>
    </div>
  );
}

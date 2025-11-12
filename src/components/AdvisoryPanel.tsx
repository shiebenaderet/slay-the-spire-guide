import { useState, useMemo } from 'react';
import type { Card, CardAdvice, CharacterType } from '../types';
import { evaluateCardForDeck, analyzeDeck } from '../utils/advisoryLogic';
import { getCardImagePath, handleImageError } from '../utils/imageHelpers';
import { detectDeckArchetypes } from '../utils/archetypeDetection';

interface AdvisoryPanelProps {
  deck: Card[];
  availableCards: Card[];
}

export function AdvisoryPanel({ deck, availableCards }: AdvisoryPanelProps) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const deckAnalysis = analyzeDeck(deck);

  // Detect archetypes for the current character
  const character: CharacterType = (deck[0]?.character === 'colorless' ? 'ironclad' : deck[0]?.character) || 'ironclad';
  const archetypes = useMemo(() => detectDeckArchetypes(deck, character), [deck, character]);

  const cardAdvices = availableCards
    .map((card) => evaluateCardForDeck(card, deck))
    .sort((a, b) => {
      const priorityOrder = { 'must-pick': 0, 'good-pick': 1, situational: 2, skip: 3 };
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.rating - a.rating;
    });

  const getPriorityColor = (priority: CardAdvice['priority']) => {
    const colors = {
      'must-pick': 'bg-green-600',
      'good-pick': 'bg-blue-600',
      'situational': 'bg-yellow-600',
      'skip': 'bg-red-600',
    };
    return colors[priority];
  };

  const getCardTypeColor = (type: string) => {
    const colors = {
      attack: 'border-l-red-500',
      skill: 'border-l-green-500',
      power: 'border-l-blue-500',
      status: 'border-l-gray-500',
      curse: 'border-l-purple-800',
    };
    return colors[type as keyof typeof colors] || 'border-l-gray-500';
  };

  return (
    <div className="bg-sts-dark rounded-lg p-4">
      <h2 className="text-2xl font-bold text-sts-light mb-4">Card Advisor</h2>

      {/* Deck Analysis Summary */}
      <div className="bg-sts-darker p-3 rounded mb-4">
        <h3 className="text-sm font-semibold text-sts-light mb-2">Deck Analysis</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-sts-light/70">
          <div>
            <span className="text-red-400">Attacks:</span> {deckAnalysis.attackCount} ({((deckAnalysis.attackCount / Math.max(deckAnalysis.size, 1)) * 100).toFixed(0)}%)
          </div>
          <div>
            <span className="text-green-400">Skills:</span> {deckAnalysis.skillCount} ({((deckAnalysis.skillCount / Math.max(deckAnalysis.size, 1)) * 100).toFixed(0)}%)
          </div>
          <div>
            <span className="text-blue-400">Powers:</span> {deckAnalysis.powerCount}
          </div>
          <div>
            <span className="text-yellow-400">Avg Cost:</span> {deckAnalysis.avgCost.toFixed(1)}
          </div>
          <div>
            <span className="text-purple-400">Block Cards:</span> {deckAnalysis.blockCards}
          </div>
          <div>
            <span className="text-cyan-400">Draw/Cycle:</span> {deckAnalysis.drawCards}
          </div>
          <div>
            <span className="text-orange-400">Scaling:</span> {deckAnalysis.scalingCards}
          </div>
          <div>
            <span className="text-pink-400">Deck Size:</span> {deckAnalysis.size}
          </div>
        </div>
        {deckAnalysis.archetypes.length > 0 && (
          <div className="mt-2 pt-2 border-t border-sts-light/10">
            <span className="text-xs text-sts-light/70">
              <span className="text-yellow-400">Archetypes:</span>{' '}
              {deckAnalysis.archetypes.map((arch) => arch.charAt(0).toUpperCase() + arch.slice(1)).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Detected Deck Archetypes */}
      {archetypes.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-bold text-sts-gold mb-3">🎯 Detected Build Strategies</h3>
          <div className="space-y-2">
            {archetypes.map((archetype, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-sts-darker to-sts-dark p-3 rounded-lg border-l-4 border-yellow-500"
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sts-light">{archetype.name}</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-sts-darkest rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                        style={{ width: `${archetype.strength}%` }}
                      />
                    </div>
                    <span className="text-xs text-yellow-400 font-semibold min-w-[35px]">
                      {archetype.strength}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-sts-light/70 mb-2">{archetype.description}</p>
                {archetype.keyCards.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="text-xs text-green-400 mr-1">Key cards:</span>
                    {archetype.keyCards.slice(0, 4).map((cardName, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 rounded bg-green-600/30 text-green-200">
                        {cardName}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-blue-400 mr-1">Recommended:</span>
                  {archetype.recommendedCards.slice(0, 5).map((cardName, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-300">
                      {cardName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-sts-light/70 mb-4">
        Top recommendations for your current deck
      </p>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {cardAdvices.slice(0, 15).map((advice, index) => (
          <div
            key={advice.card.id}
            className={`bg-sts-darker p-3 rounded border-l-4 ${getCardTypeColor(advice.card.type)} cursor-pointer transition-all hover:bg-sts-darker/80`}
            onClick={() => setExpandedCardId(expandedCardId === advice.card.id ? null : advice.card.id)}
          >
            <div className="flex gap-3">
              <img
                src={getCardImagePath(advice.card.character, advice.card.id)}
                alt={advice.card.name}
                onError={handleImageError}
                className="w-16 h-16 object-cover rounded flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-sts-light/40">
                      #{index + 1}
                    </span>
                    <h3 className="text-sts-light font-semibold">
                      {advice.card.name}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs text-white font-semibold ${getPriorityColor(
                      advice.priority
                    )} whitespace-nowrap`}
                  >
                    {advice.priority.toUpperCase()}
                  </span>
                </div>

                <p className="text-sm text-sts-light/80 mb-2">{advice.reason}</p>

                <div className="flex items-center gap-3 mb-2">
                  <span className="text-yellow-500">
                    {'★'.repeat(Math.floor(advice.rating))}
                    {'☆'.repeat(5 - Math.floor(advice.rating))}
                  </span>
                  <span className="text-xs text-sts-light/60">
                    {advice.rating.toFixed(1)}/5
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-sts-light/10 text-sts-light/70">
                    {advice.card.cost} energy
                  </span>
                  <span className="text-xs text-yellow-500">
                    {advice.card.tierRating} tier
                  </span>
                </div>

                {/* Expanded details */}
                {expandedCardId === advice.card.id && (
                  <div className="mt-3 pt-3 border-t border-sts-light/10">
                    <p className="text-xs text-sts-light/60 mb-2">{advice.card.description}</p>

                    {advice.allReasons && advice.allReasons.length > 1 && (
                      <div className="mt-2">
                        <h4 className="text-xs font-semibold text-sts-light/80 mb-1">All Factors:</h4>
                        <ul className="text-xs text-sts-light/70 space-y-1">
                          {advice.allReasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-sts-light/40">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {advice.card.synergies.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-xs font-semibold text-green-400 mb-1">Synergies with:</h4>
                        <div className="flex flex-wrap gap-1">
                          {advice.card.synergies.slice(0, 5).map((synId) => {
                            const isInDeck = deckAnalysis.cardIds.includes(synId);
                            return (
                              <span
                                key={synId}
                                className={`text-xs px-2 py-0.5 rounded ${
                                  isInDeck
                                    ? 'bg-green-600/50 text-green-200 font-semibold'
                                    : 'bg-sts-light/10 text-sts-light/50'
                                }`}
                              >
                                {synId.replace(/_/g, ' ')}
                                {isInDeck && ' ✓'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-sts-light/40 mt-2 italic">
                      Click to collapse
                    </p>
                  </div>
                )}

                {expandedCardId !== advice.card.id && (
                  <p className="text-xs text-sts-light/40 italic">
                    Click for details
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { Card, CharacterType, Relic } from '../types';
import cardsData from '../data/cards.json';
import { getCardImagePath, handleImageError } from '../utils/imageHelpers';
import { evaluateCardForDeck } from '../utils/advisoryLogic';

interface CardPickerProps {
  character: CharacterType;
  onAddCard: (card: Card) => void;
  currentDeck: Card[];
  relics: Relic[];
}

export function CardPicker({ character, onAddCard, currentDeck, relics }: CardPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const availableCards = cardsData.filter(
    (card) => card.character === character || card.character === 'colorless'
  ) as Card[];

  const filteredCards = availableCards.filter((card) => {
    const matchesSearch = card.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRarity =
      selectedRarity === 'all' || card.rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  const handleAddCard = (card: Card) => {
    const newCard = {
      ...card,
      id: `${card.id}-${Date.now()}`,
    };
    onAddCard(newCard);
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      starter: 'text-gray-400',
      common: 'text-white',
      uncommon: 'text-blue-400',
      rare: 'text-yellow-500',
      special: 'text-purple-400',
      curse: 'text-purple-800',
    };
    return colors[rarity as keyof typeof colors] || 'text-gray-400';
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

  const getCardRecommendation = (card: Card): {
    priority: string;
    reasoning: string;
    synergies: string[];
    antiSynergies: string[];
    shouldSkip: boolean;
  } => {
    // Use the advisory logic to evaluate this card
    const evaluation = evaluateCardForDeck(card, currentDeck);

    const synergies: string[] = [];
    const antiSynergies: string[] = [];
    let shouldSkip = false;

    // Check for deck synergies
    const deckCardIds = currentDeck.map(c => c.id);
    const relicIds = relics.map(r => r.id);

    // Check if card synergizes with current deck
    if (card.synergies && card.synergies.length > 0) {
      card.synergies.forEach(synergy => {
        const hasSynergy = deckCardIds.some(id => id.includes(synergy)) ||
                          relicIds.some(id => id.includes(synergy));
        if (hasSynergy) {
          synergies.push(`✓ Synergizes with your ${synergy}`);
        }
      });
    }

    // Check for anti-synergies
    if (card.antiSynergies && card.antiSynergies.length > 0) {
      card.antiSynergies.forEach(antiSyn => {
        const hasAntiSynergy = deckCardIds.some(id => id.includes(antiSyn)) ||
                               relicIds.some(id => id.includes(antiSyn));
        if (hasAntiSynergy) {
          antiSynergies.push(`⚠️ Conflicts with your ${antiSyn}`);
        }
      });
    }

    // Determine if should skip based on evaluation and deck state
    const deckSize = currentDeck.length;

    // Skip if low tier and no synergies
    if (evaluation.priority === 'skip' || (card.tierRating <= 2 && synergies.length === 0)) {
      shouldSkip = true;
    }

    // Skip if deck is getting bloated (>25 cards) and card is mediocre
    if (deckSize > 25 && card.tierRating <= 3 && evaluation.priority !== 'must-pick') {
      shouldSkip = true;
      antiSynergies.push('⚠️ Deck is already large - only add essential cards');
    }

    // Skip if conflicts with existing strategy
    if (antiSynergies.length > 0 && synergies.length === 0) {
      shouldSkip = true;
    }

    // Skip duplicates of low-impact cards
    const duplicateCount = deckCardIds.filter(id => id.startsWith(card.id)).length;
    if (duplicateCount >= 2 && card.tierRating <= 3) {
      shouldSkip = true;
      antiSynergies.push(`⚠️ Already have ${duplicateCount} copies - diminishing returns`);
    }

    return {
      priority: evaluation.priority,
      reasoning: evaluation.reason,
      synergies,
      antiSynergies,
      shouldSkip
    };
  };

  return (
    <div className="bg-sts-dark rounded-lg p-4">
      <h2 className="text-2xl font-bold text-sts-light mb-4">Add Card to Deck</h2>

      {/* Search and Filter */}
      <div className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Search cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-sts-darker text-sts-light px-3 py-2 rounded border border-sts-light/20 focus:border-sts-light/50 focus:outline-none"
        />
        <select
          value={selectedRarity}
          onChange={(e) => setSelectedRarity(e.target.value)}
          className="w-full bg-sts-darker text-sts-light px-3 py-2 rounded border border-sts-light/20 focus:border-sts-light/50 focus:outline-none"
        >
          <option value="all">All Rarities</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
        </select>
      </div>

      {/* Cards List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredCards.map((card) => {
          const isExpanded = expandedCard === card.id;
          const recommendation = getCardRecommendation(card);

          const getPriorityColor = (priority: string) => {
            if (priority === 'must-pick') return 'bg-green-600';
            if (priority === 'good-pick') return 'bg-blue-600';
            if (priority === 'situational') return 'bg-yellow-600';
            return 'bg-red-600';
          };

          const getPriorityText = (priority: string) => {
            if (priority === 'must-pick') return 'MUST PICK';
            if (priority === 'good-pick') return 'GOOD PICK';
            if (priority === 'situational') return 'SITUATIONAL';
            return 'SKIP';
          };

          return (
            <div
              key={card.id}
              className={`bg-sts-darker rounded border-l-4 ${getCardTypeColor(
                card.type
              )} transition-all ${recommendation.shouldSkip ? 'opacity-70' : ''}`}
            >
              <div className="p-3 flex gap-3 items-start">
                <img
                  src={getCardImagePath(card.character, card.id)}
                  alt={card.name}
                  onError={handleImageError}
                  className="w-16 h-16 object-cover rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sts-light font-semibold">{card.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-sts-light/10 text-sts-light/70 flex-shrink-0">
                      {card.cost} energy
                    </span>
                    <span className={`text-xs ${getRarityColor(card.rarity)} flex-shrink-0`}>
                      {card.rarity}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded text-white font-bold ${getPriorityColor(recommendation.priority)} flex-shrink-0`}>
                      {getPriorityText(recommendation.priority)}
                    </span>
                  </div>
                  <p className="text-xs text-sts-light/60 mt-1 line-clamp-1">{card.description}</p>
                  <div className="flex gap-2 items-center mt-2 flex-wrap">
                    <span className="text-xs text-yellow-500">
                      {'★'.repeat(card.tierRating)}
                    </span>
                    {recommendation.shouldSkip && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-900/50 text-red-300 font-semibold">
                        ❌ SKIP
                      </span>
                    )}
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      {isExpanded ? '▼ Hide' : '▶ Why?'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleAddCard(card)}
                  className={`px-3 py-1 text-sm ${
                    recommendation.shouldSkip
                      ? 'bg-gray-600 hover:bg-gray-700'
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white rounded flex-shrink-0`}
                >
                  Add
                </button>
              </div>

              {/* Expandable Explanation */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-sts-light/10 mt-2 pt-3">
                  <div className="bg-sts-dark rounded-lg p-3 space-y-3">
                    {/* Recommendation */}
                    <div className="text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-blue-400">💡</span>
                        <span className="font-semibold text-sts-light">Recommendation</span>
                      </div>
                      <p className="text-sts-light/80 leading-relaxed">{recommendation.reasoning}</p>
                    </div>

                    {/* Skip Warning */}
                    {recommendation.shouldSkip && (
                      <div className="text-xs bg-red-900/30 border border-red-500/50 rounded p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-red-400">⚠️</span>
                          <span className="font-semibold text-red-400">Skip This Card</span>
                        </div>
                        <p className="text-red-300">This card doesn't fit your current deck strategy or would dilute your deck without adding value.</p>
                      </div>
                    )}

                    {/* Synergies */}
                    {recommendation.synergies.length > 0 && (
                      <div className="text-xs">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-green-400">✓</span>
                          <span className="font-semibold text-green-400">Synergies with Your Deck</span>
                        </div>
                        <ul className="text-sts-light/80 space-y-1">
                          {recommendation.synergies.map((syn, idx) => (
                            <li key={idx}>• {syn}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Anti-Synergies */}
                    {recommendation.antiSynergies.length > 0 && (
                      <div className="text-xs">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-red-400">✗</span>
                          <span className="font-semibold text-red-400">Concerns</span>
                        </div>
                        <ul className="text-sts-light/80 space-y-1">
                          {recommendation.antiSynergies.map((anti, idx) => (
                            <li key={idx}>• {anti}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredCards.length === 0 && (
          <p className="text-sts-light/60 text-center">No cards found</p>
        )}
      </div>
    </div>
  );
}

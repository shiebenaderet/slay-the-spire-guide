import { useState, useMemo } from 'react';
import type { Card, CharacterType, Relic } from '../types';
import cardsData from '../data/cards.json';
import { getCardImagePath, handleImageError } from '../utils/imageHelpers';
import { evaluateCardForDeck } from '../utils/advisoryLogic';
import { CardZoomModal } from './CardZoomModal';

interface CardRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (card: Card) => void;
  character: CharacterType;
  currentDeck: Card[];
  relics?: Relic[];
}

export function CardRewardModal({
  isOpen,
  onClose,
  onSelectCard,
  character,
  currentDeck,
  relics = [],
}: CardRewardModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'attack' | 'skill' | 'power'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'cost'>('rating');
  const [zoomedCard, setZoomedCard] = useState<Card | null>(null);

  const availableCards = useMemo(() => {
    return cardsData.filter(
      (card) => card.character === character || card.character === 'colorless'
    ) as Card[];
  }, [character]);

  // Filter and evaluate cards
  const evaluatedCards = useMemo(() => {
    let filtered = availableCards;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (card) =>
          card.name.toLowerCase().includes(search) ||
          card.description.toLowerCase().includes(search)
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((card) => card.type === filterType);
    }

    // Evaluate each card
    const evaluated = filtered.map((card) => {
      const evaluation = evaluateCardForDeck(card, currentDeck, relics, character);
      return {
        card: evaluation.card,
        rating: evaluation.rating,
        reason: evaluation.reason,
        priority: evaluation.priority,
      };
    });

    // Sort cards
    evaluated.sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      } else if (sortBy === 'name') {
        return a.card.name.localeCompare(b.card.name);
      } else if (sortBy === 'cost') {
        if (a.card.cost !== b.card.cost) {
          return a.card.cost - b.card.cost;
        }
        return b.rating - a.rating;
      }
      return 0;
    });

    return evaluated;
  }, [availableCards, searchTerm, filterType, sortBy, currentDeck, relics, character]);

  if (!isOpen) return null;

  const handleSelectCard = (card: Card) => {
    onSelectCard(card);
    setSearchTerm('');
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'must-pick': 'bg-red-600 text-white',
      'good-pick': 'bg-yellow-600 text-black',
      'situational': 'bg-green-600 text-white',
      'skip': 'bg-gray-600 text-white',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-600 text-white';
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-sts-light">Choose a Card Reward</h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold text-sm"
        >
          Skip
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-sts-darker text-sts-light rounded border border-sts-light/20 focus:border-sts-light/50 focus:outline-none"
        />

        <div className="flex gap-2 flex-wrap">
          {/* Type Filters */}
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-sts-light text-sts-darker'
                : 'bg-sts-darker text-sts-light/70 hover:text-sts-light'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('attack')}
            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
              filterType === 'attack'
                ? 'bg-red-600 text-white'
                : 'bg-sts-darker text-red-400 hover:text-red-300'
            }`}
          >
            Attacks
          </button>
          <button
            onClick={() => setFilterType('skill')}
            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
              filterType === 'skill'
                ? 'bg-green-600 text-white'
                : 'bg-sts-darker text-green-400 hover:text-green-300'
            }`}
          >
            Skills
          </button>
          <button
            onClick={() => setFilterType('power')}
            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
              filterType === 'power'
                ? 'bg-blue-600 text-white'
                : 'bg-sts-darker text-blue-400 hover:text-blue-300'
            }`}
          >
            Powers
          </button>

          <div className="ml-auto flex gap-2">
            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'name' | 'cost')}
              className="px-3 py-1 bg-sts-darker text-sts-light rounded border border-sts-light/20 text-sm"
            >
              <option value="rating">Sort by Rating</option>
              <option value="name">Sort by Name</option>
              <option value="cost">Sort by Cost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Recommendations */}
      {evaluatedCards.length > 0 && (
        <div className="bg-gradient-to-r from-sts-gold/10 to-sts-gold/5 border-2 border-sts-gold/40 rounded-lg p-4">
          <h3 className="text-base font-bold text-sts-gold mb-3 flex items-center gap-2">
            ⭐ Top Recommendations
          </h3>
          <div className="space-y-2">
            {evaluatedCards.slice(0, 5).map((rec) => (
              <div
                key={rec.card.id}
                className="bg-sts-dark rounded p-3 border-2 border-sts-gold/30 hover:border-sts-gold transition-colors flex items-center gap-3"
              >
                {/* Card Image */}
                <img
                  src={getCardImagePath(rec.card.character, rec.card.id)}
                  alt={rec.card.name}
                  onError={handleImageError}
                  onClick={() => setZoomedCard(rec.card)}
                  className="w-20 h-20 object-cover rounded cursor-pointer hover:scale-105 transition-transform flex-shrink-0 border-2 border-sts-gold/50"
                  title="Click to enlarge"
                />

                {/* Card Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-bold text-sts-light">{rec.card.name}</h4>
                    <span className="text-sm text-sts-light/60 flex-shrink-0">{rec.card.cost} Energy</span>
                    <span className={`text-sm flex-shrink-0 ${getRarityColor(rec.card.rarity)}`}>
                      {rec.card.rarity.charAt(0).toUpperCase() + rec.card.rarity.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400 text-sm font-bold">
                      {'★'.repeat(Math.floor(rec.rating))} ({rec.rating.toFixed(1)}/5)
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(rec.priority)}`}>
                      {rec.priority === 'must-pick' ? 'MUST PICK' :
                       rec.priority === 'good-pick' ? 'GOOD PICK' :
                       rec.priority === 'situational' ? 'SITUATIONAL' : 'SKIP'}
                    </span>
                  </div>
                  <p className="text-xs text-sts-light/70 mb-1">{rec.card.description}</p>
                  <p className="text-xs text-sts-gold font-semibold">💡 {rec.reason}</p>
                </div>

                {/* Add Button */}
                <button
                  onClick={() => handleSelectCard(rec.card)}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm flex-shrink-0 transition-all hover:scale-105"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Browse All Section */}
      <details className="bg-sts-dark border border-sts-light/20 rounded-lg">
        <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-sts-light hover:bg-sts-darker transition-colors">
          Browse All Cards ({evaluatedCards.length} total)
        </summary>
        <div className="p-3 space-y-1.5 max-h-[40vh] overflow-y-auto">
        {evaluatedCards.map((rec) => (
            <div
              key={rec.card.id}
              className="bg-sts-darker rounded p-2 border border-sts-light/20 hover:border-sts-light/40 transition-colors flex items-center gap-2"
            >
              {/* Card Image */}
              <img
                src={getCardImagePath(rec.card.character, rec.card.id)}
                alt={rec.card.name}
                onError={handleImageError}
                onClick={() => setZoomedCard(rec.card)}
                className="w-16 h-16 object-cover rounded cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                title="Click to enlarge"
              />

              {/* Card Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-sm font-bold text-sts-light truncate">{rec.card.name}</h4>
                  <span className="text-xs text-sts-light/60 flex-shrink-0">{rec.card.cost}E</span>
                  <span className={`text-xs flex-shrink-0 ${getRarityColor(rec.card.rarity)}`}>
                    {rec.card.rarity.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-yellow-500 text-xs flex-shrink-0">
                    {'★'.repeat(Math.floor(rec.rating))}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${getPriorityColor(rec.priority)}`}>
                    {rec.priority === 'must-pick' ? 'MUST' :
                     rec.priority === 'good-pick' ? 'GOOD' :
                     rec.priority === 'situational' ? 'OK' : 'SKIP'}
                  </span>
                </div>
                <p className="text-[10px] text-sts-light/60 line-clamp-1 mb-0.5">{rec.card.description}</p>
                <p className="text-[10px] text-sts-light/70 line-clamp-1">{rec.reason}</p>
              </div>

              {/* Add Button */}
              <button
                onClick={() => handleSelectCard(rec.card)}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded font-semibold text-xs flex-shrink-0"
              >
                + Add
              </button>
            </div>
        ))}
        </div>
      </details>

      {evaluatedCards.length === 0 && (
        <div className="text-center py-8 text-sts-light/60">
          No cards found matching your search.
        </div>
      )}

      {/* Card Zoom Modal */}
      {zoomedCard && (
        <CardZoomModal card={zoomedCard} onClose={() => setZoomedCard(null)} />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import type { Card, Relic, CharacterType } from '../types';
import { getCardImagePath, getRelicImagePath, handleImageError } from '../utils/imageHelpers';
import { evaluateCardForDeck } from '../utils/advisoryLogic';
import { evaluateRelic } from '../utils/relicEvaluator';
import cardsData from '../data/cards.json';
import relicsData from '../data/relics.json';
import { CardZoomModal } from './CardZoomModal';
import { RelicZoomModal } from './RelicZoomModal';

interface EliteRewardModalProps{
  character: CharacterType;
  deck: Card[];
  relics: Relic[];
  currentAct: number;
  onSelectCard: (card: Card) => void;
  onSelectRelic: (relic: Relic) => void;
  onSkip: () => void;
  onClose: () => void;
}

interface CardRecommendation {
  card: Card;
  rating: number;
  reason: string;
  priority: 'must-pick' | 'good-pick' | 'situational' | 'skip';
}

/**
 * Elite Reward Modal - Shows card reward with 25% chance of relic
 * After defeating an elite, player gets:
 * 1. Choice of 1 card from available options (can skip)
 * 2. 25% chance: 1 random relic (non-boss)
 * 3. Gold reward (automatic)
 */
export function EliteRewardModal({
  character,
  deck,
  relics,
  currentAct,
  onSelectCard,
  onSelectRelic,
  onSkip,
  onClose,
}: EliteRewardModalProps) {
  const [cardRecommendations, setCardRecommendations] = useState<CardRecommendation[]>([]);
  const [eliteRelic, setEliteRelic] = useState<Relic | null>(null);
  const [hasRelicDrop, setHasRelicDrop] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [skippedCard, setSkippedCard] = useState(false);
  const [viewMode, setViewMode] = useState<'compact' | 'full'>('compact');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'attack' | 'skill' | 'power'>('all');
  const [zoomedCard, setZoomedCard] = useState<Card | null>(null);
  const [zoomedRelic, setZoomedRelic] = useState<Relic | null>(null);

  useEffect(() => {
    // Evaluate all available cards for smart recommendations
    const availableCards = cardsData.filter(
      (c) => c.character === character || c.character === 'colorless'
    ) as Card[];

    const analyzed = availableCards.map((card) => {
      const evaluation = evaluateCardForDeck(card, deck, relics, character);
      return {
        card: evaluation.card,
        rating: evaluation.rating,
        reason: evaluation.reason,
        priority: evaluation.priority,
      };
    });

    // Sort by rating (best first)
    analyzed.sort((a, b) => b.rating - a.rating);
    setCardRecommendations(analyzed);

    // 25% chance for relic drop
    const relicDropped = Math.random() < 0.25;
    setHasRelicDrop(relicDropped);

    if (relicDropped) {
      // Get a random non-boss relic
      const nonBossRelics = relicsData.filter(r => r.rarity !== 'boss' && r.rarity !== 'starter') as Relic[];
      const randomRelic = nonBossRelics[Math.floor(Math.random() * nonBossRelics.length)];
      setEliteRelic(randomRelic);
    }
  }, [character, deck, relics]);

  const handleCardSelect = (card: Card) => {
    setSelectedCard(card);
    if (!hasRelicDrop) {
      // No relic, finish immediately
      onSelectCard(card);
      onClose();
    }
  };

  const handleSkipCard = () => {
    setSkippedCard(true);
    if (!hasRelicDrop) {
      // No relic, finish immediately
      onSkip();
      onClose();
    }
  };

  const handleRelicAccept = () => {
    if (eliteRelic) {
      onSelectRelic(eliteRelic);
    }
    if (selectedCard) {
      onSelectCard(selectedCard);
    } else if (skippedCard) {
      onSkip();
    }
    onClose();
  };

  const handleRelicSkip = () => {
    if (selectedCard) {
      onSelectCard(selectedCard);
    } else if (skippedCard) {
      onSkip();
    }
    onClose();
  };

  const getPriorityBadge = (priority: 'must-pick' | 'good-pick' | 'situational' | 'skip') => {
    const badges = {
      'must-pick': { emoji: '🔴', label: 'Must Take', color: 'bg-red-600 text-white' },
      'good-pick': { emoji: '🟡', label: 'Good', color: 'bg-yellow-600 text-black' },
      'situational': { emoji: '🟢', label: 'Consider', color: 'bg-green-600 text-white' },
      'skip': { emoji: '⚪', label: 'Skip', color: 'bg-gray-600 text-white' },
    };
    return badges[priority];
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

  // Show relic reward after card selection
  if ((selectedCard || skippedCard) && hasRelicDrop && eliteRelic) {
    const evaluation = evaluateRelic(eliteRelic, deck, relics, character);

    return (
      <div className="bg-sts-dark rounded-lg p-4 sm:p-6 w-full border-2 border-purple-500/50 max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-purple-400 mb-3 sm:mb-4 flex items-center gap-2">
            <span>💎</span>
            <span>Elite Defeated - Relic Drop!</span>
          </h2>

          <p className="text-sts-light/80 text-xs sm:text-sm mb-4 sm:mb-6">
            {selectedCard ? `You selected: ${selectedCard.name}. ` : 'You skipped the card. '}
            A relic has dropped!
          </p>

          <div className="bg-sts-darker p-4 sm:p-6 rounded-lg border-2 border-purple-500/30 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 flex items-center justify-center mx-auto sm:mx-0">
                <img
                  src={getRelicImagePath(eliteRelic.id)}
                  alt={eliteRelic.name}
                  onError={handleImageError}
                  onClick={() => setZoomedRelic(eliteRelic)}
                  className="w-full h-full object-contain cursor-pointer hover:scale-110 transition-transform"
                  style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
                  title="Click to enlarge"
                />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-purple-400">{eliteRelic.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-sts-light/10 text-sts-light/70 capitalize">
                      {eliteRelic.rarity}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-500 text-lg">
                      {'★'.repeat(Math.floor(evaluation.rating))}{'☆'.repeat(5 - Math.floor(evaluation.rating))}
                    </div>
                    <div className="text-xs text-sts-light/60">
                      {evaluation.rating.toFixed(1)}/5
                    </div>
                  </div>
                </div>

                <p className="text-sm text-sts-light/70 mb-3 leading-tight">
                  {eliteRelic.description}
                </p>

                <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
                  <div className="text-xs font-semibold text-blue-400 mb-1">💡 Evaluation</div>
                  <p className="text-xs text-sts-light/80 leading-tight">{evaluation.reason}</p>

                  {evaluation.synergies.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-green-400">✓ Synergies: {evaluation.synergies.join(', ')}</p>
                    </div>
                  )}
                  {evaluation.antiSynergies.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs text-red-400">✗ Anti-synergies: {evaluation.antiSynergies.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRelicAccept}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold transition-colors"
            >
              Take Relic
            </button>
            <button
              onClick={handleRelicSkip}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Skip Relic
            </button>
          </div>
        </div>
    );
  }

  // Show card reward first - Hybrid compact/full view
  const topRecommendations = cardRecommendations.filter(rec => rec.rating >= 2.5).slice(0, 7);
  const hasGoodOptions = topRecommendations.length > 0;

  const filteredRecommendations = cardRecommendations.filter(rec => {
    const matchesSearch = searchTerm === '' ||
      rec.card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.card.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || rec.card.type === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-sts-dark rounded-lg p-4 w-full border-2 border-red-500/50 max-h-[80vh] flex flex-col">
      {/* Header with Skip Button */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
            <span>💀</span>
            <span>Elite Card Reward</span>
          </h2>
          {hasRelicDrop && (
            <p className="text-purple-400 text-xs mt-1">✨ A relic has also dropped!</p>
          )}
        </div>
        <button
          onClick={handleSkipCard}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold text-sm"
        >
          Skip Card
        </button>
      </div>

      {viewMode === 'compact' ? (
        // COMPACT VIEW - Top Recommendations
        <div className="flex-1 overflow-y-auto">
          {hasGoodOptions ? (
            <>
              <p className="text-sm text-sts-light/70 mb-3">
                Top recommendations for your deck:
              </p>
              <div className="space-y-2 mb-4">
                {topRecommendations.map((rec) => {
                  const badge = getPriorityBadge(rec.priority);
                  return (
                    <div
                      key={rec.card.id}
                      className={`bg-sts-darker p-2.5 rounded border-l-4 ${getCardTypeColor(rec.card.type)} flex items-center gap-3 hover:bg-sts-darker/80 transition-all`}
                    >
                      {/* Mini Card Image */}
                      <img
                        src={getCardImagePath(rec.card.character, rec.card.id)}
                        alt={rec.card.name}
                        onError={handleImageError}
                        onClick={() => setZoomedCard(rec.card)}
                        className="w-16 h-16 object-cover rounded flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                        title="Click to enlarge"
                      />

                      {/* Card Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-sts-light truncate">
                            {rec.card.name}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${badge.color}`}>
                            {badge.emoji} {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-sts-light/10 text-sts-light/70">
                            {rec.card.cost} Energy
                          </span>
                          <span className={`text-xs ${getRarityColor(rec.card.rarity)}`}>
                            {rec.card.rarity}
                          </span>
                          <span className="text-xs text-yellow-500">
                            {'★'.repeat(Math.floor(rec.rating))}
                          </span>
                        </div>
                        <p className="text-xs text-sts-light/70 line-clamp-1">{rec.reason}</p>
                      </div>

                      {/* Add Button */}
                      <button
                        onClick={() => handleCardSelect(rec.card)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded font-semibold text-sm flex-shrink-0"
                      >
                        + Add
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-sts-light/60 italic mb-4">
              No strong recommendations. Browse all cards to find options.
            </p>
          )}

          {/* Show All Cards Button */}
          <button
            onClick={() => setViewMode('full')}
            className="w-full px-4 py-2.5 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/50 rounded text-sm font-semibold text-sts-light transition-colors"
          >
            🔍 Show All Cards ({cardRecommendations.length})
          </button>
        </div>
      ) : (
        // FULL VIEW - All Cards with Filters
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="mb-3 space-y-2 flex-shrink-0">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('compact')}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-semibold"
              >
                ← Back to Recommendations
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-sts-darker text-sts-light px-3 py-1.5 rounded border border-sts-light/20 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'attack', 'skill', 'power'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    filterType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-sts-darker text-sts-light/70 hover:bg-sts-darker/70'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* All Cards Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredRecommendations.map((rec) => {
                const badge = getPriorityBadge(rec.priority);
                return (
                  <div
                    key={rec.card.id}
                    className={`bg-sts-darker p-2 rounded border-l-4 ${getCardTypeColor(rec.card.type)} flex gap-2 hover:bg-sts-darker/80 transition-all`}
                  >
                    <img
                      src={getCardImagePath(rec.card.character, rec.card.id)}
                      alt={rec.card.name}
                      onError={handleImageError}
                      onClick={() => setZoomedCard(rec.card)}
                      className="w-12 h-12 object-cover rounded flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                      title="Click to enlarge"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-xs font-bold text-sts-light truncate">
                          {rec.card.name}
                        </h4>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${badge.color}`}>
                          {badge.emoji}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] px-1 py-0.5 rounded bg-sts-light/10 text-sts-light/70">
                          {rec.card.cost}E
                        </span>
                        <span className={`text-[10px] ${getRarityColor(rec.card.rarity)}`}>
                          {rec.card.rarity}
                        </span>
                        <span className="text-[10px] text-yellow-500">
                          {'★'.repeat(Math.floor(rec.rating))}
                        </span>
                      </div>
                      <p className="text-[10px] text-sts-light/60 line-clamp-2">{rec.card.description}</p>
                    </div>
                    <button
                      onClick={() => handleCardSelect(rec.card)}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-semibold text-xs flex-shrink-0 self-start"
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Card Zoom Modal */}
      {zoomedCard && (
        <CardZoomModal card={zoomedCard} onClose={() => setZoomedCard(null)} />
      )}

      {/* Relic Zoom Modal */}
      {zoomedRelic && (
        <RelicZoomModal relic={zoomedRelic} onClose={() => setZoomedRelic(null)} />
      )}
    </div>
  );
}

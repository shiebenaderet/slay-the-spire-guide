import { useState, useEffect } from 'react';
import type { Card, Relic, CharacterType } from '../types';
import { getCardImagePath, getRelicImagePath, handleImageError } from '../utils/imageHelpers';
import { evaluateCardForDeck } from '../utils/advisoryLogic';
import { evaluateBossRelic } from '../utils/bossRelicEvaluator';
import cardsData from '../data/cards.json';
import relicsData from '../data/relics.json';
import { CardZoomModal } from './CardZoomModal';
import { RelicZoomModal } from './RelicZoomModal';

interface BossRewardModalProps {
  character: CharacterType;
  deck: Card[];
  relics: Relic[];
  currentAct: number;
  onSelectCard: (card: Card) => void;
  onSelectRelic: (relic: Relic) => void;
  onSkip: () => void;
  onClose: () => void;
}

interface RelicRecommendation {
  relic: Relic;
  rating: number;
  reason: string;
  synergies: string[];
  antiSynergies: string[];
  priority: 'must-take' | 'good-take' | 'situational' | 'skip';
}

interface CardRecommendation {
  card: Card;
  rating: number;
  reason: string;
  priority: 'must-pick' | 'good-pick' | 'situational' | 'skip';
}

/**
 * Boss Reward Modal - Shows boss relic choice and card reward
 * After defeating a boss, player gets:
 * 1. Choice of 1 boss relic from 3 options
 * 2. Choice of 1 card from available options (can skip)
 */
export function BossRewardModal({
  character,
  deck,
  relics,
  currentAct,
  onSelectCard,
  onSelectRelic,
  onSkip,
  onClose,
}: BossRewardModalProps) {
  const [bossRelicOptions, setBossRelicOptions] = useState<RelicRecommendation[]>([]);
  const [cardRecommendations, setCardRecommendations] = useState<CardRecommendation[]>([]);
  const [selectedRelic, setSelectedRelic] = useState<Relic | null>(null);
  const [showCardReward, setShowCardReward] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'attack' | 'skill' | 'power'>('all');
  const [showOnlyRecommended, setShowOnlyRecommended] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<Card | null>(null);
  const [zoomedRelic, setZoomedRelic] = useState<Relic | null>(null);

  useEffect(() => {
    // Generate and evaluate 3 random boss relics
    const bossRelics = relicsData.filter(r => r.rarity === 'boss') as Relic[];
    const shuffled = [...bossRelics].sort(() => Math.random() - 0.5).slice(0, 3);

    const evaluatedRelics = shuffled.map(relic => {
      const evaluation = evaluateBossRelic(relic, deck, relics, character);
      const ratingValue =
        evaluation.rating === 'must-take' ? 5 :
        evaluation.rating === 'good-take' ? 4 :
        evaluation.rating === 'situational' ? 3 : 2;

      return {
        relic,
        rating: ratingValue,
        reason: evaluation.reason,
        synergies: evaluation.synergies,
        antiSynergies: evaluation.antiSynergies,
        priority: evaluation.rating,
      };
    });

    // Sort by rating (best first)
    evaluatedRelics.sort((a, b) => b.rating - a.rating);
    setBossRelicOptions(evaluatedRelics);

    // Prepare card evaluation (evaluate all available cards for smart recommendations)
    if (!character) {
      console.error('BossRewardModal: character is null');
      return;
    }

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
  }, [character, deck, relics]);

  const handleRelicSelect = (relic: Relic) => {
    setSelectedRelic(relic);
    setShowCardReward(true);
  };

  const handleCardSelect = (card: Card) => {
    if (selectedRelic) {
      onSelectRelic(selectedRelic);
    }
    onSelectCard(card);
    onClose();
  };

  const handleSkipCard = () => {
    if (selectedRelic) {
      onSelectRelic(selectedRelic);
    }
    onSkip();
    onClose();
  };

  const getPriorityBadge = (priority: 'must-pick' | 'good-pick' | 'situational' | 'skip' | 'must-take' | 'good-take') => {
    const badges = {
      'must-pick': { emoji: '🔴', label: 'Must Take', color: 'bg-red-600 text-white' },
      'good-pick': { emoji: '🟡', label: 'Good', color: 'bg-yellow-600 text-black' },
      'situational': { emoji: '🟢', label: 'Consider', color: 'bg-green-600 text-white' },
      'skip': { emoji: '⚪', label: 'Skip', color: 'bg-gray-600 text-white' },
      'must-take': { emoji: '🔴', label: 'Must Take', color: 'bg-red-600 text-white' },
      'good-take': { emoji: '🟡', label: 'Good', color: 'bg-yellow-600 text-black' },
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

  if (showCardReward) {
    // Filter and sort cards
    const filteredRecommendations = cardRecommendations.filter(rec => {
      const matchesSearch = searchTerm === '' ||
        rec.card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.card.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || rec.card.type === filterType;

      const matchesRecommended = !showOnlyRecommended || rec.rating >= 2.5;

      return matchesSearch && matchesType && matchesRecommended;
    });

    const topPicks = filteredRecommendations.filter(rec => rec.rating >= 2.5).length;

    return (
      <div className="bg-sts-dark rounded-lg p-4 w-full border-2 border-yellow-500/50 max-h-[80vh] flex flex-col">
        {/* Header with Skip Button */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
              <span>👑</span>
              <span>Boss Card Reward</span>
            </h2>
            <p className="text-sts-light/70 text-xs mt-1">
              Selected: <span className="text-yellow-400 font-semibold">{selectedRelic?.name}</span>
            </p>
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
      </div>
    );
  }

  // Show boss relic selection first - Compact layout
  return (
    <div className="bg-sts-dark rounded-lg p-4 w-full border-2 border-yellow-500/50 max-h-[80vh] flex flex-col">
      <h2 className="text-xl font-bold text-yellow-400 mb-2 flex items-center gap-2">
        <span>👑</span>
        <span>Boss Defeated - Choose Relic</span>
      </h2>

      <p className="text-sts-light/80 text-sm mb-4">
        Select 1 boss relic. Powerful effects with potential drawbacks.
      </p>

      {bossRelicOptions.length === 0 ? (
        <div className="bg-red-900/20 border border-red-500/30 rounded p-4">
          <p className="text-red-400">Error: No boss relics available</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto">
          {bossRelicOptions.map((rec) => {
            const badge = getPriorityBadge(rec.priority);
            return (
              <div
                key={rec.relic.id}
                className="bg-sts-darker p-3 rounded-lg border-2 border-yellow-500/30 hover:border-yellow-500 transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Relic Image */}
                  <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                    <img
                      src={getRelicImagePath(rec.relic.id)}
                      alt={rec.relic.name}
                      onError={handleImageError}
                      onClick={() => setZoomedRelic(rec.relic)}
                      className="w-full h-full object-contain cursor-pointer hover:scale-110 transition-transform"
                      style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
                      title="Click to enlarge"
                    />
                  </div>

                  {/* Relic Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-yellow-400">{rec.relic.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${badge.color}`}>
                        {badge.emoji} {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-sts-light/70 mb-2 leading-tight line-clamp-2">
                      {rec.relic.description}
                    </p>

                    {/* Rating and synergies */}
                    <div className="flex items-center gap-3 mb-2 text-xs">
                      <span className="text-yellow-500">
                        {'★'.repeat(rec.rating)}{'☆'.repeat(5 - rec.rating)}
                      </span>
                      {rec.synergies.length > 0 && (
                        <span className="text-green-400">
                          ✓ {rec.synergies.length} synergies
                        </span>
                      )}
                      {rec.antiSynergies.length > 0 && (
                        <span className="text-red-400">
                          ✗ {rec.antiSynergies.length} conflicts
                        </span>
                      )}
                    </div>

                    {/* Evaluation reason */}
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded p-2 mb-2">
                      <p className="text-xs text-sts-light/90">{rec.reason}</p>
                    </div>

                    {/* Select Button */}
                    <button
                      onClick={() => handleRelicSelect(rec.relic)}
                      className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-semibold text-sm transition-colors"
                    >
                      Select {rec.relic.name}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Relic Zoom Modal */}
      {zoomedRelic && (
        <RelicZoomModal relic={zoomedRelic} onClose={() => setZoomedRelic(null)} />
      )}
    </div>
  );
}

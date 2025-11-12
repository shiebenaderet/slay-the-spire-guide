import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, useHasHydrated } from '../store/gameStore';
import { DeckView } from '../components/DeckView';
import { RelicHoverZoom } from '../components/RelicHoverZoom';
import { CardRewardModal } from '../components/CardRewardModal';
import { RunCompletionModal } from '../components/RunCompletionModal';
import { Toast } from '../components/Toast';
import type { Card, Relic, Potion } from '../types';
import { getRelicImagePath, handleImageError } from '../utils/imageHelpers';
import { calculateRelicBuffs } from '../utils/relicBuffs';
import { detectDeckArchetypes } from '../utils/archetypeDetection';

export function MainRunTracker() {
  const navigate = useNavigate();
  const hasHydrated = useHasHydrated();
  const {
    character,
    deck,
    relics,
    stats,
    potions,
    isRunActive,
    addCard,
    removeCard,
    upgradeCard,
    addRelic,
    removeRelic,
    addPotion,
    removePotion,
    updateStats,
    getPotionSlots,
  } = useGameStore();

  const [hoveredRelic, setHoveredRelic] = useState<Relic | null>(null);
  const [cardRewardModalOpen, setCardRewardModalOpen] = useState(false);
  const [runCompletionModalOpen, setRunCompletionModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Redirect if no active run
  useEffect(() => {
    if (hasHydrated && !isRunActive) {
      navigate('/');
    }
  }, [hasHydrated, isRunActive, navigate]);

  if (!hasHydrated || !isRunActive || !character) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sts-darkest via-sts-darker to-sts-dark flex items-center justify-center">
        <div className="text-sts-light">Loading...</div>
      </div>
    );
  }

  const relicBuffs = calculateRelicBuffs(relics);

  // Detect deck archetypes
  const detectedArchetypes = useMemo(() => {
    if (!character || deck.length === 0) return [];
    return detectDeckArchetypes(deck, character);
  }, [deck, character]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleCardReward = (card: Card) => {
    // Apply relic buffs (auto-upgrade eggs, etc.)
    let finalCard = { ...card };

    // Check for egg relics that auto-upgrade
    if (relicBuffs.autoUpgradeCardTypes.includes(card.type) && !finalCard.upgraded) {
      finalCard = { ...finalCard, upgraded: true };
      showToast(`${card.name} auto-upgraded by relic!`, 'info');
    }

    addCard(finalCard);
    setCardRewardModalOpen(false);
    showToast(`Added ${finalCard.name}${finalCard.upgraded ? '+' : ''} to deck`);
  };

  const handleRemoveCard = (cardId: string) => {
    const card = deck.find(c => c.id === cardId);
    if (card) {
      removeCard(cardId);
      showToast(`Removed ${card.name} from deck`);
    }
  };

  const handleUpgradeCard = (cardId: string) => {
    const card = deck.find(c => c.id === cardId);
    if (card && !card.upgraded) {
      upgradeCard(cardId);
      showToast(`Upgraded ${card.name}`);
    }
  };

  const handleAddPotion = () => {
    // Simple potion addition (in real version, would show potion picker)
    showToast('Potion system simplified for now', 'info');
  };

  const handleNextFloor = () => {
    updateStats({ floorNumber: stats.floorNumber + 1 });
    showToast(`Proceeding to floor ${stats.floorNumber + 1}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sts-darkest via-sts-darker to-sts-dark p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Stats */}
        <div className="bg-sts-dark border-2 border-sts-gold/40 rounded-lg p-4 mb-4 shadow-sts-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-sts-gold capitalize">{character}</h1>
              <p className="text-sm text-sts-light/60">Ascension {stats.ascensionLevel}</p>
            </div>

            <div className="flex gap-6 text-center">
              <div className="bg-sts-darker px-4 py-2 rounded">
                <div className="text-xs text-sts-light/60 mb-1">Floor</div>
                <div className="text-2xl font-bold text-sts-light">{stats.floorNumber}</div>
              </div>
              <div className="bg-sts-darker px-4 py-2 rounded">
                <div className="text-xs text-sts-light/60 mb-1">HP</div>
                <div className="text-2xl font-bold text-red-400">{stats.currentHP}/{stats.maxHP}</div>
              </div>
              <div className="bg-sts-darker px-4 py-2 rounded">
                <div className="text-xs text-sts-light/60 mb-1">Gold</div>
                <div className="text-2xl font-bold text-yellow-400">{stats.gold}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                value={stats.currentHP}
                onChange={(e) => updateStats({ currentHP: Math.max(0, Math.min(stats.maxHP, parseInt(e.target.value) || 0)) })}
                className="w-16 px-2 py-1 bg-sts-darkest text-sts-light text-center rounded border border-sts-light/20"
              />
              <input
                type="number"
                value={stats.gold}
                onChange={(e) => updateStats({ gold: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-20 px-2 py-1 bg-sts-darkest text-sts-light text-center rounded border border-sts-light/20"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Deck */}
          <div className="lg:col-span-2">
            <div className="bg-sts-dark border-2 border-sts-light/20 rounded-lg p-4 shadow-sts-lg">
              <h2 className="text-xl font-bold text-sts-light mb-4">
                Deck ({deck.length} cards)
              </h2>
              <DeckView
                deck={deck}
                character={character}
                relics={relics}
                onRemoveCard={handleRemoveCard}
                onUpgradeCard={handleUpgradeCard}
              />
            </div>
          </div>

          {/* Right Column - Relics & Actions */}
          <div className="space-y-4">
            {/* Relics */}
            <div className="bg-sts-dark border-2 border-sts-light/20 rounded-lg p-4 shadow-sts-lg">
              <h2 className="text-xl font-bold text-sts-light mb-4">
                Relics ({relics.length})
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {relics.map((relic) => (
                  <div
                    key={relic.id}
                    className="relative group cursor-pointer"
                    onMouseEnter={() => setHoveredRelic(relic)}
                    onMouseLeave={() => setHoveredRelic(null)}
                  >
                    <img
                      src={getRelicImagePath(relic.id)}
                      alt={relic.name}
                      onError={handleImageError}
                      className="w-full h-auto rounded border-2 border-sts-gold/30 hover:border-sts-gold transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Detected Build */}
            {detectedArchetypes.length > 0 && (
              <div className="bg-gradient-to-r from-sts-gold/10 to-sts-gold/5 border-2 border-sts-gold/40 rounded-lg p-4 shadow-sts-lg">
                <h3 className="text-base font-bold text-sts-gold mb-2 flex items-center gap-2">
                  🎯 Detected Build
                </h3>
                <div className="text-sts-light">
                  <div className="font-bold text-lg mb-1">{detectedArchetypes[0].name}</div>
                  <div className="text-xs text-sts-light/70 mb-2">{detectedArchetypes[0].description}</div>
                  {detectedArchetypes[0].recommendedCards.length > 0 && (
                    <div className="text-xs text-sts-gold">
                      💡 Recommended: {detectedArchetypes[0].recommendedCards.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-sts-dark border-2 border-sts-light/20 rounded-lg p-4 shadow-sts-lg">
              <h2 className="text-xl font-bold text-sts-light mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setCardRewardModalOpen(true)}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors"
                >
                  + Card Reward
                </button>
                <button
                  onClick={handleNextFloor}
                  className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors"
                >
                  Next Floor →
                </button>
                <button
                  onClick={() => setRunCompletionModalOpen(true)}
                  className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-colors"
                >
                  End Run
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {cardRewardModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-sts-darker border-2 border-sts-gold rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-sts-xl">
            <CardRewardModal
              isOpen={cardRewardModalOpen}
              onClose={() => setCardRewardModalOpen(false)}
              onSelectCard={handleCardReward}
              character={character}
              currentDeck={deck}
              relics={relics}
            />
          </div>
        </div>
      )}

      <RunCompletionModal
        isOpen={runCompletionModalOpen}
        onClose={() => setRunCompletionModalOpen(false)}
      />

      {hoveredRelic && (
        <RelicHoverZoom relic={hoveredRelic} />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

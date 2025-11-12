import { useState, useEffect } from 'react';
import type { Card, Relic, Potion, CharacterType } from '../types';
import { getCardImagePath, getRelicImagePath, handleImageError } from '../utils/imageHelpers';
import { evaluateCardForDeck } from '../utils/advisoryLogic';
import { evaluateRelic } from '../utils/relicEvaluator';
import { evaluateCardRemoval } from '../utils/shopAdvisor';
import { StSCard } from './StSCard';
import { RelicZoomModal } from './RelicZoomModal';
import cardsData from '../data/cards.json';
import relicsData from '../data/relics.json';
import potionsData from '../data/potions.json';

interface ShopModalProps {
  character: CharacterType;
  deck: Card[];
  relics: Relic[];
  gold: number;
  onBuyCard: (card: Card, cost: number) => void;
  onBuyRelic: (relic: Relic, cost: number) => void;
  onBuyPotion: (potion: Potion, cost: number) => void;
  onRemoveCard: (card: Card, cost: number) => void;
  onClose: () => void;
}

/**
 * Shop Modal - Browse and purchase cards, relics, potions, and card removal
 * Pricing:
 * - Cards: 50-75 gold (common), 75-100 (uncommon), 150-200 (rare)
 * - Relics: 150-300 gold
 * - Potions: 50 gold
 * - Card Removal: 75 gold base, +25 per removal (max 150)
 */
interface CardWithRecommendation extends Card {
  price: number;
  rating: number;
  reason: string;
  priority: 'must-pick' | 'good-pick' | 'situational' | 'skip';
}

export function ShopModal({
  character,
  deck,
  relics,
  gold,
  onBuyCard,
  onBuyRelic,
  onBuyPotion,
  onRemoveCard,
  onClose,
}: ShopModalProps) {
  const [cardStock, setCardStock] = useState<CardWithRecommendation[]>([]);
  const [relicStock, setRelicStock] = useState<Array<Relic & { price: number }>>([]);
  const [potionStock, setPotionStock] = useState<Array<Potion & { price: number }>>([]);
  const [removalPrice, setRemovalPrice] = useState(75);
  const [removalCount, setRemovalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllCards, setShowAllCards] = useState(false);
  const [zoomedRelic, setZoomedRelic] = useState<Relic | null>(null);

  useEffect(() => {
    // Generate shop stock
    console.log('ShopModal: useEffect triggered, generating stock...');
    setIsLoading(true);
    generateShopStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character]);

  const generateShopStock = () => {
    console.log('ShopModal: Generating shop stock for character:', character);
    console.log('ShopModal: cardsData loaded:', cardsData.length, 'cards');
    console.log('ShopModal: relicsData loaded:', relicsData.length, 'relics');
    console.log('ShopModal: potionsData loaded:', potionsData.length, 'potions');

    // Cards: 2 attacks, 2 skills, 1 power, 1 colorless
    const characterCards = cardsData.filter(c => c.character === character) as Card[];
    const colorlessCards = cardsData.filter(c => c.character === 'colorless') as Card[];

    console.log('ShopModal: Character cards available:', characterCards.length);
    console.log('ShopModal: Colorless cards available:', colorlessCards.length);

    const attacks = characterCards.filter(c => c.type === 'attack').sort(() => Math.random() - 0.5).slice(0, 2);
    const skills = characterCards.filter(c => c.type === 'skill').sort(() => Math.random() - 0.5).slice(0, 2);
    const powers = characterCards.filter(c => c.type === 'power').sort(() => Math.random() - 0.5).slice(0, 1);
    const colorless = colorlessCards.sort(() => Math.random() - 0.5).slice(0, 1);

    const shopCardsWithEval = [...attacks, ...skills, ...powers, ...colorless].map(card => {
      const price = card.rarity === 'common' ? 50 + Math.floor(Math.random() * 26) :
                    card.rarity === 'uncommon' ? 75 + Math.floor(Math.random() * 26) :
                    150 + Math.floor(Math.random() * 51);

      const evaluation = evaluateCardForDeck(card, deck, relics, character);

      return {
        ...card,
        price,
        rating: evaluation.rating,
        reason: evaluation.reason,
        priority: evaluation.priority,
      };
    });

    // Sort by rating (best first)
    shopCardsWithEval.sort((a, b) => b.rating - a.rating);

    console.log('ShopModal: Shop cards generated:', shopCardsWithEval.length);

    // Relics: 2-3 relics
    const nonBossRelics = relicsData.filter(r => r.rarity !== 'boss' && r.rarity !== 'starter') as Relic[];
    const shopRelics = nonBossRelics.sort(() => Math.random() - 0.5).slice(0, 3).map(relic => ({
      ...relic,
      price: relic.rarity === 'common' ? 150 :
             relic.rarity === 'uncommon' ? 250 :
             300
    }));

    console.log('ShopModal: Shop relics generated:', shopRelics.length);

    // Potions: 3 potions
    const availablePotions = potionsData.filter(
      p => p.character === character || p.character === 'shared'
    ) as Potion[];
    const shopPotions = availablePotions.sort(() => Math.random() - 0.5).slice(0, 3).map(potion => ({
      ...potion,
      price: 50
    }));

    console.log('ShopModal: Shop potions generated:', shopPotions.length);

    console.log('ShopModal: Setting state with:', shopCardsWithEval.length, 'cards,', shopRelics.length, 'relics,', shopPotions.length, 'potions');
    setCardStock(shopCardsWithEval);
    setRelicStock(shopRelics);
    setPotionStock(shopPotions);
    setIsLoading(false);
    console.log('ShopModal: State set complete, isLoading=false');
  };

  const handleBuyCard = (card: Card & { price: number }) => {
    if (gold >= card.price) {
      onBuyCard(card, card.price);
      setCardStock(cardStock.filter(c => c.id !== card.id));
    }
  };

  const handleBuyRelic = (relic: Relic & { price: number }) => {
    if (gold >= relic.price) {
      onBuyRelic(relic, relic.price);
      setRelicStock(relicStock.filter(r => r.id !== relic.id));
    }
  };

  const handleBuyPotion = (potion: Potion & { price: number }) => {
    if (gold >= potion.price) {
      onBuyPotion(potion, potion.price);
      setPotionStock(potionStock.filter(p => p.id !== potion.id));
    }
  };

  const handleRemoveCard = (card: Card) => {
    if (gold >= removalPrice) {
      onRemoveCard(card, removalPrice);
      setRemovalCount(removalCount + 1);
      setRemovalPrice(Math.min(150, 75 + (removalCount + 1) * 25));
    }
  };

  console.log('ShopModal: Rendering with stocks - cards:', cardStock.length, 'relics:', relicStock.length, 'potions:', potionStock.length, 'isLoading:', isLoading);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-sts-dark rounded-lg p-6 max-w-7xl w-full border-2 border-yellow-500/50 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
            <span>🏪</span>
            <span>Merchant</span>
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-lg font-bold text-yellow-500">
              💰 {gold}G
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Leave Shop
            </button>
          </div>
        </div>

        {/* Debug info - Always show */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4 mb-6">
          <p className="text-blue-400 text-sm">
            Debug: Character={character}, Cards={cardStock.length}, Relics={relicStock.length}, Potions={potionStock.length}, Loading={isLoading.toString()}
          </p>
          <p className="text-blue-400 text-xs mt-1">
            Check browser console (F12) for detailed logs
          </p>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-yellow-400 text-xl mb-2">🏪 Setting up shop...</div>
            <div className="text-sts-light/60 text-sm">Preparing goods for sale</div>
          </div>
        ) : (cardStock.length === 0 && relicStock.length === 0 && potionStock.length === 0) ? (
          <div className="bg-red-900/20 border border-red-500/30 rounded p-4 mb-6">
            <p className="text-red-400">Debug: Shop stock not generated. Character: {character}</p>
          </div>
        ) : (
          /* Game-style Shop Layout - All items visible at once */
          <div className="space-y-6">
          {/* Cards Section - Compact by default */}
          <div>
            <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
              <span>🎴</span>
              <span>Cards for Sale</span>
            </h3>

            {!showAllCards ? (
              // COMPACT VIEW - Top 3 recommendations
              <div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {cardStock.slice(0, 3).map((card) => {
                    const canAfford = gold >= card.price;
                    const badge = {
                      'must-pick': { emoji: '🔴', label: 'Must', color: 'bg-red-600 text-white' },
                      'good-pick': { emoji: '🟡', label: 'Good', color: 'bg-yellow-600 text-black' },
                      'situational': { emoji: '🟢', label: 'OK', color: 'bg-green-600 text-white' },
                      'skip': { emoji: '⚪', label: 'Pass', color: 'bg-gray-600 text-white' },
                    }[card.priority];

                    return (
                      <div
                        key={card.id}
                        className={`bg-sts-darker p-3 rounded-lg border-2 ${
                          canAfford ? 'border-blue-500/50 hover:border-blue-500' : 'border-gray-700 opacity-60'
                        } transition-all`}
                      >
                        {/* Card Image */}
                        <div className="aspect-[2/3] mb-2 relative">
                          <img
                            src={getCardImagePath(card.character, card.id)}
                            alt={card.name}
                            onError={handleImageError}
                            className="w-full h-full object-contain rounded"
                          />
                          {/* Rating badge */}
                          <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${badge.color}`}>
                            {badge.emoji}
                          </div>
                        </div>

                        {/* Card Info */}
                        <h4 className="text-sm font-bold text-sts-light mb-1 truncate">{card.name}</h4>
                        <div className="text-xs text-sts-light/70 mb-2">
                          {card.cost}E · {card.rarity}
                        </div>

                        {/* Reason */}
                        <p className="text-xs text-sts-light/60 mb-3 line-clamp-2 min-h-[2.5rem]">
                          {card.reason}
                        </p>

                        {/* Buy Button */}
                        <button
                          onClick={() => handleBuyCard(card)}
                          disabled={!canAfford}
                          className={`w-full px-3 py-2 text-sm rounded font-bold transition-all ${
                            canAfford
                              ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          💰 {card.price}G
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Show All Cards Button */}
                {cardStock.length > 3 && (
                  <button
                    onClick={() => setShowAllCards(true)}
                    className="w-full px-4 py-2 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/50 rounded text-sm font-semibold text-sts-light transition-colors"
                  >
                    🔍 Show All Cards ({cardStock.length})
                  </button>
                )}
              </div>
            ) : (
              // FULL VIEW - All cards in grid
              <div>
                <div className="grid grid-cols-5 gap-4 mb-3">
                  {cardStock.map((card) => {
                    const canAfford = gold >= card.price;

                    return (
                      <div key={card.id} className="relative group">
                        {/* Rating badge - top left */}
                        <div className={`absolute -top-2 -left-2 z-30 px-2 py-1 rounded-full text-xs font-bold shadow-lg ${
                          card.rating >= 4 ? 'bg-red-600 text-white' :
                          card.rating >= 3 ? 'bg-yellow-600 text-black' :
                          card.rating >= 2 ? 'bg-green-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {card.rating >= 4 ? '★★★' :
                           card.rating >= 3 ? '★★' :
                           card.rating >= 2 ? '★' : '—'}
                        </div>

                        {/* Card with StSCard component */}
                        <div className={`transition-all ${canAfford ? 'hover:scale-105' : 'opacity-60'}`}>
                          <StSCard card={card} showHoverEffect={canAfford} />
                        </div>

                        {/* Price button - below card */}
                        <button
                          onClick={() => handleBuyCard(card)}
                          disabled={!canAfford}
                          className={`w-full mt-2 px-3 py-2 text-sm rounded-lg font-bold transition-all ${
                            canAfford
                              ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          💰 {card.price}G
                        </button>

                        {/* Tooltip on hover */}
                        {card.reason && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            <div className="bg-black/95 text-white text-xs px-3 py-2 rounded whitespace-nowrap border border-gray-700 max-w-xs">
                              {card.reason}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Show Less Button */}
                <button
                  onClick={() => setShowAllCards(false)}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-semibold transition-colors"
                >
                  ← Show Top Recommendations
                </button>
              </div>
            )}
          </div>

          {/* Relics Section */}
          <div>
            <h3 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
              <span>🏺</span>
              <span>Relics for Sale</span>
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {relicStock.map((relic) => {
                const evaluation = evaluateRelic(relic, deck, relics, character);
                const canAfford = gold >= relic.price;

                return (
                  <div key={relic.id} className="bg-sts-darker p-3 rounded-lg border border-purple-500/30 hover:border-purple-500 transition-all">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                        <img
                          src={getRelicImagePath(relic.id)}
                          alt={relic.name}
                          onError={handleImageError}
                          onClick={() => setZoomedRelic(relic)}
                          className="w-full h-full object-contain cursor-pointer hover:scale-110 transition-transform"
                          title="Click to enlarge"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-purple-400 mb-1 truncate">{relic.name}</div>
                        <div className="text-xs text-sts-light/70 mb-1 line-clamp-2 leading-tight">{relic.description}</div>
                        <div className="text-xs text-yellow-500 mb-1">
                          {'★'.repeat(Math.floor(evaluation.rating))}{'☆'.repeat(5 - Math.floor(evaluation.rating))}
                        </div>
                        <button
                          onClick={() => handleBuyRelic(relic)}
                          disabled={!canAfford}
                          className={`w-full px-2 py-1 text-xs rounded font-semibold transition-colors ${
                            canAfford
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {relic.price}G
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Row: Potions and Card Removal */}
          <div className="grid grid-cols-2 gap-6">
            {/* Potions Section */}
            <div>
              <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                <span>⚗️</span>
                <span>Potions for Sale</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {potionStock.map((potion) => {
                  const canAfford = gold >= potion.price;

                  return (
                    <div key={potion.id} className="bg-sts-darker p-2 rounded-lg border border-green-500/30 hover:border-green-500 transition-all">
                      <div className="text-xs font-semibold text-green-400 mb-1 truncate" title={potion.name}>{potion.name}</div>
                      <div className="text-[10px] text-sts-light/70 mb-2 line-clamp-2">{potion.description}</div>
                      <button
                        onClick={() => handleBuyPotion(potion)}
                        disabled={!canAfford}
                        className={`w-full px-2 py-1 text-xs rounded font-semibold transition-colors ${
                          canAfford
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {potion.price}G
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card Removal Section */}
            <div>
              <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                <span>🗑️</span>
                <span>Card Removal ({removalPrice}G)</span>
              </h3>
              <div className="bg-red-900/20 border border-red-500/30 rounded p-3 mb-3">
                <p className="text-xs text-sts-light/80 mb-2">
                  Remove unwanted cards to improve deck consistency
                </p>
                <p className="text-[10px] text-sts-light/60">
                  Price increases with each removal. {removalCount > 0 && `Removed ${removalCount} so far.`}
                </p>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <div className="grid grid-cols-6 gap-3">
                  {deck.map((card) => {
                    const evaluation = evaluateCardRemoval(card, deck, relics);
                    const canAfford = gold >= removalPrice;

                    return (
                      <div key={card.id} className="relative group">
                        {/* Priority badge */}
                        {evaluation.priority !== 'keep' && (
                          <div className={`absolute -top-2 -right-2 z-30 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${
                            evaluation.priority === 'must-remove' ? 'bg-red-600' : 'bg-orange-500'
                          }`}>
                            {evaluation.priority === 'must-remove' ? '!' : '?'}
                          </div>
                        )}

                        {/* Card */}
                        <div
                          onClick={() => canAfford && handleRemoveCard(card)}
                          className={`cursor-pointer transition-all ${
                            canAfford ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'
                          } ${
                            evaluation.priority === 'must-remove' ? 'ring-2 ring-red-600' :
                            evaluation.priority === 'should-remove' ? 'ring-2 ring-orange-400' :
                            ''
                          } rounded-xl`}
                        >
                          <StSCard card={card} showHoverEffect={false} />
                        </div>

                        {/* Tooltip showing reason */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          <div className="bg-black/95 text-white text-xs px-3 py-2 rounded whitespace-nowrap border border-gray-700">
                            {evaluation.reason}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Relic Zoom Modal */}
        {zoomedRelic && (
          <RelicZoomModal relic={zoomedRelic} onClose={() => setZoomedRelic(null)} />
        )}
      </div>
    </div>
  );
}

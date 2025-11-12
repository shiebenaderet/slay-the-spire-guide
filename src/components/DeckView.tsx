import { useState, useMemo } from 'react';
import type { Card, Relic, CharacterType } from '../types';
import { StSCard } from './StSCard';
import { getCardImagePath, handleImageError } from '../utils/imageHelpers';
import { evaluateCardForDeck } from '../utils/advisoryLogic';

interface DeckViewProps {
  deck: Card[];
  character?: CharacterType;
  relics?: Relic[];
  onRemoveCard?: (cardId: string) => void;
  onUpgradeCard?: (cardId: string) => void;
  onCardClick?: (card: Card) => void;
}

export function DeckView({ deck, character, relics = [], onRemoveCard, onUpgradeCard, onCardClick }: DeckViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('compact');

  // Evaluate and sort cards by rating (highest first) if character is available
  const sortedCards = useMemo(() => {
    if (!character) {
      // Fallback to type-based sorting if no character
      return [...deck].sort((a, b) => {
        if (a.type !== b.type) {
          const typeOrder = { attack: 0, skill: 1, power: 2, status: 3, curse: 4 };
          return typeOrder[a.type] - typeOrder[b.type];
        }
        return a.name.localeCompare(b.name);
      });
    }

    // Evaluate each card and sort by rating
    const cardsWithRatings = deck.map(card => {
      const evaluation = evaluateCardForDeck(card, deck, relics, character);
      return {
        card,
        rating: evaluation.rating,
      };
    });

    return cardsWithRatings
      .sort((a, b) => {
        // Sort by rating (highest first)
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        // Then by type
        if (a.card.type !== b.card.type) {
          const typeOrder = { attack: 0, skill: 1, power: 2, status: 3, curse: 4 };
          return typeOrder[a.card.type] - typeOrder[b.card.type];
        }
        // Then by name
        return a.card.name.localeCompare(b.card.name);
      })
      .map(item => item.card);
  }, [deck, character, relics]);

  // Group cards by name for compact view
  const groupedCards = sortedCards.reduce((acc, card) => {
    const key = `${card.name}_${card.upgraded ? 'upgraded' : 'base'}`;
    if (!acc[key]) {
      acc[key] = { card, count: 0, instances: [] };
    }
    acc[key].count++;
    acc[key].instances.push(card);
    return acc;
  }, {} as Record<string, { card: Card; count: number; instances: Card[] }>);

  // Calculate deck stats
  const typeCount = deck.reduce(
    (acc, card) => {
      acc[card.type] = (acc[card.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      {/* Deck Stats Header with View Toggle */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-3 text-xs text-sts-light/70">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded"></span>
            {typeCount.attack || 0}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded"></span>
            {typeCount.skill || 0}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded"></span>
            {typeCount.power || 0}
          </span>
          {typeCount.curse > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-purple-800 rounded"></span>
              {typeCount.curse} curse{typeCount.curse > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* View Mode Toggle */}
        {deck.length > 12 && (
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'compact' : 'grid')}
            className="text-xs px-2 py-1 bg-sts-darker hover:bg-sts-light/10 text-sts-light/70 rounded transition-colors"
            title={viewMode === 'grid' ? 'Switch to compact view' : 'Switch to grid view'}
          >
            {viewMode === 'grid' ? '☰ Compact' : '⊞ Grid'}
          </button>
        )}
      </div>

      {viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-3 gap-1.5 max-h-52 overflow-y-auto overflow-x-hidden pr-1">
        {sortedCards.length === 0 && (
          <p className="text-sts-light/60 text-center py-8 col-span-3">No cards yet</p>
        )}
        {sortedCards.map((card) => {
          const canUpgrade = card.type !== 'curse' && card.type !== 'status' && !card.upgraded;

          return (
            <div
              key={card.id}
              className="relative group"
            >
              {/* Slay the Spire Card */}
              <StSCard
                card={card}
                showHoverEffect={false}
                onClick={onCardClick ? () => onCardClick(card) : undefined}
              />

              {/* Action Buttons - Show on hover */}
              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded-lg">
                {onUpgradeCard && canUpgrade && (
                  <button
                    onClick={() => onUpgradeCard(card.id)}
                    className="w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs flex items-center justify-center"
                    title="Upgrade card"
                  >
                    U
                  </button>
                )}
                {onRemoveCard && (
                  <button
                    onClick={() => onRemoveCard(card.id)}
                    className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs flex items-center justify-center"
                    title="Remove card"
                  >
                    R
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        /* Compact/Stacked View */
        <div className="space-y-1 max-h-52 overflow-y-auto overflow-x-hidden pr-1">
          {Object.values(groupedCards).map(({ card, count, instances }) => {
            const canUpgrade = card.type !== 'curse' && card.type !== 'status' && !card.upgraded;

            return (
              <div
                key={`${card.name}_${card.upgraded ? 'upgraded' : 'base'}`}
                className="bg-sts-darker rounded flex items-center gap-2 p-1.5 hover:bg-sts-light/5 transition-colors group"
              >
                {/* Mini Card Image */}
                <img
                  src={getCardImagePath(card.character, card.id)}
                  alt={card.name}
                  onError={handleImageError}
                  onClick={onCardClick ? () => onCardClick(card) : undefined}
                  className={`w-12 h-12 object-cover rounded border ${
                    card.type === 'curse' ? 'border-purple-800' :
                    card.type === 'status' ? 'border-gray-500' :
                    card.upgraded ? 'border-yellow-400' : 'border-sts-light/20'
                  } ${onCardClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                  title={onCardClick ? 'Click to enlarge' : undefined}
                />

                {/* Card Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-sts-light font-medium truncate">
                    {card.name}{card.upgraded ? '+' : ''}
                  </div>
                  <div className="text-xs text-sts-light/60">
                    {count > 1 && `×${count} · `}
                    {card.type} · {card.cost}E
                  </div>
                </div>

                {/* Action Buttons - Always visible in compact mode */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onUpgradeCard && canUpgrade && instances.length > 0 && (
                    <button
                      onClick={() => onUpgradeCard(instances[0].id)}
                      className="w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex items-center justify-center"
                      title="Upgrade card"
                    >
                      U
                    </button>
                  )}
                  {onRemoveCard && instances.length > 0 && (
                    <button
                      onClick={() => onRemoveCard(instances[0].id)}
                      className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex items-center justify-center"
                      title="Remove card"
                    >
                      R
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sortedCards.length === 0 && (
        <p className="text-sts-light/60 text-center py-8">No cards yet</p>
      )}
    </div>
  );
}

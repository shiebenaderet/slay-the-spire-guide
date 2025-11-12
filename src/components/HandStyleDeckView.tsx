import { useState } from 'react';
import type { Card } from '../types';
import { getCardImagePath, handleImageError } from '../utils/imageHelpers';

interface HandStyleDeckViewProps {
  deck: Card[];
  maxCardsToShow?: number;
}

/**
 * Displays cards in a fan/hand layout similar to the actual game
 * Cards are shown at the bottom of the container in a curved fan pattern
 */
export function HandStyleDeckView({ deck, maxCardsToShow = 10 }: HandStyleDeckViewProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Sort cards by type for better visual organization
  const sortedCards = [...deck].sort((a, b) => {
    const typeOrder = { attack: 0, skill: 1, power: 2, status: 3, curse: 4 };
    if (a.type !== b.type) {
      return typeOrder[a.type] - typeOrder[b.type];
    }
    return a.name.localeCompare(b.name);
  });

  // Show only the first N cards to avoid overcrowding
  const cardsToDisplay = sortedCards.slice(0, maxCardsToShow);
  const hasMore = deck.length > maxCardsToShow;

  // Calculate fan layout parameters
  const totalCards = cardsToDisplay.length;
  const maxRotation = 15; // degrees
  const baseSpacing = 90; // base spacing in pixels
  const cardWidth = 120;
  const cardHeight = 168;

  // Adjust spacing based on number of cards to prevent overflow
  const spacing = Math.min(baseSpacing, (window.innerWidth * 0.8) / totalCards);

  return (
    <div className="relative w-full h-48 flex items-end justify-center overflow-hidden">
      {/* Fan of cards */}
      <div className="relative" style={{ width: `${spacing * totalCards}px`, height: '180px' }}>
        {cardsToDisplay.map((card, index) => {
          const middleIndex = (totalCards - 1) / 2;
          const offset = index - middleIndex;

          // Calculate rotation and position for fan effect
          const rotation = (offset / totalCards) * maxRotation;
          const xOffset = offset * spacing;
          const yOffset = Math.abs(offset) * 8; // Cards at edges are slightly lower

          const isHovered = hoveredCard === card.id;

          return (
            <div
              key={card.id}
              className="absolute transition-all duration-200 cursor-pointer"
              style={{
                left: `${50 + (xOffset / spacing)}%`,
                bottom: `${yOffset}px`,
                transform: `
                  translateX(-50%)
                  rotate(${rotation}deg)
                  ${isHovered ? 'translateY(-40px) scale(1.15)' : 'translateY(0) scale(1)'}
                `,
                transformOrigin: 'bottom center',
                zIndex: isHovered ? 100 : 50 - Math.abs(offset),
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
              }}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`relative w-full h-full rounded-lg overflow-hidden shadow-lg ${
                card.upgraded ? 'ring-2 ring-yellow-400' : ''
              } ${
                card.type === 'curse' ? 'ring-2 ring-purple-800' : ''
              }`}>
                <img
                  src={getCardImagePath(card.character, card.id)}
                  alt={card.name}
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />

                {/* Upgraded badge */}
                {card.upgraded && (
                  <div className="absolute top-1 right-1 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                    +
                  </div>
                )}

                {/* Card name overlay on hover */}
                {isHovered && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/90 p-2">
                    <p className="text-white text-xs font-semibold text-center truncate">
                      {card.name}{card.upgraded ? '+' : ''}
                    </p>
                    <p className="text-white/70 text-xs text-center">
                      {card.type} • {card.cost}E
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* "More cards" indicator */}
      {hasMore && (
        <div className="absolute bottom-2 right-4 bg-sts-dark/90 text-sts-light text-xs px-3 py-1.5 rounded-full border border-sts-light/30">
          +{deck.length - maxCardsToShow} more
        </div>
      )}
    </div>
  );
}

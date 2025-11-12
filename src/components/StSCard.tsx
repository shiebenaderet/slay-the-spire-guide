import type { Card } from '../types';
import { getCardImagePath, handleImageError } from '../utils/imageHelpers';

interface StSCardProps {
  card: Card;
  onClick?: () => void;
  className?: string;
  showHoverEffect?: boolean;
}

/**
 * Displays an actual Slay the Spire card image from the wiki
 * These are the full game cards with frames, cost, description, etc.
 */
export function StSCard({ card, onClick, className = '', showHoverEffect = true }: StSCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative ${
        showHoverEffect ? 'hover:scale-105 hover:shadow-2xl transition-all duration-200' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${card.upgraded ? 'ring-4 ring-yellow-400/80 ring-offset-2 ring-offset-black' : ''} ${className}`}
      style={{
        aspectRatio: '268/345', // Actual wiki card aspect ratio
        boxShadow: card.upgraded ? '0 0 20px rgba(250, 204, 21, 0.6)' : '0 4px 12px rgba(0,0,0,0.5)'
      }}
      title={onClick ? 'Click to enlarge' : undefined}
    >
      {/* Full game card image */}
      <img
        src={getCardImagePath(card.character || 'colorless', card.id)}
        alt={`${card.name}${card.upgraded ? '+' : ''}`}
        onError={handleImageError}
        className="w-full h-full object-contain rounded-lg"
        style={{
          filter: card.upgraded ? 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.5))' : undefined
        }}
      />

      {/* Upgraded glow overlay */}
      {card.upgraded && (
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/10 via-yellow-400/5 to-transparent pointer-events-none rounded-lg" />
      )}
    </div>
  );
}

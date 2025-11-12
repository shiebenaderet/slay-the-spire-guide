import { useEffect } from 'react';
import type { Card } from '../types';
import { getCardImagePath, handleImageError } from '../utils/imageHelpers';

interface CardZoomModalProps {
  card: Card;
  onClose: () => void;
}

/**
 * Full-screen modal that shows an enlarged view of a card for better readability
 */
export function CardZoomModal({ card, onClose }: CardZoomModalProps) {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the card
      >
        {/* Close button - positioned inside on mobile, outside on desktop */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:-top-12 sm:right-0 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-xs sm:text-sm z-10 shadow-lg"
        >
          <span className="hidden sm:inline">Close (ESC)</span>
          <span className="sm:hidden">✕</span>
        </button>

        {/* Enlarged card */}
        <div
          className={`relative ${
            card.upgraded ? 'ring-4 ring-yellow-400/80 ring-offset-4 ring-offset-black' : ''
          }`}
          style={{
            aspectRatio: '268/345',
            boxShadow: card.upgraded ? '0 0 40px rgba(250, 204, 21, 0.6)' : '0 8px 24px rgba(0,0,0,0.7)'
          }}
        >
          <img
            src={getCardImagePath(card.character || 'colorless', card.id)}
            alt={`${card.name}${card.upgraded ? '+' : ''}`}
            onError={handleImageError}
            className="w-full h-full object-contain rounded-lg"
            style={{
              filter: card.upgraded ? 'drop-shadow(0 0 16px rgba(250, 204, 21, 0.5))' : undefined
            }}
          />

          {/* Upgraded glow overlay */}
          {card.upgraded && (
            <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/10 via-yellow-400/5 to-transparent pointer-events-none rounded-lg" />
          )}
        </div>

        {/* Card info below */}
        <div className="mt-3 sm:mt-4 text-center px-2">
          <h2 className="text-xl sm:text-2xl font-bold text-sts-light">
            {card.name}{card.upgraded && '+'}
          </h2>
          <p className="text-sts-light/70 text-xs sm:text-sm mt-1">
            <span className="hidden sm:inline">Click anywhere outside the card to close</span>
            <span className="sm:hidden">Tap outside to close</span>
          </p>
        </div>
      </div>
    </div>
  );
}

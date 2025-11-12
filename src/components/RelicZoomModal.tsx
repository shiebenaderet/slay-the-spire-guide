import { useEffect } from 'react';
import type { Relic } from '../types';
import { getRelicImagePath, handleImageError } from '../utils/imageHelpers';

interface RelicZoomModalProps {
  relic: Relic;
  onClose: () => void;
}

/**
 * Full-screen modal that shows an enlarged view of a relic for better readability
 */
export function RelicZoomModal({ relic, onClose }: RelicZoomModalProps) {
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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-300';
      case 'uncommon': return 'text-blue-400';
      case 'rare': return 'text-yellow-400';
      case 'boss': return 'text-red-400';
      case 'starter': return 'text-green-400';
      default: return 'text-gray-300';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500';
      case 'uncommon': return 'border-blue-500';
      case 'rare': return 'border-yellow-500';
      case 'boss': return 'border-red-500';
      case 'starter': return 'border-green-500';
      default: return 'border-gray-500';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-sts-darker rounded-lg border-2 p-4 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the content
        style={{ borderColor: `var(--${getRarityBorder(relic.rarity)})` }}
      >
        {/* Close button - positioned inside on mobile, outside on desktop */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:-top-12 sm:right-0 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-xs sm:text-sm z-10 shadow-lg"
        >
          <span className="hidden sm:inline">Close (ESC)</span>
          <span className="sm:hidden">✕</span>
        </button>

        {/* Relic content */}
        <div className="flex flex-col items-center">
          {/* Enlarged relic image */}
          <div className="w-32 h-32 sm:w-48 sm:h-48 mb-4 sm:mb-6 relative flex items-center justify-center">
            <img
              src={getRelicImagePath(relic.id)}
              alt={relic.name}
              onError={handleImageError}
              className="w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.7))' }}
            />
          </div>

          {/* Relic info */}
          <div className="text-center w-full">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-2 ${getRarityColor(relic.rarity)}`}>
              {relic.name}
            </h2>

            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
              <span className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full border ${getRarityBorder(relic.rarity)} ${getRarityColor(relic.rarity)} uppercase font-semibold`}>
                {relic.rarity}
              </span>
              {relic.tier && (
                <span className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full bg-sts-light/10 text-sts-light">
                  Tier {relic.tier}
                </span>
              )}
            </div>

            <p className="text-base sm:text-lg text-sts-light leading-relaxed mb-4 sm:mb-6 max-w-xl mx-auto px-2">
              {relic.description}
            </p>

            {relic.synergies && relic.synergies.length > 0 && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-green-900/20 border border-green-500/30 rounded mx-2">
                <p className="text-xs sm:text-sm font-semibold text-green-400 mb-1 sm:mb-2">Synergies</p>
                <p className="text-xs text-sts-light/80">
                  Works well with: {relic.synergies.join(', ')}
                </p>
              </div>
            )}

            <p className="text-sts-light/50 text-xs sm:text-sm mt-4 sm:mt-6">
              <span className="hidden sm:inline">Click anywhere outside to close</span>
              <span className="sm:hidden">Tap outside to close</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

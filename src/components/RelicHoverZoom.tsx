import { useState, useRef, useEffect } from 'react';
import type { Relic } from '../types';
import { getRelicImagePath, handleImageError } from '../utils/imageHelpers';

interface RelicHoverZoomProps {
  relic: Relic;
  onClick?: () => void;
  className?: string;
  showRarity?: boolean;
}

/**
 * Relic component with dock-style hover zoom effect
 * Enlarges the relic on hover without blocking other content
 */
export function RelicHoverZoom({ relic, onClick, className = '', showRarity = true }: RelicHoverZoomProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [zoomPosition, setZoomPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const relicRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isHovered || !relicRef.current) return;

    // Calculate best position for zoomed relic based on viewport position
    const rect = relicRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Zoomed relic dimensions
    const zoomedSize = 200;

    // Check available space
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;

    // Determine best position
    if (spaceAbove > zoomedSize && spaceAbove > spaceBelow) {
      setZoomPosition('top');
    } else if (spaceBelow > zoomedSize) {
      setZoomPosition('bottom');
    } else if (spaceRight > zoomedSize && spaceRight > spaceLeft) {
      setZoomPosition('right');
    } else {
      setZoomPosition('left');
    }
  }, [isHovered]);

  return (
    <div
      ref={relicRef}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Original relic - normal size */}
      <div className="relative aspect-square">
        <img
          src={getRelicImagePath(relic.id)}
          alt={relic.name}
          onError={handleImageError}
          onClick={onClick}
          className={`w-full h-full object-contain rounded ${
            onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''
          }`}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          }}
        />

        {/* Rarity indicator */}
        {showRarity && (
          <div
            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-sts-darker ${
              relic.rarity === 'starter' ? 'bg-gray-500' :
              relic.rarity === 'common' ? 'bg-white' :
              relic.rarity === 'uncommon' ? 'bg-blue-500' :
              relic.rarity === 'rare' ? 'bg-yellow-500' :
              relic.rarity === 'boss' ? 'bg-red-500' :
              'bg-gray-500'
            }`}
            title={relic.rarity}
          ></div>
        )}
      </div>

      {/* Zoomed relic on hover - dock style */}
      {isHovered && (
        <div
          className={`absolute z-50 pointer-events-none ${
            zoomPosition === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' :
            zoomPosition === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' :
            zoomPosition === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' :
            'left-full ml-2 top-1/2 -translate-y-1/2'
          }`}
        >
          <div
            className="bg-black/95 rounded-lg border-2 border-sts-light/30 p-4"
            style={{
              width: '300px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
              animation: 'zoomIn 0.15s ease-out'
            }}
          >
            {/* Enlarged relic image */}
            <div className="flex items-center justify-center mb-3">
              <img
                src={getRelicImagePath(relic.id)}
                alt={`${relic.name} (enlarged)`}
                onError={handleImageError}
                className="w-32 h-32 object-contain"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
                }}
              />
            </div>

            {/* Relic details */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-sts-light mb-1">{relic.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-sts-light/10 text-sts-light/70 capitalize">
                {relic.rarity}
              </span>
              <p className="text-sm text-sts-light/80 mt-3 leading-tight">
                {relic.description || 'No description available.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes zoomIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
}

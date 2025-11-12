import { useState, useRef, useEffect } from 'react';
import type { Card } from '../types';
import { getCardImagePath, handleImageError } from '../utils/imageHelpers';

interface CardHoverZoomProps {
  card: Card;
  onClick?: () => void;
  className?: string;
}

/**
 * Card component with dock-style hover zoom effect
 * Enlarges the card on hover without blocking other content
 */
export function CardHoverZoom({ card, onClick, className = '' }: CardHoverZoomProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [zoomPosition, setZoomPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isHovered || !cardRef.current) return;

    // Calculate best position for zoomed card based on viewport position
    const rect = cardRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Zoomed card dimensions (larger)
    const zoomedHeight = 400;
    const zoomedWidth = (400 * 268) / 345; // Maintain aspect ratio

    // Check available space
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;

    // Determine best position
    if (spaceAbove > zoomedHeight && spaceAbove > spaceBelow) {
      setZoomPosition('top');
    } else if (spaceBelow > zoomedHeight) {
      setZoomPosition('bottom');
    } else if (spaceRight > zoomedWidth && spaceRight > spaceLeft) {
      setZoomPosition('right');
    } else {
      setZoomPosition('left');
    }
  }, [isHovered]);

  return (
    <div
      ref={cardRef}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Original card - normal size */}
      <div
        onClick={onClick}
        className={`relative transition-all duration-200 ${
          onClick ? 'cursor-pointer' : ''
        } ${card.upgraded ? 'ring-2 ring-yellow-400/80' : ''}`}
        style={{
          aspectRatio: '268/345',
          boxShadow: card.upgraded
            ? '0 0 12px rgba(250, 204, 21, 0.4)'
            : '0 2px 8px rgba(0,0,0,0.3)'
        }}
      >
        <img
          src={getCardImagePath(card.character || 'colorless', card.id)}
          alt={`${card.name}${card.upgraded ? '+' : ''}`}
          onError={handleImageError}
          className="w-full h-full object-contain rounded-lg"
          style={{
            filter: card.upgraded ? 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.3))' : undefined
          }}
        />

        {card.upgraded && (
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/10 via-yellow-400/5 to-transparent pointer-events-none rounded-lg" />
        )}
      </div>

      {/* Zoomed card on hover - dock style */}
      {isHovered && (
        <div
          className={`absolute z-50 pointer-events-none ${
            zoomPosition === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' :
            zoomPosition === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' :
            zoomPosition === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' :
            'left-full ml-2 top-1/2 -translate-y-1/2'
          }`}
          style={{
            width: '310px',
            height: '400px',
          }}
        >
          <div
            className={`relative w-full h-full ${
              card.upgraded ? 'ring-4 ring-yellow-400/80 ring-offset-4 ring-offset-black' : ''
            }`}
            style={{
              aspectRatio: '268/345',
              boxShadow: card.upgraded
                ? '0 0 40px rgba(250, 204, 21, 0.6), 0 8px 24px rgba(0,0,0,0.7)'
                : '0 8px 24px rgba(0,0,0,0.7)',
              animation: 'zoomIn 0.15s ease-out'
            }}
          >
            <img
              src={getCardImagePath(card.character || 'colorless', card.id)}
              alt={`${card.name}${card.upgraded ? '+' : ''} (enlarged)`}
              onError={handleImageError}
              className="w-full h-full object-contain rounded-lg"
              style={{
                filter: card.upgraded ? 'drop-shadow(0 0 16px rgba(250, 204, 21, 0.5))' : undefined
              }}
            />

            {card.upgraded && (
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/10 via-yellow-400/5 to-transparent pointer-events-none rounded-lg" />
            )}
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

import type { Relic } from '../types';
import { RelicHoverZoom } from './RelicHoverZoom';

interface RelicViewProps {
  relics: Relic[];
  onRemoveRelic?: (relicId: string) => void;
}

/**
 * Displays relics in a styled grid with proper images and hover effects
 */
export function RelicView({ relics, onRemoveRelic }: RelicViewProps) {
  return (
    <div>
      {relics.length === 0 ? (
        <p className="text-sts-light/60 text-xs text-center py-4">No relics yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto overflow-x-hidden pr-1">
          {relics.map(relic => (
            <div
              key={relic.id}
              className="relative group bg-sts-darker rounded-lg p-2 hover:bg-sts-light/5 transition-all"
            >
              {/* Relic with Hover Zoom */}
              <RelicHoverZoom relic={relic} showRarity={true} />

              {/* Relic Name - Always visible */}
              <div className="text-[10px] text-sts-light/90 font-medium text-center leading-tight truncate px-1 mt-1.5">
                {relic.name}
              </div>

              {/* Remove Button - Show on hover */}
              {onRemoveRelic && (
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                  <button
                    onClick={() => onRemoveRelic(relic.id)}
                    className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs flex items-center justify-center"
                    title="Remove relic"
                  >
                    R
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

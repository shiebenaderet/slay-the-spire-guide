import type { Relic } from '../types';
import { getRelicImagePath, handleImageError } from '../utils/imageHelpers';

interface RelicTrackerProps {
  relics: Relic[];
  onRemoveRelic?: (relicId: string) => void;
}

export function RelicTracker({ relics, onRemoveRelic }: RelicTrackerProps) {
  const getRarityColor = (rarity: string) => {
    const colors = {
      starter: 'border-gray-400',
      common: 'border-white',
      uncommon: 'border-blue-400',
      rare: 'border-yellow-500',
      boss: 'border-red-500',
      shop: 'border-green-400',
      event: 'border-purple-400',
    };
    return colors[rarity as keyof typeof colors] || 'border-gray-400';
  };

  return (
    <div className="bg-sts-dark rounded-lg p-4">
      <h2 className="text-2xl font-bold text-sts-light mb-4">
        Relics ({relics.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {relics.map((relic) => (
          <div
            key={relic.id}
            className={`bg-sts-darker p-3 rounded border-2 ${getRarityColor(
              relic.rarity
            )}`}
          >
            <div className="flex gap-3 mb-2">
              <img
                src={getRelicImagePath(relic.id)}
                alt={relic.name}
                onError={handleImageError}
                className="w-16 h-16 object-cover rounded flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sts-light font-semibold mb-1">{relic.name}</h3>
                <span className="text-xs text-yellow-500">
                  {'★'.repeat(relic.tier)}
                </span>
              </div>
            </div>
            <p className="text-xs text-sts-light/70 mb-2">{relic.description}</p>
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-sts-light/10 text-sts-light/70 flex-shrink-0">
                {relic.rarity}
              </span>
              {onRemoveRelic && (
                <button
                  onClick={() => onRemoveRelic(relic.id)}
                  className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded flex-shrink-0"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
        {relics.length === 0 && (
          <p className="text-sts-light/60 text-center col-span-2">No relics yet</p>
        )}
      </div>
    </div>
  );
}

import type { Potion } from '../types';

interface PotionTrackerProps {
  potions: Potion[];
  maxSlots: number;
  onRemovePotion?: (potionId: string) => void;
}

export function PotionTracker({ potions, maxSlots, onRemovePotion }: PotionTrackerProps) {
  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'border-white',
      uncommon: 'border-blue-400',
      rare: 'border-yellow-500',
    };
    return colors[rarity as keyof typeof colors] || 'border-gray-400';
  };

  const getRarityBg = (rarity: string) => {
    const colors = {
      common: 'bg-gray-700/50',
      uncommon: 'bg-blue-900/30',
      rare: 'bg-yellow-900/30',
    };
    return colors[rarity as keyof typeof colors] || 'bg-gray-700/50';
  };

  // Create array of slots (filled + empty)
  const slots = Array.from({ length: maxSlots }, (_, i) => potions[i] || null);

  return (
    <div className="bg-sts-dark rounded-lg p-4">
      <h2 className="text-2xl font-bold text-sts-light mb-3 flex items-center gap-2">
        <span>🧪</span>
        <span>Potions ({potions.length}/{maxSlots})</span>
      </h2>

      <div className="grid grid-cols-1 gap-2">
        {slots.map((potion, index) => (
          <div
            key={index}
            className={`p-2 rounded border-2 ${
              potion
                ? `${getRarityColor(potion.rarity)} ${getRarityBg(potion.rarity)}`
                : 'border-dashed border-sts-light/20 bg-sts-darker/50'
            }`}
          >
            {potion ? (
              <div className="flex items-start gap-2">
                {/* Potion Icon Placeholder - will be replaced with actual images */}
                <div className="w-10 h-10 bg-sts-light/10 rounded flex items-center justify-center flex-shrink-0 text-2xl">
                  🧪
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sts-light font-semibold text-sm">{potion.name}</h3>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-sts-light/10 text-sts-light/70">
                      {potion.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-sts-light/80 mt-1">{potion.effect}</p>
                  <p className="text-xs text-green-400/80 mt-1 italic">
                    💡 {potion.useCase}
                  </p>
                </div>
                {onRemovePotion && (
                  <button
                    onClick={() => onRemovePotion(potion.id)}
                    className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded flex-shrink-0"
                    title="Use/discard potion"
                  >
                    Use
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-10 text-sts-light/40 text-xs">
                Empty Slot
              </div>
            )}
          </div>
        ))}
      </div>

      {potions.length === 0 && (
        <p className="text-sts-light/60 text-center text-sm mt-2">
          No potions yet. Find them after combat or buy from shops!
        </p>
      )}

      {potions.length >= maxSlots && (
        <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-500/50 rounded">
          <p className="text-xs text-yellow-300">
            ⚠️ Potion slots full! Use or discard a potion before picking up new ones.
          </p>
        </div>
      )}
    </div>
  );
}

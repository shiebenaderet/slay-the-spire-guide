import type { RunStats as RunStatsType } from '../types';

interface RunStatsProps {
  stats: RunStatsType;
  onUpdateStats: (stats: Partial<RunStatsType>) => void;
}

export function RunStats({ stats, onUpdateStats }: RunStatsProps) {
  const handleStatChange = (key: keyof RunStatsType, value: number) => {
    onUpdateStats({ [key]: value });
  };

  return (
    <div className="bg-sts-dark rounded-lg p-4">
      <h2 className="text-2xl font-bold text-sts-light mb-4">Run Statistics</h2>
      <div className="space-y-4">
        {/* Floor Number */}
        <div>
          <label className="block text-sts-light/80 text-sm mb-1">Floor</label>
          <input
            type="number"
            value={stats.floorNumber}
            onChange={(e) =>
              handleStatChange('floorNumber', parseInt(e.target.value) || 1)
            }
            className="w-full bg-sts-darker text-sts-light px-3 py-2 rounded border border-sts-light/20 focus:border-sts-light/50 focus:outline-none"
            min="1"
            max="60"
          />
        </div>

        {/* HP */}
        <div>
          <label className="block text-sts-light/80 text-sm mb-1">HP</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={stats.currentHP}
              onChange={(e) =>
                handleStatChange('currentHP', parseInt(e.target.value) || 0)
              }
              className="flex-1 bg-sts-darker text-sts-light px-3 py-2 rounded border border-sts-light/20 focus:border-sts-light/50 focus:outline-none"
              min="0"
              max={stats.maxHP}
            />
            <span className="text-sts-light/60 flex items-center">/</span>
            <input
              type="number"
              value={stats.maxHP}
              onChange={(e) =>
                handleStatChange('maxHP', parseInt(e.target.value) || 1)
              }
              className="flex-1 bg-sts-darker text-sts-light px-3 py-2 rounded border border-sts-light/20 focus:border-sts-light/50 focus:outline-none"
              min="1"
            />
          </div>
          <div className="mt-2 bg-sts-darker rounded-full h-2 overflow-hidden">
            <div
              className="bg-red-500 h-full transition-all"
              style={{
                width: `${(stats.currentHP / stats.maxHP) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Gold */}
        <div>
          <label className="block text-sts-light/80 text-sm mb-1">Gold</label>
          <input
            type="number"
            value={stats.gold}
            onChange={(e) =>
              handleStatChange('gold', parseInt(e.target.value) || 0)
            }
            className="w-full bg-sts-darker text-sts-light px-3 py-2 rounded border border-sts-light/20 focus:border-sts-light/50 focus:outline-none"
            min="0"
          />
        </div>

        {/* Ascension Level */}
        <div>
          <label className="block text-sts-light/80 text-sm mb-1">
            Ascension Level
          </label>
          <input
            type="number"
            value={stats.ascensionLevel}
            onChange={(e) =>
              handleStatChange('ascensionLevel', parseInt(e.target.value) || 0)
            }
            className="w-full bg-sts-darker text-sts-light px-3 py-2 rounded border border-sts-light/20 focus:border-sts-light/50 focus:outline-none"
            min="0"
            max="20"
          />
        </div>
      </div>
    </div>
  );
}

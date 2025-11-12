import { useMemo } from 'react';
import { generateMap, getEncounterForNode, type ActMap, type NodeType } from '../utils/mapGenerator';

interface MapDisplayProps {
  seed: string;
  act: number;
  ascensionLevel: number;
  currentFloor: number;
}

const NODE_ICONS: Record<NodeType, string> = {
  'M': '⚔️', // Monster
  'E': '👹', // Elite
  '?': '❓', // Event
  '$': '💰', // Shop
  'R': '🔥', // Rest
  'T': '📦', // Treasure
  'BOSS': '👑' // Boss
};

const NODE_COLORS: Record<NodeType, string> = {
  'M': 'bg-red-900/30 border-red-500',
  'E': 'bg-purple-900/30 border-purple-500',
  '?': 'bg-blue-900/30 border-blue-500',
  '$': 'bg-yellow-900/30 border-yellow-600',
  'R': 'bg-green-900/30 border-green-500',
  'T': 'bg-orange-900/30 border-orange-500',
  'BOSS': 'bg-red-900/50 border-red-600'
};

export function MapDisplay({ seed, act, ascensionLevel, currentFloor }: MapDisplayProps) {
  const map: ActMap = useMemo(() => {
    if (!seed) return { act, nodes: [], paths: [] };
    return generateMap(seed, act, ascensionLevel);
  }, [seed, act, ascensionLevel]);

  if (!seed || !map.nodes.length) {
    return (
      <div className="bg-sts-darker rounded-lg p-4 border border-sts-light/20 text-center">
        <p className="text-sts-light/60 text-sm">Enter a seed to see the map</p>
      </div>
    );
  }

  // Group nodes by floor for rendering
  const nodesByFloor = new Map<number, typeof map.nodes>();
  map.nodes.forEach(node => {
    if (!nodesByFloor.has(node.y)) {
      nodesByFloor.set(node.y, []);
    }
    nodesByFloor.get(node.y)!.push(node);
  });

  return (
    <div className="bg-sts-darker rounded-lg p-4 border border-sts-light/20">
      <h3 className="text-lg font-bold text-sts-light mb-3">Act {act} Map - Seed: {seed}</h3>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {/* Render floors from top (15) to bottom (1) */}
        {Array.from({ length: 16 }, (_, i) => 15 - i).map(floor => {
          const nodesOnFloor = nodesByFloor.get(floor) || [];
          if (nodesOnFloor.length === 0) return null;

          const isCurrentFloor = floor + 1 === currentFloor;
          const isPastFloor = floor + 1 < currentFloor;

          return (
            <div key={floor} className={`flex items-center gap-2 ${isCurrentFloor ? 'ring-2 ring-blue-500 rounded' : ''}`}>
              {/* Floor number */}
              <div className={`w-8 text-xs font-bold text-center ${
                isCurrentFloor ? 'text-blue-400' :
                isPastFloor ? 'text-green-400' :
                'text-sts-light/60'
              }`}>
                {floor + 1}
              </div>

              {/* Nodes on this floor */}
              <div className="flex-1 flex items-center justify-center gap-2 flex-wrap">
                {nodesOnFloor.map((node, idx) => {
                  const encounters = node.type === 'M' ? getEncounterForNode(seed, act, floor + 1, ascensionLevel) : null;

                  return (
                    <div
                      key={`${node.x}-${node.y}-${idx}`}
                      className={`relative group px-2 py-1 rounded border ${NODE_COLORS[node.type]} text-xs cursor-pointer`}
                      title={`Floor ${floor + 1} - ${node.type === 'M' ? 'Monster' :
                              node.type === 'E' ? 'Elite' :
                              node.type === '?' ? 'Event' :
                              node.type === '$' ? 'Shop' :
                              node.type === 'R' ? 'Rest' :
                              node.type === 'T' ? 'Treasure' :
                              'Boss'}`}
                    >
                      <span className="text-base">{NODE_ICONS[node.type]}</span>

                      {/* Hover tooltip showing encounter details */}
                      {encounters && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/95 rounded border border-sts-light/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap text-xs">
                          {encounters.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-sts-light/20">
        <div className="grid grid-cols-4 gap-2 text-xs">
          {Object.entries(NODE_ICONS).map(([type, icon]) => (
            <div key={type} className="flex items-center gap-1">
              <span>{icon}</span>
              <span className="text-sts-light/70">
                {type === 'M' ? 'Monster' :
                 type === 'E' ? 'Elite' :
                 type === '?' ? 'Event' :
                 type === '$' ? 'Shop' :
                 type === 'R' ? 'Rest' :
                 type === 'T' ? 'Treasure' :
                 'Boss'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

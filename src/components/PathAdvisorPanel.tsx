import { useMemo } from 'react';
import type { Card, CharacterType, Relic } from '../types';
import { generatePathStrategy } from '../utils/pathAdvisor';

interface PathAdvisorPanelProps {
  deck: Card[];
  relics: Relic[];
  character: CharacterType;
  floor: number;
  currentHP: number;
  maxHP: number;
  gold: number;
  ascensionLevel: number;
}

export function PathAdvisorPanel({
  deck,
  relics,
  character,
  floor,
  currentHP,
  maxHP,
  gold,
  ascensionLevel
}: PathAdvisorPanelProps) {
  const strategy = useMemo(() => {
    return generatePathStrategy(
      deck,
      relics,
      character,
      floor,
      currentHP,
      maxHP,
      gold,
      ascensionLevel
    );
  }, [deck, relics, character, floor, currentHP, maxHP, gold, ascensionLevel]);

  const nodeTypeIcon = (type: string) => {
    switch (type) {
      case 'M': return '⚔️';
      case 'E': return '👹';
      case '?': return '❓';
      case '$': return '🏪';
      case 'R': return '🔥';
      case 'T': return '💎';
      case 'BOSS': return '👑';
      default: return '•';
    }
  };

  const nodeTypeName = (type: string) => {
    switch (type) {
      case 'M': return 'Monster (Hallway)';
      case 'E': return 'Elite';
      case '?': return 'Unknown (Event)';
      case '$': return 'Shop';
      case 'R': return 'Rest Site';
      case 'T': return 'Treasure';
      case 'BOSS': return 'Boss';
      default: return 'Unknown';
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return { bg: 'bg-green-900/50', border: 'border-green-500', text: 'text-green-400', icon: '🎯' };
      case 'high': return { bg: 'bg-blue-900/40', border: 'border-blue-500', text: 'text-blue-400', icon: '💡' };
      case 'neutral': return { bg: 'bg-gray-900/40', border: 'border-gray-500', text: 'text-gray-400', icon: '•' };
      case 'low': return { bg: 'bg-yellow-900/30', border: 'border-yellow-600', text: 'text-yellow-600', icon: '⚠️' };
      case 'avoid': return { bg: 'bg-red-900/40', border: 'border-red-500', text: 'text-red-400', icon: '🚫' };
      default: return { bg: 'bg-gray-900/40', border: 'border-gray-500', text: 'text-gray-400', icon: '•' };
    }
  };

  const riskColor = (risk: string) => {
    switch (risk) {
      case 'safe': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'risky': return 'text-orange-400';
      case 'dangerous': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-sts-dark border-2 border-sts-gold/40 rounded-lg p-4 shadow-sts-lg">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-sts-gold">Path Strategy</h2>
            <p className="text-sm text-sts-light/60">
              Act {strategy.act} • Floor {strategy.currentFloor}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-sts-light">{strategy.floorsUntilBoss}</div>
            <div className="text-xs text-sts-light/60">floors to boss</div>
          </div>
        </div>

        {/* General Strategy */}
        <div className="p-3 bg-sts-darker rounded border border-sts-gold/30">
          <p className="text-sts-light font-semibold">{strategy.generalStrategy}</p>
        </div>
      </div>

      {/* Warnings */}
      {strategy.warnings.length > 0 && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded">
          <h3 className="text-sm font-bold text-red-400 mb-2">⚠️ PATH WARNINGS</h3>
          <ul className="space-y-1">
            {strategy.warnings.map((warning, i) => (
              <li key={i} className="text-sm text-red-300">{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Goals */}
      <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/40 rounded">
        <h3 className="text-sm font-bold text-blue-400 mb-2">🎯 PATH GOALS</h3>
        <ul className="space-y-1">
          {strategy.goals.map((goal, i) => (
            <li key={i} className="text-sm text-blue-300">{goal}</li>
          ))}
        </ul>
      </div>

      {/* Room Type Recommendations */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-sts-light mb-3">Room Type Recommendations</h3>

        {strategy.recommendations.map((rec, i) => {
          const colors = priorityColor(rec.priority);

          return (
            <div
              key={i}
              className={`p-3 rounded border ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 text-3xl">
                  {nodeTypeIcon(rec.nodeType)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-lg font-bold ${colors.text}`}>
                      {nodeTypeName(rec.nodeType)}
                    </h4>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-sts-darker text-sts-light capitalize">
                      {rec.priority}
                    </span>
                  </div>

                  {/* Risk Level */}
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-sts-light/60">Risk: </span>
                    <span className={`text-xs font-semibold capitalize ${riskColor(rec.riskLevel)}`}>
                      {rec.riskLevel}
                    </span>
                  </div>

                  {/* Reason */}
                  <p className="text-sm text-sts-light/80">{rec.reason}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Reference */}
      <div className="mt-4 p-3 bg-sts-darker rounded border border-sts-light/20">
        <h3 className="text-sm font-bold text-sts-light mb-2">🗺️ Quick Reference</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-sts-light/60">⚔️ Monster: </span>
            <span className="text-sts-light">Card rewards</span>
          </div>
          <div>
            <span className="text-sts-light/60">👹 Elite: </span>
            <span className="text-sts-light">Relic + gold</span>
          </div>
          <div>
            <span className="text-sts-light/60">❓ Event: </span>
            <span className="text-sts-light">Upgrades, transforms</span>
          </div>
          <div>
            <span className="text-sts-light/60">🏪 Shop: </span>
            <span className="text-sts-light">Cards, relics, removal</span>
          </div>
          <div>
            <span className="text-sts-light/60">🔥 Rest: </span>
            <span className="text-sts-light">Heal or upgrade</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-green-900/20 border border-green-500/40 rounded">
        <h3 className="text-sm font-bold text-green-400 mb-2">💡 Pathing Tips</h3>
        <ul className="space-y-1 text-sm text-green-300">
          <li>• Plan 3-5 floors ahead based on your current needs</li>
          <li>• Elites are worth it if HP {'>'} 70% and deck score {'>'} 60</li>
          <li>• Events have high value but can be risky at low HP</li>
          <li>• Always have a rest site planned before boss floor</li>
        </ul>
      </div>
    </div>
  );
}

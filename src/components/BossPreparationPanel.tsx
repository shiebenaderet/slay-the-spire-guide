import { useMemo } from 'react';
import type { Card, CharacterType, Relic } from '../types';
import { analyzeBossReadiness } from '../utils/bossPreparation';

interface BossPreparationPanelProps {
  deck: Card[];
  relics: Relic[];
  character: CharacterType;
  floor: number;
  currentHP: number;
  maxHP: number;
}

export function BossPreparationPanel({
  deck,
  relics,
  character,
  floor,
  currentHP,
  maxHP
}: BossPreparationPanelProps) {
  const bossPrep = useMemo(() => {
    return analyzeBossReadiness(deck, relics, character, floor, currentHP, maxHP);
  }, [deck, relics, character, floor, currentHP, maxHP]);

  if (!bossPrep) {
    return (
      <div className="bg-sts-dark border-2 border-sts-gold/40 rounded-lg p-4 shadow-sts-lg">
        <div className="text-center text-sts-light/60">
          <p>No upcoming boss detected</p>
          <p className="text-sm mt-1">You may have completed all acts</p>
        </div>
      </div>
    );
  }

  const readinessColor = (readiness: string) => {
    switch (readiness) {
      case 'ready': return { bg: 'bg-green-900/40', border: 'border-green-500', text: 'text-green-400', icon: '✅' };
      case 'caution': return { bg: 'bg-yellow-900/40', border: 'border-yellow-500', text: 'text-yellow-400', icon: '⚠️' };
      case 'danger': return { bg: 'bg-red-900/40', border: 'border-red-500', text: 'text-red-400', icon: '🚨' };
      default: return { bg: 'bg-gray-900/40', border: 'border-gray-500', text: 'text-gray-400', icon: '❓' };
    }
  };

  const importanceIcon = (importance: string) => {
    switch (importance) {
      case 'critical': return '🚨';
      case 'important': return '⚠️';
      case 'recommended': return '💡';
      default: return '•';
    }
  };

  const colors = readinessColor(bossPrep.readiness);
  const urgency = bossPrep.floorsUntilBoss <= 5 ? 'SOON' : bossPrep.floorsUntilBoss <= 10 ? 'APPROACHING' : 'DISTANT';

  return (
    <div className="bg-sts-dark border-2 border-sts-gold/40 rounded-lg p-4 shadow-sts-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-sts-gold">{bossPrep.bossName}</h2>
          <p className="text-sm text-sts-light/60">Boss Fight Preparation</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-sts-light">{bossPrep.floorsUntilBoss}</div>
          <div className="text-xs text-sts-light/60">{urgency}</div>
        </div>
      </div>

      {/* Readiness Score */}
      <div className={`p-4 rounded-lg border-2 ${colors.bg} ${colors.border} mb-4`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-xl font-bold ${colors.text}`}>
            {colors.icon} {bossPrep.readiness.toUpperCase()}
          </h3>
          <span className={`text-3xl font-bold ${colors.text}`}>
            {bossPrep.overallScore}/100
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-sts-darker rounded-full h-3 overflow-hidden mb-2">
          <div
            className={`h-full transition-all duration-300 ${
              bossPrep.readiness === 'ready' ? 'bg-green-500' :
              bossPrep.readiness === 'caution' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${bossPrep.overallScore}%` }}
          />
        </div>

        <p className="text-sm text-sts-light/80">{bossPrep.strategy}</p>
      </div>

      {/* Warnings */}
      {bossPrep.warnings.length > 0 && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded">
          <h3 className="text-sm font-bold text-red-400 mb-2">⚠️ WARNINGS</h3>
          <ul className="space-y-1">
            {bossPrep.warnings.map((warning, i) => (
              <li key={i} className="text-sm text-red-300">{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Top Priorities */}
      {bossPrep.topPriorities.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/40 rounded">
          <h3 className="text-sm font-bold text-yellow-400 mb-2">🎯 TOP PRIORITIES</h3>
          <ul className="space-y-1">
            {bossPrep.topPriorities.map((priority, i) => (
              <li key={i} className="text-sm text-yellow-300">{priority}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Requirements Checklist */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-sts-light mb-2">Requirements Checklist</h3>

        {bossPrep.requirements.map((req, i) => (
          <div
            key={i}
            className={`p-2 rounded border ${
              req.met
                ? 'bg-green-900/20 border-green-500/40'
                : req.importance === 'critical'
                ? 'bg-red-900/30 border-red-500/50'
                : req.importance === 'important'
                ? 'bg-yellow-900/20 border-yellow-500/40'
                : 'bg-gray-900/20 border-gray-500/30'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">
                {req.met ? '✅' : importanceIcon(req.importance)}
              </span>
              <div className="flex-1">
                <div className={`font-semibold ${
                  req.met
                    ? 'text-green-400'
                    : req.importance === 'critical'
                    ? 'text-red-400'
                    : req.importance === 'important'
                    ? 'text-yellow-400'
                    : 'text-gray-400'
                }`}>
                  {req.name}
                </div>
                <div className="text-sm text-sts-light/70 mt-1">
                  {req.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

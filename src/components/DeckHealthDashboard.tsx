import { useMemo } from 'react';
import type { Card, CharacterType, Relic } from '../types';
import { analyzeDeckHealth } from '../utils/deckHealth';

interface DeckHealthDashboardProps {
  deck: Card[];
  relics: Relic[];
  character: CharacterType;
  floor: number;
  ascensionLevel: number;
}

export function DeckHealthDashboard({
  deck,
  relics,
  character,
  floor,
  ascensionLevel
}: DeckHealthDashboardProps) {
  const health = useMemo(() => {
    return analyzeDeckHealth(deck, relics, character, floor, ascensionLevel);
  }, [deck, relics, character, floor, ascensionLevel]);

  const gradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'text-yellow-400';
      case 'A': return 'text-green-400';
      case 'B': return 'text-blue-400';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-500';
      case 'F': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-900/40 border-green-500';
      case 'good': return 'bg-blue-900/40 border-blue-500';
      case 'adequate': return 'bg-yellow-900/40 border-yellow-500';
      case 'weak': return 'bg-orange-900/40 border-orange-500';
      case 'critical': return 'bg-red-900/40 border-red-500';
      default: return 'bg-gray-900/40 border-gray-500';
    }
  };

  const scoreBarColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 55) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-sts-dark border-2 border-sts-gold/40 rounded-lg p-4 shadow-sts-lg">
      {/* Overall Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-sts-gold">Deck Health</h2>
          <div className="flex items-center gap-3">
            <span className={`text-4xl font-bold ${gradeColor(health.overallGrade)}`}>
              {health.overallGrade}
            </span>
            <div className="text-right">
              <div className="text-xl font-bold text-sts-light">{health.overallScore}/100</div>
              <div className="text-xs text-sts-light/60 capitalize">{health.overallStatus}</div>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full bg-sts-darker rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${scoreBarColor(health.overallScore)} transition-all duration-300`}
            style={{ width: `${health.overallScore}%` }}
          />
        </div>

        {/* Win Rate Estimate */}
        <div className="mt-2 text-center text-sm text-sts-light/70">
          Projected Win Rate: <span className="font-bold text-sts-light">{health.projectedWinRate}%</span>
        </div>
      </div>

      {/* Critical Issues */}
      {health.criticalIssues.length > 0 && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded">
          <h3 className="text-sm font-bold text-red-400 mb-2">🚨 CRITICAL ISSUES</h3>
          <ul className="space-y-1">
            {health.criticalIssues.map((issue, i) => (
              <li key={i} className="text-sm text-red-300">{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {Object.entries(health.categories).map(([key, category]) => (
          <div
            key={key}
            className={`p-3 rounded border ${statusColor(category.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sts-light">{category.name}</h3>
              <span className={`text-2xl font-bold ${gradeColor(category.grade)}`}>
                {category.grade}
              </span>
            </div>

            {/* Score bar */}
            <div className="w-full bg-sts-darker rounded-full h-2 mb-2 overflow-hidden">
              <div
                className={`h-full ${scoreBarColor(category.score)} transition-all duration-300`}
                style={{ width: `${category.score}%` }}
              />
            </div>

            <div className="text-xs text-sts-light/80">{category.score}/100</div>

            {/* Issues */}
            {category.issues.length > 0 && (
              <div className="mt-2 space-y-1">
                {category.issues.slice(0, 2).map((issue, i) => (
                  <div key={i} className="text-xs text-sts-light/70">
                    ⚠️ {issue}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Top Recommendations */}
      {health.topRecommendations.length > 0 && (
        <div className="p-3 bg-blue-900/20 border border-blue-500/40 rounded">
          <h3 className="text-sm font-bold text-blue-400 mb-2">💡 Top Priorities</h3>
          <ul className="space-y-1">
            {health.topRecommendations.map((rec, i) => (
              <li key={i} className="text-sm text-blue-300">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

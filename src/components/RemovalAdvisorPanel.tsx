import { useMemo } from 'react';
import type { Card, CharacterType, Relic } from '../types';
import { generateRemovalPriority, shouldRemoveAtShop } from '../utils/removalAdvisor';

interface RemovalAdvisorPanelProps {
  deck: Card[];
  relics: Relic[];
  character: CharacterType;
  floor: number;
  gold: number;
}

export function RemovalAdvisorPanel({
  deck,
  relics,
  character,
  floor,
  gold
}: RemovalAdvisorPanelProps) {
  const removalAdvice = useMemo(() => {
    return generateRemovalPriority(deck, relics, character, floor, gold);
  }, [deck, relics, character, floor, gold]);

  const shopAdvice = useMemo(() => {
    return shouldRemoveAtShop(deck, gold, floor);
  }, [deck, gold, floor]);

  const urgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return { bg: 'bg-red-900/40', border: 'border-red-500', text: 'text-red-400', icon: '🚨' };
      case 'high': return { bg: 'bg-orange-900/40', border: 'border-orange-500', text: 'text-orange-400', icon: '⚠️' };
      case 'medium': return { bg: 'bg-yellow-900/30', border: 'border-yellow-500', text: 'text-yellow-400', icon: '💡' };
      case 'low': return { bg: 'bg-gray-900/30', border: 'border-gray-500', text: 'text-gray-400', icon: '•' };
      default: return { bg: 'bg-gray-900/30', border: 'border-gray-500', text: 'text-gray-400', icon: '•' };
    }
  };

  // Top 10 removal priorities
  const topRemovals = removalAdvice.slice(0, 10);

  return (
    <div className="bg-sts-dark border-2 border-sts-gold/40 rounded-lg p-4 shadow-sts-lg">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-sts-gold mb-1">Card Removal Priority</h2>
        <p className="text-sm text-sts-light/60">Remove in this order for optimal deck thinning</p>
      </div>

      {/* Shop Removal Advice */}
      <div className={`p-3 mb-4 rounded border ${
        shopAdvice.recommend
          ? 'bg-green-900/30 border-green-500/50'
          : 'bg-gray-900/30 border-gray-500/40'
      }`}>
        <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
          <span>{shopAdvice.recommend ? '✅' : 'ℹ️'}</span>
          <span className={shopAdvice.recommend ? 'text-green-400' : 'text-gray-400'}>
            Shop Removal ({gold} gold available)
          </span>
        </h3>
        <p className="text-sm text-sts-light/80 mb-1">{shopAdvice.reason}</p>
        {shopAdvice.alternativeUse && (
          <p className="text-xs text-sts-light/60 italic">💡 {shopAdvice.alternativeUse}</p>
        )}
      </div>

      {/* Removal Priority List */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-sts-light mb-2">
          Removal Order (Top {topRemovals.length})
        </h3>

        {topRemovals.map((advice, i) => {
          const colors = urgencyColor(advice.urgency);

          return (
            <div
              key={i}
              className={`p-3 rounded border ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-start gap-3">
                {/* Rank Number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sts-darker flex items-center justify-center font-bold text-sts-light">
                  {i + 1}
                </div>

                {/* Card Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-lg font-bold ${colors.text}`}>
                      {advice.card.name}{advice.card.upgraded ? '+' : ''}
                    </span>
                    <span className="text-xs text-sts-light/60 capitalize">
                      {advice.card.type}
                    </span>
                  </div>

                  {/* Priority Score */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-sts-light/80">
                      Priority: {advice.priority}/10
                    </span>
                    <span className={`text-xs font-semibold ${colors.text}`}>
                      {colors.icon} {advice.urgency.toUpperCase()}
                    </span>
                  </div>

                  {/* Reason */}
                  <p className="text-sm text-sts-light/80">{advice.reason}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 p-3 bg-sts-darker rounded border border-sts-light/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-xs text-sts-light/60">Critical</div>
            <div className="text-xl font-bold text-red-400">
              {removalAdvice.filter(a => a.urgency === 'critical').length}
            </div>
          </div>
          <div>
            <div className="text-xs text-sts-light/60">High</div>
            <div className="text-xl font-bold text-orange-400">
              {removalAdvice.filter(a => a.urgency === 'high').length}
            </div>
          </div>
          <div>
            <div className="text-xs text-sts-light/60">Medium</div>
            <div className="text-xl font-bold text-yellow-400">
              {removalAdvice.filter(a => a.urgency === 'medium').length}
            </div>
          </div>
          <div>
            <div className="text-xs text-sts-light/60">Total Deck</div>
            <div className="text-xl font-bold text-sts-light">
              {deck.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/40 rounded">
        <h3 className="text-sm font-bold text-blue-400 mb-2">💡 Removal Tips</h3>
        <ul className="space-y-1 text-sm text-blue-300">
          <li>• Shop removal costs 75 gold - worth it for critical cards</li>
          <li>• Events like Bonfire Spirits offer free removal</li>
          <li>• Peace Pipe relic lets you remove curses at rest sites</li>
          <li>• Don't over-remove - keep deck size reasonable (15-25 cards)</li>
        </ul>
      </div>
    </div>
  );
}

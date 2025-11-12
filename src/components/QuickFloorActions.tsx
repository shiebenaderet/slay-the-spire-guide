import { useState } from 'react';
import type { CharacterType } from '../types';

interface QuickFloorActionsProps {
  character: CharacterType;
  currentFloor: number;
  ascensionLevel: number;
  onAction: (action: FloorAction) => void;
}

export type FloorAction =
  | { type: 'hallway-fight'; cardReward: boolean }
  | { type: 'elite-fight'; cardReward: boolean }
  | { type: 'boss-fight' }
  | { type: 'event' }
  | { type: 'shop' }
  | { type: 'campfire'; action: 'rest' | 'upgrade' | 'smith' | 'lift' | 'toke' | 'recall' | 'dig' }
  | { type: 'treasure' };

/**
 * QuickFloorActions - Condensed UI for entering floor actions quickly
 * Replaces the large button grid with a streamlined input system
 */
export function QuickFloorActions({
  character,
  currentFloor,
  ascensionLevel,
  onAction,
}: QuickFloorActionsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleQuickAction = (action: FloorAction) => {
    onAction(action);
    setExpanded(null);
  };

  return (
    <div className="bg-sts-dark rounded-lg p-3 border border-sts-light/20">
      <h3 className="text-base font-bold text-sts-light mb-2.5">Floor {currentFloor} Actions</h3>

      <div className="grid grid-cols-4 gap-2">
        {/* Combat Actions */}
        <div className="relative">
          <button
            onClick={() => setExpanded(expanded === 'combat' ? null : 'combat')}
            className="w-full p-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/50 rounded text-sm font-semibold text-sts-light transition-colors"
          >
            ⚔️ Combat
          </button>
          {expanded === 'combat' && (
            <div className="absolute top-full left-0 mt-1 bg-sts-darker border border-red-500/50 rounded p-2 z-10 w-48">
              <button
                onClick={() => handleQuickAction({ type: 'hallway-fight', cardReward: true })}
                className="w-full text-left px-2 py-1 hover:bg-red-900/30 rounded text-sm text-sts-light"
              >
                🎴 Hallway Fight
              </button>
              <button
                onClick={() => handleQuickAction({ type: 'hallway-fight', cardReward: false })}
                className="w-full text-left px-2 py-1 hover:bg-red-900/30 rounded text-sm text-sts-light/70"
              >
                Skip Card Reward
              </button>
              <div className="border-t border-sts-light/20 my-1"></div>
              <button
                onClick={() => handleQuickAction({ type: 'elite-fight', cardReward: true })}
                className="w-full text-left px-2 py-1 hover:bg-red-900/30 rounded text-sm text-red-400"
              >
                💀 Elite Fight
              </button>
              <button
                onClick={() => handleQuickAction({ type: 'boss-fight' })}
                className="w-full text-left px-2 py-1 hover:bg-yellow-900/30 rounded text-sm text-yellow-400"
              >
                👑 Boss Fight
              </button>
            </div>
          )}
        </div>

        {/* Campfire */}
        <div className="relative">
          <button
            onClick={() => setExpanded(expanded === 'campfire' ? null : 'campfire')}
            className="w-full p-2 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/50 rounded text-sm font-semibold text-sts-light transition-colors"
          >
            🔥 Rest
          </button>
          {expanded === 'campfire' && (
            <div className="absolute top-full left-0 mt-1 bg-sts-darker border border-blue-500/50 rounded p-2 z-10 w-48">
              <button
                onClick={() => handleQuickAction({ type: 'campfire', action: 'rest' })}
                className="w-full text-left px-2 py-1 hover:bg-blue-900/30 rounded text-sm text-sts-light"
              >
                ❤️ Rest (Heal)
              </button>
              <button
                onClick={() => handleQuickAction({ type: 'campfire', action: 'upgrade' })}
                className="w-full text-left px-2 py-1 hover:bg-blue-900/30 rounded text-sm text-sts-light"
              >
                ⬆️ Smith (Upgrade)
              </button>
              {ascensionLevel >= 15 && (
                <button
                  onClick={() => handleQuickAction({ type: 'campfire', action: 'smith' })}
                  className="w-full text-left px-2 py-1 hover:bg-green-900/30 rounded text-sm text-green-400"
                >
                  🟢 Take Emerald Key
                </button>
              )}
              <div className="border-t border-sts-light/20 my-1 text-xs text-sts-light/50 px-2">Relics</div>
              <button
                onClick={() => handleQuickAction({ type: 'campfire', action: 'lift' })}
                className="w-full text-left px-2 py-1 hover:bg-blue-900/30 rounded text-xs text-sts-light/70"
              >
                🏋️ Girya (Lift)
              </button>
              <button
                onClick={() => handleQuickAction({ type: 'campfire', action: 'toke' })}
                className="w-full text-left px-2 py-1 hover:bg-blue-900/30 rounded text-xs text-sts-light/70"
              >
                🌿 Peace Pipe (Toke)
              </button>
              <button
                onClick={() => handleQuickAction({ type: 'campfire', action: 'recall' })}
                className="w-full text-left px-2 py-1 hover:bg-blue-900/30 rounded text-xs text-sts-light/70"
              >
                🔔 Shovel (Dig)
              </button>
            </div>
          )}
        </div>

        {/* Event/Shop */}
        <button
          onClick={() => handleQuickAction({ type: 'event' })}
          className="p-2 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/50 rounded text-sm font-semibold text-sts-light transition-colors"
        >
          ❓ Event
        </button>

        <button
          onClick={() => handleQuickAction({ type: 'shop' })}
          className="p-2 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-500/50 rounded text-sm font-semibold text-sts-light transition-colors"
        >
          🏪 Shop
        </button>

        <button
          onClick={() => handleQuickAction({ type: 'treasure' })}
          className="p-2 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-500/50 rounded text-sm font-semibold text-sts-light transition-colors"
        >
          💎 Treasure
        </button>
      </div>

      <div className="mt-2.5 text-xs text-sts-light/60 text-center font-medium">
        Click an action to record what happened this floor
      </div>
    </div>
  );
}

import type { Card, Relic, CharacterType } from '../types';

interface AscensionKeyAdvisorProps {
  character: CharacterType;
  deck: Card[];
  relics: Relic[];
  currentHp: number;
  maxHp: number;
  currentAct: number;
  keysObtained: {
    emerald: boolean;  // From campfire
    ruby: boolean;     // From chest
    sapphire: boolean; // From elite
  };
  onClose: () => void;
}

interface KeyAdvice {
  shouldTake: boolean;
  priority: 'high' | 'medium' | 'low' | 'avoid';
  reason: string;
}

/**
 * Evaluates whether to take the Emerald Key (offered at campfires)
 * Cost: Skips rest/upgrade option at campfire
 */
function evaluateEmeraldKey(
  currentHp: number,
  maxHp: number,
  deck: Card[],
  currentAct: number,
  hasRubyKey: boolean,
  hasSapphireKey: boolean
): KeyAdvice {
  const hpPercent = currentHp / Math.max(maxHp, 1);
  const unupgradedCards = deck.filter(c => !c.upgraded).length;

  // Already have both other keys
  if (hasRubyKey && hasSapphireKey) {
    return {
      shouldTake: true,
      priority: 'high',
      reason: 'You have Ruby + Sapphire keys. Take Emerald to unlock Act 4!',
    };
  }

  // Act 1 - Too early
  if (currentAct === 1) {
    return {
      shouldTake: false,
      priority: 'low',
      reason: 'Act 1: Too early. You need upgrades/rest more than keys.',
    };
  }

  // Low HP
  if (hpPercent < 0.4) {
    return {
      shouldTake: false,
      priority: 'avoid',
      reason: `Low HP (${Math.round(hpPercent * 100)}%). Rest is critical. Skip Emerald Key.`,
    };
  }

  // Act 3 - Late game
  if (currentAct === 3) {
    if (hpPercent > 0.7 && unupgradedCards < 5) {
      return {
        shouldTake: true,
        priority: 'high',
        reason: `Act 3, high HP (${Math.round(hpPercent * 100)}%), few unupgraded cards. Safe to take Emerald.`,
      };
    }
    if (hpPercent > 0.5) {
      return {
        shouldTake: true,
        priority: 'medium',
        reason: `Act 3, decent HP (${Math.round(hpPercent * 100)}%). Consider taking Emerald Key.`,
      };
    }
  }

  // Act 2 - Mid game
  if (currentAct === 2) {
    if (hpPercent > 0.7 && unupgradedCards < 8) {
      return {
        shouldTake: true,
        priority: 'medium',
        reason: `Act 2, high HP (${Math.round(hpPercent * 100)}%). Can afford to skip rest/upgrade.`,
      };
    }
    return {
      shouldTake: false,
      priority: 'low',
      reason: `Act 2, but ${unupgradedCards} unupgraded cards. Upgrades > key.`,
    };
  }

  return {
    shouldTake: false,
    priority: 'low',
    reason: 'Not critical yet. Prioritize deck strength.',
  };
}

/**
 * Evaluates whether to take the Ruby Key (offered at chests)
 * Cost: Skip chest reward (gold + relic/cards)
 */
function evaluateRubyKey(
  currentHp: number,
  maxHp: number,
  relics: Relic[],
  currentAct: number,
  hasEmeraldKey: boolean,
  hasSapphireKey: boolean
): KeyAdvice {
  const hpPercent = currentHp / Math.max(maxHp, 1);
  const relicCount = relics.length;

  // Already have both other keys
  if (hasEmeraldKey && hasSapphireKey) {
    return {
      shouldTake: true,
      priority: 'high',
      reason: 'You have Emerald + Sapphire keys. Take Ruby to unlock Act 4!',
    };
  }

  // Act 1 - Too early, need relics
  if (currentAct === 1 && relicCount < 5) {
    return {
      shouldTake: false,
      priority: 'avoid',
      reason: 'Act 1 + few relics. Chest rewards are critical. Skip Ruby Key.',
    };
  }

  // Act 3 - Late game
  if (currentAct === 3) {
    if (relicCount >= 10) {
      return {
        shouldTake: true,
        priority: 'high',
        reason: `Act 3, ${relicCount} relics. You're strong enough to skip chest. Take Ruby.`,
      };
    }
    return {
      shouldTake: true,
      priority: 'medium',
      reason: `Act 3. Ruby Key is worth it to access Act 4.`,
    };
  }

  // Act 2
  if (currentAct === 2) {
    if (relicCount >= 8 && hpPercent > 0.6) {
      return {
        shouldTake: true,
        priority: 'medium',
        reason: `${relicCount} relics, decent HP. Can skip chest for Ruby Key.`,
      };
    }
    return {
      shouldTake: false,
      priority: 'low',
      reason: `Act 2, only ${relicCount} relics. Chest rewards still valuable.`,
    };
  }

  return {
    shouldTake: false,
    priority: 'low',
    reason: 'Too early. Build strength first.',
  };
}

/**
 * Evaluates whether to take the Sapphire Key (offered after elite fights)
 * Cost: Skip elite relic drop (25% chance)
 */
function evaluateSapphireKey(
  currentHp: number,
  maxHp: number,
  currentAct: number,
  hasEmeraldKey: boolean,
  hasRubyKey: boolean
): KeyAdvice {
  const hpPercent = currentHp / Math.max(maxHp, 1);

  // Already have both other keys
  if (hasEmeraldKey && hasRubyKey) {
    return {
      shouldTake: true,
      priority: 'high',
      reason: 'You have Emerald + Ruby keys. Take Sapphire to unlock Act 4!',
    };
  }

  // Low HP after elite
  if (hpPercent < 0.3) {
    return {
      shouldTake: false,
      priority: 'avoid',
      reason: `Very low HP (${Math.round(hpPercent * 100)}%) after elite. You might not survive to use the key. Skip.`,
    };
  }

  // Act 1 - Generally safe
  if (currentAct === 1) {
    return {
      shouldTake: true,
      priority: 'medium',
      reason: 'Act 1: Sapphire Key costs least (only 25% relic chance). Safe to take early.',
    };
  }

  // Act 3 - Take it
  if (currentAct === 3) {
    return {
      shouldTake: true,
      priority: 'high',
      reason: 'Act 3: Take Sapphire Key. Last chance before boss.',
    };
  }

  // Act 2
  if (currentAct === 2) {
    if (hpPercent > 0.5) {
      return {
        shouldTake: true,
        priority: 'high',
        reason: `Act 2, decent HP (${Math.round(hpPercent * 100)}%). Sapphire Key is low-cost. Take it.`,
      };
    }
    return {
      shouldTake: true,
      priority: 'medium',
      reason: 'Act 2: Sapphire Key is cheap (only 25% relic chance). Consider taking.',
    };
  }

  return {
    shouldTake: true,
    priority: 'medium',
    reason: 'Sapphire Key has lowest opportunity cost. Generally worth taking.',
  };
}

/**
 * Ascension Key Advisor - Helps decide when to take keys for Act 4 access (A15+)
 * The three keys are required to unlock the Act 4 true ending (Heart boss)
 */
export function AscensionKeyAdvisor({
  character,
  deck,
  relics,
  currentHp,
  maxHp,
  currentAct,
  keysObtained,
  onClose,
}: AscensionKeyAdvisorProps) {
  const emeraldAdvice = evaluateEmeraldKey(
    currentHp,
    maxHp,
    deck,
    currentAct,
    keysObtained.ruby,
    keysObtained.sapphire
  );

  const rubyAdvice = evaluateRubyKey(
    currentHp,
    maxHp,
    relics,
    currentAct,
    keysObtained.emerald,
    keysObtained.sapphire
  );

  const sapphireAdvice = evaluateSapphireKey(
    currentHp,
    maxHp,
    currentAct,
    keysObtained.emerald,
    keysObtained.ruby
  );

  const keysCount = [keysObtained.emerald, keysObtained.ruby, keysObtained.sapphire].filter(Boolean).length;

  return (
    <div className="bg-sts-dark rounded-lg p-6 w-full border-2 border-blue-500/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
            <span>🔑</span>
            <span>Ascension Key Strategy (A15+)</span>
          </h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4 mb-6">
          <h3 className="text-lg font-bold text-blue-300 mb-2">What are the Keys?</h3>
          <p className="text-sm text-sts-light/80 mb-3 leading-relaxed">
            On Ascension 15 and higher, you can collect 3 keys to unlock Act 4 and fight the Heart (true final boss).
            Each key has a cost - you must decide if you're strong enough to sacrifice immediate rewards.
          </p>
          <div className="text-sm text-sts-light/90">
            <span className="font-semibold">Keys Obtained: {keysCount}/3</span>
            <div className="flex gap-4 mt-2">
              <span className={keysObtained.emerald ? 'text-green-400' : 'text-gray-500'}>
                {keysObtained.emerald ? '✓' : '○'} Emerald
              </span>
              <span className={keysObtained.ruby ? 'text-red-400' : 'text-gray-500'}>
                {keysObtained.ruby ? '✓' : '○'} Ruby
              </span>
              <span className={keysObtained.sapphire ? 'text-blue-400' : 'text-gray-500'}>
                {keysObtained.sapphire ? '✓' : '○'} Sapphire
              </span>
            </div>
          </div>
        </div>

        {/* Current Stats */}
        <div className="bg-sts-darker/50 rounded p-3 mb-6 flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-red-400">❤️</span>
            <span className="text-sts-light">{currentHp} / {maxHp} HP ({Math.round((currentHp/maxHp)*100)}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">🃏</span>
            <span className="text-sts-light">{deck.length} Cards ({deck.filter(c => c.upgraded).length} upgraded)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400">💎</span>
            <span className="text-sts-light">{relics.length} Relics</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">📍</span>
            <span className="text-sts-light">Act {currentAct}</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Emerald Key */}
          <div className={`bg-sts-darker p-4 rounded-lg border-2 ${
            keysObtained.emerald
              ? 'border-green-500/50'
              : emeraldAdvice.priority === 'high'
              ? 'border-green-500/50'
              : emeraldAdvice.priority === 'medium'
              ? 'border-yellow-500/50'
              : emeraldAdvice.priority === 'low'
              ? 'border-blue-500/30'
              : 'border-red-500/50'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-400 flex items-center gap-2 mb-1">
                  <span>🟢</span>
                  <span>Emerald Key</span>
                  {keysObtained.emerald && <span className="text-xs px-2 py-0.5 rounded bg-green-900/30 text-green-400">OBTAINED</span>}
                </h3>
                <p className="text-xs text-sts-light/70 mb-2">
                  <span className="font-semibold">Where:</span> Offered at campfires<br />
                  <span className="font-semibold">Cost:</span> Skip rest or upgrade option
                </p>
              </div>
              {!keysObtained.emerald && (
                <div className={`text-xs px-3 py-1 rounded font-bold ${
                  emeraldAdvice.priority === 'high' ? 'bg-green-900/30 text-green-400' :
                  emeraldAdvice.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                  emeraldAdvice.priority === 'low' ? 'bg-blue-900/30 text-blue-400' :
                  'bg-red-900/30 text-red-400'
                }`}>
                  {emeraldAdvice.priority.toUpperCase()} PRIORITY
                </div>
              )}
            </div>
            {!keysObtained.emerald && (
              <div className={`text-sm p-3 rounded ${
                emeraldAdvice.shouldTake
                  ? 'bg-green-900/20 text-green-300'
                  : 'bg-red-900/20 text-red-300'
              }`}>
                <span className="font-semibold">
                  {emeraldAdvice.shouldTake ? '✓ TAKE' : '✗ SKIP'}:
                </span> {emeraldAdvice.reason}
              </div>
            )}
          </div>

          {/* Ruby Key */}
          <div className={`bg-sts-darker p-4 rounded-lg border-2 ${
            keysObtained.ruby
              ? 'border-red-500/50'
              : rubyAdvice.priority === 'high'
              ? 'border-green-500/50'
              : rubyAdvice.priority === 'medium'
              ? 'border-yellow-500/50'
              : rubyAdvice.priority === 'low'
              ? 'border-blue-500/30'
              : 'border-red-500/50'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-1">
                  <span>🔴</span>
                  <span>Ruby Key</span>
                  {keysObtained.ruby && <span className="text-xs px-2 py-0.5 rounded bg-red-900/30 text-red-400">OBTAINED</span>}
                </h3>
                <p className="text-xs text-sts-light/70 mb-2">
                  <span className="font-semibold">Where:</span> Offered in treasure chests<br />
                  <span className="font-semibold">Cost:</span> Skip chest reward (gold + relic/cards)
                </p>
              </div>
              {!keysObtained.ruby && (
                <div className={`text-xs px-3 py-1 rounded font-bold ${
                  rubyAdvice.priority === 'high' ? 'bg-green-900/30 text-green-400' :
                  rubyAdvice.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                  rubyAdvice.priority === 'low' ? 'bg-blue-900/30 text-blue-400' :
                  'bg-red-900/30 text-red-400'
                }`}>
                  {rubyAdvice.priority.toUpperCase()} PRIORITY
                </div>
              )}
            </div>
            {!keysObtained.ruby && (
              <div className={`text-sm p-3 rounded ${
                rubyAdvice.shouldTake
                  ? 'bg-green-900/20 text-green-300'
                  : 'bg-red-900/20 text-red-300'
              }`}>
                <span className="font-semibold">
                  {rubyAdvice.shouldTake ? '✓ TAKE' : '✗ SKIP'}:
                </span> {rubyAdvice.reason}
              </div>
            )}
          </div>

          {/* Sapphire Key */}
          <div className={`bg-sts-darker p-4 rounded-lg border-2 ${
            keysObtained.sapphire
              ? 'border-blue-500/50'
              : sapphireAdvice.priority === 'high'
              ? 'border-green-500/50'
              : sapphireAdvice.priority === 'medium'
              ? 'border-yellow-500/50'
              : sapphireAdvice.priority === 'low'
              ? 'border-blue-500/30'
              : 'border-red-500/50'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2 mb-1">
                  <span>🔵</span>
                  <span>Sapphire Key</span>
                  {keysObtained.sapphire && <span className="text-xs px-2 py-0.5 rounded bg-blue-900/30 text-blue-400">OBTAINED</span>}
                </h3>
                <p className="text-xs text-sts-light/70 mb-2">
                  <span className="font-semibold">Where:</span> Offered after elite fights<br />
                  <span className="font-semibold">Cost:</span> Skip potential relic drop (25% chance)
                </p>
              </div>
              {!keysObtained.sapphire && (
                <div className={`text-xs px-3 py-1 rounded font-bold ${
                  sapphireAdvice.priority === 'high' ? 'bg-green-900/30 text-green-400' :
                  sapphireAdvice.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                  sapphireAdvice.priority === 'low' ? 'bg-blue-900/30 text-blue-400' :
                  'bg-red-900/30 text-red-400'
                }`}>
                  {sapphireAdvice.priority.toUpperCase()} PRIORITY
                </div>
              )}
            </div>
            {!keysObtained.sapphire && (
              <div className={`text-sm p-3 rounded ${
                sapphireAdvice.shouldTake
                  ? 'bg-green-900/20 text-green-300'
                  : 'bg-red-900/20 text-red-300'
              }`}>
                <span className="font-semibold">
                  {sapphireAdvice.shouldTake ? '✓ TAKE' : '✗ SKIP'}:
                </span> {sapphireAdvice.reason}
              </div>
            )}
          </div>
        </div>

        {keysCount === 3 && (
          <div className="mt-6 bg-yellow-900/20 border border-yellow-500/50 rounded p-4">
            <p className="text-yellow-400 font-semibold text-center">
              🎉 All 3 keys obtained! Act 4 unlocked after Act 3 boss. Prepare for the Heart!
            </p>
          </div>
        )}
      </div>
  );
}

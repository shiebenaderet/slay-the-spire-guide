import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useCoachingStore } from '../store/coachingStore';
import type { Blessing, Card } from '../types';
import blessingsData from '../data/blessings.json';
import cardsData from '../data/cards.json';
import { BlessingWorkflow, type BlessingWorkflowResult } from '../components/BlessingWorkflow';
import { getBlessingActionType } from '../utils/blessingHelpers';

export function StartingChoice() {
  const navigate = useNavigate();
  const { character, stats, setStartingRelic: setGameStoreRelic, setStartingBlessing, setBlessingWorkflowResult, startRun: startGameStoreRun } = useGameStore();
  const { startRun: startCoachingRun } = useCoachingStore();
  const [selectedBlessing, setSelectedBlessing] = useState<Blessing | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<BlessingWorkflowResult | null>(null);

  // Generate starter deck for the blessing workflow
  // This is needed because the deck isn't initialized until startRun() is called
  const getStarterDeck = (): Card[] => {
    if (!character) return [];

    // Get character's starter deck from cards.json
    const starterCards = cardsData.filter(
      (c: any) => c.character === character && c.rarity === 'starter'
    ) as Card[];

    return starterCards;
  };

  const starterDeck = getStarterDeck();

  // Filter blessings by character and ascension restrictions
  const characterBlessings = (blessingsData.filter(
    (blessing) => blessing.character === character
  ) as Blessing[]).filter((blessing) => {
    // Ascension 14+: Can't get 3 potions (only 2 slots available base, would need Potion Belt)
    // This blessing is generally not offered on A14+ in the actual game
    if (stats.ascensionLevel >= 14 && blessing.description.includes('3 random potions')) {
      return false;
    }

    return true;
  });

  useEffect(() => {
    if (!character) {
      navigate('/');
    }
  }, [character, navigate]);

  const handleBlessingSelect = (blessing: Blessing) => {
    setSelectedBlessing(blessing);
    const actionType = getBlessingActionType(blessing);

    // If blessing requires interaction, show workflow
    if (actionType !== 'none') {
      setShowWorkflow(true);
    } else {
      // Simple blessing, just show confirmation
      setIsConfirming(true);
    }
  };

  const handleWorkflowComplete = (result: BlessingWorkflowResult) => {
    setWorkflowResult(result);
    setShowWorkflow(false);
    setIsConfirming(true);
  };

  const handleWorkflowCancel = () => {
    setShowWorkflow(false);
    setSelectedBlessing(null);
    setWorkflowResult(null);
  };

  const handleConfirm = () => {
    setStartingBlessing(selectedBlessing);

    // Pass workflow results to the game store (will be applied during startRun)
    if (workflowResult) {
      setBlessingWorkflowResult(workflowResult);
    }

    // Start both stores (for now, for compatibility)
    startGameStoreRun();

    // Start coaching store with proper values
    const startingRelic = (useGameStore.getState() as any).startingRelic?.name || 'Burning Blood';
    startCoachingRun(character || 'Ironclad', stats.ascensionLevel, startingRelic);

    navigate('/run-tracker');
  };

  const handleSkip = () => {
    setStartingBlessing(null);

    // Start both stores
    startGameStoreRun();

    const startingRelic = (useGameStore.getState() as any).startingRelic?.name || 'Burning Blood';
    startCoachingRun(character || 'Ironclad', stats.ascensionLevel, startingRelic);

    navigate('/run-tracker');
  };

  if (!character) {
    return null;
  }

  const getCharacterName = () => {
    const names = {
      ironclad: 'Ironclad',
      silent: 'Silent',
      defect: 'Defect',
      watcher: 'Watcher',
    };
    return names[character];
  };

  const getCharacterColor = () => {
    const colors = {
      ironclad: 'from-red-900/40 to-red-950/60',
      silent: 'from-green-900/40 to-green-950/60',
      defect: 'from-blue-900/40 to-blue-950/60',
      watcher: 'from-purple-900/40 to-purple-950/60',
    };
    return colors[character];
  };

  const getCharacterAccent = () => {
    const colors = {
      ironclad: 'border-ironclad bg-ironclad/10 hover:bg-ironclad/20',
      silent: 'border-silent bg-silent/10 hover:bg-silent/20',
      defect: 'border-defect bg-defect/10 hover:bg-defect/20',
      watcher: 'border-watcher bg-watcher/10 hover:bg-watcher/20',
    };
    return colors[character];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sts-darkest via-sts-darker to-sts-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Blessing Workflow Modal */}
      {showWorkflow && selectedBlessing && character && (
        <BlessingWorkflow
          blessing={selectedBlessing}
          character={character}
          currentDeck={starterDeck}
          onComplete={handleWorkflowComplete}
          onCancel={handleWorkflowCancel}
        />
      )}

      {/* Background effect */}
      <div className={`absolute inset-0 bg-gradient-to-b ${getCharacterColor()} opacity-30`}></div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl w-full">
        {/* Header - Neow style */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <div className="mb-4 flex justify-center">
              <img
                src="/images/npcs/neow.png"
                alt="Neow"
                className="h-40 w-auto object-contain opacity-90"
                onError={(e) => {
                  // Fallback to whale emoji if image doesn't load
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'text-6xl';
                  fallback.textContent = '🐋';
                  target.parentElement?.appendChild(fallback);
                }}
              />
            </div>
            <h1 className="text-5xl font-bold text-sts-gold mb-2" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.9)' }}>
              Neow's Lament
            </h1>
            <p className="text-xl text-sts-light/80 italic">
              "Choose your blessing, {getCharacterName()}..."
            </p>
          </div>

          {/* Run Info */}
          <div className="inline-block bg-sts-dark/90 border-2 border-sts-gold/40 rounded-lg px-6 py-3 shadow-sts-xl">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-sts-light/60">Character:</span>
                <span className="text-sts-gold font-bold capitalize">{character}</span>
              </div>
              <div className="w-px h-6 bg-sts-gold/30"></div>
              <div className="flex items-center gap-2">
                <span className="text-sts-light/60">Ascension:</span>
                <span className="text-sts-gold font-bold">{stats.ascensionLevel}</span>
              </div>
              <div className="w-px h-6 bg-sts-gold/30"></div>
              <div className="flex items-center gap-2">
                <span className="text-sts-light/60">HP:</span>
                <span className="text-sts-gold font-bold">{stats.maxHP}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Blessing Options */}
        {!isConfirming ? (
          <div>
            <h2 className="text-2xl font-semibold text-sts-light mb-4 text-center">
              Select Your Blessing
            </h2>
            <p className="text-sm text-sts-light/60 mb-6 text-center">
              All {characterBlessings.length} possible Neow blessings for {getCharacterName()}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
              {characterBlessings.map((blessing) => (
                <button
                  key={blessing.id}
                  onClick={() => handleBlessingSelect(blessing)}
                  className={`group relative bg-sts-dark/80 backdrop-blur-sm rounded-lg p-4 border-2 transition-all transform hover:scale-105 hover:shadow-sts ${getCharacterAccent()} text-left overflow-hidden`}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-sts-gold/0 via-sts-gold/5 to-sts-gold/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="text-3xl mb-2 text-center">
                      {blessing.id.includes('heal') && '❤️‍🩹'}
                      {blessing.id.includes('max_hp') && !blessing.id.includes('lose') && !blessing.id.includes('heal') && '❤️'}
                      {blessing.id.includes('gold') && !blessing.id.includes('lose') && '💰'}
                      {(blessing.id.includes('card') || blessing.id.includes('upgrade') || blessing.id.includes('transform') || blessing.id.includes('remove')) && '🎴'}
                      {blessing.id.includes('relic') && '✨'}
                      {blessing.id.includes('potion') && '🧪'}
                      {blessing.id.includes('enemies_1hp') && '⚔️'}
                      {blessing.id.includes('lose') && '⚠️'}
                      {blessing.id.includes('curse') && '💀'}
                      {!blessing.id.includes('max_hp') && !blessing.id.includes('heal') && !blessing.id.includes('gold') && !blessing.id.includes('card') && !blessing.id.includes('relic') && !blessing.id.includes('potion') && !blessing.id.includes('upgrade') && !blessing.id.includes('transform') && !blessing.id.includes('remove') && !blessing.id.includes('enemies_1hp') && !blessing.id.includes('lose') && !blessing.id.includes('curse') && '🌟'}
                    </div>

                    <h3 className="text-sm font-bold text-sts-light mb-2 text-center leading-tight">
                      {blessing.name}
                    </h3>

                    <p className="text-xs text-sts-light/70 leading-snug text-center min-h-[40px]">
                      {blessing.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Skip Option */}
            <div className="text-center">
              <button
                onClick={handleSkip}
                className="px-8 py-3 bg-sts-darker/80 border-2 border-sts-light/30 hover:border-sts-light/60 rounded-lg text-sts-light/70 hover:text-sts-light transition-all hover:shadow-sts"
              >
                Skip Blessing (Start with default stats)
              </button>
            </div>
          </div>
        ) : (
          // Confirmation Screen
          <div className="max-w-2xl mx-auto">
            <div className="bg-sts-dark/90 backdrop-blur-sm rounded-lg p-8 border-3 border-sts-gold/60 shadow-sts-xl">
              <h2 className="text-3xl font-bold text-sts-gold mb-6 text-center">
                Confirm Your Choice
              </h2>

              <div className="bg-sts-darker/80 rounded-lg p-6 mb-6 border-2 border-sts-gold/40">
                <div className="text-5xl mb-4 text-center">
                  {selectedBlessing?.id.includes('heal') && '❤️‍🩹'}
                  {selectedBlessing?.id.includes('max_hp') && !selectedBlessing?.id.includes('lose') && !selectedBlessing?.id.includes('heal') && '❤️'}
                  {selectedBlessing?.id.includes('gold') && !selectedBlessing?.id.includes('lose') && '💰'}
                  {(selectedBlessing?.id.includes('card') || selectedBlessing?.id.includes('upgrade') || selectedBlessing?.id.includes('transform') || selectedBlessing?.id.includes('remove')) && '🎴'}
                  {selectedBlessing?.id.includes('relic') && '✨'}
                  {selectedBlessing?.id.includes('potion') && '🧪'}
                  {selectedBlessing?.id.includes('enemies_1hp') && '⚔️'}
                  {selectedBlessing?.id.includes('lose') && '⚠️'}
                  {selectedBlessing?.id.includes('curse') && '💀'}
                  {!selectedBlessing?.id.includes('max_hp') && !selectedBlessing?.id.includes('heal') && !selectedBlessing?.id.includes('gold') && !selectedBlessing?.id.includes('card') && !selectedBlessing?.id.includes('relic') && !selectedBlessing?.id.includes('potion') && !selectedBlessing?.id.includes('upgrade') && !selectedBlessing?.id.includes('transform') && !selectedBlessing?.id.includes('remove') && !selectedBlessing?.id.includes('enemies_1hp') && !selectedBlessing?.id.includes('lose') && !selectedBlessing?.id.includes('curse') && '🌟'}
                </div>

                <h3 className="text-2xl font-bold text-sts-light mb-4 text-center">
                  {selectedBlessing?.name}
                </h3>

                <p className="text-base text-sts-light/90 leading-relaxed text-center">
                  {selectedBlessing?.description}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsConfirming(false)}
                  className="flex-1 px-6 py-4 bg-sts-darker border-2 border-sts-light/30 hover:border-sts-light/60 rounded-lg text-sts-light transition-all hover:shadow-sts"
                >
                  ← Back
                </button>

                <button
                  onClick={handleConfirm}
                  className="flex-1 px-6 py-4 bg-gradient-to-b from-sts-gold to-sts-bronze text-sts-darkest font-bold text-lg rounded-lg transition-all transform hover:scale-105 hover:shadow-sts-xl"
                >
                  Begin Run →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sts-light/50 hover:text-sts-light/80 transition-colors text-sm"
          >
            ← Back to Character Select
          </button>
        </div>
      </div>
    </div>
  );
}

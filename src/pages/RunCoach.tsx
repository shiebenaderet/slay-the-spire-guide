import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCoachingStore } from '../store/coachingStore';
import { CombatFlow } from '../components/CombatFlow';
import { ShopFlow } from '../components/ShopFlow';
import { RestFlow } from '../components/RestFlow';
import { DeckEditModal } from '../components/DeckEditModal';
import type { FloorType, CombatEncounter } from '../types/coaching';

export function RunCoach() {
  const navigate = useNavigate();
  const {
    character,
    ascensionLevel,
    currentFloor,
    currentHP,
    maxHP,
    gold,
    deck,
    relics,
    activeFloor,
    startFloor,
    completeFloor,
    addCardToDeck,
    updateHP,
    updateGold,
    resetRun,
    setDeck,
    setRelics,
  } = useCoachingStore();

  const [selectedFloorType, setSelectedFloorType] = useState<FloorType | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showDeckEditModal, setShowDeckEditModal] = useState(false);

  if (!character) {
    navigate('/');
    return null;
  }

  const handleRestartRun = () => {
    resetRun();
    navigate('/');
  };

  const handleStartFloor = () => {
    if (selectedFloorType) {
      startFloor(selectedFloorType);
    }
  };

  const handleCompleteFloor = () => {
    completeFloor();
    setSelectedFloorType(null);
  };

  // Selecting floor type
  if (!activeFloor) {
    return (
      <div className="min-h-screen bg-sts-darkest text-sts-light p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-sts-gold">Floor {currentFloor}</h1>
              <button
                onClick={() => setShowRestartConfirm(true)}
                className="px-4 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-500/40 hover:border-red-500 text-red-300 hover:text-red-200 rounded transition-all"
              >
                🔄 Restart Run
              </button>
            </div>
            <div className="flex gap-6 text-sm text-sts-light/70">
              <span>{character} - A{ascensionLevel}</span>
              <span>HP: {currentHP}/{maxHP}</span>
              <span>Gold: {gold}</span>
              <span>Deck: {deck.length} cards</span>
              <span>Relics: {relics.length}</span>
            </div>
          </div>

          {/* Restart Confirmation Modal */}
          {showRestartConfirm && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="bg-sts-dark border-2 border-sts-gold/40 rounded-lg p-6 max-w-md mx-4">
                <h2 className="text-2xl font-bold text-sts-gold mb-4">Restart Run?</h2>
                <p className="text-sts-light mb-6">
                  Are you sure you want to restart? All progress will be lost.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowRestartConfirm(false)}
                    className="flex-1 px-4 py-2 bg-sts-darker border border-sts-light/40 text-sts-light hover:border-sts-light/60 rounded transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRestartRun}
                    className="flex-1 px-4 py-2 bg-red-900/40 border border-red-500/40 text-red-300 hover:bg-red-900/60 hover:border-red-500 rounded transition-all"
                  >
                    Restart
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Deck Edit Modal */}
          {showDeckEditModal && (
            <DeckEditModal
              character={character}
              deck={deck}
              relics={relics}
              onUpdateDeck={setDeck}
              onUpdateRelics={setRelics}
              onClose={() => setShowDeckEditModal(false)}
            />
          )}

          {/* Floor Type Selection */}
          <div className="bg-sts-dark border-2 border-sts-gold/40 rounded-lg p-6">
            <h2 className="text-xl font-bold text-sts-gold mb-4">What type of room is this?</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <FloorTypeButton
                type="combat"
                label="Combat"
                icon="⚔️"
                selected={selectedFloorType === 'combat'}
                onClick={() => setSelectedFloorType('combat')}
              />
              <FloorTypeButton
                type="elite"
                label="Elite"
                icon="👹"
                selected={selectedFloorType === 'elite'}
                onClick={() => setSelectedFloorType('elite')}
              />
              <FloorTypeButton
                type="shop"
                label="Shop"
                icon="🛒"
                selected={selectedFloorType === 'shop'}
                onClick={() => setSelectedFloorType('shop')}
              />
              <FloorTypeButton
                type="rest"
                label="Rest Site"
                icon="🔥"
                selected={selectedFloorType === 'rest'}
                onClick={() => setSelectedFloorType('rest')}
              />
              <FloorTypeButton
                type="event"
                label="Event"
                icon="❓"
                selected={selectedFloorType === 'event'}
                onClick={() => setSelectedFloorType('event')}
              />
              <FloorTypeButton
                type="treasure"
                label="Treasure"
                icon="💎"
                selected={selectedFloorType === 'treasure'}
                onClick={() => setSelectedFloorType('treasure')}
              />
              <FloorTypeButton
                type="boss"
                label="Boss"
                icon="👑"
                selected={selectedFloorType === 'boss'}
                onClick={() => setSelectedFloorType('boss')}
              />
            </div>

            <button
              onClick={handleStartFloor}
              disabled={!selectedFloorType}
              className="w-full py-3 bg-sts-gold hover:bg-sts-gold/80 disabled:bg-sts-gold/30 text-sts-dark font-bold rounded transition-colors disabled:cursor-not-allowed"
            >
              {selectedFloorType ? `Enter ${selectedFloorType}` : 'Select a room type'}
            </button>
          </div>

          {/* Quick Stats - Clickable to Edit */}
          <button
            onClick={() => setShowDeckEditModal(true)}
            className="mt-8 w-full bg-sts-dark hover:bg-sts-dark/80 border border-sts-light/20 hover:border-sts-gold/40 rounded-lg p-6 text-left transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-sts-light">Current Deck ({deck.length} cards)</h3>
              <span className="text-xs text-sts-gold">Click to edit ✏️</span>
            </div>
            <div className="text-sm text-sts-light/80">
              {deck.length === 0 ? (
                <p>No cards yet</p>
              ) : (
                <p className="line-clamp-3">{deck.join(', ')}</p>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 mb-3">
              <h3 className="text-lg font-bold text-sts-light">Relics ({relics.length})</h3>
            </div>
            <div className="text-sm text-sts-light/80">
              {relics.length === 0 ? (
                <p>No relics yet</p>
              ) : (
                <p className="line-clamp-2">{relics.join(', ')}</p>
              )}
            </div>
          </button>

          {/* Version Footer */}
          <div className="mt-8 text-center text-xs text-sts-light/40">
            v2.0.2
          </div>
        </div>
      </div>
    );
  }

  const handleCombatComplete = (combat: CombatEncounter, cardReward?: any) => {
    // Check if player lost
    if (combat.won === false) {
      // Player lost the combat - end the run
      console.log('Combat lost - ending run');

      // Update HP to show death (0 HP)
      updateHP(0);

      // Navigate back to character select after a short delay
      setTimeout(() => {
        alert(`Run ended on floor ${currentFloor}. You were defeated by: ${combat.enemies.join(', ')}`);
        resetRun();
        navigate('/');
      }, 500);

      return;
    }

    // Player won - update stats and continue
    if (combat.endingHP !== undefined) {
      updateHP(combat.endingHP);
    }
    if (combat.goldReceived !== undefined && combat.goldReceived > 0) {
      updateGold(gold + combat.goldReceived);
    }

    // Add picked card to deck (if not skipped)
    if (cardReward?.picked && cardReward.picked !== 'SKIP' && cardReward.picked !== 'skip') {
      addCardToDeck(cardReward.picked);
    }

    console.log('Combat completed:', combat, cardReward);
    handleCompleteFloor();
  };

  const handleShopComplete = (purchased: string[], removed: string[], goldSpent: number) => {
    // TODO: Update deck with purchases and removals
    // TODO: Update gold
    console.log('Shop completed:', { purchased, removed, goldSpent });
    handleCompleteFloor();
  };

  const handleRestComplete = (action: 'rest' | 'upgrade' | 'smith' | 'lift', cardUpgraded?: string, cardRemoved?: string) => {
    // TODO: Update HP if rested
    // TODO: Update deck with upgraded/removed cards
    console.log('Rest site completed:', { action, cardUpgraded, cardRemoved });
    handleCompleteFloor();
  };

  // In active floor - show floor-specific UI
  return (
    <div className="min-h-screen bg-sts-darkest text-sts-light p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-sts-gold">
              Floor {currentFloor} - {activeFloor.floorType.charAt(0).toUpperCase() + activeFloor.floorType.slice(1)}
            </h1>
            <button
              onClick={() => setShowRestartConfirm(true)}
              className="px-4 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-500/40 hover:border-red-500 text-red-300 hover:text-red-200 rounded transition-all"
            >
              🔄 Restart Run
            </button>
          </div>
          <div className="flex gap-6 text-sm text-sts-light/70">
            <span>HP: {currentHP}/{maxHP}</span>
            <span>Gold: {gold}</span>
          </div>
        </div>

        {/* Restart Confirmation Modal */}
        {showRestartConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-sts-dark border-2 border-sts-gold/40 rounded-lg p-6 max-w-md mx-4">
              <h2 className="text-2xl font-bold text-sts-gold mb-4">Restart Run?</h2>
              <p className="text-sts-light mb-6">
                Are you sure you want to restart? All progress will be lost.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowRestartConfirm(false)}
                  className="flex-1 px-4 py-2 bg-sts-darker border border-sts-light/40 text-sts-light hover:border-sts-light/60 rounded transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestartRun}
                  className="flex-1 px-4 py-2 bg-red-900/40 border border-red-500/40 text-red-300 hover:bg-red-900/60 hover:border-red-500 rounded transition-all"
                >
                  Restart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floor-specific content */}
        <div className="bg-sts-dark border-2 border-sts-gold/40 rounded-lg p-6">
          {(activeFloor.floorType === 'combat' || activeFloor.floorType === 'elite' || activeFloor.floorType === 'boss') && (
            <CombatFlow
              floor={currentFloor}
              deck={deck}
              relics={relics}
              character={character}
              currentHP={currentHP}
              maxHP={maxHP}
              gold={gold}
              ascension={ascensionLevel}
              onComplete={handleCombatComplete}
            />
          )}

          {activeFloor.floorType === 'shop' && (
            <ShopFlow
              floor={currentFloor}
              deck={deck}
              relics={relics}
              character={character}
              currentHP={currentHP}
              maxHP={maxHP}
              gold={gold}
              ascension={ascensionLevel}
              onComplete={handleShopComplete}
            />
          )}

          {activeFloor.floorType === 'rest' && (
            <RestFlow
              floor={currentFloor}
              deck={deck}
              relics={relics}
              character={character}
              currentHP={currentHP}
              maxHP={maxHP}
              gold={gold}
              ascension={ascensionLevel}
              onComplete={handleRestComplete}
            />
          )}

          {activeFloor.floorType === 'event' && (
            <div>
              <p className="text-sts-light/70 mb-4">Event functionality coming soon...</p>
              <button
                onClick={handleCompleteFloor}
                className="px-6 py-2 bg-sts-gold hover:bg-sts-gold/80 text-sts-dark font-bold rounded transition-colors"
              >
                Leave Event
              </button>
            </div>
          )}

          {activeFloor.floorType === 'treasure' && (
            <div>
              <p className="text-sts-light/70 mb-4">Treasure functionality coming soon...</p>
              <button
                onClick={handleCompleteFloor}
                className="px-6 py-2 bg-sts-gold hover:bg-sts-gold/80 text-sts-dark font-bold rounded transition-colors"
              >
                Leave Treasure Room
              </button>
            </div>
          )}
        </div>

        {/* Version Footer */}
        <div className="mt-8 text-center text-xs text-sts-light/40">
          v2.0.2
        </div>
      </div>
    </div>
  );
}

interface FloorTypeButtonProps {
  type: FloorType;
  label: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
}

function FloorTypeButton({ label, icon, selected, onClick }: FloorTypeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-lg border-2 transition-all
        ${selected
          ? 'border-sts-gold bg-sts-gold/20 text-sts-gold'
          : 'border-sts-light/20 bg-sts-darker hover:border-sts-light/40'
        }
      `}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-semibold">{label}</div>
    </button>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCoachingStore } from '../store/coachingStore';
import { CombatFlow } from '../components/CombatFlow';
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
  } = useCoachingStore();

  const [selectedFloorType, setSelectedFloorType] = useState<FloorType | null>(null);

  if (!character) {
    navigate('/');
    return null;
  }

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
            <h1 className="text-3xl font-bold text-sts-gold mb-2">Floor {currentFloor}</h1>
            <div className="flex gap-6 text-sm text-sts-light/70">
              <span>{character} - A{ascensionLevel}</span>
              <span>HP: {currentHP}/{maxHP}</span>
              <span>Gold: {gold}</span>
              <span>Deck: {deck.length} cards</span>
              <span>Relics: {relics.length}</span>
            </div>
          </div>

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

          {/* Quick Stats */}
          <div className="mt-8 bg-sts-dark border border-sts-light/20 rounded-lg p-6">
            <h3 className="text-lg font-bold text-sts-light mb-3">Current Deck</h3>
            <div className="text-sm text-sts-light/80">
              {deck.length === 0 ? (
                <p>No cards yet</p>
              ) : (
                <p>{deck.join(', ')}</p>
              )}
            </div>

            <h3 className="text-lg font-bold text-sts-light mt-4 mb-3">Relics</h3>
            <div className="text-sm text-sts-light/80">
              {relics.length === 0 ? (
                <p>No relics yet</p>
              ) : (
                <p>{relics.join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCombatComplete = (combat: CombatEncounter) => {
    // TODO: Update floor data with combat results
    // TODO: Show card reward screen
    console.log('Combat completed:', combat);
    handleCompleteFloor();
  };

  // In active floor - show floor-specific UI
  return (
    <div className="min-h-screen bg-sts-darkest text-sts-light p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-sts-gold mb-2">
            Floor {currentFloor} - {activeFloor.floorType.charAt(0).toUpperCase() + activeFloor.floorType.slice(1)}
          </h1>
          <div className="flex gap-6 text-sm text-sts-light/70">
            <span>HP: {currentHP}/{maxHP}</span>
            <span>Gold: {gold}</span>
          </div>
        </div>

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
              onComplete={handleCombatComplete}
            />
          )}

          {activeFloor.floorType === 'shop' && (
            <div>
              <p className="text-sts-light/70 mb-4">Shop functionality coming soon...</p>
              <button
                onClick={handleCompleteFloor}
                className="px-6 py-2 bg-sts-gold hover:bg-sts-gold/80 text-sts-dark font-bold rounded transition-colors"
              >
                Leave Shop
              </button>
            </div>
          )}

          {activeFloor.floorType === 'rest' && (
            <div>
              <p className="text-sts-light/70 mb-4">Rest site functionality coming soon...</p>
              <button
                onClick={handleCompleteFloor}
                className="px-6 py-2 bg-sts-gold hover:bg-sts-gold/80 text-sts-dark font-bold rounded transition-colors"
              >
                Leave Rest Site
              </button>
            </div>
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

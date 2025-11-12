import { useState, useEffect } from 'react';
import type { Card, Relic, CharacterType } from '../types';
import { EVENTS, evaluateEventChoice, getEventImagePath, type Event, type EventChoice } from '../utils/eventAdvisor';
import { evaluateCardRemoval } from '../utils/shopAdvisor';
import { getCardImagePath, handleImageError } from '../utils/imageHelpers';

interface EventModalProps {
  character: CharacterType;
  deck: Card[];
  relics: Relic[];
  currentHp: number;
  maxHp: number;
  gold: number;
  onEventComplete: (goldChange: number, hpChange: number, maxHpChange: number) => void;
  onRemoveCard?: (cardId: string) => void;
  onUpgradeCard?: (cardId: string) => void;
  onClose: () => void;
}

/**
 * Event Modal - Shows ? room events with decision trees and smart advice
 * Helps players navigate random events with context-aware recommendations
 */
export function EventModal({
  character,
  deck,
  relics,
  currentHp,
  maxHp,
  gold,
  onEventComplete,
  onRemoveCard,
  onUpgradeCard,
  onClose,
}: EventModalProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventList, setShowEventList] = useState(true);
  const [showCardSelection, setShowCardSelection] = useState(false);
  const [cardSelectionMode, setCardSelectionMode] = useState<'remove' | 'upgrade' | null>(null);
  const [cardsToSelect, setCardsToSelect] = useState(1);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  useEffect(() => {
    // Could randomly select an event here for more realism
    // For now, let user choose which event they encountered
  }, []);

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setShowEventList(false);
  };

  const handleChoiceSelect = (choice: EventChoice) => {
    // Check if this choice requires card selection
    if (selectedEvent?.id === 'wing_statue' && choice.id === 'remove') {
      // Wing Statue: Remove 1 card
      setCardSelectionMode('remove');
      setCardsToSelect(1);
      setSelectedCards([]);
      setShowCardSelection(true);
      return;
    }

    if (selectedEvent?.id === 'shining_light' && choice.id === 'upgrade_two') {
      // Shining Light: Upgrade 2 cards
      setCardSelectionMode('upgrade');
      setCardsToSelect(2);
      setSelectedCards([]);
      setShowCardSelection(true);
      return;
    }

    if (selectedEvent?.id === 'old_beggar' && choice.id === 'give_all') {
      // Old Beggar: Remove 2 cards
      setCardSelectionMode('remove');
      setCardsToSelect(2);
      setSelectedCards([]);
      setShowCardSelection(true);
      return;
    }

    // Calculate the outcome
    let goldChange = 0;
    let hpChange = 0;
    let maxHpChange = 0;

    if (choice.goldCost !== undefined) {
      if (choice.goldCost === -1) {
        // Special: all gold (Old Beggar)
        goldChange = -gold;
      } else {
        goldChange = -choice.goldCost;
      }
    }

    if (choice.hpCost !== undefined) {
      hpChange = -choice.hpCost;
    }

    if (choice.maxHpCost !== undefined) {
      maxHpChange = -Math.floor(maxHp * choice.maxHpCost);
    }

    // Add gold gained from outcomes
    if (selectedEvent?.id === 'golden_shrine') {
      if (choice.id === 'pray') goldChange += 100;
      if (choice.id === 'desecrate') goldChange += 275;
    } else if (selectedEvent?.id === 'world_of_goop' && choice.id === 'gold') {
      goldChange += 75;
    } else if (selectedEvent?.id === 'golden_idol' && choice.id === 'take') {
      goldChange += 250;
    } else if (selectedEvent?.id === 'nest' && choice.id === 'take') {
      goldChange += 250;
    } else if (selectedEvent?.id === 'big_fish') {
      if (choice.id === 'banana') maxHpChange += 5;
      if (choice.id === 'donut') hpChange += Math.floor(maxHp * 0.33);
    } else if (selectedEvent?.id === 'vampire' && choice.id === 'refuse') {
      maxHpChange += 5;
    }

    onEventComplete(goldChange, hpChange, maxHpChange);
    onClose();
  };

  const handleBack = () => {
    setShowEventList(true);
    setSelectedEvent(null);
    setShowCardSelection(false);
    setCardSelectionMode(null);
  };

  const handleCardToggle = (cardId: string) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    } else if (selectedCards.length < cardsToSelect) {
      setSelectedCards([...selectedCards, cardId]);
    }
  };

  const handleConfirmCardSelection = () => {
    if (selectedCards.length !== cardsToSelect) return;

    // Apply card actions
    if (cardSelectionMode === 'remove' && onRemoveCard) {
      selectedCards.forEach(cardId => onRemoveCard(cardId));
    } else if (cardSelectionMode === 'upgrade' && onUpgradeCard) {
      selectedCards.forEach(cardId => onUpgradeCard(cardId));
    }

    // Calculate gold change if Old Beggar give_all
    let goldChange = 0;
    if (selectedEvent?.id === 'old_beggar') {
      goldChange = -gold; // Lose all gold
    }

    onEventComplete(goldChange, 0, 0);
    onClose();
  };

  // Card selection screen (for Wing Statue, Shining Light, Old Beggar)
  if (showCardSelection && cardSelectionMode) {
    return (
      <div className="bg-sts-dark rounded-lg p-6 w-full border-2 border-purple-500/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
              <span>{cardSelectionMode === 'remove' ? '🗑️' : '⬆️'}</span>
              <span>{cardSelectionMode === 'remove' ? 'Remove' : 'Upgrade'} {cardsToSelect} Card{cardsToSelect > 1 ? 's' : ''}</span>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Back
              </button>
            </div>
          </div>

          <div className="bg-purple-900/20 border border-purple-500/30 rounded p-4 mb-4">
            <p className="text-sts-light/90 text-sm mb-2">
              {cardSelectionMode === 'remove'
                ? `Select ${cardsToSelect} card${cardsToSelect > 1 ? 's' : ''} to remove from your deck.`
                : `Select ${cardsToSelect} card${cardsToSelect > 1 ? 's' : ''} to upgrade. Choose your most impactful cards.`
              }
            </p>
            {cardSelectionMode === 'remove' && (
              <div className="text-xs text-sts-light/70 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-red-400">🔥 Priority:</span>
                  <span>Curses → Strikes → Defends → Weak cards</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">⚠️ Consider:</span>
                  <span>Situational cards with no synergies</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">✓ Keep:</span>
                  <span>High-tier cards and synergistic pieces</span>
                </div>
              </div>
            )}
          </div>

          <div className="mb-4 text-sm flex items-center justify-between">
            <span className="text-sts-light/70">Selected: </span>
            <span className={`font-bold ${selectedCards.length === cardsToSelect ? 'text-green-400' : 'text-yellow-400'}`}>
              {selectedCards.length} / {cardsToSelect}
            </span>
          </div>

          <div className="grid grid-cols-6 gap-3 mb-6">
            {deck.map((card) => {
              const isSelected = selectedCards.includes(card.id);
              const canSelect = selectedCards.length < cardsToSelect || isSelected;

              // For remove mode, evaluate removal priority
              const removalEval = cardSelectionMode === 'remove'
                ? evaluateCardRemoval(card, deck, relics)
                : null;

              // For upgrade mode, skip already upgraded cards
              if (cardSelectionMode === 'upgrade' && card.upgraded) {
                return null;
              }

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardToggle(card.id)}
                  disabled={!canSelect && !isSelected}
                  className={`bg-sts-darker p-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-green-500 ring-2 ring-green-500/50'
                      : removalEval && removalEval.priority === 'must-remove'
                      ? 'border-red-500/50 hover:border-red-500'
                      : removalEval && removalEval.priority === 'should-remove'
                      ? 'border-yellow-500/30 hover:border-yellow-500'
                      : 'border-sts-light/20 hover:border-blue-500/50'
                  } ${!canSelect && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  <div className="aspect-[2/3] mb-1">
                    <img
                      src={getCardImagePath(card.character, card.id)}
                      alt={card.name}
                      onError={handleImageError}
                      className="w-full h-full object-contain rounded"
                    />
                  </div>
                  <div className="text-xs font-semibold text-sts-light mb-1 truncate" title={card.name}>
                    {card.name}
                  </div>
                  {removalEval && cardSelectionMode === 'remove' && (
                    <div className={`text-[10px] px-1 py-0.5 rounded mb-1 ${
                      removalEval.priority === 'must-remove' ? 'bg-red-900/30 text-red-400' :
                      removalEval.priority === 'should-remove' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-gray-900/30 text-gray-400'
                    }`}>
                      {removalEval.priority === 'must-remove' ? '🔥 Priority' :
                       removalEval.priority === 'should-remove' ? '⚠️ Consider' :
                       '✓ Keep'}
                    </div>
                  )}
                  {card.upgraded && cardSelectionMode === 'upgrade' && (
                    <div className="text-[10px] px-1 py-0.5 rounded bg-blue-900/30 text-blue-400">
                      Already +
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleConfirmCardSelection}
              disabled={selectedCards.length !== cardsToSelect}
              className={`flex-1 px-6 py-3 rounded font-semibold transition-colors ${
                selectedCards.length === cardsToSelect
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Confirm {cardSelectionMode === 'remove' ? 'Removal' : 'Upgrade'}
            </button>
          </div>
        </div>
    );
  }

  // Event selection screen
  if (showEventList) {
    return (
      <div className="bg-sts-dark rounded-lg p-6 w-full border-2 border-purple-500/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
              <span>❓</span>
              <span>Event Encounter - Choose Event</span>
            </h2>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-sts-light/80 text-sm mb-6">
            Select which event you encountered in the ? room. The advisor will provide recommendations for each choice.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {EVENTS.map((event) => (
              <button
                key={event.id}
                onClick={() => handleEventSelect(event)}
                className="bg-sts-darker rounded-lg hover:bg-sts-light/10 transition-all border-2 border-transparent hover:border-purple-500/50 text-left overflow-hidden group"
              >
                <div className="w-full h-32 bg-black overflow-hidden">
                  <img
                    src={getEventImagePath(event.id)}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <div className="font-semibold text-purple-400 mb-2">{event.name}</div>
                  <div className="text-xs text-sts-light/70 leading-tight line-clamp-2">
                    {event.description}
                  </div>
                  <div className="text-xs text-blue-400 mt-2">
                    {event.choices.length} choices
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
    );
  }

  // Event decision screen
  if (!selectedEvent) return null;

  return (
    <div className="bg-sts-dark rounded-lg p-6 w-full border-2 border-purple-500/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
            <span>❓</span>
            <span>{selectedEvent.name}</span>
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Back
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Current stats */}
        <div className="bg-sts-darker/50 rounded p-3 mb-6 flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-red-400">❤️</span>
            <span className="text-sts-light">{currentHp} / {maxHp} HP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">💰</span>
            <span className="text-sts-light">{gold} Gold</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">🃏</span>
            <span className="text-sts-light">{deck.length} Cards</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400">💎</span>
            <span className="text-sts-light">{relics.length} Relics</span>
          </div>
        </div>

        {/* Event Image & Story/Description */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="col-span-1 bg-black rounded-lg overflow-hidden">
            <img
              src={getEventImagePath(selectedEvent.id)}
              alt={selectedEvent.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="col-span-2 bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 flex items-center">
            <p className="text-sts-light italic text-sm leading-relaxed">
              {selectedEvent.description}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {selectedEvent.choices.map((choice) => {
            const evaluation = evaluateEventChoice(
              selectedEvent,
              choice,
              currentHp,
              maxHp,
              gold,
              deck,
              relics,
              character
            );

            const canAfford = choice.goldCost === undefined ||
                             choice.goldCost === -1 && gold > 0 ||
                             choice.goldCost !== -1 && gold >= choice.goldCost;
            const canSurvive = choice.hpCost === undefined || currentHp > choice.hpCost;

            const isDisabled = !canAfford || !canSurvive;

            return (
              <button
                key={choice.id}
                onClick={() => handleChoiceSelect(choice)}
                disabled={isDisabled}
                className={`w-full bg-sts-darker p-4 rounded-lg border-2 transition-all text-left ${
                  isDisabled
                    ? 'border-gray-700 opacity-50 cursor-not-allowed'
                    : evaluation.rating === 'highly-recommended'
                    ? 'border-green-500/50 hover:border-green-500 hover:bg-green-900/10'
                    : evaluation.rating === 'recommended'
                    ? 'border-blue-500/50 hover:border-blue-500 hover:bg-blue-900/10'
                    : evaluation.rating === 'situational'
                    ? 'border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-900/10'
                    : 'border-red-500/30 hover:border-red-500 hover:bg-red-900/10'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-sts-light mb-1 flex items-center gap-2">
                      {choice.description}
                      {evaluation.recommendedChoice === choice.id && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-900/30 text-green-400 font-bold">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-sts-light/60 mb-2">
                      {choice.outcome}
                    </div>

                    {/* Costs */}
                    {(choice.goldCost !== undefined || choice.hpCost !== undefined || choice.maxHpCost !== undefined) && (
                      <div className="flex gap-3 text-xs mb-2">
                        {choice.goldCost !== undefined && (
                          <span className={`${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
                            💰 {choice.goldCost === -1 ? `All gold (${gold}G)` : `-${choice.goldCost}G`}
                          </span>
                        )}
                        {choice.hpCost !== undefined && (
                          <span className={`${canSurvive ? 'text-red-300' : 'text-red-500 font-bold'}`}>
                            ❤️ -{choice.hpCost} HP
                          </span>
                        )}
                        {choice.maxHpCost !== undefined && (
                          <span className="text-red-400">
                            💔 -{Math.round(choice.maxHpCost * 100)}% Max HP
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rating indicator */}
                  <div className={`text-xs px-2 py-1 rounded font-semibold ml-4 ${
                    evaluation.rating === 'highly-recommended' ? 'bg-green-900/30 text-green-400' :
                    evaluation.rating === 'recommended' ? 'bg-blue-900/30 text-blue-400' :
                    evaluation.rating === 'situational' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {evaluation.rating === 'highly-recommended' ? '★★★' :
                     evaluation.rating === 'recommended' ? '★★' :
                     evaluation.rating === 'situational' ? '★' :
                     '⚠'}
                  </div>
                </div>

                {/* Evaluation advice */}
                <div className={`text-xs p-2 rounded leading-tight ${
                  evaluation.rating === 'highly-recommended' ? 'bg-green-900/20 text-green-300' :
                  evaluation.rating === 'recommended' ? 'bg-blue-900/20 text-blue-300' :
                  evaluation.rating === 'situational' ? 'bg-yellow-900/20 text-yellow-300' :
                  'bg-red-900/20 text-red-300'
                }`}>
                  💡 {evaluation.reason}
                </div>

                {isDisabled && (
                  <div className="text-xs text-red-400 mt-2 font-semibold">
                    {!canAfford && '❌ Not enough gold'}
                    {!canSurvive && '❌ Not enough HP'}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
  );
}

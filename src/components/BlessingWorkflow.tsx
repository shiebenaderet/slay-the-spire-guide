import { useState, useEffect } from 'react';
import type { Blessing, Card, Relic, CharacterType, Potion } from '../types';
import {
  getBlessingActionType,
  getCardSelectionCount,
  getRelicSelectionCount,
  getCardRarity,
  getRelicRarity,
  getBlessingActionDescription,
  blessingAddsCurse,
} from '../utils/blessingHelpers';
import cardsData from '../data/cards.json';
import relicsDataRaw from '../data/relics.json';
import potionsDataRaw from '../data/potions.json';
import { getCardImagePath, getRelicImagePath, handleImageError } from '../utils/imageHelpers';

const relicsData = relicsDataRaw as unknown as Relic[];
const potionsData = potionsDataRaw as Potion[];

interface BlessingWorkflowProps {
  blessing: Blessing;
  character: CharacterType;
  currentDeck: Card[];
  onComplete: (result: BlessingWorkflowResult) => void;
  onCancel: () => void;
}

export interface BlessingWorkflowResult {
  cardsToAdd: Card[];
  cardsToRemove: string[]; // Card IDs
  cardsToUpgrade: string[]; // Card IDs
  cardsToTransform: string[]; // Card IDs
  relicsToAdd: Relic[];
  potionsToAdd: Potion[];
  curseToAdd: Card | null; // Selected curse
}

export function BlessingWorkflow({
  blessing,
  character,
  currentDeck,
  onComplete,
  onCancel,
}: BlessingWorkflowProps) {
  const actionType = getBlessingActionType(blessing);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedRelic, setSelectedRelic] = useState<Relic | null>(null);
  const [selectedPotions, setSelectedPotions] = useState<Potion[]>([]);
  const [selectedCurse, setSelectedCurse] = useState<Card | null>(null);
  const [availableOptions, setAvailableOptions] = useState<Card[] | Relic[] | Potion[]>([]);
  const [step, setStep] = useState<'main' | 'curse'>('main'); // Track which step we're on
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search filter

  useEffect(() => {
    // Generate random options based on action type
    if (actionType.includes('card')) {
      generateCardOptions();
    } else if (actionType.includes('relic')) {
      generateRelicOptions();
    } else if (actionType === 'choose_potions') {
      generatePotionOptions();
    }
  }, [actionType]);

  const generateCardOptions = () => {
    const rarity = getCardRarity(actionType);

    let pool = cardsData.filter((card) => {
      // For colorless cards
      if (actionType === 'choose_colorless_card') {
        return card.character === 'colorless' && card.rarity !== 'curse';
      }
      // For specific rarity
      if (rarity) {
        return (
          (card.character === character || card.character === 'colorless') &&
          card.rarity === rarity
        );
      }
      // General card selection
      return card.character === character || card.character === 'colorless';
    }) as Card[];

    // Show ALL cards, not just random 3
    const options = pool.map((card, idx) => ({
      ...card,
      id: `${card.id}-blessing-${idx}`,
    }));

    setAvailableOptions(options);
  };

  const generateRelicOptions = () => {
    const rarity = getRelicRarity(actionType);

    if (!rarity) return;

    // Show ALL relics of the specified rarity, not just random 3
    let pool = relicsData.filter((relic) => {
      return (
        relic.rarity === rarity &&
        (relic.character === 'shared' || relic.character === character)
      );
    });

    setAvailableOptions(pool);
  };

  const generatePotionOptions = () => {
    // Show ALL potions for character (shared + character-specific), not just random 5
    let pool = potionsData.filter(
      (potion) => potion.character === 'shared' || potion.character === character
    );

    setAvailableOptions(pool);
  };

  const generateCurseOptions = () => {
    // Show ALL curses, not just random 3
    const curses = (cardsData as Card[]).filter((card) => card.type === 'curse');
    const options = curses.map((card, idx) => ({
      ...card,
      id: `${card.id}-curse-${idx}`,
    }));

    setAvailableOptions(options);
  };

  const handleCardSelection = (card: Card) => {
    const maxSelections = getMaxSelections();

    if (selectedCards.some((c) => c.id === card.id)) {
      setSelectedCards(selectedCards.filter((c) => c.id !== card.id));
    } else if (selectedCards.length < maxSelections) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleDeckCardSelection = (cardId: string) => {
    const maxSelections = getMaxSelections();

    if (selectedCardIds.includes(cardId)) {
      setSelectedCardIds(selectedCardIds.filter((id) => id !== cardId));
    } else if (selectedCardIds.length < maxSelections) {
      setSelectedCardIds([...selectedCardIds, cardId]);
    }
  };

  const handleRelicSelection = (relic: Relic) => {
    setSelectedRelic(relic);
  };

  const handlePotionSelection = (potion: Potion) => {
    const maxSelections = getMaxSelections();

    if (selectedPotions.some((p) => p.id === potion.id)) {
      setSelectedPotions(selectedPotions.filter((p) => p.id !== potion.id));
    } else if (selectedPotions.length < maxSelections) {
      setSelectedPotions([...selectedPotions, potion]);
    }
  };

  const getMaxSelections = (): number => {
    switch (actionType) {
      case 'remove_2_cards':
      case 'transform_2_cards':
        return 2;
      case 'choose_potions':
        return 3;
      default:
        return 1;
    }
  };

  const handleConfirm = () => {
    // If blessing adds a curse and we haven't selected one yet, go to curse selection
    if (step === 'main' && blessingAddsCurse(blessing)) {
      setStep('curse');
      generateCurseOptions();
      return;
    }

    // Build final result
    const result: BlessingWorkflowResult = {
      cardsToAdd: [],
      cardsToRemove: [],
      cardsToUpgrade: [],
      cardsToTransform: [],
      relicsToAdd: [],
      potionsToAdd: [],
      curseToAdd: null,
    };

    // Card addition
    if (actionType.includes('choose') && actionType.includes('card')) {
      result.cardsToAdd = [...selectedCards];
    }

    // Add curse if blessing requires it
    if (blessingAddsCurse(blessing) && selectedCurse) {
      result.curseToAdd = selectedCurse;
    }

    // Relic addition
    if (actionType.includes('relic') && selectedRelic) {
      result.relicsToAdd = [selectedRelic];
    }

    // Potion addition
    if (actionType === 'choose_potions') {
      result.potionsToAdd = selectedPotions;
    }

    // Card removal
    if (actionType === 'remove_card' || actionType === 'remove_2_cards') {
      result.cardsToRemove = selectedCardIds;
    }

    // Card upgrade
    if (actionType === 'upgrade_card') {
      result.cardsToUpgrade = selectedCardIds;
    }

    // Card transformation
    if (actionType === 'transform_card' || actionType === 'transform_2_cards') {
      result.cardsToTransform = selectedCardIds;
    }

    onComplete(result);
  };

  // Helper to get a random curse card
  const getRandomCurse = (): Card | null => {
    const curses = (cardsData as Card[]).filter((card) => card.type === 'curse');
    if (curses.length === 0) return null;

    const randomCurse = curses[Math.floor(Math.random() * curses.length)];
    return {
      ...randomCurse,
      id: `${randomCurse.id}-curse-${Date.now()}`,
    };
  };

  const canConfirm = (): boolean => {
    // If we're on curse selection step, need a curse selected
    if (step === 'curse') {
      return selectedCurse !== null;
    }

    // Otherwise check main action requirements
    const maxSelections = getMaxSelections();

    if (actionType.includes('card') && actionType.includes('choose')) {
      return selectedCards.length === maxSelections;
    }
    if (actionType.includes('relic')) {
      return selectedRelic !== null;
    }
    if (actionType === 'choose_potions') {
      return selectedPotions.length === maxSelections;
    }
    if (
      actionType === 'remove_card' ||
      actionType === 'remove_2_cards' ||
      actionType === 'upgrade_card' ||
      actionType === 'transform_card' ||
      actionType === 'transform_2_cards'
    ) {
      return selectedCardIds.length === maxSelections;
    }
    return false;
  };

  // Filter options based on search query
  const getFilteredOptions = () => {
    if (!searchQuery.trim()) return availableOptions;

    const query = searchQuery.toLowerCase();

    if (actionType.includes('relic')) {
      return (availableOptions as Relic[]).filter(
        relic => relic.name.toLowerCase().includes(query) ||
                 relic.description?.toLowerCase().includes(query)
      );
    } else if (actionType === 'choose_potions') {
      return (availableOptions as Potion[]).filter(
        potion => potion.name.toLowerCase().includes(query) ||
                  potion.effect?.toLowerCase().includes(query)
      );
    } else {
      return (availableOptions as Card[]).filter(
        card => card.name.toLowerCase().includes(query) ||
                card.type?.toLowerCase().includes(query)
      );
    }
  };

  // Render card selection from available options
  const renderCardSelection = () => {
    const filteredOptions = getFilteredOptions() as Card[];
    const showImages = searchQuery.trim().length > 0;

    return (
      <div>
        <p className="text-xs text-sts-light/70 mb-2 text-center">
          {getBlessingActionDescription(actionType)}
        </p>

        {/* Search bar */}
        <div className="mb-2">
          <input
            type="text"
            placeholder="Type to search and see card images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-sts-darker border-2 border-sts-light/20 rounded text-sts-light placeholder-sts-light/40 focus:border-sts-gold/60 focus:outline-none"
          />
        </div>

        {!showImages && (
          <p className="text-center text-sts-light/60 text-xs mb-2">
            👆 Start typing to filter and view cards
          </p>
        )}

        {showImages && (
          <div className="grid grid-cols-4 gap-2">
            {filteredOptions.map((card) => {
              const isSelected = selectedCards.some((c) => c.id === card.id);
              // Remove the -blessing-X suffix to get the original card ID
              const originalId = card.id.replace(/-blessing-\d+$/, '');
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardSelection(card)}
                  className={`relative p-1.5 rounded border-2 transition-all ${
                    isSelected
                      ? 'border-sts-gold bg-sts-gold/20 shadow-sts'
                      : 'border-sts-light/20 hover:border-sts-light/50 bg-sts-darker'
                  }`}
                >
                  <img
                    src={getCardImagePath(card.character || character, originalId)}
                    alt={card.name}
                    onError={handleImageError}
                    className="w-full h-auto rounded mb-1"
                  />
                  <p className="text-[10px] text-sts-light font-semibold text-center truncate">{card.name}</p>
                  <p className="text-[9px] text-sts-light/60 text-center">{card.cost}E · {card.type}</p>
                  {isSelected && (
                    <div className="absolute top-0.5 right-0.5 bg-sts-gold text-sts-darkest rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render relic selection from available options
  const renderRelicSelection = () => {
    const filteredOptions = getFilteredOptions() as Relic[];
    const showImages = searchQuery.trim().length > 0;

    return (
      <div>
        <p className="text-xs text-sts-light/70 mb-2 text-center">
          {getBlessingActionDescription(actionType)}
        </p>

        {/* Search bar */}
        <div className="mb-2">
          <input
            type="text"
            placeholder="Type to search and see relic images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-sts-darker border-2 border-sts-light/20 rounded text-sts-light placeholder-sts-light/40 focus:border-sts-gold/60 focus:outline-none"
          />
        </div>

        {!showImages && (
          <p className="text-center text-sts-light/60 text-xs mb-2">
            👆 Start typing to filter and view relics
          </p>
        )}

        {showImages && (
          <div className="grid grid-cols-5 gap-2">
            {filteredOptions.map((relic) => {
              const isSelected = selectedRelic?.id === relic.id;
              return (
                <button
                  key={relic.id}
                  onClick={() => handleRelicSelection(relic)}
                  className={`relative p-2 rounded border-2 transition-all ${
                    isSelected
                      ? 'border-sts-gold bg-sts-gold/20 shadow-sts'
                      : 'border-sts-light/20 hover:border-sts-light/50 bg-sts-darker'
                  }`}
                >
                  <img
                    src={getRelicImagePath(relic.id)}
                    alt={relic.name}
                    onError={handleImageError}
                    className="w-16 h-16 object-contain mx-auto mb-1 bg-sts-light/5 rounded"
                  />
                  <p className="text-[10px] text-sts-light font-semibold text-center mb-0.5 truncate">{relic.name}</p>
                  <p className="text-[9px] text-sts-light/60 text-center line-clamp-2">
                    {relic.description}
                  </p>
                  {isSelected && (
                    <div className="absolute top-0.5 right-0.5 bg-sts-gold text-sts-darkest rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render potion selection
  const renderPotionSelection = () => {
    const maxSelections = getMaxSelections();
    const filteredOptions = getFilteredOptions() as Potion[];

    return (
      <div>
        <p className="text-xs text-sts-light/70 mb-2 text-center">
          {getBlessingActionDescription(actionType)}
          <br />
          <span className="text-[10px] text-sts-light/50">
            Selected: {selectedPotions.length} / {maxSelections}
          </span>
        </p>

        {/* Search bar */}
        <div className="mb-2">
          <input
            type="text"
            placeholder="Search potions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-sts-darker border-2 border-sts-light/20 rounded text-sts-light placeholder-sts-light/40 focus:border-sts-gold/60 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-6 gap-2">
          {filteredOptions.map((potion) => {
            const isSelected = selectedPotions.some((p) => p.id === potion.id);
            return (
              <button
                key={potion.id}
                onClick={() => handlePotionSelection(potion)}
                className={`relative p-2 rounded border-2 transition-all ${
                  isSelected
                    ? 'border-sts-gold bg-sts-gold/20 shadow-sts'
                    : 'border-sts-light/20 hover:border-sts-light/50 bg-sts-darker'
                }`}
              >
                {/* Potion Icon */}
                <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center text-4xl">
                  🧪
                </div>
                <p className="text-xs text-sts-light font-semibold text-center mb-1">{potion.name}</p>
                <p className="text-xs text-sts-light/60 text-center line-clamp-2">
                  {potion.effect}
                </p>
                {isSelected && (
                  <div className="absolute top-1 right-1 bg-sts-gold text-sts-darkest rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render card selection from current deck
  const renderDeckCardSelection = () => {
    const maxSelections = getMaxSelections();

    return (
      <div>
        <p className="text-xs text-sts-light/70 mb-2 text-center">
          {getBlessingActionDescription(actionType)}
          <br />
          <span className="text-[10px] text-sts-light/50">
            Selected: {selectedCardIds.length} / {maxSelections}
          </span>
        </p>
        <div className="grid grid-cols-5 gap-2">
          {currentDeck.map((card) => {
            const isSelected = selectedCardIds.includes(card.id);
            const canSelect =
              actionType === 'upgrade_card' ? !card.upgraded && card.type !== 'curse' : true;

            return (
              <button
                key={card.id}
                onClick={() => canSelect && handleDeckCardSelection(card.id)}
                disabled={!canSelect}
                className={`relative p-1.5 rounded border-2 transition-all ${
                  isSelected
                    ? 'border-sts-gold bg-sts-gold/20 shadow-sts'
                    : canSelect
                    ? 'border-sts-light/20 hover:border-sts-light/50 bg-sts-darker'
                    : 'border-gray-600 bg-gray-800 opacity-40 cursor-not-allowed'
                }`}
              >
                <img
                  src={getCardImagePath(card.character, card.id)}
                  alt={card.name}
                  onError={handleImageError}
                  className="w-full h-auto rounded mb-1"
                />
                <p className="text-[10px] text-sts-light text-center truncate">
                  {card.name}
                  {card.upgraded ? '+' : ''}
                </p>
                {isSelected && (
                  <div className="absolute top-0.5 right-0.5 bg-sts-gold text-sts-darkest rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render curse selection
  const renderCurseSelection = () => {
    const filteredOptions = getFilteredOptions() as Card[];
    const showImages = searchQuery.trim().length > 0;

    return (
      <div>
        <p className="text-xs text-sts-light/70 mb-2 text-center">
          Choose 1 curse to add to your deck
        </p>

        {/* Search bar */}
        <div className="mb-2">
          <input
            type="text"
            placeholder="Type to search and see curse images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-sts-darker border-2 border-sts-light/20 rounded text-sts-light placeholder-sts-light/40 focus:border-sts-gold/60 focus:outline-none"
          />
        </div>

        {!showImages && (
          <p className="text-center text-sts-light/60 text-xs mb-2">
            👆 Start typing to filter and view curses
          </p>
        )}

        {showImages && (
          <div className="grid grid-cols-4 gap-2">
            {filteredOptions.map((card) => {
              const isSelected = selectedCurse?.id === card.id;
              // Remove the -curse-X suffix to get the original card ID
              const originalId = card.id.replace(/-curse-\d+$/, '');
              return (
                <button
                  key={card.id}
                  onClick={() => setSelectedCurse(card)}
                  className={`relative p-1.5 rounded border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/20 shadow-sts'
                      : 'border-sts-light/20 hover:border-purple-400/50 bg-sts-darker'
                  }`}
                >
                  <img
                    src={getCardImagePath('colorless', originalId)}
                    alt={card.name}
                    onError={handleImageError}
                    className="w-full h-auto rounded mb-1"
                  />
                  <p className="text-[10px] text-sts-light font-semibold text-center truncate">{card.name}</p>
                  <p className="text-[9px] text-purple-400 text-center">Curse</p>
                  {isSelected && (
                    <div className="absolute top-0.5 right-0.5 bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2">
      <div className="bg-sts-dark rounded-lg border-2 border-sts-gold/60 shadow-sts-xl max-w-6xl w-full h-[95vh] flex flex-col">
        {/* Header - Compact */}
        <div className="bg-gradient-to-b from-sts-gold/20 to-transparent p-3 border-b border-sts-gold/30 flex-shrink-0">
          <h2 className="text-xl font-bold text-sts-gold mb-1 text-center">
            {step === 'curse' ? 'Select Your Curse' : blessing.name}
          </h2>
          <p className="text-xs text-sts-light/80 text-center">
            {step === 'curse'
              ? 'This blessing requires you to take a curse. Choose wisely.'
              : blessing.description
            }
          </p>

          {/* Curse Warning - only show on main step */}
          {step === 'main' && blessingAddsCurse(blessing) && (
            <div className="mt-2 p-1.5 bg-purple-900/40 border border-purple-500/50 rounded text-center">
              <p className="text-[10px] text-purple-300">
                ⚠️ This blessing will add a curse to your deck (you'll choose which one next)
              </p>
            </div>
          )}
        </div>

        {/* Content - Scrollable if needed but designed to fit */}
        <div className="p-3 overflow-y-auto flex-1">
          {step === 'curse' ? (
            renderCurseSelection()
          ) : actionType === 'none' ? (
            <p className="text-center text-sts-light/70 text-sm">
              This blessing has been applied automatically!
            </p>
          ) : actionType.includes('choose') && actionType.includes('card') ? (
            renderCardSelection()
          ) : actionType.includes('relic') ? (
            renderRelicSelection()
          ) : actionType === 'choose_potions' ? (
            renderPotionSelection()
          ) : (
            renderDeckCardSelection()
          )}
        </div>

        {/* Actions - Compact */}
        <div className="p-3 border-t border-sts-light/10 flex gap-3 flex-shrink-0">
          <button
            onClick={step === 'curse' ? () => setStep('main') : onCancel}
            className="flex-1 px-4 py-2 bg-sts-darker border-2 border-sts-light/30 hover:border-sts-light/60 rounded text-sts-light transition-all text-sm"
          >
            {step === 'curse' ? '← Back' : 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm()}
            className={`flex-1 px-4 py-2 rounded font-bold text-sm transition-all ${
              canConfirm()
                ? 'bg-gradient-to-b from-sts-gold to-sts-bronze text-sts-darkest hover:scale-105 shadow-sts'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            {step === 'curse' ? 'Confirm Selection' : blessingAddsCurse(blessing) ? 'Continue →' : 'Confirm Selection'}
          </button>
        </div>
      </div>
    </div>
  );
}

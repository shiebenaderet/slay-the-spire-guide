import { useState } from 'react';
import { AutocompleteInput } from './AutocompleteInput';
import cardsData from '../data/cards.json';
import relicsData from '../data/relics.json';

interface DeckEditModalProps {
  character: string;
  deck: string[];
  relics: string[];
  onUpdateDeck: (newDeck: string[]) => void;
  onUpdateRelics: (newRelics: string[]) => void;
  onClose: () => void;
}

export function DeckEditModal({
  character,
  deck,
  relics,
  onUpdateDeck,
  onUpdateRelics,
  onClose,
}: DeckEditModalProps) {
  const [editedDeck, setEditedDeck] = useState<string[]>([...deck]);
  const [editedRelics, setEditedRelics] = useState<string[]>([...relics]);
  const [activeTab, setActiveTab] = useState<'deck' | 'relics'>('deck');
  const [newCards, setNewCards] = useState<string[]>([]);
  const [newRelicsToAdd, setNewRelicsToAdd] = useState<string[]>([]);

  // Get all card names for autocomplete
  const availableCards = cardsData
    .filter((c: any) => c.character === character.toLowerCase() || c.character === 'colorless')
    .map((c: any) => c.name);

  const availableRelics = relicsData.map((r: any) => r.name);

  const handleRemoveCard = (index: number) => {
    const newDeck = editedDeck.filter((_, i) => i !== index);
    setEditedDeck(newDeck);
  };

  const handleToggleUpgrade = (index: number) => {
    const newDeck = [...editedDeck];
    const card = newDeck[index];
    if (card.endsWith('+')) {
      newDeck[index] = card.slice(0, -1); // Remove +
    } else {
      newDeck[index] = card + '+'; // Add +
    }
    setEditedDeck(newDeck);
  };

  const handleAddCards = () => {
    setEditedDeck([...editedDeck, ...newCards]);
    setNewCards([]);
  };

  const handleRemoveRelic = (index: number) => {
    const newRelics = editedRelics.filter((_, i) => i !== index);
    setEditedRelics(newRelics);
  };

  const handleAddRelics = () => {
    setEditedRelics([...editedRelics, ...newRelicsToAdd]);
    setNewRelicsToAdd([]);
  };

  const handleSave = () => {
    onUpdateDeck(editedDeck);
    onUpdateRelics(editedRelics);
    onClose();
  };

  // Count card occurrences
  const cardCounts = editedDeck.reduce((acc, card) => {
    acc[card] = (acc[card] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueCards = Object.keys(cardCounts).sort();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-sts-dark border-2 border-sts-gold/40 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-sts-light/20">
          <h2 className="text-2xl font-bold text-sts-gold">Edit Deck & Relics</h2>
          <p className="text-sm text-sts-light/70 mt-1">
            Manually fix any tracking errors
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-sts-light/20">
          <button
            onClick={() => setActiveTab('deck')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeTab === 'deck'
                ? 'bg-sts-gold/20 text-sts-gold border-b-2 border-sts-gold'
                : 'text-sts-light/70 hover:bg-sts-darker'
            }`}
          >
            Deck ({editedDeck.length} cards)
          </button>
          <button
            onClick={() => setActiveTab('relics')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeTab === 'relics'
                ? 'bg-sts-gold/20 text-sts-gold border-b-2 border-sts-gold'
                : 'text-sts-light/70 hover:bg-sts-darker'
            }`}
          >
            Relics ({editedRelics.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'deck' ? (
            <div className="space-y-6">
              {/* Current Deck */}
              <div>
                <h3 className="text-lg font-bold text-sts-light mb-3">Current Deck</h3>
                <div className="space-y-2">
                  {uniqueCards.map((card) => (
                    <div
                      key={card}
                      className="flex items-center justify-between p-3 bg-sts-darker border border-sts-light/20 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold ${card.endsWith('+') ? 'text-green-400' : 'text-sts-light'}`}>
                          {card}
                        </span>
                        <span className="text-sm text-sts-light/60">×{cardCounts[card]}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const index = editedDeck.indexOf(card);
                            handleToggleUpgrade(index);
                          }}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                            card.endsWith('+')
                              ? 'bg-green-900/40 text-green-300 hover:bg-green-900/60'
                              : 'bg-sts-dark border border-sts-light/40 text-sts-light/70 hover:border-sts-gold'
                          }`}
                        >
                          {card.endsWith('+') ? 'Upgraded' : 'Upgrade'}
                        </button>
                        <button
                          onClick={() => {
                            const index = editedDeck.indexOf(card);
                            handleRemoveCard(index);
                          }}
                          className="px-3 py-1 bg-red-900/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded text-xs font-semibold"
                        >
                          Remove 1
                        </button>
                      </div>
                    </div>
                  ))}
                  {editedDeck.length === 0 && (
                    <p className="text-sts-light/50 text-center py-8">Deck is empty</p>
                  )}
                </div>
              </div>

              {/* Add Cards */}
              <div>
                <h3 className="text-lg font-bold text-sts-light mb-3">Add Cards</h3>
                <AutocompleteInput
                  type="card"
                  values={newCards}
                  onChange={setNewCards}
                  placeholder="Type card name..."
                  suggestions={availableCards}
                />
                {newCards.length > 0 && (
                  <button
                    onClick={handleAddCards}
                    className="mt-3 w-full px-4 py-2 bg-sts-gold hover:bg-sts-gold/80 text-sts-dark font-semibold rounded"
                  >
                    Add {newCards.length} Card{newCards.length > 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Relics */}
              <div>
                <h3 className="text-lg font-bold text-sts-light mb-3">Current Relics</h3>
                <div className="space-y-2">
                  {editedRelics.map((relic, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-sts-darker border border-sts-light/20 rounded"
                    >
                      <span className="font-semibold text-sts-light">{relic}</span>
                      <button
                        onClick={() => handleRemoveRelic(index)}
                        className="px-3 py-1 bg-red-900/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded text-xs font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {editedRelics.length === 0 && (
                    <p className="text-sts-light/50 text-center py-8">No relics</p>
                  )}
                </div>
              </div>

              {/* Add Relics */}
              <div>
                <h3 className="text-lg font-bold text-sts-light mb-3">Add Relics</h3>
                <AutocompleteInput
                  type="relic"
                  values={newRelicsToAdd}
                  onChange={setNewRelicsToAdd}
                  placeholder="Type relic name..."
                  suggestions={availableRelics}
                />
                {newRelicsToAdd.length > 0 && (
                  <button
                    onClick={handleAddRelics}
                    className="mt-3 w-full px-4 py-2 bg-sts-gold hover:bg-sts-gold/80 text-sts-dark font-semibold rounded"
                  >
                    Add {newRelicsToAdd.length} Relic{newRelicsToAdd.length > 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-sts-light/20 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-sts-darker border border-sts-light/40 text-sts-light hover:border-sts-light/60 rounded font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-sts-gold hover:bg-sts-gold/80 text-sts-dark font-bold rounded"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { Potion, CharacterType } from '../types';
import potionsData from '../data/potions.json';

interface PotionPickerProps {
  character: CharacterType;
  onAddPotion: (potion: Potion) => void;
  maxSlots: number;
  currentPotions: Potion[];
}

export function PotionPicker({ character, onAddPotion, maxSlots, currentPotions }: PotionPickerProps) {
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  const availablePotions = (potionsData as Potion[]).filter(
    (potion) => potion.character === character || potion.character === 'shared'
  );

  const filteredPotions = availablePotions.filter((potion) => {
    const matchesRarity =
      selectedRarity === 'all' || potion.rarity === selectedRarity;
    return matchesRarity;
  });

  const handleAddPotion = (potion: Potion) => {
    if (currentPotions.length >= maxSlots) {
      alert(`Potion slots full (${maxSlots}/${maxSlots})! Use or discard a potion first.`);
      return;
    }
    onAddPotion(potion);
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'text-white',
      uncommon: 'text-blue-400',
      rare: 'text-yellow-500',
    };
    return colors[rarity as keyof typeof colors] || 'text-gray-400';
  };

  const getRarityBorder = (rarity: string) => {
    const colors = {
      common: 'border-l-white',
      uncommon: 'border-l-blue-400',
      rare: 'border-l-yellow-500',
    };
    return colors[rarity as keyof typeof colors] || 'border-l-gray-400';
  };

  const isFull = currentPotions.length >= maxSlots;

  return (
    <div className="bg-sts-dark rounded-lg p-4">
      <h2 className="text-2xl font-bold text-sts-light mb-4">Add Potion</h2>

      {isFull && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded">
          <p className="text-sm text-yellow-300">
            ⚠️ Potion slots full ({currentPotions.length}/{maxSlots})! Use or discard a potion before adding more.
          </p>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select
          value={selectedRarity}
          onChange={(e) => setSelectedRarity(e.target.value)}
          className="w-full bg-sts-darker text-sts-light px-3 py-2 rounded border border-sts-light/20 focus:border-sts-light/50 focus:outline-none"
        >
          <option value="all">All Rarities</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
        </select>
      </div>

      {/* Potions List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredPotions.map((potion) => (
          <div
            key={potion.id}
            className={`bg-sts-darker rounded border-l-4 ${getRarityBorder(potion.rarity)}`}
          >
            <div className="p-3 flex gap-3 items-start">
              {/* Potion Icon Placeholder */}
              <div className="w-12 h-12 bg-sts-light/10 rounded flex items-center justify-center flex-shrink-0 text-2xl">
                🧪
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sts-light font-semibold">{potion.name}</span>
                  <span className={`text-xs ${getRarityColor(potion.rarity)} flex-shrink-0`}>
                    {potion.rarity}
                  </span>
                </div>
                <p className="text-sm text-sts-light/80 mb-1">{potion.description}</p>
                <p className="text-xs text-blue-400 mb-1">
                  <strong>Effect:</strong> {potion.effect}
                </p>
                <p className="text-xs text-green-400 italic">
                  💡 <strong>When to use:</strong> {potion.useCase}
                </p>
              </div>
              <button
                onClick={() => handleAddPotion(potion)}
                disabled={isFull}
                className={`px-3 py-1 text-sm ${
                  isFull
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white rounded flex-shrink-0`}
              >
                Add
              </button>
            </div>
          </div>
        ))}
        {filteredPotions.length === 0 && (
          <p className="text-sts-light/60 text-center">No potions found</p>
        )}
      </div>
    </div>
  );
}

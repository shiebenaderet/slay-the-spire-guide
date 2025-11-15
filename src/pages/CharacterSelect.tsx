import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import type { CharacterType, Relic } from '../types';
import packageJson from '../../package.json';

const characters: Array<{
  id: CharacterType;
  name: string;
  description: string;
  color: string;
  borderColor: string;
  startingHP: number;
  startingRelic: string;
  relicDescription: string;
}> = [
  {
    id: 'ironclad',
    name: 'The Ironclad',
    description: 'A battle-hardened warrior. Focuses on strength and powerful attacks.',
    color: 'bg-ironclad hover:bg-red-700',
    borderColor: 'border-red-500',
    startingHP: 80,
    startingRelic: 'Burning Blood',
    relicDescription: 'At the end of combat, heal 6 HP.',
  },
  {
    id: 'silent',
    name: 'The Silent',
    description: 'A deadly huntress. Employs poison and cards that cost 0.',
    color: 'bg-silent hover:bg-green-700',
    borderColor: 'border-green-500',
    startingHP: 70,
    startingRelic: 'Ring of the Snake',
    relicDescription: 'At the start of each combat, draw 2 additional cards.',
  },
  {
    id: 'defect',
    name: 'The Defect',
    description: 'A sentient automaton. Channels powerful orbs of energy.',
    color: 'bg-defect hover:bg-blue-700',
    borderColor: 'border-blue-500',
    startingHP: 75,
    startingRelic: 'Cracked Core',
    relicDescription: 'At the start of each combat, channel 1 Lightning.',
  },
  {
    id: 'watcher',
    name: 'The Watcher',
    description: 'A calculating monastic. Switches between different stances.',
    color: 'bg-watcher hover:bg-purple-700',
    borderColor: 'border-purple-500',
    startingHP: 72,
    startingRelic: 'Pure Water',
    relicDescription: 'At the start of each combat, add a Miracle to your hand.',
  },
];

export function CharacterSelect() {
  const navigate = useNavigate();
  const { setCharacter, setAscension, setStartingRelic, statistics } = useGameStore();
  const [selectedAscension, setSelectedAscension] = useState(0);

  const handleCharacterSelect = (character: CharacterType) => {
    // Find the selected character data
    const selectedChar = characters.find(c => c.id === character);

    if (selectedChar) {
      // Map character to their starter relic ID
      const starterRelicIds = {
        ironclad: 'burning_blood',
        silent: 'ring_of_the_snake',
        defect: 'cracked_core',
        watcher: 'pure_water',
      };

      // Create the starting relic object
      const startingRelic: Relic = {
        id: starterRelicIds[character],
        name: selectedChar.startingRelic,
        rarity: 'starter',
        character: character,
        description: selectedChar.relicDescription,
        tier: 5, // Starting relics are always top tier
        synergies: [], // Starting relics don't need specific synergies
      };

      // Set character, ascension, and starting relic
      setCharacter(character);
      setAscension(selectedAscension);
      setStartingRelic(startingRelic);
    }

    navigate('/starting-choice');
  };

  const getModifiedHP = (baseHP: number, charId: CharacterType) => {
    let maxHP = baseHP;

    // Ascension 14+ reduces max HP (Ironclad: -5, others: -4)
    if (selectedAscension >= 14) {
      const hpReduction = charId === 'ironclad' ? 5 : 4;
      maxHP -= hpReduction;
    }

    return maxHP;
  };

  const getCurrentHP = (baseHP: number, charId: CharacterType) => {
    const maxHP = getModifiedHP(baseHP, charId);

    // Ascension 6+ starts damaged (lose 10% of max HP, rounded down)
    if (selectedAscension >= 6) {
      const hpLoss = Math.floor(maxHP * 0.1);
      return maxHP - hpLoss;
    }

    return maxHP;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sts-darkest via-sts-darker to-sts-dark flex flex-col items-center justify-center p-4">
      <div className="max-w-7xl w-full">
        <h1 className="text-6xl font-bold text-center mb-2 text-sts-light drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
          Slay the Spire
        </h1>
        <h2 className="text-2xl font-semibold text-center mb-2 text-sts-gold">
          Run Tracker & Advisor
        </h2>
        <p className="text-sm text-center mb-2 text-sts-light/50">
          v{packageJson.version}
        </p>
        <p className="text-lg text-center mb-12 text-sts-light/70">
          Select Your Character
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          {characters.map((char) => (
            <button
              key={char.id}
              onClick={() => handleCharacterSelect(char.id)}
              className={`bg-sts-dark text-white rounded-lg shadow-sts-xl transition-all transform hover:scale-105 hover:shadow-sts-xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-${char.id}/50 border-3 ${char.borderColor} overflow-hidden group`}
            >
              {/* Character Portrait */}
              <div className={`${char.color} h-56 flex items-center justify-center relative overflow-hidden group-hover:brightness-110 transition-all`}>
                <img
                  src={`/images/characters/${char.id}Portrait.jpg`}
                  alt={char.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />

                {/* Stats Badge */}
                {statistics[char.id].totalRuns > 0 && (
                  <div className="absolute top-3 left-3 bg-black/90 px-2 py-1 rounded border border-sts-gold/50 shadow-sts">
                    <div className="text-[10px] text-sts-gold font-bold">
                      A{statistics[char.id].highestAscension} | {statistics[char.id].winRate}% WR
                    </div>
                    <div className="text-[9px] text-sts-light/70">
                      {statistics[char.id].wins}W-{statistics[char.id].losses}L
                    </div>
                  </div>
                )}

                <div className="absolute bottom-3 right-3 bg-black/80 px-4 py-2 rounded-lg text-base font-bold border-2 border-sts-gold/50 shadow-sts">
                  {getCurrentHP(char.startingHP, char.id)}/{getModifiedHP(char.startingHP, char.id)} HP
                  {selectedAscension >= 6 && (
                    <span className="text-red-400 ml-1 text-xs">(-{getModifiedHP(char.startingHP, char.id) - getCurrentHP(char.startingHP, char.id)})</span>
                  )}
                </div>
              </div>

              {/* Character Info */}
              <div className="p-5 text-left bg-gradient-to-b from-sts-dark to-sts-darker">
                <h2 className="text-2xl font-bold mb-2 text-sts-light">{char.name}</h2>
                <p className="text-sm text-sts-light/80 mb-4 leading-relaxed">{char.description}</p>

                {/* Starting Relic Info */}
                <div className="bg-sts-darkest p-3 rounded-lg border-2 border-sts-gold/40 shadow-sts">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2.5 h-2.5 bg-sts-gold rounded-full shadow-lg"></div>
                    <h3 className="text-sm font-bold text-sts-gold">
                      {char.startingRelic}
                    </h3>
                  </div>
                  <p className="text-xs text-sts-light/80 leading-relaxed">
                    {char.relicDescription}
                  </p>
                </div>

                {/* Stats */}
                <div className="mt-4 flex justify-between items-center text-xs">
                  <span className="text-sts-light/70 font-medium">
                    Starting HP: {getCurrentHP(char.startingHP, char.id)}/{getModifiedHP(char.startingHP, char.id)}
                    {selectedAscension >= 6 && (
                      <span className="text-red-400"> (base: {char.startingHP})</span>
                    )}
                  </span>
                  <span className="text-sts-gold font-semibold group-hover:translate-x-1 transition-transform">
                    Select →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Ascension Selector - Simple */}
        <div className="mb-12 max-w-md mx-auto">
          <div className="bg-sts-dark border-2 border-sts-gold/40 rounded-lg p-4 shadow-sts-lg">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label htmlFor="ascension-input" className="text-base font-bold text-sts-gold mb-1 block">
                  Ascension Level (0-20)
                </label>
                <p className="text-xs text-sts-light/60">
                  {selectedAscension === 0 && 'Standard difficulty'}
                  {selectedAscension > 0 && selectedAscension < 10 && 'Increased difficulty'}
                  {selectedAscension >= 10 && selectedAscension < 15 && 'High difficulty'}
                  {selectedAscension >= 15 && 'Extreme difficulty'}
                </p>
              </div>

              <input
                id="ascension-input"
                type="number"
                min="0"
                max="20"
                value={selectedAscension === 0 ? '' : selectedAscension}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setSelectedAscension(Math.max(0, Math.min(20, val)));
                }}
                placeholder="0"
                className="w-20 h-12 bg-sts-darkest text-sts-gold text-center font-bold text-2xl rounded border-2 border-sts-gold/60 focus:border-sts-gold focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sts-light/60 text-base leading-relaxed">
            Track your deck, relics, and get AI-powered card recommendations for optimal runs
          </p>
        </div>
      </div>
    </div>
  );
}

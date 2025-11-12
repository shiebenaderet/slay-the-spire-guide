import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

interface RunCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RunCompletionModal({ isOpen, onClose }: RunCompletionModalProps) {
  const navigate = useNavigate();
  const { stats, deck, character, recordRunCompletion, resetRun } = useGameStore();

  if (!isOpen) return null;

  const handleComplete = (isWin: boolean) => {
    recordRunCompletion(isWin);
    resetRun();
    onClose();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-sts-darker border-2 border-sts-gold rounded-lg p-6 max-w-md w-full shadow-sts-xl">
        <h2 className="text-2xl font-bold text-sts-gold mb-4 text-center">
          Run Complete!
        </h2>

        <div className="bg-sts-dark rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sts-light">
            <span className="text-sts-light/70">Character:</span>
            <span className="font-semibold capitalize">{character}</span>
          </div>
          <div className="flex justify-between text-sts-light">
            <span className="text-sts-light/70">Floor Reached:</span>
            <span className="font-semibold">{stats.floorNumber}</span>
          </div>
          <div className="flex justify-between text-sts-light">
            <span className="text-sts-light/70">Ascension:</span>
            <span className="font-semibold">{stats.ascensionLevel}</span>
          </div>
          <div className="flex justify-between text-sts-light">
            <span className="text-sts-light/70">Final HP:</span>
            <span className="font-semibold">{stats.currentHP} / {stats.maxHP}</span>
          </div>
          <div className="flex justify-between text-sts-light">
            <span className="text-sts-light/70">Deck Size:</span>
            <span className="font-semibold">{deck.length} cards</span>
          </div>
        </div>

        <p className="text-center text-sts-light mb-4">
          How did your run end?
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleComplete(true)}
            className="py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition-colors"
          >
            Victory!
          </button>
          <button
            onClick={() => handleComplete(false)}
            className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition-colors"
          >
            Defeat
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { AutocompleteInput } from './AutocompleteInput';
import {
  evaluateShopPurchases,
  generateShopStrategy,
  getRemovalPriority,
  type CardForSale,
  type RelicForSale,
  type ShopRecommendation,
} from '../utils/shopAdvisor';

interface ShopFlowProps {
  floor: number;
  deck: string[];
  relics: string[];
  character: string;
  currentHP: number;
  maxHP: number;
  gold: number;
  ascension: number;
  onComplete: (purchased: string[], removed: string[], goldSpent: number) => void;
}

export function ShopFlow({
  floor,
  deck,
  relics,
  character,
  currentHP,
  maxHP,
  gold,
  ascension,
  onComplete,
}: ShopFlowProps) {
  const [step, setStep] = useState<'enter-shop' | 'show-recommendations'>('enter-shop');
  const [cardsForSale, setCardsForSale] = useState<string[]>([]);
  const [relicsForSale, setRelicsForSale] = useState<string[]>([]);
  const [purchased, setPurchased] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [goldSpent, setGoldSpent] = useState(0);

  const act = floor <= 16 ? 1 : floor <= 33 ? 2 : 3;
  const upcomingBoss = act === 1 ? 'Hexaghost' : act === 2 ? 'Bronze Automaton' : 'Time Eater';
  let upcomingElites = 3;
  if (act === 1) {
    if (floor >= 14) upcomingElites = 0;
    else if (floor >= 10) upcomingElites = 1;
    else if (floor >= 6) upcomingElites = 2;
  } else if (act === 2) {
    if (floor >= 30) upcomingElites = 0;
    else if (floor >= 26) upcomingElites = 1;
    else if (floor >= 22) upcomingElites = 2;
  } else {
    if (floor >= 48) upcomingElites = 0;
    else if (floor >= 44) upcomingElites = 1;
    else if (floor >= 40) upcomingElites = 2;
  }

  const handleShopEntered = () => {
    setStep('show-recommendations');
  };

  const handleComplete = () => {
    onComplete(purchased, removed, goldSpent);
  };

  const togglePurchase = (item: string, cost: number) => {
    if (purchased.includes(item)) {
      setPurchased(purchased.filter(p => p !== item));
      setGoldSpent(goldSpent - cost);
    } else {
      setPurchased([...purchased, item]);
      setGoldSpent(goldSpent + cost);
    }
  };

  const toggleRemoval = (card: string, cost: number) => {
    if (removed.includes(card)) {
      setRemoved(removed.filter(r => r !== card));
      setGoldSpent(goldSpent - cost);
    } else {
      setRemoved([...removed, card]);
      setGoldSpent(goldSpent + cost);
    }
  };

  // Step 1: Enter shop contents
  if (step === 'enter-shop') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-sts-gold mb-2">Shop Contents</h2>
          <p className="text-sm text-sts-light/70 mb-4">
            Enter what's available in the shop (optional - enter as many or as few as you want)
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-sts-light mb-2">
                Cards for Sale
              </label>
              <AutocompleteInput
                type="card"
                values={cardsForSale}
                onChange={setCardsForSale}
                placeholder="Type card name..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-sts-light mb-2">
                Relics for Sale
              </label>
              <AutocompleteInput
                type="relic"
                values={relicsForSale}
                onChange={setRelicsForSale}
                placeholder="Type relic name..."
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-sts-light/70">
            <p><strong>Your gold:</strong> {gold}</p>
            {cardsForSale.length > 0 && <p><strong>Cards:</strong> {cardsForSale.join(', ')}</p>}
            {relicsForSale.length > 0 && <p><strong>Relics:</strong> {relicsForSale.join(', ')}</p>}
          </div>
        </div>

        <button
          onClick={handleShopEntered}
          className="w-full py-3 bg-sts-gold hover:bg-sts-gold/80 text-sts-dark font-bold rounded transition-colors"
        >
          Get Recommendations
        </button>
      </div>
    );
  }

  // Step 2: Show recommendations
  const cardsSale: CardForSale[] = cardsForSale.map(card => ({
    card,
    cost: 50, // Default shop price (user can adjust if needed)
  }));

  const relicsSale: RelicForSale[] = relicsForSale.map(relic => ({
    relic,
    cost: 150, // Default shop price
  }));

  const recommendations = evaluateShopPurchases(cardsSale, relicsSale, {
    character,
    act,
    floor,
    deck,
    relics,
    currentHP,
    maxHP,
    gold,
    ascension,
    upcomingElites,
    upcomingBoss,
  });

  const strategy = generateShopStrategy(recommendations, gold, act);
  const removals = getRemovalPriority(deck, relics, gold, act);

  const remainingGold = gold - goldSpent;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-sts-gold mb-2">Shop Recommendations</h2>
        <div className="flex gap-4 text-sm text-sts-light/70 mb-4">
          <span>Gold: {gold}</span>
          <span className={goldSpent > 0 ? 'text-yellow-400' : ''}>
            Spending: {goldSpent}
          </span>
          <span className={remainingGold < 0 ? 'text-red-400' : ''}>
            Remaining: {remainingGold}
          </span>
        </div>

        {/* Strategy Summary */}
        <div className="mb-6 p-4 bg-blue-900/30 border-2 border-blue-500/60 rounded-lg">
          <h3 className="text-lg font-bold text-blue-400 mb-2">💡 Strategy</h3>
          <div className="text-sm text-sts-light whitespace-pre-line">{strategy}</div>
        </div>

        {/* Removal Options */}
        {removals.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-sts-light mb-3">Card Removal (75g each)</h3>
            <div className="space-y-2">
              {removals.slice(0, 3).map((removal, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded border-2 ${
                    removal.priority === 'critical'
                      ? 'bg-red-900/20 border-red-500/40'
                      : removal.priority === 'high'
                      ? 'bg-yellow-900/20 border-yellow-500/40'
                      : 'bg-sts-darker border-sts-light/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sts-light">
                        {removal.card}
                        <span
                          className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                            removal.priority === 'critical'
                              ? 'bg-red-900/40 text-red-300'
                              : removal.priority === 'high'
                              ? 'bg-yellow-900/40 text-yellow-300'
                              : 'bg-blue-900/40 text-blue-300'
                          }`}
                        >
                          {removal.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-sts-light/70 mt-1">{removal.reasoning}</div>
                    </div>
                    <button
                      onClick={() => toggleRemoval(removal.card, 75)}
                      disabled={!removal.costWorth && !removed.includes(removal.card)}
                      className={`px-4 py-2 rounded font-semibold transition-colors ${
                        removed.includes(removal.card)
                          ? 'bg-sts-gold text-sts-dark'
                          : 'bg-sts-dark border-2 border-sts-light/40 text-sts-light hover:border-sts-gold disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {removed.includes(removal.card) ? '✓ Removed' : 'Remove'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Purchase Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-sts-light mb-3">Purchase Options</h3>
            <div className="space-y-2">
              {recommendations
                .filter(r => r.action !== 'remove-card' && r.priority !== 'skip')
                .slice(0, 5)
                .map((rec, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border-2 ${
                      rec.priority === 'must-buy'
                        ? 'bg-green-900/20 border-green-500/40'
                        : rec.priority === 'strong-buy'
                        ? 'bg-blue-900/20 border-blue-500/40'
                        : 'bg-sts-darker border-sts-light/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sts-light">{rec.item}</span>
                          <span className="text-sm text-sts-light/70">({rec.cost}g)</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              rec.priority === 'must-buy'
                                ? 'bg-green-900/40 text-green-300'
                                : rec.priority === 'strong-buy'
                                ? 'bg-blue-900/40 text-blue-300'
                                : 'bg-yellow-900/40 text-yellow-300'
                            }`}
                          >
                            {rec.priority === 'must-buy' ? 'MUST BUY' : rec.priority === 'strong-buy' ? 'STRONG' : 'CONSIDER'}
                          </span>
                        </div>
                        <div className="text-xs text-sts-light/70 mt-1 space-y-0.5">
                          {rec.reasoning.slice(0, 2).map((reason, i) => (
                            <div key={i}>{reason}</div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => togglePurchase(rec.item!, rec.cost)}
                        disabled={remainingGold < rec.cost && !purchased.includes(rec.item!)}
                        className={`px-4 py-2 rounded font-semibold transition-colors ml-4 ${
                          purchased.includes(rec.item!)
                            ? 'bg-sts-gold text-sts-dark'
                            : 'bg-sts-dark border-2 border-sts-light/40 text-sts-light hover:border-sts-gold disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        {purchased.includes(rec.item!) ? '✓ Bought' : 'Buy'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setStep('enter-shop')}
          className="flex-1 py-3 bg-sts-darker hover:bg-sts-dark border-2 border-sts-light/20 text-sts-light font-semibold rounded transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleComplete}
          className="flex-1 py-3 bg-sts-gold hover:bg-sts-gold/80 text-sts-dark font-bold rounded transition-colors"
        >
          Leave Shop
        </button>
      </div>
    </div>
  );
}

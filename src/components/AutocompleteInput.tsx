import { useState, useRef, useEffect } from 'react';

interface AutocompleteInputProps {
  type: 'card' | 'enemy' | 'relic' | 'potion';
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  suggestions?: string[];  // Optional pre-filtered suggestions (e.g., current deck for hand input)
}

// Common enemy names
const ENEMY_NAMES = [
  'Cultist', 'Jaw Worm', 'Acid Slime (S)', 'Acid Slime (M)', 'Acid Slime (L)', 'Spike Slime (S)', 'Spike Slime (M)',
  'Louse', 'Fungi Beast', 'Fat Gremlin', 'Mad Gremlin', 'Sneaky Gremlin', 'Gremlin Wizard', 'Shield Gremlin',
  'Lagavulin', 'Gremlin Nob', 'Sentry', 'Sentries',
  'Chosen', 'Bronze Automaton', 'Lagavulin (Elite)', 'Gremlin Leader', 'Book of Stabbing',
  'Hexaghost', 'Slime Boss', 'The Guardian',
];

export function AutocompleteInput({
  type,
  values,
  onChange,
  placeholder = 'Type to add...',
  suggestions = [],
}: AutocompleteInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredSuggestions([]);
      return;
    }

    const query = inputValue.toLowerCase();
    let allSuggestions: string[] = [];

    // Get suggestions based on type
    if (type === 'enemy') {
      allSuggestions = ENEMY_NAMES;
    } else if (type === 'card' && suggestions.length > 0) {
      allSuggestions = suggestions;  // Use provided deck
    }

    // Filter suggestions
    const filtered = allSuggestions
      .filter((s) => s.toLowerCase().includes(query))
      .slice(0, 10);

    setFilteredSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [inputValue, type, suggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (inputValue.trim()) {
        // If there's exactly one suggestion, use it
        if (filteredSuggestions.length === 1) {
          addValue(filteredSuggestions[0]);
        } else if (filteredSuggestions.length > 1) {
          // Multiple matches - don't add, let user select from dropdown
          return;
        } else {
          // No suggestions - check if input exactly matches a valid option (case-insensitive)
          const exactMatch = suggestions.find(
            s => s.toLowerCase() === inputValue.trim().toLowerCase()
          );
          if (exactMatch) {
            addValue(exactMatch);
          }
          // If no match, do nothing (don't add invalid text)
        }
      }
    } else if (e.key === 'Backspace' && !inputValue && values.length > 0) {
      // Remove last value if backspace on empty input
      const newValues = [...values];
      newValues.pop();
      onChange(newValues);
    }
  };

  const addValue = (value: string) => {
    // Always allow adding (including duplicates like multiple Strikes)
    onChange([...values, value]);
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeValue = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
    inputRef.current?.focus();
  };

  const selectSuggestion = (suggestion: string) => {
    addValue(suggestion);
  };

  return (
    <div className="relative">
      {/* Value chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {values.map((value, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-sts-gold/20 border border-sts-gold/40 rounded text-sm text-sts-light"
          >
            <span>{value}</span>
            <button
              onClick={() => removeValue(index)}
              className="text-sts-light/70 hover:text-sts-light"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setShowSuggestions(filteredSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-sts-darker border-2 border-sts-light/20 rounded text-sts-light placeholder-sts-light/40 focus:border-sts-gold focus:outline-none"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-sts-dark border-2 border-sts-gold/40 rounded shadow-lg max-h-60 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => selectSuggestion(suggestion)}
                className="w-full px-4 py-2 text-left text-sts-light hover:bg-sts-gold/20 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-sts-light/60">
        Press <kbd className="px-1.5 py-0.5 bg-sts-darker border border-sts-light/20 rounded text-xs">Tab</kbd> or <kbd className="px-1.5 py-0.5 bg-sts-darker border border-sts-light/20 rounded text-xs">Enter</kbd> to add
      </p>
    </div>
  );
}

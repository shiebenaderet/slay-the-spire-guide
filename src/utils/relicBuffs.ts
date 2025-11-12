import type { Relic } from '../types';

export interface RelicBuffs {
  strength: number;
  dexterity: number;
  startingBlock: number;
  notes: string[];
}

/**
 * Calculate passive buffs provided by relics at the start of combat
 */
export function calculateRelicBuffs(relics: Relic[], currentHP: number, maxHP: number): RelicBuffs {
  const buffs: RelicBuffs = {
    strength: 0,
    dexterity: 0,
    startingBlock: 0,
    notes: [],
  };

  const relicIds = new Set(relics.map(r => r.id));

  // Vajra: +1 Strength at start of combat
  if (relicIds.has('vajra')) {
    buffs.strength += 1;
    buffs.notes.push('Vajra: +1 Strength');
  }

  // Oddly Smooth Stone: +1 Dexterity at start of combat
  if (relicIds.has('oddly_smooth_stone')) {
    buffs.dexterity += 1;
    buffs.notes.push('Oddly Smooth Stone: +1 Dexterity');
  }

  // Red Skull: +3 Strength when HP ≤ 50%
  if (relicIds.has('red_skull') && currentHP <= maxHP * 0.5) {
    buffs.strength += 3;
    buffs.notes.push('Red Skull: +3 Strength (HP ≤ 50%)');
  }

  // Anchor: +10 Block at start of combat
  if (relicIds.has('anchor')) {
    buffs.startingBlock += 10;
    buffs.notes.push('Anchor: +10 Block');
  }

  return buffs;
}

/**
 * Get a summary string of active buffs
 */
export function getBuffSummary(buffs: RelicBuffs): string {
  const parts: string[] = [];

  if (buffs.strength > 0) {
    parts.push(`+${buffs.strength} Strength`);
  }

  if (buffs.dexterity > 0) {
    parts.push(`+${buffs.dexterity} Dexterity`);
  }

  if (buffs.startingBlock > 0) {
    parts.push(`+${buffs.startingBlock} Block`);
  }

  return parts.length > 0 ? parts.join(', ') : 'None';
}

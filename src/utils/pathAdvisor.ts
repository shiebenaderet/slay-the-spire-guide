import type { Card, CharacterType, Relic } from '../types';
import type { NodeType } from './mapGenerator';
import { analyzeDeck } from './deckAnalyzer';
import { analyzeDeckHealth } from './deckHealth';

export interface PathRecommendation {
  nodeType: NodeType;
  priority: 'avoid' | 'low' | 'neutral' | 'high' | 'critical';
  reason: string;
  riskLevel: 'safe' | 'moderate' | 'risky' | 'dangerous';
}

export interface PathStrategy {
  currentFloor: number;
  act: number;
  floorsUntilBoss: number;
  recommendations: PathRecommendation[];
  generalStrategy: string;
  goals: string[];
  warnings: string[];
}

/**
 * Generate path recommendations based on deck state
 * Critical for A20 route optimization
 */
export function generatePathStrategy(
  deck: Card[],
  relics: Relic[],
  character: CharacterType,
  floor: number,
  currentHP: number,
  maxHP: number,
  gold: number,
  ascensionLevel: number
): PathStrategy {
  const analysis = analyzeDeck(deck);
  const health = analyzeDeckHealth(deck, relics, character, floor, ascensionLevel);

  const act = getAct(floor);
  const floorsUntilBoss = getBossFloor(act) - floor;

  // Generate recommendations for each node type
  const recommendations: PathRecommendation[] = [
    recommendMonster(deck, analysis, health, currentHP, maxHP, floor, floorsUntilBoss),
    recommendElite(deck, analysis, health, relics, currentHP, maxHP, floor, floorsUntilBoss),
    recommendEvent(deck, analysis, currentHP, maxHP, gold, floor),
    recommendShop(deck, analysis, gold, floor, floorsUntilBoss),
    recommendRest(currentHP, maxHP, floor, floorsUntilBoss),
  ];

  const generalStrategy = getGeneralStrategy(health, currentHP, maxHP, floorsUntilBoss, deck);
  const goals = getPathGoals(health, deck, floor, floorsUntilBoss);
  const warnings = getPathWarnings(health, currentHP, maxHP, floorsUntilBoss);

  return {
    currentFloor: floor,
    act,
    floorsUntilBoss,
    recommendations,
    generalStrategy,
    goals,
    warnings
  };
}

function recommendMonster(
  deck: Card[],
  analysis: any,
  health: any,
  currentHP: number,
  maxHP: number,
  floor: number,
  floorsUntilBoss: number
): PathRecommendation {
  const hpPercent = (currentHP / maxHP) * 100;

  // Always need some hallway fights for cards
  if (deck.length < 20 && health.categories.damage.status === 'critical') {
    return {
      nodeType: 'M',
      priority: 'high',
      reason: 'Need card rewards to build damage output',
      riskLevel: 'moderate'
    };
  }

  // Low HP = avoid combat
  if (hpPercent < 30) {
    return {
      nodeType: 'M',
      priority: 'avoid',
      reason: 'Too low HP - avoid combat, path to rest sites',
      riskLevel: 'dangerous'
    };
  }

  // Near boss = minimize unnecessary fights
  if (floorsUntilBoss <= 3 && hpPercent < 60) {
    return {
      nodeType: 'M',
      priority: 'low',
      reason: 'Boss soon - preserve HP, avoid unnecessary fights',
      riskLevel: 'risky'
    };
  }

  // Good HP and need cards
  if (hpPercent >= 70 && health.overallScore < 70) {
    return {
      nodeType: 'M',
      priority: 'high',
      reason: 'Good HP, deck needs improvement - take hallway fights for cards',
      riskLevel: 'safe'
    };
  }

  return {
    nodeType: 'M',
    priority: 'neutral',
    reason: 'Standard hallway fights for card rewards and gold',
    riskLevel: 'moderate'
  };
}

function recommendElite(
  deck: Card[],
  analysis: any,
  health: any,
  relics: Relic[],
  currentHP: number,
  maxHP: number,
  floor: number,
  floorsUntilBoss: number
): PathRecommendation {
  const hpPercent = (currentHP / maxHP) * 100;
  const deckScore = health.overallScore;
  const act = getAct(floor);

  // Very low HP = absolutely avoid
  if (hpPercent < 40) {
    return {
      nodeType: 'E',
      priority: 'avoid',
      reason: `${currentHP}/${maxHP} HP is too low for elite fights`,
      riskLevel: 'dangerous'
    };
  }

  // Weak deck = risky
  if (deckScore < 50) {
    return {
      nodeType: 'E',
      priority: 'avoid',
      reason: `Deck score ${deckScore}/100 - too weak for elites`,
      riskLevel: 'dangerous'
    };
  }

  // Need relics badly
  const relicCount = relics.length;
  const expectedRelics = Math.floor(floor / 8); // Rough estimate

  if (relicCount < expectedRelics - 2) {
    return {
      nodeType: 'E',
      priority: 'high',
      reason: `Only ${relicCount} relics - critically need elite rewards`,
      riskLevel: hpPercent >= 70 ? 'moderate' : 'risky'
    };
  }

  // Good HP and deck = take elites
  if (hpPercent >= 75 && deckScore >= 70) {
    return {
      nodeType: 'E',
      priority: 'high',
      reason: 'Strong deck + good HP - elites are efficient for relics',
      riskLevel: 'moderate'
    };
  }

  // Near boss with good HP = get one more elite
  if (floorsUntilBoss <= 5 && hpPercent >= 65 && deckScore >= 60) {
    return {
      nodeType: 'E',
      priority: 'neutral',
      reason: 'Can fit one elite before boss for relic',
      riskLevel: 'risky'
    };
  }

  // Act 1: Prioritize elites more (easier, need relics)
  if (act === 1 && hpPercent >= 60 && deckScore >= 55) {
    return {
      nodeType: 'E',
      priority: 'high',
      reason: 'Act 1 elites are manageable - get relics early',
      riskLevel: 'moderate'
    };
  }

  // Act 3: Elites are brutal, be careful
  if (act === 3 && (hpPercent < 70 || deckScore < 70)) {
    return {
      nodeType: 'E',
      priority: 'avoid',
      reason: 'Act 3 elites are deadly - only take if deck is strong',
      riskLevel: 'dangerous'
    };
  }

  return {
    nodeType: 'E',
    priority: 'low',
    reason: 'Elites are risky - only take if you need relics urgently',
    riskLevel: 'risky'
  };
}

function recommendEvent(
  deck: Card[],
  analysis: any,
  currentHP: number,
  maxHP: number,
  gold: number,
  floor: number
): PathRecommendation {
  const hpPercent = (currentHP / maxHP) * 100;

  // Low HP = risky events
  if (hpPercent < 35) {
    return {
      nodeType: '?',
      priority: 'avoid',
      reason: 'Low HP makes event risks dangerous',
      riskLevel: 'risky'
    };
  }

  // Events are great value (free upgrades, transforms, relics)
  if (hpPercent >= 60) {
    return {
      nodeType: '?',
      priority: 'high',
      reason: 'Events offer high value (upgrades, transforms, relics) with manageable risk',
      riskLevel: 'moderate'
    };
  }

  // Need card transforms (too many strikes/defends)
  const basicCount = deck.filter(c =>
    c.id.startsWith('strike_') || c.id.startsWith('defend_')
  ).length;

  if (basicCount >= 7 && floor >= 17) {
    return {
      nodeType: '?',
      priority: 'high',
      reason: `${basicCount} strikes/defends - events can transform them`,
      riskLevel: 'moderate'
    };
  }

  return {
    nodeType: '?',
    priority: 'neutral',
    reason: 'Events provide card upgrades, transforms, and occasional relics',
    riskLevel: 'moderate'
  };
}

function recommendShop(
  deck: Card[],
  analysis: any,
  gold: number,
  floor: number,
  floorsUntilBoss: number
): PathRecommendation {
  // Always high priority if you have gold
  if (gold >= 250) {
    return {
      nodeType: '$',
      priority: 'critical',
      reason: `${gold} gold - can buy key cards/relics or removal`,
      riskLevel: 'safe'
    };
  }

  // Before boss with decent gold
  if (floorsUntilBoss <= 5 && gold >= 150) {
    return {
      nodeType: '$',
      priority: 'high',
      reason: 'Shop before boss for last-minute upgrades',
      riskLevel: 'safe'
    };
  }

  // Need removal
  const cursesAndStatus = deck.filter(c =>
    c.type === 'curse' || c.type === 'status'
  ).length;
  const basicCount = deck.filter(c =>
    c.id.startsWith('strike_') || c.id.startsWith('defend_')
  ).length;

  if ((cursesAndStatus >= 2 || basicCount >= 8) && gold >= 75) {
    return {
      nodeType: '$',
      priority: 'high',
      reason: 'Can afford card removal to thin deck',
      riskLevel: 'safe'
    };
  }

  // Low gold = skip shop
  if (gold < 100) {
    return {
      nodeType: '$',
      priority: 'low',
      reason: `Only ${gold} gold - probably can't afford anything good`,
      riskLevel: 'safe'
    };
  }

  return {
    nodeType: '$',
    priority: 'neutral',
    reason: 'Shops offer cards, relics, and removal',
    riskLevel: 'safe'
  };
}

function recommendRest(
  currentHP: number,
  maxHP: number,
  floor: number,
  floorsUntilBoss: number
): PathRecommendation {
  const hpPercent = (currentHP / maxHP) * 100;

  // Critical HP
  if (hpPercent < 30) {
    return {
      nodeType: 'R',
      priority: 'critical',
      reason: `${currentHP}/${maxHP} HP - MUST rest or you will die`,
      riskLevel: 'safe'
    };
  }

  // Low HP
  if (hpPercent < 50) {
    return {
      nodeType: 'R',
      priority: 'high',
      reason: `${currentHP}/${maxHP} HP - need healing`,
      riskLevel: 'safe'
    };
  }

  // Before boss
  if (floorsUntilBoss <= 3 && hpPercent < 70) {
    return {
      nodeType: 'R',
      priority: 'high',
      reason: 'Boss soon - rest to maximize HP for boss fight',
      riskLevel: 'safe'
    };
  }

  // Good HP but could upgrade
  if (hpPercent >= 80) {
    return {
      nodeType: 'R',
      priority: 'neutral',
      reason: 'Good HP - use rest site for key upgrades',
      riskLevel: 'safe'
    };
  }

  return {
    nodeType: 'R',
    priority: 'neutral',
    reason: 'Rest sites for healing or key card upgrades',
    riskLevel: 'safe'
  };
}

function getGeneralStrategy(
  health: any,
  currentHP: number,
  maxHP: number,
  floorsUntilBoss: number,
  deck: Card[]
): string {
  const hpPercent = (currentHP / maxHP) * 100;

  if (hpPercent < 30) {
    return '🚨 SURVIVAL MODE: Path directly to rest sites, avoid all combat';
  }

  if (health.overallScore < 50) {
    return '⚠️ DECK BUILDING: Prioritize hallways and events for card rewards';
  }

  if (floorsUntilBoss <= 3) {
    return '🎯 BOSS PREP: Minimize risks, prepare deck for boss fight';
  }

  if (health.overallScore >= 75 && hpPercent >= 70) {
    return '💪 AGGRESSIVE: Strong deck + good HP - take elites for relics';
  }

  return '⚖️ BALANCED: Mix of hallways, events, and elites based on HP';
}

function getPathGoals(
  health: any,
  deck: Card[],
  floor: number,
  floorsUntilBoss: number
): string[] {
  const goals: string[] = [];

  // Damage goals
  if (health.categories.damage.status === 'critical') {
    goals.push('🎯 Get 2-3 high-damage attack cards');
  }

  // Defense goals
  if (health.categories.defense.status === 'critical') {
    goals.push('🛡️ Add 3-4 block cards immediately');
  }

  // Scaling goals
  if (health.categories.scaling.status === 'weak' && floorsUntilBoss > 5) {
    goals.push('⚡ Add scaling cards for boss fights');
  }

  // Removal goals
  const basicCount = deck.filter(c =>
    c.id.startsWith('strike_') || c.id.startsWith('defend_')
  ).length;

  if (basicCount >= 7) {
    goals.push(`🗑️ Remove ${Math.min(3, basicCount - 4)} strikes/defends`);
  }

  // Relic goals
  if (floor >= 20 && goals.length < 3) {
    goals.push('💎 Take 1-2 elites for relics');
  }

  // HP goals
  if (goals.length === 0) {
    goals.push('✅ Deck is solid - optimize path for efficiency');
  }

  return goals.slice(0, 4); // Max 4 goals
}

function getPathWarnings(
  health: any,
  currentHP: number,
  maxHP: number,
  floorsUntilBoss: number
): string[] {
  const warnings: string[] = [];
  const hpPercent = (currentHP / maxHP) * 100;

  if (hpPercent < 40 && floorsUntilBoss <= 5) {
    warnings.push('⚠️ Low HP with boss approaching - prioritize rest sites');
  }

  if (health.overallScore < 50 && floorsUntilBoss <= 3) {
    warnings.push('🚨 Weak deck approaching boss - you may not be ready');
  }

  if (health.categories.damage.status === 'critical') {
    warnings.push('⚠️ Damage is critically low - you will struggle in all fights');
  }

  if (health.categories.defense.status === 'critical') {
    warnings.push('⚠️ Defense is critically low - you are taking excessive damage');
  }

  return warnings;
}

function getAct(floor: number): number {
  if (floor <= 51) return 1;
  if (floor <= 85) return 2;
  if (floor <= 119) return 3;
  return 4;
}

function getBossFloor(act: number): number {
  if (act === 1) return 51;
  if (act === 2) return 85;
  if (act === 3) return 119;
  return 126; // Heart
}

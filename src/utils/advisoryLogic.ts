import type { Card, CardAdvice } from '../types';
import { analyzeDeck, type DeckAnalysis } from './deckAnalyzer';

// Re-export for backwards compatibility
export { analyzeDeck };

/**
 * Generates archetype-specific recommendation text for tier 5 cards
 * This replaces generic "TOP-TIER CARD" text with context-aware reasoning
 */
function generateArchetypeReason(card: Card, analysis: DeckAnalysis, deck: Card[]): string {
  const archetypes = analysis.archetypes;

  // CORRUPTION BUILD
  if (archetypes.includes('corruption')) {
    if (card.id === 'barricade') {
      return '💀 CORE BUILD CARD - Essential for your Corruption infinite block strategy';
    }
    if (card.id === 'entrench' && analysis.cardIds.includes('barricade')) {
      return '💀 PERFECT SYNERGY - Doubles your Barricade block for massive defense';
    }
    if (card.type === 'skill' && card.tags.includes('block')) {
      return '💀 AMAZING WITH CORRUPTION - Free block card powers your infinite engine';
    }
    if (card.id === 'dead_branch') {
      return '💀 BUILD ENABLER - Turns your exhausting skills into card advantage';
    }
  }

  // BARRICADE BUILD
  if (archetypes.includes('barricade')) {
    if (card.id === 'entrench') {
      return '🛡️ CORE SYNERGY - Doubles your Barricade block exponentially';
    }
    if (card.id === 'body_slam') {
      return '🛡️ PERFECT FINISHER - Turns your massive block into huge damage';
    }
    if (card.tags.includes('block') && card.type === 'skill') {
      return '🛡️ ESSENTIAL DEFENSE - Your Barricade keeps this block forever';
    }
  }

  // DEAD BRANCH BUILD
  if (archetypes.includes('dead_branch')) {
    if (card.tags.includes('exhaust') || card.id === 'fiend_fire') {
      return '🌿 BUILD SYNERGY - Triggers Dead Branch for free cards';
    }
    if (card.id === 'corruption') {
      return '🌿💀 ARCHETYPE FUSION - Enables Dead Branch + Corruption infinite combo';
    }
  }

  // RUPTURE / SELF-DAMAGE BUILD
  if (archetypes.includes('rupture')) {
    if (card.tags.includes('self-damage') || card.id === 'hemokinesis') {
      return '💪 STRENGTH ENGINE - Powers up your Rupture for massive scaling';
    }
    if (card.id === 'reaper' && analysis.cardIds.includes('rupture')) {
      return '💪 PERFECT SUSTAIN - Heals back all your Rupture self-damage';
    }
  }

  // STRENGTH SCALING BUILD
  if (archetypes.includes('strength')) {
    if (card.tags.includes('multi-hit')) {
      return '⚔️ STRENGTH MULTIPLIER - Each hit scales with your strength cards';
    }
    if (card.id === 'limit_break') {
      return '⚔️ EXPONENTIAL SCALING - Doubles your accumulated strength';
    }
    if (card.id === 'reaper') {
      return '⚔️ STRENGTH SUSTAIN - Heals more with your strength scaling';
    }
  }

  // POISON BUILD (SILENT)
  if (archetypes.includes('poison')) {
    if (card.tags.includes('poison')) {
      const poisonCount = deck.filter(c => c.tags.includes('poison')).length;
      return `🧪 POISON SYNERGY - Stacks with your ${poisonCount} poison cards`;
    }
    if (card.id === 'catalyst') {
      return '🧪 POISON MULTIPLIER - Doubles/triples your poison damage instantly';
    }
    if (card.id === 'corpse_explosion') {
      return '🧪 POISON FINISHER - Converts poison into explosive AOE damage';
    }
  }

  // SHIV BUILD (SILENT)
  if (archetypes.includes('shiv')) {
    if (card.tags.includes('shiv') || card.id === 'blade_dance') {
      const shivCount = deck.filter(c => c.tags.includes('shiv')).length;
      return `🗡️ SHIV ENGINE - Synergizes with your ${shivCount} shiv generators`;
    }
    if (card.id === 'accuracy' || card.id === 'after_image') {
      return '🗡️ SHIV MULTIPLIER - Makes every shiv significantly more powerful';
    }
  }

  // DISCARD BUILD (SILENT)
  if (archetypes.includes('discard')) {
    if (card.tags.includes('discard')) {
      return '🃏 DISCARD ENGINE - Triggers your Tactician and Reflex cards';
    }
    if (card.id === 'calculated_gamble') {
      return '🃏 DISCARD PAYOFF - Massive card draw for your discard synergies';
    }
  }

  // ORB/FOCUS BUILD (DEFECT)
  if (archetypes.includes('orb-focus')) {
    if (card.tags.includes('focus') || card.id === 'defragment') {
      return '🔮 FOCUS SCALING - Multiplies all your orb damage and block';
    }
    if (card.tags.includes('channel') || card.tags.includes('orb')) {
      return '🔮 ORB SYNERGY - Scales with your focus for massive value';
    }
    if (card.id === 'electrodynamics') {
      return '🔮 ORB AOE - Turns your lightning orbs into screen-wide damage';
    }
  }

  // LIGHTNING BUILD (DEFECT)
  if (archetypes.includes('lightning')) {
    if (card.tags.includes('lightning')) {
      return '⚡ LIGHTNING SYNERGY - Stacks with your lightning-focused deck';
    }
    if (card.id === 'electrodynamics') {
      return '⚡ BUILD ENABLER - Makes lightning hit ALL enemies every turn';
    }
  }

  // FROST BUILD (DEFECT)
  if (archetypes.includes('frost')) {
    if (card.tags.includes('frost')) {
      return '❄️ FROST SYNERGY - Adds to your defensive frost engine';
    }
    if (card.id === 'glacier' || card.id === 'blizzard') {
      return '❄️ FROST SCALING - Massive frost generation for defense';
    }
  }

  // CLAW BUILD (DEFECT)
  if (archetypes.includes('claw')) {
    if (card.id === 'claw') {
      const clawCount = deck.filter(c => c.id === 'claw').length;
      return `🦞 CLAW SYNERGY - Scales with your ${clawCount} existing Claws`;
    }
    if (card.id === 'all_for_one') {
      return '🦞 CLAW ENGINE - Recursion for infinite Claw scaling';
    }
  }

  // STANCE DANCE BUILD (WATCHER)
  if (archetypes.includes('stance-dance')) {
    if (card.tags.includes('stance') || card.tags.includes('wrath') || card.tags.includes('calm')) {
      return '🧘 STANCE SYNERGY - Triggers your Mental Fortress and Rushdown';
    }
    if (card.id === 'mental_fortress' || card.id === 'rushdown') {
      return '🧘 STANCE PAYOFF - Massive value from stance switching';
    }
  }

  // DIVINITY BUILD (WATCHER)
  if (archetypes.includes('divinity')) {
    if (card.tags.includes('mantra')) {
      return '✨ DIVINITY ENGINE - Builds toward your Divinity stance';
    }
    if (card.id === 'worship' || card.id === 'pray') {
      return '✨ MANTRA GENERATION - Fast-tracks your Divinity activation';
    }
  }

  // SCRY BUILD (WATCHER)
  if (archetypes.includes('scry')) {
    if (card.tags.includes('scry')) {
      return '🔍 SCRY SYNERGY - Maximizes your deck manipulation';
    }
    if (card.id === 'foresight' || card.id === 'third_eye') {
      return '🔍 SCRY PAYOFF - Constant deck filtering for perfect draws';
    }
  }

  // SCALING BUILD (GENERAL)
  if (archetypes.includes('scaling') && card.tags.includes('scaling')) {
    const scalingCount = analysis.scalingCards;
    return `📈 SCALING SYNERGY - Complements your ${scalingCount} scaling cards`;
  }

  // DEFENSIVE BUILD (GENERAL)
  if (archetypes.includes('defensive') && card.tags.includes('block')) {
    return '🛡️ DEFENSIVE SYNERGY - Perfect for your block-heavy strategy';
  }

  // SPECIFIC CARD RECOMMENDATIONS BASED ON DECK CONTEXT
  if (card.id === 'apotheosis') {
    const powerCount = analysis.powerCount;
    if (powerCount >= 4) {
      return `⭐ BUILD ENABLER - Upgrades your ${powerCount} powerful powers instantly`;
    }
    return '⭐ UNIVERSAL VALUE - Upgrades your entire deck permanently';
  }

  if (card.id === 'offering') {
    if (analysis.avgCost <= 1.2) {
      return '⚡ ENERGY ENGINE - Lets you play your entire low-cost hand';
    }
    return '⚡ GAME-CHANGING - Free energy and card draw every combat';
  }

  if (card.id === 'feed') {
    if (archetypes.includes('strength')) {
      return '💪 SCALING SUSTAIN - Permanent HP for your strength build';
    }
    return '❤️ PERMANENT SCALING - Each kill makes you tankier forever';
  }

  if (card.id === 'wraith_form') {
    if (analysis.blockCards >= 8) {
      return '👻 DEFENSIVE COMPLEMENT - Pairs with your block cards for safety';
    }
    return '👻 DEFENSIVE POWER - Near-invincibility for 3 turns';
  }

  if (card.id === 'echo_form') {
    const highImpactCards = deck.filter(c => c.tierRating >= 4).length;
    if (highImpactCards >= 5) {
      return `🔁 BUILD MULTIPLIER - Doubles your ${highImpactCards} high-impact cards`;
    }
    return '🔁 GAME-ENDING - Doubles every card you play';
  }

  // DEFAULT FOR TIER 5 CARDS
  // Check for specific synergies with deck
  const synergyCount = card.synergies.filter(syn => analysis.cardIds.includes(syn)).length;
  if (synergyCount >= 2) {
    return `⭐ EXCEPTIONAL CARD - Synergizes with ${synergyCount} cards in your deck`;
  }

  // Energy generation is always valuable
  if (card.tags.includes('energy')) {
    return '⚡ ENERGY GENERATION - Game-changing resource advantage';
  }

  // Card draw is always valuable
  if (card.tags.includes('draw')) {
    return '📚 CARD ADVANTAGE - Essential for consistent high-value hands';
  }

  // Fallback with deck-specific context
  if (analysis.size <= 15) {
    return '⭐ PREMIUM CARD - Elite pick for your lean deck';
  } else if (analysis.size >= 25) {
    return '⭐ HIGH-IMPACT CARD - Exactly what your deck needs';
  }

  // Final fallback (should rarely hit this)
  return '⭐ EXCEPTIONAL CARD - Strong pick in almost any situation';
}

export function evaluateCardForDeck(card: Card, deck: Card[], relics?: any[], character?: any): CardAdvice {
  const analysis = analyzeDeck(deck);
  let rating = card.tierRating;
  const reasons: string[] = [];
  let priority: CardAdvice['priority'] = 'situational';

  // 1. SYNERGY ANALYSIS
  const synergyCount = card.synergies.filter((syn) => analysis.cardIds.includes(syn)).length;
  const antiSynergyCount = card.antiSynergies.filter((anti) => analysis.cardIds.includes(anti)).length;

  if (synergyCount > 0) {
    rating += synergyCount * 0.5;
    reasons.push(`Synergizes with ${synergyCount} card(s) in your deck`);
  }

  if (antiSynergyCount > 0) {
    rating -= antiSynergyCount * 0.5;
    reasons.push(`⚠️ Conflicts with ${antiSynergyCount} card(s) in your deck`);
  }

  // 2. ARCHETYPE DETECTION & SYNERGIES
  analysis.archetypes.forEach((archetype) => {
    if (archetype === 'corruption' && card.type === 'skill') {
      // Corruption makes all skills cost 0 and exhaust
      // High-value skills are amazing, low-value skills are just okay
      const highValueCorruptionSkills = [
        'shrug_it_off', 'battle_trance', 'true_grit', 'offering', 'spot_weakness',
        'impervious', 'shockwave', 'power_through', 'second_wind', 'seeing_red'
      ];
      const mediumValueCorruptionSkills = [
        'armaments', 'warcry', 'flame_barrier', 'ghostly_armor', 'entrench',
        'disarm', 'intimidate', 'sentinel', 'bloodletting', 'burning_pact'
      ];

      if (highValueCorruptionSkills.includes(card.id)) {
        rating += 1.5;
        reasons.push('🔥 AMAZING with Corruption - High-value free skill!');
        priority = 'must-pick';
      } else if (mediumValueCorruptionSkills.includes(card.id)) {
        rating += 0.8;
        reasons.push('✅ Good with Corruption - Free skill');
        if (priority === 'situational') priority = 'good-pick';
      } else if (card.tierRating >= 4) {
        // Other high-tier skills are good too
        rating += 0.6;
        reasons.push('👍 Works with Corruption - Free skill');
        if (priority === 'situational') priority = 'good-pick';
      } else {
        // Low-value skills are just okay with Corruption
        rating += 0.3;
        reasons.push('Corruption makes this free (but not high-impact)');
      }
    }

    if (archetype === 'barricade' && card.tags.includes('block')) {
      rating += 1;
      reasons.push('🛡️ Excellent with Barricade - Block carries over');
      if (priority !== 'must-pick') priority = 'good-pick';
    }

    if (archetype === 'dead_branch' && card.tags.includes('exhaust')) {
      rating += 1.2;
      reasons.push('🌿 Synergizes with Dead Branch - Free cards!');
      priority = 'must-pick';
    }

    if (archetype === 'rupture' && card.tags.includes('self-damage')) {
      rating += 1;
      reasons.push('💪 Excellent with Rupture - Gain strength!');
      if (priority !== 'must-pick') priority = 'good-pick';
    }

    if (archetype === 'strength' && card.tags.includes('multi-hit')) {
      rating += 0.8;
      reasons.push('⚔️ Great with strength scaling - Multi-hit attack');
      if (priority === 'situational') priority = 'good-pick';
    }
  });

  // 3. DECK COMPOSITION BALANCE
  const attackRatio = analysis.attackCount / Math.max(analysis.size, 1);
  const powerRatio = analysis.powerCount / Math.max(analysis.size, 1);

  // Need more damage
  if (card.type === 'attack' && attackRatio < 0.45) {
    rating += 0.6;
    reasons.push('⚔️ Your deck needs more damage output');
    if (card.tierRating >= 4 && priority === 'situational') priority = 'good-pick';
  }

  // Need more defense/skills
  if (card.tags.includes('block') && analysis.blockCards < analysis.size * 0.25) {
    rating += 0.7;
    reasons.push('🛡️ Your deck lacks defensive options');
    if (priority === 'situational') priority = 'good-pick';
  }

  // Too many powers
  if (card.type === 'power' && analysis.powerCount >= 5) {
    rating -= 1.2;
    reasons.push('⚠️ Too many powers - Deck will be slow');
    priority = 'skip';
  } else if (card.type === 'power' && powerRatio < 0.15 && card.tierRating >= 4) {
    rating += 0.4;
    reasons.push('💎 Good power card - Balanced amount in deck');
  }

  // 4. COST CURVE ANALYSIS
  const lowCostCards = (analysis.costDistribution[0] || 0) + (analysis.costDistribution[1] || 0);
  const highCostCards = (analysis.costDistribution[3] || 0) + (analysis.costDistribution[4] || 0) +
                         (analysis.costDistribution[5] || 0);

  if (card.cost <= 1 && lowCostCards < analysis.size * 0.4) {
    rating += 0.5;
    reasons.push('⚡ Low-cost card - Improves curve flexibility');
  }

  if (card.cost >= 3 && highCostCards > analysis.size * 0.3) {
    rating -= 0.6;
    reasons.push('⚠️ High-cost card - Deck curve is already heavy');
  }

  if (analysis.avgCost > 1.5 && card.cost <= 1) {
    rating += 0.4;
    reasons.push('⚡ Helps lower your average card cost');
  }

  // 5. CARD DRAW & CYCLING
  if (card.tags.includes('draw') || card.tags.includes('cycle')) {
    rating += 0.5;
    reasons.push('📚 Card draw is always valuable');
    if (analysis.drawCards < 3) {
      rating += 0.3;
      reasons.push('📖 Your deck needs more card draw');
    }
  }

  // 6. SCALING FOR LONG FIGHTS
  if (card.tags.includes('scaling')) {
    rating += 0.5;
    reasons.push('📈 Scaling card - Crucial for harder fights');
    if (analysis.scalingCards < 3) {
      rating += 0.4;
      reasons.push('⚠️ Deck lacks scaling - Will struggle in long fights');
    }
  }

  // 7. ENERGY GENERATION
  if (card.tags.includes('energy')) {
    rating += 0.7;
    reasons.push('⚡ Energy generation is extremely powerful');
    if (analysis.energyCards === 0) {
      rating += 0.5;
      reasons.push('🔋 First energy card - High priority!');
      if (priority === 'situational') priority = 'good-pick';
    }
  }

  // 8. AOE DAMAGE
  if (card.tags.includes('aoe') && card.type === 'attack') {
    rating += 0.4;
    reasons.push('🌊 AOE damage - Essential for multi-enemy fights');
    const aoeCards = deck.filter((c) => c.tags.includes('aoe')).length;
    if (aoeCards < 2) {
      rating += 0.3;
      reasons.push('⚠️ Deck needs AOE for hallway fights');
    }
  }

  // 9. TIER-BASED PRIORITY
  if (card.tierRating === 5) {
    if (priority === 'situational' || priority === 'good-pick' || priority === 'skip') {
      priority = 'must-pick';
    }
    // Generate archetype-specific reason instead of generic text
    const archetypeReason = generateArchetypeReason(card, analysis, deck);
    reasons.unshift(archetypeReason);
  } else if (card.tierRating === 4 && rating >= 4.5) {
    if (priority === 'situational' || priority === 'skip') {
      priority = 'good-pick';
    }
  } else if (rating >= 5) {
    priority = 'must-pick';
  } else if (rating >= 4) {
    if (priority === 'situational') priority = 'good-pick';
  } else if (rating < 2.5) {
    priority = 'skip';
  }

  // 10. DECK SIZE CONSIDERATION
  if (analysis.size > 30 && card.tierRating < 4) {
    rating -= 0.5;
    reasons.push('⚠️ Large deck - Only take high-impact cards');
  }

  // 11. EXHAUST SYNERGIES
  if (card.tags.includes('exhaust') && analysis.exhaustCards >= 3) {
    const hasFeltNoFear = analysis.cardIds.includes('feel_no_pain');
    const hasDarkEmbrace = analysis.cardIds.includes('dark_embrace');
    if (hasFeltNoFear || hasDarkEmbrace) {
      rating += 0.6;
      reasons.push('♻️ Exhaust synergy - Triggers your powers');
    }
  }

  const finalRating = Math.max(1, Math.min(5, rating));
  const primaryReason = reasons.length > 0 ? reasons[0] : `Base rating: ${card.tierRating}/5`;

  return {
    card,
    rating: finalRating,
    reason: primaryReason,
    allReasons: reasons,
    priority,
  };
}

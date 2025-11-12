/**
 * Script to download actual Slay the Spire card images from the wiki
 *
 * Run with: node scripts/download-wiki-cards.js
 *
 * This will download real card images from the Slay the Spire Wiki (CC-BY-SA licensed)
 * to replace the portrait-only images we currently have.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load card data
const cardsData = require('../src/data/cards.json');

// Output directory - we'll overwrite existing images
const baseOutputDir = path.join(__dirname, '../public/images/cards');

// Wiki image base URL pattern
// Cards follow this pattern: https://static.wikia.nocookie.net/slay-the-spire/images/{hash}/{hash2}/{CardName}.png
// But we need to find the actual URLs first

// Manual mapping of card IDs to wiki image file names
// Wiki uses PascalCase naming with underscores, we use snake_case
const cardIdToWikiName = (cardId, cardName) => {
  // Special cases where wiki name differs from card name
  const specialCases = {
    // Strike and Defend go to character-specific pages on wiki
    'strike_r': 'Strike_(Ironclad)',
    'strike_g': 'Strike_(Silent)',
    'strike_b': 'Strike_(Defect)',
    'strike_p': 'Strike_(Watcher)',
    'defend_r': 'Defend_(Ironclad)',
    'defend_g': 'Defend_(Silent)',
    'defend_b': 'Defend_(Defect)',
    'defend_p': 'Defend_(Watcher)',

    // Colorless cards with special formatting
    'jax': 'J.A.X.',
    'bandage_up': 'BandageUp',
    'dark_shackles': 'DarkShackles',
    'deep_breath': 'DeepBreath',
    'dramatic_entrance': 'DramaticEntrance',
    'flash_of_steel': 'FlashOfSteel',
    'good_instincts': 'GoodInstincts',
    'hand_of_greed': 'HandOfGreed',
    'jack_of_all_trades': 'JackOfAllTrades',
    'master_of_strategy': 'MasterOfStrategy',
    'mind_blast': 'MindBlast',
    'panic_button': 'PanicButton',
    'sadistic_nature': 'SadisticNature',
    'secret_technique': 'SecretTechnique',
    'secret_weapon': 'SecretWeapon',
    'swift_strike': 'SwiftStrike',
    'the_bomb': 'TheBomb',
    'thinking_ahead': 'ThinkingAhead',

    // Defect cards
    'all_for_one': 'AllForOne',
    'ball_lightning': 'BallLightning',
    'beam_cell': 'BeamCell',
    'biased_cognition': 'BiasedCognition',
    'boot_sequence': 'BootSequence',
    'charge_battery': 'ChargeBattery',
    'cold_snap': 'ColdSnap',
    'compile_driver': 'CompileDriver',
    'core_surge': 'CoreSurge',
    'creative_ai': 'CreativeAI',
    'doom_and_gloom': 'DoomAndGloom',
    'double_energy': 'DoubleEnergy',
    'echo_form': 'EchoForm',
    'force_field': 'ForceField',
    'genetic_algorithm': 'GeneticAlgorithm',
    'go_for_the_eyes': 'GoForTheEyes',
    'hello_world': 'HelloWorld',
    'machine_learning': 'MachineLearning',
    'meteor_strike': 'MeteorStrike',
    'reinforced_body': 'ReinforcedBody',
    'rip_and_tear': 'RipAndTear',
    'self_repair': 'SelfRepair',
    'static_discharge': 'StaticDischarge',
    'steam_barrier': 'SteamBarrier',
    'sweeping_beam': 'SweepingBeam',
    'thunder_strike': 'ThunderStrike',
    'white_noise': 'WhiteNoise',

    // Ironclad cards
    'battle_trance': 'BattleTrance',
    'blood_for_blood': 'BloodForBlood',
    'body_slam': 'BodySlam',
    'burning_pact': 'BurningPact',
    'dark_embrace': 'DarkEmbrace',
    'demon_form': 'DemonForm',
    'double_tap': 'DoubleTap',
    'dual_wield': 'DualWield',
    'feel_no_pain': 'FeelNoPain',
    'fiend_fire': 'FiendFire',
    'fire_breathing': 'FireBreathing',
    'flame_barrier': 'FlameBarrier',
    'ghostly_armor': 'GhostlyArmor',
    'heavy_blade': 'HeavyBlade',
    'infernal_blade': 'InfernalBlade',
    'iron_wave': 'IronWave',
    'limit_break': 'LimitBreak',
    'perfected_strike': 'PerfectedStrike',
    'pommel_strike': 'PommelStrike',
    'power_through': 'PowerThrough',
    'reckless_charge': 'RecklessCharge',
    'searing_blow': 'SearingBlow',
    'second_wind': 'SecondWind',
    'seeing_red': 'SeeingRed',
    'sever_soul': 'SeverSoul',
    'shrug_it_off': 'ShrugItOff',
    'spot_weakness': 'SpotWeakness',
    'sword_boomerang': 'SwordBoomerang',
    'true_grit': 'TrueGrit',
    'twin_strike': 'TwinStrike',
    'wild_strike': 'WildStrike',

    // Silent cards
    'a_thousand_cuts': 'AThousandCuts',
    'after_image': 'AfterImage',
    'all_out_attack': 'All-OutAttack',
    'blade_dance': 'BladeDance',
    'bouncing_flask': 'BouncingFlask',
    'bullet_time': 'BulletTime',
    'calculated_gamble': 'CalculatedGamble',
    'cloak_and_dagger': 'CloakAndDagger',
    'corpse_explosion': 'CorpseExplosion',
    'crippling_cloud': 'CripplingCloud',
    'dagger_spray': 'DaggerSpray',
    'dagger_throw': 'DaggerThrow',
    'deadly_poison': 'DeadlyPoison',
    'die_die_die': 'DieDieDie',
    'dodge_and_roll': 'DodgeAndRoll',
    'endless_agony': 'EndlessAgony',
    'escape_plan': 'EscapePlan',
    'flying_knee': 'FlyingKnee',
    'glass_knife': 'GlassKnife',
    'grand_finale': 'GrandFinale',
    'heel_hook': 'HeelHook',
    'infinite_blades': 'InfiniteBlades',
    'leg_sweep': 'LegSweep',
    'masterful_stab': 'MasterfulStab',
    'noxious_fumes': 'NoxiousFumes',
    'phantasmal_killer': 'PhantasmalKiller',
    'piercing_wail': 'PiercingWail',
    'poisoned_stab': 'PoisonedStab',
    'quick_slash': 'QuickSlash',
    'riddle_with_holes': 'RiddleWithHoles',
    'sneaky_strike': 'SneakyStrike',
    'storm_of_steel': 'StormOfSteel',
    'sucker_punch': 'SuckerPunch',
    'tools_of_the_trade': 'ToolsOfTheTrade',
    'well_laid_plans': 'Well-LaidPlans',
    'wraith_form': 'WraithForm',

    // Watcher cards
    'battle_hymn': 'BattleHymn',
    'bowling_bash': 'BowlingBash',
    'carve_reality': 'CarveReality',
    'conjure_blade': 'ConjureBlade',
    'crush_joints': 'CrushJoints',
    'cut_through_fate': 'CutThroughFate',
    'deceive_reality': 'DeceiveReality',
    'deus_ex_machina': 'DeusExMachina',
    'deva_form': 'DevaForm',
    'empty_body': 'EmptyBody',
    'empty_fist': 'EmptyFist',
    'empty_mind': 'EmptyMind',
    'fear_no_evil': 'FearNoEvil',
    'flurry_of_blows': 'FlurryOfBlows',
    'flying_sleeves': 'FlyingSleeves',
    'follow_up': 'Follow-Up',
    'foreign_influence': 'ForeignInfluence',
    'inner_peace': 'InnerPeace',
    'just_lucky': 'JustLucky',
    'lesson_learned': 'LessonLearned',
    'like_water': 'LikeWater',
    'master_reality': 'MasterReality',
    'mental_fortress': 'MentalFortress',
    'pressure_points': 'PressurePoints',
    'reach_heaven': 'ReachHeaven',
    'sands_of_time': 'SandsOfTime',
    'sash_whip': 'SashWhip',
    'signature_move': 'SignatureMove',
    'simmering_fury': 'SimmeringFury',
    'spirit_shield': 'SpiritShield',
    'talk_to_the_hand': 'TalkToTheHand',
    'third_eye': 'ThirdEye',
    'wave_of_the_hand': 'WaveOfTheHand',
    'windmill_strike': 'WindmillStrike',
    'wish': 'Wish',
    'worship': 'Worship',
    'wreath_of_flame': 'WreathOfFlame',

    // Curse cards
    'curse_of_the_bell': 'CurseOfTheBell',

    // Status cards
    // (most status cards work with default naming)
  };

  if (specialCases[cardId]) {
    return specialCases[cardId];
  }

  // Default: use the card name with spaces replaced by underscores
  return cardName.replace(/ /g, '_');
};

// Fetch the wiki page HTML to find the actual image URL
const extractImageUrlFromWikiPage = async (wikiCardName) => {
  return new Promise((resolve, reject) => {
    const wikiPageUrl = `https://slay-the-spire.fandom.com/wiki/${wikiCardName}`;

    https.get(wikiPageUrl, (res) => {
      let html = '';

      res.on('data', (chunk) => {
        html += chunk;
      });

      res.on('end', () => {
        // Look for image tag with the card name
        // Pattern: <img ... src="https://static.wikia.nocookie.net/slay-the-spire/images/.../CardName.png..."
        const cardNamePattern = wikiCardName.replace(/[()]/g, '\\$&'); // Escape parens
        const imageRegex = new RegExp(`src="(https:\\/\\/static\\.wikia\\.nocookie\\.net\\/slay-the-spire\\/images\\/[a-f0-9]\\/[a-f0-9]{2}\\/${cardNamePattern}\\.png[^"]*)"`, 'i');
        const match = html.match(imageRegex);

        if (match && match[1]) {
          let imageUrl = match[1];
          // Remove query parameters but keep the path
          imageUrl = imageUrl.split('?')[0];
          resolve(imageUrl);
        } else {
          reject(new Error(`Could not find image URL for ${wikiCardName}`));
        }
      });
    }).on('error', reject);
  });
};

// Download an image from URL
const downloadImage = async (url, outputPath) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirect
        return downloadImage(res.headers.location, outputPath).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: ${res.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', reject);
    }).on('error', reject);
  });
};

// Process a single card
const processCard = async (card, index, total) => {
  const { id, name, character, type } = card;

  // Determine output directory
  let outputDir;
  if (type === 'curse') {
    outputDir = path.join(baseOutputDir, 'curse');
  } else if (type === 'status') {
    outputDir = path.join(baseOutputDir, 'status');
  } else {
    outputDir = path.join(baseOutputDir, character || 'colorless');
  }

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${id}.png`);

  try {
    const wikiName = cardIdToWikiName(id, name);
    console.log(`[${index}/${total}] Downloading ${name} (${wikiName})...`);

    const imageUrl = await extractImageUrlFromWikiPage(wikiName);
    await downloadImage(imageUrl, outputPath);

    console.log(`[${index}/${total}] ✓ ${name}`);
    return { success: true };
  } catch (error) {
    console.error(`[${index}/${total}] ✗ ${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Delay between requests to be respectful to the wiki
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main function
const main = async () => {
  console.log('🃏 Downloading Slay the Spire Card Images from Wiki');
  console.log('=====================================================\n');
  console.log(`📦 Total cards to process: ${cardsData.length}`);
  console.log(`⏱️  Estimated time: ~${Math.ceil(cardsData.length * 2 / 60)} minutes\n`);
  console.log('⚠️  Note: Images are CC-BY-SA licensed from the Slay the Spire Wiki');
  console.log('   Credit: https://slay-the-spire.fandom.com/\n');

  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < cardsData.length; i++) {
    const card = cardsData[i];
    const result = await processCard(card, i + 1, cardsData.length);

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({ card: card.name, error: result.error });
    }

    // Be respectful - wait between requests
    if (i < cardsData.length - 1) {
      await delay(2000); // 2 seconds between requests
    }
  }

  console.log('\n=====================================================');
  console.log('📊 Download Summary:');
  console.log(`   ✓ Successfully downloaded: ${results.success}`);
  console.log(`   ✗ Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Failed cards:');
    results.errors.forEach(({ card, error }) => {
      console.log(`   - ${card}: ${error}`);
    });
  }

  console.log('\n✅ Done!');
};

// Run the script
main().catch(console.error);

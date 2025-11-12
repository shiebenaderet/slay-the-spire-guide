/**
 * Test script to download a few sample cards from the wiki
 *
 * Run with: node scripts/test-download-cards.cjs
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Test with a few different card types
const testCards = [
  { id: 'bash', name: 'Bash', character: 'ironclad', type: 'attack' },
  { id: 'whirlwind', name: 'Whirlwind', character: 'ironclad', type: 'attack' },
  { id: 'backflip', name: 'Backflip', character: 'silent', type: 'skill' },
  { id: 'burn', name: 'Burn', character: 'colorless', type: 'status' },
  { id: 'wound', name: 'Wound', character: 'colorless', type: 'status' },
];

const baseOutputDir = path.join(__dirname, '../public/images/cards');

const cardIdToWikiName = (cardId, cardName) => {
  // Special mappings for cards that have different wiki names
  const specialCases = {
    // Strike and Defend go to character-specific pages
    'strike_r': 'Strike_(Ironclad)',
    'strike_g': 'Strike_(Silent)',
    'strike_b': 'Strike_(Defect)',
    'strike_p': 'Strike_(Watcher)',
    'defend_r': 'Defend_(Ironclad)',
    'defend_g': 'Defend_(Silent)',
    'defend_b': 'Defend_(Defect)',
    'defend_p': 'Defend_(Watcher)',
    // Special formatting
    'jax': 'J.A.X.',
    'cut_through_fate': 'Cut_Through_Fate',
  };

  if (specialCases[cardId]) {
    return specialCases[cardId];
  }

  // Default: use the card name with spaces replaced by underscores
  return cardName.replace(/ /g, '_');
};

const getWikiPageUrl = (wikiCardName) => {
  return `https://slay-the-spire.fandom.com/wiki/${wikiCardName}`;
};

const extractImageUrlFromWikiPage = async (wikiCardName) => {
  return new Promise((resolve, reject) => {
    const pageUrl = getWikiPageUrl(wikiCardName);
    console.log(`  Fetching wiki page: ${pageUrl}`);

    https.get(pageUrl, (res) => {
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
          console.log(`  Found image URL: ${imageUrl}`);
          resolve(imageUrl);
        } else {
          reject(new Error(`Could not find image URL for ${wikiCardName}`));
        }
      });
    }).on('error', reject);
  });
};

const downloadImage = async (url, outputPath) => {
  return new Promise((resolve, reject) => {
    console.log(`  Downloading from: ${url}`);
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
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
        const stats = fs.statSync(outputPath);
        console.log(`  Downloaded ${(stats.size / 1024).toFixed(1)} KB`);
        resolve();
      });

      fileStream.on('error', reject);
    }).on('error', reject);
  });
};

const processCard = async (card, index, total) => {
  const { id, name, character, type } = card;

  let outputDir;
  if (type === 'curse') {
    outputDir = path.join(baseOutputDir, 'curse');
  } else if (type === 'status') {
    outputDir = path.join(baseOutputDir, 'status');
  } else {
    outputDir = path.join(baseOutputDir, character || 'colorless');
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${id}.png`);

  // Remove existing file for testing
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  try {
    const wikiName = cardIdToWikiName(id, name);
    console.log(`\n[${index}/${total}] Processing ${name} (${wikiName})...`);

    const imageUrl = await extractImageUrlFromWikiPage(wikiName);
    await downloadImage(imageUrl, outputPath);

    console.log(`[${index}/${total}] ✓ ${name} downloaded successfully to ${outputPath}`);
    return { success: true };
  } catch (error) {
    console.error(`[${index}/${total}] ✗ ${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const main = async () => {
  console.log('🧪 Testing Card Download Script');
  console.log('================================\n');
  console.log(`Testing with ${testCards.length} sample cards...\n`);

  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < testCards.length; i++) {
    const card = testCards[i];
    const result = await processCard(card, i + 1, testCards.length);

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({ card: card.name, error: result.error });
    }

    if (i < testCards.length - 1) {
      console.log('  Waiting 2 seconds...');
      await delay(2000);
    }
  }

  console.log('\n================================');
  console.log('📊 Test Summary:');
  console.log(`   ✓ Success: ${results.success}`);
  console.log(`   ✗ Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Failed cards:');
    results.errors.forEach(({ card, error }) => {
      console.log(`   - ${card}: ${error}`);
    });
  }

  console.log('\n' + (results.failed === 0 ? '✅ All tests passed!' : '⚠️  Some tests failed.'));
};

main().catch(console.error);

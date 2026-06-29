/**
 * generate-icons.js
 * Converts SVG logo to PNG icon files for the app.
 * Run: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.resolve(__dirname, '..', 'assets');
const SVG_SOURCE = path.resolve(ASSETS_DIR, 'images', 'logo-mark.svg');
const LOGO_SVG = path.resolve(ASSETS_DIR, 'images', 'asal-usul-logo.svg');

const SIZES = {
  'icon': 1024,           // App icon
  'adaptive-icon': 1024,  // Android adaptive icon
  'favicon': 48,          // Web favicon
  'asal-usul-logo': 512,  // In-app logo
};

async function generate() {
  console.log('🔨 Generating icons from SVG...\n');

  // First, convert logo-mark.svg to the various icon sizes
  for (const [name, size] of Object.entries(SIZES)) {
    const svgPath = name === 'asal-usul-logo' ? LOGO_SVG : SVG_SOURCE;

    if (!fs.existsSync(svgPath)) {
      console.error(`❌ SVG not found: ${svgPath}`);
      continue;
    }

    const pngPath = path.resolve(ASSETS_DIR, 'expo.icon', 'Assets', `${name}.png`);

    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath);
      console.log(`✅ ${name}.png (${size}x${size})`);
    } catch (err) {
      console.error(`❌ Failed to generate ${name}.png:`, err.message);
    }
  }

  // Also generate a copy of icon.png for iOS
  const iconSrc = path.resolve(ASSETS_DIR, 'expo.icon', 'Assets', 'icon.png');
  // The app.json already points both iOS and Android to the same icon.png, so that's fine.

  console.log('\n✨ Done! Check assets/expo.icon/Assets/');
}

generate().catch(console.error);

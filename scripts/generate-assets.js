/**
 * Script pour générer les icônes et splash screens
 *
 * Prérequis: npm install sharp
 * Usage: node scripts/generate-assets.js
 *
 * Alternative recommandée: npx @capacitor/assets generate
 */

const fs = require('fs');
const path = require('path');

// Vérifier si sharp est installé
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp non installé. Installation...');
  console.log('Exécutez: npm install sharp --save-dev');
  console.log('\nOu utilisez @capacitor/assets:');
  console.log('npx @capacitor/assets generate --iconBackgroundColor "#1a1a2e" --splashBackgroundColor "#1a1a2e"');
  process.exit(1);
}

const ICON_SIZES = {
  android: [
    { name: 'mipmap-mdpi', size: 48 },
    { name: 'mipmap-hdpi', size: 72 },
    { name: 'mipmap-xhdpi', size: 96 },
    { name: 'mipmap-xxhdpi', size: 144 },
    { name: 'mipmap-xxxhdpi', size: 192 },
  ],
  ios: [
    { name: '20', size: 20 },
    { name: '29', size: 29 },
    { name: '40', size: 40 },
    { name: '58', size: 58 },
    { name: '60', size: 60 },
    { name: '76', size: 76 },
    { name: '80', size: 80 },
    { name: '87', size: 87 },
    { name: '120', size: 120 },
    { name: '152', size: 152 },
    { name: '167', size: 167 },
    { name: '180', size: 180 },
    { name: '1024', size: 1024 },
  ],
};

const SPLASH_SIZES = {
  android: [
    { name: 'drawable', width: 480, height: 800 },
    { name: 'drawable-land-hdpi', width: 800, height: 480 },
    { name: 'drawable-port-hdpi', width: 480, height: 800 },
    { name: 'drawable-port-xhdpi', width: 720, height: 1280 },
    { name: 'drawable-port-xxhdpi', width: 960, height: 1600 },
    { name: 'drawable-port-xxxhdpi', width: 1280, height: 1920 },
  ],
  ios: [
    { name: 'Default@2x~universal~anyany', width: 2732, height: 2732 },
  ],
};

async function generateIcons() {
  const iconSource = path.join(__dirname, '../resources/icon/icon.svg');

  if (!fs.existsSync(iconSource)) {
    console.error('Fichier source icon.svg non trouvé');
    console.log('Créez une icône PNG 1024x1024 dans resources/icon/icon.png');
    return;
  }

  console.log('Génération des icônes...\n');

  // Android
  const androidDir = path.join(__dirname, '../android/app/src/main/res');
  for (const icon of ICON_SIZES.android) {
    const outputDir = path.join(androidDir, icon.name);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'ic_launcher.png');
    await sharp(iconSource)
      .resize(icon.size, icon.size)
      .png()
      .toFile(outputPath);

    console.log(`  ✓ Android ${icon.name}: ${icon.size}x${icon.size}`);
  }

  // iOS
  const iosDir = path.join(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset');
  if (!fs.existsSync(iosDir)) {
    fs.mkdirSync(iosDir, { recursive: true });
  }

  for (const icon of ICON_SIZES.ios) {
    const outputPath = path.join(iosDir, `AppIcon-${icon.size}.png`);
    await sharp(iconSource)
      .resize(icon.size, icon.size)
      .png()
      .toFile(outputPath);

    console.log(`  ✓ iOS ${icon.size}x${icon.size}`);
  }

  console.log('\nIcônes générées avec succès!\n');
}

async function generateSplashScreens() {
  const splashSource = path.join(__dirname, '../resources/splash/splash.svg');

  if (!fs.existsSync(splashSource)) {
    console.error('Fichier source splash.svg non trouvé');
    return;
  }

  console.log('Génération des splash screens...\n');

  // Android
  const androidDir = path.join(__dirname, '../android/app/src/main/res');
  for (const splash of SPLASH_SIZES.android) {
    const outputDir = path.join(androidDir, splash.name);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'splash.png');
    await sharp(splashSource)
      .resize(splash.width, splash.height, { fit: 'cover' })
      .png()
      .toFile(outputPath);

    console.log(`  ✓ Android ${splash.name}: ${splash.width}x${splash.height}`);
  }

  // iOS
  const iosDir = path.join(__dirname, '../ios/App/App/Assets.xcassets/Splash.imageset');
  if (!fs.existsSync(iosDir)) {
    fs.mkdirSync(iosDir, { recursive: true });
  }

  for (const splash of SPLASH_SIZES.ios) {
    const outputPath = path.join(iosDir, `${splash.name}.png`);
    await sharp(splashSource)
      .resize(splash.width, splash.height, { fit: 'cover' })
      .png()
      .toFile(outputPath);

    console.log(`  ✓ iOS ${splash.name}: ${splash.width}x${splash.height}`);
  }

  // Créer Contents.json pour iOS
  const contentsJson = {
    images: SPLASH_SIZES.ios.map(s => ({
      filename: `${s.name}.png`,
      idiom: 'universal',
      scale: '1x',
    })),
    info: { author: 'xcode', version: 1 },
  };
  fs.writeFileSync(
    path.join(iosDir, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2)
  );

  console.log('\nSplash screens générés avec succès!\n');
}

async function main() {
  console.log('=== Génération des assets ===\n');

  try {
    await generateIcons();
    await generateSplashScreens();
    console.log('Terminé!');
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

main();

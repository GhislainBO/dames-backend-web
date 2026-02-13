# Ressources graphiques - Dames

## Icônes requises

Placez votre icône source `icon.png` (1024x1024 px) dans le dossier `icon/`.

### Android (dans `android/app/src/main/res/`)
- `mipmap-mdpi/ic_launcher.png` - 48x48
- `mipmap-hdpi/ic_launcher.png` - 72x72
- `mipmap-xhdpi/ic_launcher.png` - 96x96
- `mipmap-xxhdpi/ic_launcher.png` - 144x144
- `mipmap-xxxhdpi/ic_launcher.png` - 192x192

### iOS (dans `ios/App/App/Assets.xcassets/AppIcon.appiconset/`)
- 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87
- 120x120, 152x152, 167x167, 180x180, 1024x1024

## Splash Screens

Placez votre image source `splash.png` (2732x2732 px) dans le dossier `splash/`.

### Android (dans `android/app/src/main/res/`)
- `drawable/splash.png` - 480x800
- `drawable-land-hdpi/splash.png` - 800x480
- `drawable-port-hdpi/splash.png` - 480x800
- `drawable-port-xhdpi/splash.png` - 720x1280
- `drawable-port-xxhdpi/splash.png` - 960x1600
- `drawable-port-xxxhdpi/splash.png` - 1280x1920

### iOS (dans `ios/App/App/Assets.xcassets/Splash.imageset/`)
- splash-2732x2732.png

## Génération automatique

Utilisez `@capacitor/assets` pour générer automatiquement toutes les tailles :

```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#1a1a2e' --splashBackgroundColor '#1a1a2e'
```

## Icône de notification (Android)

Créez une icône monochrome blanche sur fond transparent :
- `android/app/src/main/res/drawable/ic_stat_icon.png` - 24x24 (mdpi)
- Utilisez uniquement du blanc (#FFFFFF) et de la transparence

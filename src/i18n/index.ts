import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { Capacitor } from '@capacitor/core';

import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import de from './locales/de.json';
import ar from './locales/ar.json';

export const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
];

// Récupérer la langue sauvegardée (fonctionne sur web et mobile)
const getSavedLanguage = (): string | null => {
  try {
    return localStorage.getItem('i18nextLng');
  } catch {
    return null;
  }
};

// Sauvegarder la langue (appelé après changement)
export const saveLanguage = (lng: string) => {
  try {
    localStorage.setItem('i18nextLng', lng);
  } catch (e) {
    console.warn('Could not save language preference', e);
  }
};

// Détecter la langue initiale
const detectLanguage = (): string => {
  // 1. Langue sauvegardée
  const saved = getSavedLanguage();
  if (saved && ['fr', 'en', 'es', 'pt', 'de', 'ar'].includes(saved)) {
    return saved;
  }

  // 2. Langue du navigateur/système
  const browserLang = navigator.language?.split('-')[0] || 'fr';
  if (['fr', 'en', 'es', 'pt', 'de', 'ar'].includes(browserLang)) {
    return browserLang;
  }

  // 3. Fallback
  return 'fr';
};

const initialLanguage = detectLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt },
      de: { translation: de },
      ar: { translation: ar },
    },
    lng: initialLanguage,
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en', 'es', 'pt', 'de', 'ar'],
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
  });

// Sauvegarder automatiquement quand la langue change
i18n.on('languageChanged', (lng) => {
  saveLanguage(lng);
  // Gérer RTL pour l'arabe
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
});

export default i18n;

/**
 * AdMobService - Gestion des publicités AdMob
 *
 * Types de pubs:
 * - Rewarded: L'utilisateur regarde volontairement pour gagner des coins
 * - Interstitial: Plein écran après les parties (non-premium)
 * - Banner: Bannière permanente en bas (non-premium)
 */

import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdSize,
  BannerAdPosition,
  BannerAdPluginEvents,
  AdOptions,
  AdLoadInfo,
  RewardAdOptions,
  RewardAdPluginEvents,
  AdMobRewardItem,
  InterstitialAdPluginEvents,
} from '@capacitor-community/admob';

// Configuration AdMob basée sur l'environnement
const IS_PRODUCTION = import.meta.env.PROD;

// IDs de test fournis par Google (pour développement)
const TEST_AD_IDS = {
  android: {
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    banner: 'ca-app-pub-3940256099942544/6300978111',
  },
  ios: {
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    banner: 'ca-app-pub-3940256099942544/2934735716',
  },
};

// IDs de production AdMob
const PROD_AD_IDS = {
  android: {
    rewarded: 'ca-app-pub-7041028160012242/8628423615',
    interstitial: 'ca-app-pub-7041028160012242/7231581460',
    banner: 'ca-app-pub-7041028160012242/8381855495',
  },
  ios: {
    rewarded: import.meta.env.VITE_ADMOB_IOS_REWARDED || '',
    interstitial: import.meta.env.VITE_ADMOB_IOS_INTERSTITIAL || '',
    banner: import.meta.env.VITE_ADMOB_IOS_BANNER || '',
  },
};

// Utiliser les IDs de test en développement, production sinon
const AD_CONFIG = {
  android: IS_PRODUCTION ? PROD_AD_IDS.android : TEST_AD_IDS.android,
  ios: IS_PRODUCTION ? PROD_AD_IDS.ios : TEST_AD_IDS.ios,
  useTestAds: !IS_PRODUCTION,
};

// Compteur de parties pour interstitial (afficher toutes les X parties)
const INTERSTITIAL_FREQUENCY = 3;

class AdMobService {
  private initialized = false;
  private isNativePlatform = false;
  private gamesPlayed = 0;
  private bannerVisible = false;
  private isPremiumUser = false;
  private consentGiven = false;
  private rewardedAdReady = false;
  private interstitialAdReady = false;

  constructor() {
    this.isNativePlatform = Capacitor.isNativePlatform();
    // Charger le consentement sauvegardé
    this.consentGiven = localStorage.getItem('adConsent') === 'true';
  }

  /**
   * Définit le consentement GDPR de l'utilisateur
   */
  setConsent(consent: boolean): void {
    this.consentGiven = consent;
    localStorage.setItem('adConsent', consent.toString());
    console.log(`AdMob: Consentement ${consent ? 'accordé' : 'refusé'}`);
  }

  /**
   * Vérifie si le consentement a été donné
   */
  hasConsent(): boolean {
    return this.consentGiven;
  }

  /**
   * Définit le statut premium de l'utilisateur
   */
  setPremiumStatus(isPremium: boolean): void {
    this.isPremiumUser = isPremium;
    if (isPremium && this.bannerVisible) {
      this.hideBanner();
    }
  }

  /**
   * Initialise AdMob (à appeler au démarrage de l'app)
   */
  async initialize(): Promise<void> {
    if (!this.isNativePlatform) {
      console.log('AdMob: Mode web - simulation activée');
      this.initialized = true;
      return;
    }

    if (this.initialized) return;

    try {
      await AdMob.initialize({
        initializeForTesting: AD_CONFIG.useTestAds,
      });

      // Écouter les événements de récompense
      AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
        console.log('AdMob: Récompense reçue', reward);
      });

      AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
        this.rewardedAdReady = true;
        console.log('AdMob: Rewarded ad prêt');
      });

      AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        this.rewardedAdReady = false;
        // Précharger la prochaine pub
        this.preloadRewardedAd();
      });

      // Écouter les événements interstitial
      AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
        this.interstitialAdReady = true;
        console.log('AdMob: Interstitial prêt');
      });

      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
        this.interstitialAdReady = false;
        console.log('AdMob: Interstitial fermé');
        // Précharger la prochaine pub
        this.preloadInterstitialAd();
      });

      this.initialized = true;
      console.log(`AdMob: Initialisé avec succès (mode ${AD_CONFIG.useTestAds ? 'test' : 'production'})`);

      // Précharger les pubs si consentement donné
      if (this.consentGiven && !this.isPremiumUser) {
        this.preloadAds();
      }
    } catch (error) {
      console.error('AdMob: Erreur initialisation', error);
    }
  }

  /**
   * Précharge toutes les pubs pour un affichage instantané
   */
  async preloadAds(): Promise<void> {
    if (!this.isNativePlatform || !this.initialized) return;

    await Promise.all([
      this.preloadRewardedAd(),
      this.preloadInterstitialAd(),
    ]);
  }

  /**
   * Précharge une pub rewarded
   */
  private async preloadRewardedAd(): Promise<void> {
    if (this.rewardedAdReady) return;

    try {
      const platform = Capacitor.getPlatform();
      const adId = platform === 'ios' ? AD_CONFIG.ios.rewarded : AD_CONFIG.android.rewarded;

      await AdMob.prepareRewardVideoAd({
        adId,
        isTesting: AD_CONFIG.useTestAds,
        npa: !this.consentGiven, // Non-personalized ads si pas de consentement
      });
    } catch (error) {
      console.error('AdMob: Erreur préchargement rewarded', error);
    }
  }

  /**
   * Précharge une pub interstitial
   */
  private async preloadInterstitialAd(): Promise<void> {
    if (this.interstitialAdReady || this.isPremiumUser) return;

    try {
      const platform = Capacitor.getPlatform();
      const adId = platform === 'ios' ? AD_CONFIG.ios.interstitial : AD_CONFIG.android.interstitial;

      await AdMob.prepareInterstitial({
        adId,
        isTesting: AD_CONFIG.useTestAds,
        npa: !this.consentGiven,
      });
    } catch (error) {
      console.error('AdMob: Erreur préchargement interstitial', error);
    }
  }

  /**
   * Affiche une publicité reward et retourne true si la récompense a été gagnée
   */
  async showRewardedAd(): Promise<{ success: boolean; reward?: number }> {
    // Sur web, toujours simuler
    if (!this.isNativePlatform) {
      return this.simulateRewardedAd();
    }

    try {
      const platform = Capacitor.getPlatform();
      const adId = platform === 'ios'
        ? AD_CONFIG.ios.rewarded
        : AD_CONFIG.android.rewarded;

      // Vérifier si AdMob est configuré avec de vrais IDs
      const hasRealAdIds = adId && !adId.includes('ca-app-pub-3940256099942544');

      if (!hasRealAdIds) {
        // Pas de vrais IDs configurés, simuler directement
        console.log('AdMob: Pas d\'IDs de production configurés - simulation');
        return this.simulateRewardedAd();
      }

      const options: RewardAdOptions = {
        adId,
        isTesting: AD_CONFIG.useTestAds,
      };

      await AdMob.prepareRewardVideoAd(options);
      await AdMob.showRewardVideoAd();

      return { success: true, reward: 30 };
    } catch (error) {
      console.error('AdMob: Erreur pub reward', error);
      // Toujours simuler en cas d'erreur pour ne pas bloquer l'utilisateur
      console.log('AdMob: Erreur - fallback vers simulation');
      return this.simulateRewardedAd();
    }
  }

  /**
   * Affiche une publicité interstitial après une partie
   * Retourne true si la pub a été affichée
   */
  async showInterstitialAd(): Promise<boolean> {
    // Ne pas afficher pour les utilisateurs premium
    if (this.isPremiumUser) {
      console.log('AdMob: Utilisateur premium - pas d\'interstitial');
      return false;
    }

    this.gamesPlayed++;

    // Afficher toutes les X parties
    if (this.gamesPlayed % INTERSTITIAL_FREQUENCY !== 0) {
      console.log(`AdMob: Partie ${this.gamesPlayed}, interstitial dans ${INTERSTITIAL_FREQUENCY - (this.gamesPlayed % INTERSTITIAL_FREQUENCY)} parties`);
      return false;
    }

    if (!this.isNativePlatform) {
      return this.simulateInterstitialAd();
    }

    try {
      const platform = Capacitor.getPlatform();
      const adId = platform === 'ios'
        ? AD_CONFIG.ios.interstitial
        : AD_CONFIG.android.interstitial;

      const options: AdOptions = {
        adId,
        isTesting: AD_CONFIG.useTestAds,
      };

      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();

      console.log('AdMob: Interstitial affiché');
      return true;
    } catch (error) {
      console.error('AdMob: Erreur interstitial', error);
      return false;
    }
  }

  /**
   * Affiche la bannière publicitaire en bas de l'écran
   */
  async showBanner(): Promise<void> {
    // Ne pas afficher pour les utilisateurs premium
    if (this.isPremiumUser) {
      console.log('AdMob: Utilisateur premium - pas de bannière');
      return;
    }

    if (this.bannerVisible) return;

    // Attendre que AdMob soit initialisé
    if (!this.initialized) {
      console.log('AdMob: En attente d\'initialisation avant affichage bannière');
      return;
    }

    if (!this.isNativePlatform) {
      console.log('AdMob: Simulation bannière (web)');
      this.bannerVisible = true;
      // Émettre un événement pour le composant BannerAd
      window.dispatchEvent(new CustomEvent('adMobBannerShow'));
      return;
    }

    // Délai pour s'assurer que la vue Android est prête
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const platform = Capacitor.getPlatform();
      const adId = platform === 'ios'
        ? AD_CONFIG.ios.banner
        : AD_CONFIG.android.banner;

      const options: BannerAdOptions = {
        adId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        isTesting: AD_CONFIG.useTestAds,
        margin: 0,
      };

      await AdMob.showBanner(options);
      this.bannerVisible = true;
      console.log('AdMob: Bannière affichée');
    } catch (error) {
      console.error('AdMob: Erreur bannière', error);
      // En cas d'erreur, ne pas bloquer l'app
      this.bannerVisible = false;
    }
  }

  /**
   * Cache la bannière publicitaire
   */
  async hideBanner(): Promise<void> {
    if (!this.bannerVisible) return;

    if (!this.isNativePlatform) {
      this.bannerVisible = false;
      window.dispatchEvent(new CustomEvent('adMobBannerHide'));
      return;
    }

    try {
      await AdMob.hideBanner();
      this.bannerVisible = false;
      console.log('AdMob: Bannière cachée');
    } catch (error) {
      console.error('AdMob: Erreur masquage bannière', error);
    }
  }

  /**
   * Simule une publicité reward pour le web
   */
  private async simulateRewardedAd(): Promise<{ success: boolean; reward?: number }> {
    return new Promise((resolve) => {
      console.log('AdMob: Simulation pub reward (3 secondes)');
      setTimeout(() => {
        resolve({ success: true, reward: 30 });
      }, 3000);
    });
  }

  /**
   * Simule une publicité interstitial pour le web
   */
  private async simulateInterstitialAd(): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('AdMob: Simulation interstitial (2 secondes)');
      // Émettre événement pour afficher overlay sur web
      window.dispatchEvent(new CustomEvent('adMobInterstitialShow'));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('adMobInterstitialHide'));
        resolve(true);
      }, 2000);
    });
  }

  /**
   * Réinitialise le compteur de parties (ex: nouveau jour)
   */
  resetGameCounter(): void {
    this.gamesPlayed = 0;
  }

  /**
   * Vérifie si on est sur une plateforme native
   */
  isNative(): boolean {
    return this.isNativePlatform;
  }

  /**
   * Vérifie si la bannière est visible
   */
  isBannerVisible(): boolean {
    return this.bannerVisible;
  }
}

// Singleton
export const adMobService = new AdMobService();

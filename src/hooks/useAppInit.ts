/**
 * useAppInit - Hook pour initialiser les services de l'application
 *
 * Initialise AdMob, Firebase, et autres services au démarrage
 */

import { useEffect, useState } from 'react';
import { adMobService } from '../services/AdMobService';
import { firebaseService } from '../services/FirebaseService';

interface InitState {
  isReady: boolean;
  error: string | null;
  services: {
    admob: boolean;
    firebase: boolean;
  };
}

export function useAppInit(): InitState {
  const [state, setState] = useState<InitState>({
    isReady: false,
    error: null,
    services: {
      admob: false,
      firebase: false,
    },
  });

  useEffect(() => {
    async function initializeServices() {
      const services = {
        admob: false,
        firebase: false,
      };

      try {
        // Initialiser AdMob
        await adMobService.initialize();
        services.admob = true;
      } catch (error) {
        console.error('Erreur initialisation AdMob:', error);
      }

      try {
        // Initialiser Firebase
        await firebaseService.initialize();
        services.firebase = true;

        // Programmer le rappel du bonus quotidien
        await firebaseService.scheduleDailyBonusReminder(10); // 10h du matin
      } catch (error) {
        console.error('Erreur initialisation Firebase:', error);
      }

      setState({
        isReady: true,
        error: null,
        services,
      });
    }

    initializeServices();
  }, []);

  return state;
}

/**
 * Hook pour gérer l'état de l'utilisateur premium et les publicités
 */
export function usePremiumStatus(isPremium: boolean): void {
  useEffect(() => {
    adMobService.setPremiumStatus(isPremium);

    if (!isPremium) {
      // Précharger les pubs si non-premium
      adMobService.preloadAds();
    }
  }, [isPremium]);
}

/**
 * Hook pour afficher une bannière publicitaire
 */
export function useAdBanner(shouldShow: boolean): void {
  useEffect(() => {
    if (shouldShow) {
      adMobService.showBanner();
    } else {
      adMobService.hideBanner();
    }

    return () => {
      adMobService.hideBanner();
    };
  }, [shouldShow]);
}

export default useAppInit;

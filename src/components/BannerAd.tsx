/**
 * BannerAd - Bannière publicitaire (simulation web + espace pour native)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './BannerAd.css';

interface BannerAdProps {
  position?: 'top' | 'bottom';
}

function BannerAd({ position = 'bottom' }: BannerAdProps) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [isNative, setIsNative] = useState(false);

  // Vérifier si l'utilisateur est premium
  const isPremium = user?.isPremium || false;

  useEffect(() => {
    // Vérifier si on est en mode natif
    const checkNative = () => {
      try {
        const { Capacitor } = require('@capacitor/core');
        setIsNative(Capacitor.isNativePlatform());
      } catch {
        setIsNative(false);
      }
    };
    checkNative();

    // Écouter les événements de bannière (simulation web)
    const handleShow = () => setVisible(true);
    const handleHide = () => setVisible(false);

    window.addEventListener('adMobBannerShow', handleShow);
    window.addEventListener('adMobBannerHide', handleHide);

    return () => {
      window.removeEventListener('adMobBannerShow', handleShow);
      window.removeEventListener('adMobBannerHide', handleHide);
    };
  }, []);

  // Ne pas afficher si premium ou en mode natif (AdMob gère la bannière)
  if (isPremium || isNative || !visible) {
    return null;
  }

  return (
    <div className={`banner-ad banner-ad-${position}`}>
      <div className="banner-ad-content">
        <span className="banner-ad-label">Publicité</span>
        <div className="banner-ad-placeholder">
          <span>Bannière publicitaire</span>
          <small>Passez Premium pour supprimer les pubs</small>
        </div>
      </div>
    </div>
  );
}

export default BannerAd;

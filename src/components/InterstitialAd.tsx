/**
 * InterstitialAd - Publicité plein écran (simulation web)
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './InterstitialAd.css';

function InterstitialAd() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const handleShow = () => {
      setVisible(true);
      setCountdown(3);
    };
    const handleHide = () => {
      setVisible(false);
    };

    window.addEventListener('adMobInterstitialShow', handleShow);
    window.addEventListener('adMobInterstitialHide', handleHide);

    return () => {
      window.removeEventListener('adMobInterstitialShow', handleShow);
      window.removeEventListener('adMobInterstitialHide', handleHide);
    };
  }, []);

  // Compte à rebours
  useEffect(() => {
    if (!visible || countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [visible, countdown]);

  if (!visible) return null;

  return (
    <div className="interstitial-overlay">
      <div className="interstitial-content">
        <div className="interstitial-header">
          <span className="ad-label">{t('ads.advertisement')}</span>
          {countdown > 0 ? (
            <span className="countdown">{countdown}</span>
          ) : (
            <button className="close-btn" onClick={() => setVisible(false)}>
              &times;
            </button>
          )}
        </div>

        <div className="interstitial-body">
          <div className="ad-placeholder">
            <div className="ad-icon">📺</div>
            <h3>{t('ads.interstitialTitle')}</h3>
            <p>{t('ads.interstitialDesc')}</p>
          </div>
        </div>

        <div className="interstitial-footer">
          <p>{t('ads.removePremium')}</p>
        </div>
      </div>
    </div>
  );
}

export default InterstitialAd;

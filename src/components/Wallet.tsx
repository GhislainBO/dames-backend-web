/**
 * Wallet - Affiche le solde de jetons et les actions
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { adMobService } from '../services/AdMobService';
import { notificationService } from '../services/NotificationService';
import BuyCoins from './BuyCoins';
import './Wallet.css';

const API_URL = 'https://dames-backend-production.up.railway.app';

interface WalletData {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  isPremium: boolean;
  premiumExpires: string | null;
  lastDailyBonus: string | null;
}

// Packs Premium disponibles
const PREMIUM_PACKS = [
  { days: 7, price: 500, labelKey: 'wallet.oneWeek' },
  { days: 30, price: 1500, labelKey: 'wallet.oneMonth', popular: true },
  { days: 90, price: 3500, labelKey: 'wallet.threeMonths' },
];

function Wallet() {
  const { t, i18n } = useTranslation();
  const { token, isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showBuyCoins, setShowBuyCoins] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);
  const [message, setMessage] = useState('');
  const walletRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletRef.current && !walletRef.current.contains(event.target as Node)) {
        setShowDetails(false);
      }
    };

    if (showDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetails]);

  // Toggle le dropdown au clic
  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchWallet();
    }
  }, [isAuthenticated, token]);

  const fetchWallet = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setWallet(data.wallet);
      }
    } catch (error) {
      console.error('Erreur wallet:', error);
    }
  };

  const claimDailyBonus = async () => {
    setClaiming(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/api/wallet/daily-bonus`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setMessage(t('wallet.adReward', { amount: data.amount }));
        fetchWallet();
        // Programmer le rappel pour demain
        notificationService.scheduleDailyBonusReminder();
      } else {
        setMessage(data.error || t('common.error'));
      }
    } catch (error) {
      setMessage(t('errors.connectionFailed'));
    } finally {
      setClaiming(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const canClaimDaily = (): boolean => {
    if (!wallet?.lastDailyBonus) return true;
    const last = new Date(wallet.lastDailyBonus);
    const now = new Date();
    return last.getDate() !== now.getDate() ||
           last.getMonth() !== now.getMonth() ||
           last.getFullYear() !== now.getFullYear();
  };

  // Regarder une publicité (AdMob sur mobile, simulation sur web)
  const watchAd = async () => {
    if (!token) {
      setMessage(t('buyCoins.loginRequired'));
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setWatchingAd(true);
    setMessage(adMobService.isNative() ? t('wallet.loadingAd') : t('wallet.simulatingAd'));

    try {
      // Afficher la pub (AdMob ou simulation)
      const adResult = await adMobService.showRewardedAd();
      console.log('AdMob result:', adResult);

      if (!adResult.success) {
        setMessage(t('wallet.adNotAvailable'));
        setWatchingAd(false);
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      // Créditer les jetons sur le serveur
      console.log('Calling ad-reward API to:', `${API_URL}/api/wallet/ad-reward`);

      const response = await fetch(`${API_URL}/api/wallet/ad-reward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        console.error('API error:', response.status, response.statusText);
        setMessage(`Erreur API: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log('Ad-reward API response:', data);

      if (data.success) {
        // Afficher le nouveau solde
        const newBalance = data.balance || (wallet ? wallet.balance + 30 : 30);
        setMessage(`+30 jetons! Nouveau solde: ${newBalance}`);
        await fetchWallet();
      } else {
        setMessage(data.error || t('common.error'));
      }
    } catch (error: any) {
      console.error('Ad reward error:', error);
      setMessage(`Erreur: ${error.message || t('errors.connectionFailed')}`);
    } finally {
      setWatchingAd(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  // Acheter Premium
  const purchasePremium = async (days: number, price: number) => {
    if (!wallet || wallet.balance < price) {
      setMessage(t('shop.insufficientFunds'));
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/wallet/premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ days, price }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage(t('wallet.premiumActivated'));
        setShowPremiumModal(false);
        fetchWallet();
      } else {
        setMessage(data.error || t('common.error'));
      }
    } catch (error) {
      setMessage(t('errors.connectionFailed'));
    }
    setTimeout(() => setMessage(''), 3000);
  };

  // Formater la date d'expiration Premium
  const formatPremiumExpiry = (): string => {
    if (!wallet?.premiumExpires) return '';
    const date = new Date(wallet.premiumExpires);
    const locale = i18n.language === 'ar' ? 'ar-SA' :
                   i18n.language === 'de' ? 'de-DE' :
                   i18n.language === 'es' ? 'es-ES' :
                   i18n.language === 'pt' ? 'pt-BR' :
                   i18n.language === 'en' ? 'en-US' : 'fr-FR';
    return date.toLocaleDateString(locale);
  };

  if (!isAuthenticated || !wallet) {
    return null;
  }

  return (
    <div
      ref={walletRef}
      className="wallet-container"
      onClick={toggleDetails}
    >
      <div className="wallet-balance">
        <span className="coin-icon">🪙</span>
        <span className="balance-amount">{wallet.balance.toLocaleString()}</span>
        {wallet.isPremium && <span className="premium-badge">VIP</span>}
      </div>

      {message && <div className="wallet-message">{message}</div>}

      {showDetails && (
        <div className="wallet-dropdown" onClick={(e) => e.stopPropagation()}>
          <div className="wallet-dropdown-content">
            <div className="wallet-stats">
              <div className="stat-row">
                <span>{t('wallet.totalEarned')}</span>
                <span className="earned">+{wallet.totalEarned.toLocaleString()}</span>
              </div>
              <div className="stat-row">
                <span>{t('wallet.totalSpent')}</span>
                <span className="spent">-{wallet.totalSpent.toLocaleString()}</span>
              </div>
            </div>

            <button
              className={`daily-bonus-btn ${!canClaimDaily() ? 'claimed' : ''}`}
              onClick={claimDailyBonus}
              disabled={!canClaimDaily() || claiming}
            >
              {claiming ? '...' : canClaimDaily() ? `🎁 ${t('wallet.dailyBonus')} ${wallet.isPremium ? '(+200)' : '(+100)'}` : `✓ ${t('wallet.claimed')}`}
            </button>

            <button
              className="watch-ad-btn"
              onClick={watchAd}
              disabled={watchingAd}
            >
              {watchingAd ? `⏳ ${t('wallet.watching')}...` : `🎬 ${t('wallet.watchAd')} (+30)`}
            </button>

            {!wallet.isPremium ? (
              <button
                className="premium-btn"
                onClick={() => setShowPremiumModal(true)}
              >
                ⭐ {t('wallet.becomePremium')}
              </button>
            ) : (
              <div className="premium-status">
                ⭐ {t('wallet.premiumUntil', { date: formatPremiumExpiry() })}
              </div>
            )}

            {/* Achats Stripe activés uniquement sur Web (pas sur mobile/Google Play) */}
            {!adMobService.isNative() && (
              <button
                className="buy-coins-btn"
                onClick={() => setShowBuyCoins(true)}
              >
                💰 {t('wallet.buyCoins')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal Premium */}
      {showPremiumModal && ReactDOM.createPortal(
        <div className="premium-modal-overlay" onClick={() => setShowPremiumModal(false)}>
          <div className="premium-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPremiumModal(false)}>&times;</button>
            <h3>⭐ {t('wallet.premiumSubscription')}</h3>
            <p className="premium-benefits">
              {t('wallet.premiumBenefits')}:
            </p>
            <ul className="benefits-list">
              <li>🎁 {t('wallet.benefit1')}</li>
              <li>🏆 {t('wallet.benefit2')}</li>
              <li>🎨 {t('wallet.benefit3')}</li>
              <li>🚫 {t('wallet.benefit4')}</li>
            </ul>

            <div className="premium-packs">
              {PREMIUM_PACKS.map(pack => (
                <div
                  key={pack.days}
                  className={`premium-pack ${pack.popular ? 'popular' : ''}`}
                >
                  {pack.popular && <span className="popular-tag">{t('wallet.popular')}</span>}
                  <div className="pack-duration">{t(pack.labelKey)}</div>
                  <div className="pack-price">🪙 {pack.price}</div>
                  <button
                    className="pack-buy-btn"
                    onClick={() => purchasePremium(pack.days, pack.price)}
                    disabled={wallet.balance < pack.price}
                  >
                    {wallet.balance < pack.price ? t('shop.insufficientFunds') : t('shop.buy')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Achat de jetons */}
      <BuyCoins
        isOpen={showBuyCoins}
        onClose={() => setShowBuyCoins(false)}
        onPurchaseComplete={fetchWallet}
      />
    </div>
  );
}

export default Wallet;

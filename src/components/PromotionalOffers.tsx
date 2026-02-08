/**
 * PromotionalOffers - Affichage des offres promotionnelles
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import './PromotionalOffers.css';

const API_URL = 'https://dames-backend-production.up.railway.app';

interface Promotion {
  id: string;
  type: 'first_purchase' | 'limited_time' | 'special_bundle';
  name: string;
  description: string;
  discount: number;
  coins: number;
  price: number;
  originalPrice: number;
  endDate: string;
}

interface PiggyBank {
  coins: number;
  maxCapacity: number;
  breakPriceCoins: number;
  percentage: number;
}

interface PromotionalOffersProps {
  isOpen: boolean;
  onClose: () => void;
  onBalanceChange?: () => void;
}

function PromotionalOffers({ isOpen, onClose, onBalanceChange }: PromotionalOffersProps) {
  const { t } = useTranslation();
  const { token, isAuthenticated } = useAuth();
  const [firstPurchaseOffer, setFirstPurchaseOffer] = useState<Promotion | null>(null);
  const [limitedTimeOffers, setLimitedTimeOffers] = useState<Promotion[]>([]);
  const [specialBundles, setSpecialBundles] = useState<Promotion[]>([]);
  const [piggyBank, setPiggyBank] = useState<PiggyBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'offers' | 'piggybank'>('offers');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupérer les offres
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const offersRes = await fetch(`${API_URL}/api/promotions/offers`, { headers });
      const offersData = await offersRes.json();

      if (offersData.success) {
        setFirstPurchaseOffer(offersData.firstPurchaseOffer);
        setLimitedTimeOffers(offersData.limitedTimeOffers || []);
        setSpecialBundles(offersData.specialBundles || []);
      }

      // Récupérer la tirelire si connecté
      if (isAuthenticated && token) {
        const piggyRes = await fetch(`${API_URL}/api/promotions/piggybank`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const piggyData = await piggyRes.json();
        if (piggyData.success) {
          setPiggyBank(piggyData.piggyBank);
        }
      }
    } catch (error) {
      console.error('Erreur chargement promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBreakPiggyBank = async () => {
    if (!isAuthenticated) {
      setMessage(t('promotions.loginRequired'));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/promotions/piggybank/break`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (data.success) {
        setMessage(t('promotions.piggyBankBroken', { amount: data.coinsReceived }));
        fetchData();
        onBalanceChange?.();
      } else {
        setMessage(data.error || t('common.error'));
      }
    } catch (error) {
      setMessage(t('errors.connectionFailed'));
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handlePurchaseOffer = async (promotionId: string) => {
    if (!isAuthenticated) {
      setMessage(t('promotions.loginRequired'));
      return;
    }

    // Simuler l'achat (en production, intégrer Stripe)
    try {
      const res = await fetch(`${API_URL}/api/promotions/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ promotionId }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage(t('promotions.purchaseSuccess', { amount: data.coinsReceived }));
        fetchData();
        onBalanceChange?.();
      } else {
        setMessage(data.error || t('common.error'));
      }
    } catch (error) {
      setMessage(t('errors.connectionFailed'));
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const formatPrice = (cents: number): string => {
    return (cents / 100).toFixed(2) + ' EUR';
  };

  if (!isOpen) return null;

  return (
    <div className="promo-overlay" onClick={onClose}>
      <div className="promo-modal" onClick={e => e.stopPropagation()}>
        <button className="promo-close" onClick={onClose}>&times;</button>

        <div className="promo-header">
          <h2>{t('promotions.title')}</h2>
          <p className="promo-subtitle">{t('promotions.subtitle')}</p>
        </div>

        {message && <div className="promo-message">{message}</div>}

        {/* Tabs */}
        <div className="promo-tabs">
          <button
            className={`tab ${activeTab === 'offers' ? 'active' : ''}`}
            onClick={() => setActiveTab('offers')}
          >
            {t('promotions.offers')}
          </button>
          <button
            className={`tab ${activeTab === 'piggybank' ? 'active' : ''}`}
            onClick={() => setActiveTab('piggybank')}
          >
            {t('promotions.piggyBank')}
          </button>
        </div>

        {loading ? (
          <p className="loading-text">{t('common.loading')}</p>
        ) : activeTab === 'offers' ? (
          <div className="promo-content">
            {/* Offre première achat */}
            {firstPurchaseOffer && (
              <div className="offer-card first-purchase">
                <div className="offer-badge">{t('promotions.newPlayer')}</div>
                <div className="offer-icon">🎁</div>
                <h3>{firstPurchaseOffer.name}</h3>
                <p className="offer-desc">{firstPurchaseOffer.description}</p>
                <div className="offer-coins">
                  <span className="coins-amount">{firstPurchaseOffer.coins.toLocaleString()}</span>
                  <span className="coins-label">{t('wallet.coins')}</span>
                </div>
                <div className="offer-price">
                  <span className="original-price">{formatPrice(firstPurchaseOffer.originalPrice)}</span>
                  <span className="current-price">{formatPrice(firstPurchaseOffer.price)}</span>
                </div>
                <div className="offer-discount">-{firstPurchaseOffer.discount}%</div>
                <button
                  className="offer-btn"
                  onClick={() => handlePurchaseOffer(firstPurchaseOffer.id)}
                >
                  {t('promotions.buyNow')}
                </button>
              </div>
            )}

            {/* Offres limitées */}
            {limitedTimeOffers.length > 0 && (
              <div className="offers-section">
                <h3 className="section-title">{t('promotions.limitedTime')}</h3>
                <div className="offers-grid">
                  {limitedTimeOffers.map(offer => (
                    <div key={offer.id} className="offer-card limited">
                      <div className="offer-timer">
                        <span className="timer-icon">⏰</span>
                        <span>{t('promotions.endsIn')}</span>
                      </div>
                      <h4>{offer.name}</h4>
                      <p className="offer-desc">{offer.description}</p>
                      <div className="offer-coins">
                        <span className="coins-amount">{offer.coins.toLocaleString()}</span>
                        <span className="coins-label">{t('wallet.coins')}</span>
                      </div>
                      <div className="offer-price">
                        <span className="current-price">{formatPrice(offer.price)}</span>
                      </div>
                      <button
                        className="offer-btn"
                        onClick={() => handlePurchaseOffer(offer.id)}
                      >
                        {t('promotions.claim')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Packs spéciaux */}
            {specialBundles.length > 0 && (
              <div className="offers-section">
                <h3 className="section-title">{t('promotions.specialPacks')}</h3>
                <div className="offers-grid">
                  {specialBundles.map(bundle => (
                    <div key={bundle.id} className="offer-card bundle">
                      <div className="offer-badge popular">{t('promotions.bestValue')}</div>
                      <h4>{bundle.name}</h4>
                      <p className="offer-desc">{bundle.description}</p>
                      <div className="offer-coins">
                        <span className="coins-amount">{bundle.coins.toLocaleString()}</span>
                        <span className="coins-label">{t('wallet.coins')}</span>
                      </div>
                      <div className="offer-price">
                        <span className="original-price">{formatPrice(bundle.originalPrice)}</span>
                        <span className="current-price">{formatPrice(bundle.price)}</span>
                      </div>
                      <div className="offer-discount">-{bundle.discount}%</div>
                      <button
                        className="offer-btn"
                        onClick={() => handlePurchaseOffer(bundle.id)}
                      >
                        {t('promotions.buyNow')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!firstPurchaseOffer && limitedTimeOffers.length === 0 && specialBundles.length === 0 && (
              <p className="no-offers">{t('promotions.noOffers')}</p>
            )}
          </div>
        ) : (
          /* Tirelire */
          <div className="piggybank-content">
            <div className="piggybank-visual">
              <div className="piggy-icon">🐷</div>
              {piggyBank && (
                <>
                  <div className="piggy-fill" style={{ height: `${piggyBank.percentage}%` }} />
                  <div className="piggy-coins">{piggyBank.coins.toLocaleString()}</div>
                </>
              )}
            </div>

            <div className="piggybank-info">
              <h3>{t('promotions.piggyBankTitle')}</h3>
              <p>{t('promotions.piggyBankDesc')}</p>

              {piggyBank && (
                <div className="piggy-stats">
                  <div className="stat">
                    <span className="stat-label">{t('promotions.accumulated')}</span>
                    <span className="stat-value">{piggyBank.coins.toLocaleString()} 🪙</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">{t('promotions.capacity')}</span>
                    <span className="stat-value">{piggyBank.maxCapacity.toLocaleString()} 🪙</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">{t('promotions.breakCost')}</span>
                    <span className="stat-value">{piggyBank.breakPriceCoins} 🪙</span>
                  </div>
                </div>
              )}

              <button
                className="break-btn"
                onClick={handleBreakPiggyBank}
                disabled={!piggyBank || piggyBank.coins === 0}
              >
                {t('promotions.breakPiggyBank')}
              </button>

              <p className="piggy-hint">{t('promotions.piggyBankHint')}</p>
            </div>

            {!isAuthenticated && (
              <div className="login-warning">
                {t('promotions.loginRequired')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PromotionalOffers;

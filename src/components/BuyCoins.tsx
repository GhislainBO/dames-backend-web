/**
 * BuyCoins - Interface d'achat de jetons avec Stripe
 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import StripeCheckout from './StripeCheckout';
import './BuyCoins.css';

const API_URL = 'https://dames-backend-production.up.railway.app';

// Cle publique Stripe (production)
const STRIPE_PUBLIC_KEY = 'pk_live_51SqyQTGpbzjOCrW2CY3RFhglzimZJVNrNEhojZaPnFXiTQW8feJBAjGm9IzPI1MzXMbCtEZCocp96O47yipd4zKS00h1ex1yjw';

// Initialiser Stripe
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

interface CoinPack {
  id: string;
  name: string;
  coins: number;
  price: number;
  currency: string;
  bonus?: number;
  popular?: boolean;
}

interface BuyCoinsProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete?: () => void;
}

interface PaymentState {
  clientSecret: string;
  paymentId: string;
  pack: CoinPack;
}

function BuyCoins({ isOpen, onClose, onPurchaseComplete }: BuyCoinsProps) {
  const { t, i18n } = useTranslation();
  const { token, isAuthenticated } = useAuth();
  const [packs, setPacks] = useState<CoinPack[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPacks();
      setPaymentState(null);
    }
  }, [isOpen]);

  const fetchPacks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/payments/packs`);
      const data = await response.json();
      if (data.success) {
        setPacks(data.packs);
        setStripeConfigured(data.stripeConfigured);
      }
    } catch (error) {
      console.error('Erreur chargement packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    const amount = price / 100;
    const locale = i18n.language === 'ar' ? 'ar-SA' :
                   i18n.language === 'de' ? 'de-DE' :
                   i18n.language === 'es' ? 'es-ES' :
                   i18n.language === 'pt' ? 'pt-BR' :
                   i18n.language === 'en' ? 'en-US' : 'fr-FR';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const handlePurchase = async (packId: string) => {
    if (!isAuthenticated) {
      setMessage(t('buyCoins.loginRequired'));
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const pack = packs.find(p => p.id === packId);
    if (!pack) return;

    setPurchasing(packId);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/payments/create-stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ packId }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.clientSecret) {
          // Stripe configure - afficher le formulaire de paiement
          setPaymentState({
            clientSecret: data.clientSecret,
            paymentId: data.paymentId,
            pack,
          });
        } else {
          // Mode simulation - paiement direct
          setMessage(t('buyCoins.purchaseSuccess'));
          onPurchaseComplete?.();
          setTimeout(() => {
            setMessage('');
            onClose();
          }, 2000);
        }
      } else {
        setMessage(data.error || t('buyCoins.purchaseError'));
      }
    } catch (error) {
      setMessage(t('errors.connectionFailed'));
    } finally {
      setPurchasing(null);
      if (!paymentState) {
        setTimeout(() => setMessage(''), 5000);
      }
    }
  };

  const handlePaymentSuccess = async () => {
    if (!paymentState) return;

    // Confirmer le paiement cote serveur
    try {
      const response = await fetch(`${API_URL}/api/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentId: paymentState.paymentId }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(t('buyCoins.paymentSuccess'));
        setPaymentState(null);
        onPurchaseComplete?.();
        setTimeout(() => {
          setMessage('');
          onClose();
        }, 2500);
      }
    } catch (error) {
      setMessage(t('buyCoins.confirmationError'));
    }
  };

  const handlePaymentCancel = () => {
    setPaymentState(null);
  };

  if (!isOpen) return null;

  // Si on est en mode paiement Stripe
  if (paymentState && stripePromise) {
    return ReactDOM.createPortal(
      <div className="buy-coins-overlay" onClick={handlePaymentCancel}>
        <div className="buy-coins-modal" onClick={e => e.stopPropagation()}>
          <button className="buy-coins-close" onClick={handlePaymentCancel}>&times;</button>

          <h2>{t('buyCoins.finalizePurchase')}</h2>

          <div className="test-cards-info" style={{
            background: 'rgba(74, 158, 255, 0.1)',
            border: '1px dashed #4a9eff',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '15px',
            fontSize: '0.85rem',
            color: '#4a9eff',
          }}>
            <strong>{t('buyCoins.testMode')}:</strong>
            {t('buyCoins.cardNumber')}: <code style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}>4242 4242 4242 4242</code><br/>
            {t('buyCoins.dateAndCVC')}
          </div>

          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: paymentState.clientSecret,
              appearance: {
                theme: 'night',
                variables: {
                  colorPrimary: '#4a9eff',
                  colorBackground: '#1a1a2e',
                  colorText: '#ffffff',
                  colorDanger: '#f87171',
                  fontFamily: 'system-ui, sans-serif',
                  borderRadius: '8px',
                },
              },
            }}
          >
            <StripeCheckout
              clientSecret={paymentState.clientSecret}
              amount={paymentState.pack.price}
              currency={paymentState.pack.currency}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </Elements>
        </div>
      </div>,
      document.body
    );
  }

  return ReactDOM.createPortal(
    <div className="buy-coins-overlay" onClick={onClose}>
      <div className="buy-coins-modal" onClick={e => e.stopPropagation()}>
        <button className="buy-coins-close" onClick={onClose}>&times;</button>

        <h2>{t('wallet.buyCoins')}</h2>

        {message && (
          <div className={`buy-coins-message ${message.includes(t('common.success').toLowerCase()) ? 'success' : ''}`}>
            {message}
          </div>
        )}

        {!isAuthenticated && (
          <div className="buy-coins-warning">
            {t('buyCoins.loginRequired')}
          </div>
        )}

        {!stripeConfigured && (
          <div className="buy-coins-info">
            {t('buyCoins.testModeInfo')}
          </div>
        )}

        {stripeConfigured && !stripePromise && (
          <div className="buy-coins-warning">
            {t('buyCoins.configureStripe')}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888' }}>{t('common.loading')}</p>
        ) : (
          <div className="coin-packs-grid">
            {packs.map(pack => (
              <div
                key={pack.id}
                className={`coin-pack-card ${pack.popular ? 'popular' : ''}`}
              >
                {pack.popular && <span className="popular-badge">{t('wallet.popular')}</span>}

                <div className="pack-coins">
                  <span className="coins-icon">🪙</span>
                  <span className="coins-amount">{pack.coins.toLocaleString()}</span>
                </div>

                {pack.bonus && (
                  <div className="pack-bonus">
                    +{pack.bonus.toLocaleString()} bonus
                  </div>
                )}

                <div className="pack-name">{pack.name}</div>

                <div className="pack-price">
                  {formatPrice(pack.price, pack.currency)}
                </div>

                <button
                  className="pack-buy-btn"
                  onClick={() => handlePurchase(pack.id)}
                  disabled={purchasing !== null || !isAuthenticated}
                >
                  {purchasing === pack.id ? t('buyCoins.processing') : t('shop.buy')}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="payment-methods">
          <p>{t('buyCoins.acceptedPayments')}:</p>
          <div className="payment-icons">
            <span>{t('buyCoins.creditCard')}</span>
            <span>Apple Pay</span>
            <span>Google Pay</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default BuyCoins;

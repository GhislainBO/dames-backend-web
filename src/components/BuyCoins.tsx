/**
 * BuyCoins - Interface d'achat de jetons avec Stripe et PayPal
 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import StripeCheckout from './StripeCheckout';
import PayPalCheckout from './PayPalCheckout';
import './BuyCoins.css';

const API_URL = 'https://dames-backend-production.up.railway.app';

// Cle publique Stripe (production)
const STRIPE_PUBLIC_KEY = 'pk_live_51SqyQTGpbzjOCrW2CY3RFhglzimZJVNrNEhojZaPnFXiTQW8feJBAjGm9IzPI1MzXMbCtEZCocp96O47yipd4zKS00h1ex1yjw';

// Initialiser Stripe
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

type PaymentMethod = 'stripe' | 'paypal' | null;

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

type CheckoutStep = 'select-pack' | 'select-method' | 'checkout';

function BuyCoins({ isOpen, onClose, onPurchaseComplete }: BuyCoinsProps) {
  const { t, i18n } = useTranslation();
  const { token, isAuthenticated } = useAuth();
  const [packs, setPacks] = useState<CoinPack[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState | null>(null);

  // Nouveaux states pour le flow multi-methode
  const [selectedPack, setSelectedPack] = useState<CoinPack | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('select-pack');

  useEffect(() => {
    if (isOpen) {
      fetchPacks();
      resetCheckout();
    }
  }, [isOpen]);

  const resetCheckout = () => {
    setPaymentState(null);
    setSelectedPack(null);
    setSelectedMethod(null);
    setCheckoutStep('select-pack');
    setMessage('');
  };

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

  const handlePackSelect = (pack: CoinPack) => {
    if (!isAuthenticated) {
      setMessage(t('buyCoins.loginRequired'));
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setSelectedPack(pack);
    setCheckoutStep('select-method');
  };

  const handleMethodSelect = async (method: PaymentMethod) => {
    if (!selectedPack || !method) return;

    setSelectedMethod(method);

    if (method === 'stripe') {
      await initiateStripePayment(selectedPack);
    } else if (method === 'paypal') {
      setCheckoutStep('checkout');
    }
  };

  const initiateStripePayment = async (pack: CoinPack) => {
    setPurchasing(pack.id);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/payments/create-stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ packId: pack.id }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.clientSecret) {
          setPaymentState({
            clientSecret: data.clientSecret,
            paymentId: data.paymentId,
            pack,
          });
          setCheckoutStep('checkout');
        } else {
          // Mode simulation - paiement direct
          handlePaymentComplete();
        }
      } else {
        setMessage(data.error || t('buyCoins.purchaseError'));
        setCheckoutStep('select-method');
      }
    } catch (error) {
      setMessage(t('errors.connectionFailed'));
      setCheckoutStep('select-method');
    } finally {
      setPurchasing(null);
    }
  };

  const handlePaymentComplete = () => {
    setMessage(t('buyCoins.purchaseSuccess'));
    onPurchaseComplete?.();
    setTimeout(() => {
      setMessage('');
      onClose();
    }, 2000);
  };

  const handleStripeSuccess = async () => {
    if (!paymentState) return;

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
        handlePaymentComplete();
      } else {
        setMessage(t('buyCoins.confirmationError'));
      }
    } catch (error) {
      setMessage(t('buyCoins.confirmationError'));
    }
  };

  const handlePayPalSuccess = async (orderId: string) => {
    if (!selectedPack) return;

    console.log('[PayPal] Confirming payment with orderId:', orderId);

    try {
      // Confirmer le paiement PayPal cote serveur
      const response = await fetch(`${API_URL}/api/payments/confirm-paypal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          packId: selectedPack.id,
        }),
      });

      const data = await response.json();
      console.log('[PayPal] Server response:', data);

      if (data.success) {
        handlePaymentComplete();
      } else {
        setMessage(data.error || t('buyCoins.confirmationError'));
        setCheckoutStep('select-method');
      }
    } catch (error) {
      console.error('[PayPal] Error:', error);
      setMessage(t('buyCoins.confirmationError'));
      setCheckoutStep('select-method');
    }
  };

  const handlePayPalError = (error: string) => {
    setMessage(error);
    setCheckoutStep('select-method');
  };

  const handleCancel = () => {
    if (checkoutStep === 'checkout') {
      setCheckoutStep('select-method');
      setPaymentState(null);
    } else if (checkoutStep === 'select-method') {
      setCheckoutStep('select-pack');
      setSelectedPack(null);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Etape 3: Checkout Stripe
  if (checkoutStep === 'checkout' && selectedMethod === 'stripe' && paymentState && stripePromise) {
    return ReactDOM.createPortal(
      <div className="buy-coins-overlay" onClick={handleCancel}>
        <div className="buy-coins-modal" onClick={e => e.stopPropagation()}>
          <button className="buy-coins-close" onClick={handleCancel}>&times;</button>

          <h2>{t('buyCoins.finalizePurchase')}</h2>

          <div className="selected-pack-summary">
            <h3>{selectedPack?.name}</h3>
            <div className="pack-details">
              <span className="coins-display">
                <span>🪙</span>
                {selectedPack?.coins.toLocaleString()}
                {selectedPack?.bonus && <span style={{color: '#4ade80'}}> +{selectedPack.bonus}</span>}
              </span>
              <span className="price-display">
                {selectedPack && formatPrice(selectedPack.price, selectedPack.currency)}
              </span>
            </div>
          </div>

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
              onSuccess={handleStripeSuccess}
              onCancel={handleCancel}
            />
          </Elements>
        </div>
      </div>,
      document.body
    );
  }

  // Etape 3: Checkout PayPal
  if (checkoutStep === 'checkout' && selectedMethod === 'paypal' && selectedPack) {
    return ReactDOM.createPortal(
      <div className="buy-coins-overlay" onClick={handleCancel}>
        <div className="buy-coins-modal" onClick={e => e.stopPropagation()}>
          <button className="buy-coins-close" onClick={handleCancel}>&times;</button>

          <h2>{t('buyCoins.finalizePurchase')}</h2>

          <div className="selected-pack-summary">
            <h3>{selectedPack.name}</h3>
            <div className="pack-details">
              <span className="coins-display">
                <span>🪙</span>
                {selectedPack.coins.toLocaleString()}
                {selectedPack.bonus && <span style={{color: '#4ade80'}}> +{selectedPack.bonus}</span>}
              </span>
              <span className="price-display">
                {formatPrice(selectedPack.price, selectedPack.currency)}
              </span>
            </div>
          </div>

          <PayPalCheckout
            amount={selectedPack.price}
            currency={selectedPack.currency}
            packId={selectedPack.id}
            packName={selectedPack.name}
            onSuccess={handlePayPalSuccess}
            onError={handlePayPalError}
            onCancel={handleCancel}
          />
        </div>
      </div>,
      document.body
    );
  }

  // Etape 2: Selection de la methode de paiement
  if (checkoutStep === 'select-method' && selectedPack) {
    return ReactDOM.createPortal(
      <div className="buy-coins-overlay" onClick={handleCancel}>
        <div className="buy-coins-modal" onClick={e => e.stopPropagation()}>
          <button className="buy-coins-close" onClick={handleCancel}>&times;</button>

          <h2>{t('buyCoins.selectPaymentMethod', 'Choisir le mode de paiement')}</h2>

          {message && (
            <div className={`buy-coins-message ${message.includes('succes') ? 'success' : ''}`}>
              {message}
            </div>
          )}

          <div className="selected-pack-summary">
            <h3>{selectedPack.name}</h3>
            <div className="pack-details">
              <span className="coins-display">
                <span>🪙</span>
                {selectedPack.coins.toLocaleString()}
                {selectedPack.bonus && <span style={{color: '#4ade80'}}> +{selectedPack.bonus}</span>}
              </span>
              <span className="price-display">
                {formatPrice(selectedPack.price, selectedPack.currency)}
              </span>
            </div>
            <button className="change-pack-btn" onClick={() => setCheckoutStep('select-pack')}>
              {t('buyCoins.changePack', 'Changer de pack')}
            </button>
          </div>

          <div className="payment-method-selection">
            <h3>{t('buyCoins.howToPay', 'Comment souhaitez-vous payer ?')}</h3>
            <div className="payment-method-buttons">
              <button
                className={`payment-method-btn stripe ${selectedMethod === 'stripe' ? 'selected' : ''}`}
                onClick={() => handleMethodSelect('stripe')}
                disabled={purchasing !== null}
              >
                <span className="payment-method-icon">💳</span>
                <span>{t('buyCoins.creditCard', 'Carte bancaire')}</span>
              </button>

              <button
                className={`payment-method-btn paypal ${selectedMethod === 'paypal' ? 'selected' : ''}`}
                onClick={() => handleMethodSelect('paypal')}
                disabled={purchasing !== null}
              >
                <span className="payment-method-icon">🅿️</span>
                <span>PayPal</span>
              </button>
            </div>
          </div>

          {purchasing && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ color: '#888' }}>{t('buyCoins.processing')}...</p>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }

  // Etape 1: Selection du pack (vue par defaut)
  return ReactDOM.createPortal(
    <div className="buy-coins-overlay" onClick={onClose}>
      <div className="buy-coins-modal" onClick={e => e.stopPropagation()}>
        <button className="buy-coins-close" onClick={onClose}>&times;</button>

        <h2>{t('wallet.buyCoins')}</h2>

        {message && (
          <div className={`buy-coins-message ${message.includes('succes') ? 'success' : ''}`}>
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
                  onClick={() => handlePackSelect(pack)}
                  disabled={!isAuthenticated}
                >
                  {t('shop.buy')}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="payment-methods">
          <p>{t('buyCoins.acceptedPayments')}:</p>
          <div className="payment-icons">
            <span>{t('buyCoins.creditCard')}</span>
            <span>PayPal</span>
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
// Force rebuild Sat, Feb 14, 2026  9:42:17 PM

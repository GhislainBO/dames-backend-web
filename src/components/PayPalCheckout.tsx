/**
 * PayPalCheckout - Composant de paiement PayPal
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// PayPal Client ID (Sandbox pour test, remplacer par live en production)
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb'; // 'sb' = sandbox

interface PayPalCheckoutProps {
  amount: number; // En centimes
  currency: string;
  packId: string;
  packName: string;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: PayPalButtonConfig) => {
        render: (container: HTMLElement) => Promise<void>;
        close: () => void;
      };
    };
  }
}

interface PayPalButtonConfig {
  style?: {
    layout?: 'vertical' | 'horizontal';
    color?: 'gold' | 'blue' | 'silver' | 'black' | 'white';
    shape?: 'rect' | 'pill';
    label?: 'paypal' | 'checkout' | 'buynow' | 'pay';
    height?: number;
  };
  createOrder: (data: unknown, actions: PayPalActions) => Promise<string>;
  onApprove: (data: PayPalApproveData, actions: PayPalActions) => Promise<void>;
  onError: (err: Error) => void;
  onCancel: () => void;
}

interface PayPalActions {
  order: {
    create: (order: PayPalOrder) => Promise<string>;
    capture: () => Promise<PayPalCaptureResult>;
  };
}

interface PayPalOrder {
  purchase_units: Array<{
    amount: {
      currency_code: string;
      value: string;
    };
    description?: string;
  }>;
}

interface PayPalApproveData {
  orderID: string;
}

interface PayPalCaptureResult {
  id: string;
  status: string;
  purchase_units: Array<{
    payments: {
      captures: Array<{
        id: string;
        status: string;
      }>;
    };
  }>;
}

const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({
  amount,
  currency,
  packId,
  packName,
  onSuccess,
  onError,
  onCancel,
}) => {
  const { t } = useTranslation();
  const paypalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const buttonsInstance = useRef<{ close: () => void } | null>(null);
  const isMounted = useRef(true);

  // Charger le SDK PayPal
  useEffect(() => {
    const scriptId = 'paypal-sdk';

    // Verifier si le script existe deja
    if (document.getElementById(scriptId)) {
      if (window.paypal) {
        setSdkReady(true);
        setLoading(false);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${currency.toUpperCase()}`;
    script.async = true;

    script.onload = () => {
      setSdkReady(true);
      setLoading(false);
    };

    script.onerror = () => {
      onError(t('paypal.loadError', 'Erreur de chargement PayPal'));
      setLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      // Marquer comme démonté
      isMounted.current = false;
      // Cleanup: fermer les boutons PayPal si ils existent
      if (buttonsInstance.current) {
        try {
          buttonsInstance.current.close();
        } catch (e) {
          // Ignorer les erreurs de cleanup
        }
      }
    };
  }, [currency, onError, t]);

  // Rendre les boutons PayPal une fois le SDK charge
  useEffect(() => {
    if (!sdkReady || !window.paypal || !paypalRef.current) return;

    // Nettoyer le conteneur
    paypalRef.current.innerHTML = '';

    const amountInUnits = (amount / 100).toFixed(2);

    const buttons = window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'pay',
        height: 45,
      },
      createOrder: async (_data: unknown, actions: PayPalActions) => {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                currency_code: currency.toUpperCase(),
                value: amountInUnits,
              },
              description: `DAMESELITE - ${packName}`,
            },
          ],
        });
      },
      onApprove: async (data: PayPalApproveData, actions: PayPalActions) => {
        console.log('[PayPal] onApprove called, orderID:', data.orderID);
        setProcessing(true);
        try {
          console.log('[PayPal] Capturing order...');
          const captureResult = await actions.order.capture();
          console.log('[PayPal] Capture result:', captureResult.status, captureResult.id);

          if (captureResult.status === 'COMPLETED') {
            console.log('[PayPal] Payment completed, calling onSuccess...');
            // Appeler onSuccess immédiatement
            onSuccess(captureResult.id);
          } else {
            console.log('[PayPal] Payment not completed:', captureResult.status);
            onError(t('paypal.captureError', 'Erreur lors de la capture du paiement'));
          }
        } catch (error) {
          console.error('[PayPal] Capture error:', error);
          onError(t('paypal.captureError', 'Erreur lors de la capture du paiement'));
        }
      },
      onError: (err: Error) => {
        console.error('PayPal Error:', err);
        onError(t('paypal.paymentError', 'Erreur de paiement PayPal'));
      },
      onCancel: () => {
        onCancel();
      },
    });

    buttons.render(paypalRef.current);
    buttonsInstance.current = buttons;

  }, [sdkReady, amount, currency, packId, packName, onSuccess, onError, onCancel, t]);

  if (loading) {
    return (
      <div className="paypal-loading">
        <div className="spinner"></div>
        <p>{t('paypal.loading', 'Chargement de PayPal...')}</p>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="paypal-loading">
        <div className="spinner"></div>
        <p>{t('paypal.processing', 'Traitement du paiement...')}</p>
      </div>
    );
  }

  return (
    <div className="paypal-checkout">
      <div className="paypal-info">
        <p>{t('paypal.securePayment', 'Paiement securise par PayPal')}</p>
      </div>
      <div ref={paypalRef} className="paypal-buttons-container"></div>
      <button className="paypal-cancel-btn" onClick={onCancel}>
        {t('common.cancel', 'Annuler')}
      </button>
    </div>
  );
};

export default PayPalCheckout;

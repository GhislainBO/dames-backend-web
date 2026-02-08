/**
 * StripeCheckout - Formulaire de paiement Stripe Elements
 */

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import './StripeCheckout.css';

interface StripeCheckoutProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function StripeCheckout({
  clientSecret,
  amount,
  currency,
  onSuccess,
  onCancel,
}: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number, curr: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: curr.toUpperCase(),
    }).format(price / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Erreur de validation');
      setProcessing(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Erreur de paiement');
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
    }
  };

  return (
    <div className="stripe-checkout">
      <div className="checkout-header">
        <h3>Paiement securise</h3>
        <p className="checkout-amount">Montant : {formatPrice(amount, currency)}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />

        {error && <div className="checkout-error">{error}</div>}

        <div className="checkout-actions">
          <button
            type="button"
            className="checkout-cancel-btn"
            onClick={onCancel}
            disabled={processing}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="checkout-pay-btn"
            disabled={!stripe || processing}
          >
            {processing ? 'Traitement...' : `Payer ${formatPrice(amount, currency)}`}
          </button>
        </div>
      </form>

      <div className="checkout-security">
        <span>🔒</span>
        <span>Paiement securise par Stripe</span>
      </div>
    </div>
  );
}

export default StripeCheckout;

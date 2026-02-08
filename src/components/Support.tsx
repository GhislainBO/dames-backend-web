/**
 * Support - Page de soutien avec donations et liens utiles
 *
 * Buy Me a Coffee, Ko-fi, PayPal et options gratuites
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Support.css';

interface SupportProps {
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// CONFIGURATION DES LIENS DE PAIEMENT STRIPE
// Remplacez ces URLs par vos vrais Stripe Payment Links
// Créez-les sur: https://dashboard.stripe.com/payment-links
// =============================================================================
const STRIPE_PAYMENT_LINKS = {
  // Lien pour don de 2€
  donation_2: 'https://buy.stripe.com/28E3cv7ZYcMQbuJgkR4Vyq00',
  // Lien pour don de 5€
  donation_5: 'https://buy.stripe.com/eVqaEX2MIbIM6ap70I4Vyq01',
  // Lien pour don de 10€
  donation_10: 'https://buy.stripe.com/4gM14ngDy3cgfKZ5Gd4Vyq02',
  // Lien pour don de 25€
  donation_25: 'https://buy.stripe.com/14A9AT872d0U42h7014Vyq04',
};

// Configuration des plateformes alternatives
const DONATION_CONFIG = {
  // Plateformes de don alternatives (optionnel)
  buymeacoffee: {
    enabled: true,
    username: 'dameselite',
    url: 'https://buymeacoffee.com/dameselite',
  },
  kofi: {
    enabled: true,
    username: 'dameselite',
    url: 'https://ko-fi.com/dameselite',
  },
  paypal: {
    enabled: true,
    email: 'contact@dameselite.com',
    url: 'https://paypal.me/dameselite',
  },
  // Liens sociaux
  discord: 'https://discord.gg/dameselite',
  twitter: 'https://twitter.com/dameselite',
  instagram: 'https://instagram.com/dameselite',
  facebook: 'https://facebook.com/dameselite',
};

const DONATION_PLATFORMS = [
  {
    id: 'buymeacoffee',
    name: 'Buy Me a Coffee',
    icon: '☕',
    url: DONATION_CONFIG.buymeacoffee.url,
    description: 'Offrez-nous un cafe!',
    color: '#FFDD00',
    textColor: '#000000',
    enabled: DONATION_CONFIG.buymeacoffee.enabled,
  },
  {
    id: 'kofi',
    name: 'Ko-fi',
    icon: '❤️',
    url: DONATION_CONFIG.kofi.url,
    description: 'Soutenez-nous sur Ko-fi',
    color: '#FF5E5B',
    textColor: '#FFFFFF',
    enabled: DONATION_CONFIG.kofi.enabled,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '💳',
    url: DONATION_CONFIG.paypal.url,
    description: 'Don direct via PayPal',
    color: '#003087',
    textColor: '#FFFFFF',
    enabled: DONATION_CONFIG.paypal.enabled,
  },
];

const SUPPORT_TIERS = [
  {
    amount: 2,
    label: '2€',
    name: 'Cafe',
    icon: '☕',
    description: 'Un petit cafe pour nous motiver',
    stripeLink: STRIPE_PAYMENT_LINKS.donation_2,
  },
  {
    amount: 5,
    label: '5€',
    name: 'Supporter',
    icon: '⭐',
    description: 'Aide a payer les serveurs',
    stripeLink: STRIPE_PAYMENT_LINKS.donation_5,
  },
  {
    amount: 10,
    label: '10€',
    name: 'Champion',
    icon: '🏆',
    description: 'Soutien important au projet',
    stripeLink: STRIPE_PAYMENT_LINKS.donation_10,
  },
  {
    amount: 25,
    label: '25€',
    name: 'Legende',
    icon: '👑',
    description: 'Vous etes incroyable!',
    stripeLink: STRIPE_PAYMENT_LINKS.donation_25,
  },
];

const Support: React.FC<SupportProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [showThanks, setShowThanks] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Ouvrir le lien de donation (plateforme alternative)
  const openDonationLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => setShowThanks(true), 2000);
  };

  // Ouvrir le lien Stripe Payment pour un montant donné
  const openStripePaymentLink = (stripeLink: string) => {
    window.open(stripeLink, '_blank', 'noopener,noreferrer');
    // Afficher le message de remerciement après un délai
    setTimeout(() => setShowThanks(true), 3000);
  };

  // Partager le jeu
  const shareGame = async () => {
    const shareData = {
      title: 'DAMESELITE - Jeu de Dames Internationales',
      text: 'Découvrez DAMESELITE, le meilleur jeu de dames en ligne gratuit!',
      url: 'https://dames-backend-web.vercel.app',
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        setShowShareModal(true);
      }
    } catch (err) {
      setShowShareModal(true);
    }
  };

  // Copier le lien
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://dames-backend-web.vercel.app');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Ouvrir Discord
  const openDiscord = () => {
    window.open(DONATION_CONFIG.discord, '_blank', 'noopener,noreferrer');
  };

  // Ouvrir les réseaux sociaux
  const openSocialMedia = () => {
    // Ouvre Twitter par défaut, ou on pourrait afficher un menu
    window.open(DONATION_CONFIG.twitter, '_blank', 'noopener,noreferrer');
  };

  // Ouvrir les stores pour noter (placeholder - à personnaliser selon les stores)
  const openRating = () => {
    // Pour une PWA web, on peut rediriger vers une page de feedback
    // Pour une app mobile, on redirigerait vers le store
    alert(t('support.ratingMessage', 'Merci! Les évaluations seront bientôt disponibles sur les app stores.'));
  };

  if (!isOpen) return null;

  return (
    <div className="support-overlay" onClick={onClose}>
      <div className="support-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        <div className="support-header">
          <div className="heart-icon">💝</div>
          <h2>{t('support.title', 'Soutenez DAMESELITE')}</h2>
          <p>{t('support.subtitle', 'Aidez-nous a garder le jeu gratuit et sans pub')}</p>
        </div>

        {/* Message de remerciement */}
        {showThanks && (
          <div className="thanks-message">
            <span className="thanks-icon">🙏</span>
            <p>{t('support.thanks', 'Merci infiniment pour votre soutien!')}</p>
            <button onClick={() => setShowThanks(false)}>OK</button>
          </div>
        )}

        {/* Modal de partage */}
        {showShareModal && (
          <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
            <div className="share-modal" onClick={e => e.stopPropagation()}>
              <h3>{t('support.shareTitle', 'Partager DAMESELITE')}</h3>
              <div className="share-buttons">
                <button
                  className="share-btn twitter"
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=Découvrez DAMESELITE, le meilleur jeu de dames en ligne!&url=https://dames-backend-web.vercel.app`, '_blank')}
                >
                  𝕏 Twitter
                </button>
                <button
                  className="share-btn facebook"
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=https://dames-backend-web.vercel.app`, '_blank')}
                >
                  📘 Facebook
                </button>
                <button
                  className="share-btn whatsapp"
                  onClick={() => window.open(`https://wa.me/?text=Découvrez DAMESELITE, le meilleur jeu de dames en ligne! https://dames-backend-web.vercel.app`, '_blank')}
                >
                  💬 WhatsApp
                </button>
                <button className="share-btn copy" onClick={copyLink}>
                  {copySuccess ? '✓ Copié!' : '📋 Copier le lien'}
                </button>
              </div>
              <button className="cancel-btn" onClick={() => setShowShareModal(false)}>
                {t('common.close', 'Fermer')}
              </button>
            </div>
          </div>
        )}

        {/* Pourquoi soutenir */}
        <div className="why-support">
          <h3>{t('support.whyTitle', 'Pourquoi nous soutenir?')}</h3>
          <ul>
            <li>
              <span className="check">✓</span>
              {t('support.reason1', 'Jeu 100% gratuit, sans publicites intrusives')}
            </li>
            <li>
              <span className="check">✓</span>
              {t('support.reason2', 'Developpement continu de nouvelles fonctionnalites')}
            </li>
            <li>
              <span className="check">✓</span>
              {t('support.reason3', 'Serveurs et infrastructure a maintenir')}
            </li>
            <li>
              <span className="check">✓</span>
              {t('support.reason4', 'Equipe passionnee qui travaille dur')}
            </li>
          </ul>
        </div>

        {/* Tiers de donation - Redirection vers Stripe Payment Links */}
        <div className="donation-tiers">
          {SUPPORT_TIERS.map(tier => (
            <div
              key={tier.amount}
              className="tier-card clickable"
              onClick={() => openStripePaymentLink(tier.stripeLink)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && openStripePaymentLink(tier.stripeLink)}
            >
              <span className="tier-icon">{tier.icon}</span>
              <span className="tier-amount">{tier.label}</span>
              <span className="tier-name">{tier.name}</span>
              <span className="tier-desc">{tier.description}</span>
            </div>
          ))}
        </div>

        {/* Plateformes de donation */}
        <h3 className="section-title">{t('support.donateVia', 'Ou directement via')}</h3>
        <div className="donation-platforms">
          {DONATION_PLATFORMS.filter(p => p.enabled).map(platform => (
            <button
              key={platform.id}
              className="platform-btn"
              onClick={() => openDonationLink(platform.url)}
              style={{
                '--platform-color': platform.color,
                '--platform-text': platform.textColor,
              } as React.CSSProperties}
            >
              <span className="platform-icon">{platform.icon}</span>
              <div className="platform-info">
                <span className="platform-name">{platform.name}</span>
                <span className="platform-desc">{platform.description}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Note importante */}
        <div className="setup-note">
          <span className="note-icon">ℹ️</span>
          <p>{t('support.setupNote', 'Les comptes de paiement sont en cours de configuration. Merci de votre patience!')}</p>
        </div>

        {/* Message alternatif - MAINTENANT CLIQUABLE */}
        <div className="alternative-support">
          <h4>{t('support.noMoney', 'Pas de budget?')}</h4>
          <p>{t('support.freeWays', 'Vous pouvez aussi nous aider gratuitement:')}</p>
          <div className="free-ways">
            <button className="free-way" onClick={openRating}>
              <span className="way-icon">⭐</span>
              <span>{t('support.rateUs', 'Notez-nous 5 etoiles')}</span>
            </button>
            <button className="free-way" onClick={shareGame}>
              <span className="way-icon">📢</span>
              <span>{t('support.shareGame', 'Partagez le jeu')}</span>
            </button>
            <button className="free-way" onClick={openDiscord}>
              <span className="way-icon">💬</span>
              <span>{t('support.joinDiscord', 'Rejoignez Discord')}</span>
            </button>
            <button className="free-way" onClick={openSocialMedia}>
              <span className="way-icon">🐦</span>
              <span>{t('support.followSocial', 'Suivez-nous')}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="support-footer">
          <p>{t('support.footerText', 'Chaque contribution compte. Merci!')}</p>
          <span className="heart-animation">❤️</span>
        </div>
      </div>
    </div>
  );
};

export default Support;

/**
 * Support - Page de soutien avec donations et liens utiles
 *
 * Buy Me a Coffee, Ko-fi, et message de soutien
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Support.css';

interface SupportProps {
  isOpen: boolean;
  onClose: () => void;
}

const DONATION_PLATFORMS = [
  {
    id: 'buymeacoffee',
    name: 'Buy Me a Coffee',
    icon: '☕',
    url: 'https://buymeacoffee.com/dameselite',
    description: 'Offrez-nous un cafe!',
    color: '#FFDD00',
    textColor: '#000000',
  },
  {
    id: 'kofi',
    name: 'Ko-fi',
    icon: '❤️',
    url: 'https://ko-fi.com/dameselite',
    description: 'Soutenez-nous sur Ko-fi',
    color: '#FF5E5B',
    textColor: '#FFFFFF',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '💳',
    url: 'https://paypal.me/dameselite',
    description: 'Don direct via PayPal',
    color: '#003087',
    textColor: '#FFFFFF',
  },
];

const SUPPORT_TIERS = [
  {
    amount: '2€',
    name: 'Cafe',
    icon: '☕',
    description: 'Un petit cafe pour nous motiver',
  },
  {
    amount: '5€',
    name: 'Supporter',
    icon: '⭐',
    description: 'Aide a payer les serveurs',
  },
  {
    amount: '10€',
    name: 'Champion',
    icon: '🏆',
    description: 'Soutien important au projet',
  },
  {
    amount: '25€',
    name: 'Legende',
    icon: '👑',
    description: 'Vous etes incroyable!',
  },
];

const Support: React.FC<SupportProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [showThanks, setShowThanks] = useState(false);

  const openDonationLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    // Afficher message de remerciement apres 2 secondes
    setTimeout(() => setShowThanks(true), 2000);
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

        {/* Tiers de donation */}
        <div className="donation-tiers">
          {SUPPORT_TIERS.map(tier => (
            <div key={tier.amount} className="tier-card">
              <span className="tier-icon">{tier.icon}</span>
              <span className="tier-amount">{tier.amount}</span>
              <span className="tier-name">{tier.name}</span>
              <span className="tier-desc">{tier.description}</span>
            </div>
          ))}
        </div>

        {/* Plateformes de donation */}
        <h3 className="section-title">{t('support.donateVia', 'Faire un don via')}</h3>
        <div className="donation-platforms">
          {DONATION_PLATFORMS.map(platform => (
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

        {/* Message alternatif */}
        <div className="alternative-support">
          <h4>{t('support.noMoney', 'Pas de budget?')}</h4>
          <p>{t('support.freeWays', 'Vous pouvez aussi nous aider gratuitement:')}</p>
          <div className="free-ways">
            <div className="free-way">
              <span className="way-icon">⭐</span>
              <span>{t('support.rateUs', 'Notez-nous 5 etoiles')}</span>
            </div>
            <div className="free-way">
              <span className="way-icon">📢</span>
              <span>{t('support.shareGame', 'Partagez le jeu')}</span>
            </div>
            <div className="free-way">
              <span className="way-icon">💬</span>
              <span>{t('support.joinDiscord', 'Rejoignez Discord')}</span>
            </div>
            <div className="free-way">
              <span className="way-icon">🐦</span>
              <span>{t('support.followSocial', 'Suivez-nous')}</span>
            </div>
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

/**
 * Community - Page communaute avec liens sociaux, Discord et newsletter
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Community.css';

interface CommunityProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOCIAL_LINKS = [
  {
    id: 'discord',
    name: 'Discord',
    icon: '💬',
    url: 'https://discord.gg/dameselite',
    description: 'Rejoignez notre serveur communautaire',
    members: '500+',
    color: '#5865F2',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: '🐦',
    url: 'https://twitter.com/dameselite',
    description: 'Actualites et tips quotidiens',
    followers: '1.2K',
    color: '#1DA1F2',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    url: 'https://instagram.com/dameselite',
    description: 'Belles parties et moments forts',
    followers: '800',
    color: '#E4405F',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    url: 'https://tiktok.com/@dameselite',
    description: 'Videos courtes et tutoriels',
    followers: '2.5K',
    color: '#000000',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    url: 'https://facebook.com/dameselite',
    description: 'Groupe et page officielle',
    followers: '600',
    color: '#1877F2',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '🎬',
    url: 'https://youtube.com/@dameselite',
    description: 'Analyses et streams',
    subscribers: '300',
    color: '#FF0000',
  },
];

const Community: React.FC<CommunityProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);

    // Simuler l'inscription (remplacer par Mailchimp API)
    setTimeout(() => {
      setSubscribed(true);
      setLoading(false);
      // Stocker localement que l'utilisateur s'est inscrit
      localStorage.setItem('dameselite_newsletter', 'subscribed');
    }, 1500);
  };

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="community-overlay" onClick={onClose}>
      <div className="community-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        <div className="community-header">
          <div className="community-icon">🌍</div>
          <h2>{t('community.title', 'Communaute')}</h2>
          <p>{t('community.subtitle', 'Rejoignez des milliers de joueurs passionnes')}</p>
        </div>

        {/* Discord highlight */}
        <div className="discord-highlight" onClick={() => openLink('https://discord.gg/dameselite')}>
          <div className="discord-logo">💬</div>
          <div className="discord-info">
            <h3>{t('community.joinDiscord', 'Rejoignez notre Discord')}</h3>
            <p>{t('community.discordDesc', 'Echangez, apprenez et participez aux defis!')}</p>
            <div className="discord-stats">
              <span className="online-dot"></span>
              <span>{t('community.membersOnline', '50+ en ligne')}</span>
            </div>
          </div>
          <div className="join-btn">{t('community.join', 'Rejoindre')}</div>
        </div>

        {/* Reseaux sociaux */}
        <h3 className="section-title">{t('community.followUs', 'Suivez-nous')}</h3>
        <div className="social-grid">
          {SOCIAL_LINKS.map(social => (
            <div
              key={social.id}
              className="social-card"
              onClick={() => openLink(social.url)}
              style={{ '--social-color': social.color } as React.CSSProperties}
            >
              <span className="social-icon">{social.icon}</span>
              <div className="social-info">
                <h4>{social.name}</h4>
                <p>{social.description}</p>
              </div>
              <span className="social-followers">
                {social.followers || social.subscribers || social.members}
              </span>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="newsletter-section">
          <h3>{t('community.newsletter', 'Newsletter')}</h3>
          <p>{t('community.newsletterDesc', 'Recevez le puzzle de la semaine et les actualites')}</p>

          {subscribed ? (
            <div className="subscribed-message">
              <span className="check-icon">✓</span>
              <p>{t('community.subscribed', 'Merci! Vous etes inscrit.')}</p>
            </div>
          ) : (
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('community.emailPlaceholder', 'Votre email')}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? '...' : t('community.subscribe', "S'inscrire")}
              </button>
            </form>
          )}

          <p className="privacy-note">
            {t('community.privacyNote', 'Pas de spam. Desabonnement en un clic.')}
          </p>
        </div>

        {/* Stats communaute */}
        <div className="community-stats">
          <div className="stat-item">
            <span className="stat-value">10K+</span>
            <span className="stat-label">{t('community.players', 'Joueurs')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">50K+</span>
            <span className="stat-label">{t('community.gamesPlayed', 'Parties jouees')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">15</span>
            <span className="stat-label">{t('community.countries', 'Pays')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;

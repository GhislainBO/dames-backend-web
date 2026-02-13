/**
 * Partners - Page des partenaires et sponsors
 *
 * Affiche les sponsors et propose le partenariat
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import './Partners.css';

interface Partner {
  id: string;
  name: string;
  logo?: string;
  description: string;
  tier: 'gold' | 'silver' | 'bronze' | 'supporter';
  url?: string;
}

interface PartnersProps {
  isOpen: boolean;
  onClose: () => void;
}

// Configuration du formulaire de contact sponsors
const SPONSOR_FORM_URL = 'https://forms.gle/your-google-form-id'; // À remplacer par votre Google Form
const SPONSOR_EMAIL = 'sponsors@dameselite.com';

// Partenaires actuels (ou espaces reserves)
const PARTNERS: Partner[] = [
  // === PARTENAIRES OR (Premium) ===
  {
    id: 'ffjd',
    name: 'Federation Francaise de Jeu de Dames',
    description: 'Partenaire officiel pour la promotion des dames en France.',
    tier: 'gold',
    url: 'https://ffjd.fr',
  },
  {
    id: 'gold-slot-1',
    name: 'Votre Marque Ici',
    description: 'Emplacement premium disponible - Visibilite maximale',
    tier: 'gold',
  },
  // === PARTENAIRES ARGENT ===
  {
    id: 'ligue-hdf',
    name: 'Ligue Hauts-de-France de Jeu de Dames',
    description: 'Ligue regionale - Wattrelos (59)',
    tier: 'silver',
    url: 'https://ligue-hdf-dames.fr',
  },
  {
    id: 'silver-slot-1',
    name: 'Emplacement Disponible',
    description: 'Rejoignez nos partenaires Argent',
    tier: 'silver',
  },
  // === PARTENAIRES BRONZE ===
  {
    id: 'damier-compiegne',
    name: 'Damier Compiegnois',
    description: 'Club de dames - Compiegne (60)',
    tier: 'bronze',
  },
  {
    id: 'damier-glisy',
    name: 'Damier de Glisy',
    description: 'Club de dames - Glisy (80)',
    tier: 'bronze',
  },
  {
    id: 'damier-sens',
    name: 'Damier Club de Sens',
    description: 'Club de dames - Sens (89)',
    tier: 'bronze',
  },
  // === SUPPORTERS ===
  {
    id: 'aillant-recreajeux',
    name: 'AILLANT-RECREA\'JEUX',
    description: 'Club de dames - Aillant-sur-Tholon (89)',
    tier: 'supporter',
  },
  {
    id: 'club-albert',
    name: 'Jeu de Dames Albert',
    description: 'Club de dames - Albert (21)',
    tier: 'supporter',
  },
];

const PARTNERSHIP_BENEFITS = [
  {
    tier: 'gold',
    name: 'Partenaire Or',
    price: '200€/mois',
    benefits: [
      'Logo en page d\'accueil',
      'Mention dans les tournois',
      'Post dedie sur reseaux sociaux',
      'Banniere dans le jeu',
      'Newsletter sponsorisee',
    ],
    color: '#FFD700',
  },
  {
    tier: 'silver',
    name: 'Partenaire Argent',
    price: '100€/mois',
    benefits: [
      'Logo en page partenaires',
      'Mention dans les tournois',
      'Post sur reseaux sociaux',
      'Lien vers votre site',
    ],
    color: '#C0C0C0',
  },
  {
    tier: 'bronze',
    name: 'Partenaire Bronze',
    price: '50€/mois',
    benefits: [
      'Logo en page partenaires',
      'Lien vers votre site',
      'Remerciement public',
    ],
    color: '#CD7F32',
  },
];

const Partners: React.FC<PartnersProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      gold: '#FFD700',
      silver: '#C0C0C0',
      bronze: '#CD7F32',
      supporter: '#4CAF50',
    };
    return colors[tier] || '#888';
  };

  const getTierIcon = (tier: string) => {
    const icons: Record<string, string> = {
      gold: '🥇',
      silver: '🥈',
      bronze: '🥉',
      supporter: '💚',
    };
    return icons[tier] || '⭐';
  };

  const openPartnerLink = (url?: string) => {
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const contactForPartnership = (method: 'email' | 'form' = 'email') => {
    if (method === 'form' && SPONSOR_FORM_URL !== 'https://forms.gle/your-google-form-id') {
      window.open(SPONSOR_FORM_URL, '_blank', 'noopener,noreferrer');
    } else {
      const subject = encodeURIComponent('Demande de partenariat DAMESELITE');
      const body = encodeURIComponent(`
Bonjour,

Je souhaite devenir partenaire de DAMESELITE.

Informations:
- Nom/Entreprise:
- Type de partenariat souhaite (Or/Argent/Bronze):
- Site web:
- Message:

Cordialement,
      `);
      window.location.href = `mailto:dev.mesapps@gmail.com?subject=${subject}&body=${body}`;
    }
  };

  const isPlaceholder = (partner: Partner) => {
    return partner.name.includes('Votre') || partner.name.includes('Emplacement') || partner.name.includes('Disponible');
  };

  if (!isOpen) return null;

  return (
    <div className="partners-overlay" onClick={onClose}>
      <div className="partners-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        <div className="partners-header">
          <div className="partners-icon">🤝</div>
          <h2>{t('partners.title', 'Nos Partenaires')}</h2>
          <p>{t('partners.subtitle', 'Merci a ceux qui nous soutiennent')}</p>
        </div>

        {/* Partenaires actuels */}
        <div className="partners-grid">
          {PARTNERS.map(partner => (
            <div
              key={partner.id}
              className={`partner-card tier-${partner.tier} ${partner.url ? 'clickable' : ''} ${isPlaceholder(partner) ? 'placeholder available' : ''}`}
              onClick={() => isPlaceholder(partner) ? contactForPartnership() : openPartnerLink(partner.url)}
              style={{ '--tier-color': getTierColor(partner.tier) } as React.CSSProperties}
            >
              <span className="tier-badge">{getTierIcon(partner.tier)}</span>
              <div className="partner-logo">
                {partner.logo ? (
                  <img src={partner.logo} alt={partner.name} />
                ) : isPlaceholder(partner) ? (
                  <span className="logo-placeholder available">
                    <span className="plus-icon">+</span>
                  </span>
                ) : (
                  <span className="logo-placeholder">
                    {partner.name.charAt(0)}
                  </span>
                )}
              </div>
              <h4>{partner.name}</h4>
              <p>{partner.description}</p>
              {isPlaceholder(partner) && (
                <span className="cta-badge">{t('partners.clickToJoin', 'Cliquez pour rejoindre')}</span>
              )}
            </div>
          ))}
        </div>

        {/* Devenir partenaire */}
        <div className="become-partner">
          <h3>{t('partners.becomePartner', 'Devenir Partenaire')}</h3>
          <p>{t('partners.becomePartnerDesc', 'Associez votre marque a DAMESELITE et touchez des milliers de joueurs passionnes.')}</p>

          <div className="tiers-grid">
            {PARTNERSHIP_BENEFITS.map(tier => (
              <div
                key={tier.tier}
                className="tier-card"
                style={{ '--tier-color': tier.color } as React.CSSProperties}
              >
                <span className="tier-icon">{getTierIcon(tier.tier)}</span>
                <h4>{tier.name}</h4>
                <span className="tier-price">{tier.price}</span>
                <ul>
                  {tier.benefits.map((benefit, i) => (
                    <li key={i}>
                      <span className="check">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <button className="contact-btn" onClick={contactForPartnership}>
            {t('partners.contactUs', 'Nous Contacter')}
          </button>
        </div>

        {/* Stats */}
        <div className="reach-stats">
          <h3>{t('partners.ourReach', 'Notre Audience')}</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">10K+</span>
              <span className="stat-label">{t('partners.monthlyPlayers', 'Joueurs/mois')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">50K+</span>
              <span className="stat-label">{t('partners.pageViews', 'Pages vues')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">5K+</span>
              <span className="stat-label">{t('partners.socialFollowers', 'Abonnes')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">15</span>
              <span className="stat-label">{t('partners.countries', 'Pays')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="partners-footer">
          <p>
            {t('partners.footerText', 'Contact: dev.mesapps@gmail.com')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Partners;

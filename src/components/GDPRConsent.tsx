/**
 * GDPRConsent - Composant de consentement RGPD
 *
 * Affiche une bannière de consentement pour les cookies et publicités
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adMobService } from '../services/AdMobService';

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
  timestamp: string;
}

const CONSENT_KEY = 'gdpr_consent';
const CONSENT_VERSION = '1.0';

export const GDPRConsent: React.FC = () => {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true, // Toujours requis
    analytics: false,
    advertising: false,
    timestamp: '',
  });

  useEffect(() => {
    // Vérifier si le consentement a déjà été donné
    const savedConsent = localStorage.getItem(CONSENT_KEY);
    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        if (parsed.version === CONSENT_VERSION) {
          setConsent(parsed.consent);
          applyConsent(parsed.consent);
          return;
        }
      } catch (e) {
        // Consentement invalide, redemander
      }
    }
    // Afficher la bannière si pas de consentement valide
    setShowBanner(true);
  }, []);

  const applyConsent = (consentState: ConsentState) => {
    // Appliquer le consentement aux services
    if (consentState.advertising) {
      adMobService.setConsent(true);
    } else {
      adMobService.setConsent(false);
    }

    // Analytics (à implémenter si vous utilisez GA, etc.)
    if (consentState.analytics) {
      // window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    }
  };

  const saveConsent = (consentState: ConsentState) => {
    const data = {
      version: CONSENT_VERSION,
      consent: {
        ...consentState,
        timestamp: new Date().toISOString(),
      },
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
    applyConsent(consentState);
    setShowBanner(false);
  };

  const acceptAll = () => {
    const fullConsent: ConsentState = {
      necessary: true,
      analytics: true,
      advertising: true,
      timestamp: new Date().toISOString(),
    };
    setConsent(fullConsent);
    saveConsent(fullConsent);
  };

  const acceptNecessary = () => {
    const minimalConsent: ConsentState = {
      necessary: true,
      analytics: false,
      advertising: false,
      timestamp: new Date().toISOString(),
    };
    setConsent(minimalConsent);
    saveConsent(minimalConsent);
  };

  const saveCustomConsent = () => {
    saveConsent(consent);
  };

  if (!showBanner) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.banner}>
        <div style={styles.header}>
          <span style={styles.icon}>🍪</span>
          <h3 style={styles.title}>{t('gdpr.title', 'Votre vie privée')}</h3>
        </div>

        <p style={styles.text}>
          {t('gdpr.description',
            'Nous utilisons des cookies pour améliorer votre expérience et afficher des publicités personnalisées. Vous pouvez choisir quels cookies accepter.'
          )}
        </p>

        {showDetails && (
          <div style={styles.details}>
            <div style={styles.option}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={consent.necessary}
                  disabled
                  style={styles.checkbox}
                />
                <span style={styles.optionTitle}>
                  {t('gdpr.necessary', 'Cookies nécessaires')}
                </span>
              </label>
              <p style={styles.optionDesc}>
                {t('gdpr.necessaryDesc', 'Requis pour le fonctionnement du jeu (authentification, sauvegarde).')}
              </p>
            </div>

            <div style={styles.option}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={consent.analytics}
                  onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                  style={styles.checkbox}
                />
                <span style={styles.optionTitle}>
                  {t('gdpr.analytics', 'Cookies analytiques')}
                </span>
              </label>
              <p style={styles.optionDesc}>
                {t('gdpr.analyticsDesc', 'Nous aident à comprendre comment vous utilisez le jeu.')}
              </p>
            </div>

            <div style={styles.option}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={consent.advertising}
                  onChange={(e) => setConsent({ ...consent, advertising: e.target.checked })}
                  style={styles.checkbox}
                />
                <span style={styles.optionTitle}>
                  {t('gdpr.advertising', 'Cookies publicitaires')}
                </span>
              </label>
              <p style={styles.optionDesc}>
                {t('gdpr.advertisingDesc', 'Permettent d\'afficher des publicités pertinentes.')}
              </p>
            </div>
          </div>
        )}

        <div style={styles.buttons}>
          {!showDetails ? (
            <>
              <button onClick={() => setShowDetails(true)} style={styles.buttonSecondary}>
                {t('gdpr.customize', 'Personnaliser')}
              </button>
              <button onClick={acceptNecessary} style={styles.buttonSecondary}>
                {t('gdpr.acceptNecessary', 'Refuser optionnels')}
              </button>
              <button onClick={acceptAll} style={styles.buttonPrimary}>
                {t('gdpr.acceptAll', 'Tout accepter')}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setShowDetails(false)} style={styles.buttonSecondary}>
                {t('gdpr.back', 'Retour')}
              </button>
              <button onClick={saveCustomConsent} style={styles.buttonPrimary}>
                {t('gdpr.save', 'Sauvegarder mes choix')}
              </button>
            </>
          )}
        </div>

        <div style={styles.links}>
          <a href="/privacy-policy.html" target="_blank" style={styles.link}>
            {t('gdpr.privacyPolicy', 'Politique de confidentialité')}
          </a>
          <span style={styles.separator}>|</span>
          <a href="/terms-of-service.html" target="_blank" style={styles.link}>
            {t('gdpr.terms', "Conditions d'utilisation")}
          </a>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: '16px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
    pointerEvents: 'none',
  },
  banner: {
    maxWidth: '600px',
    margin: '0 auto',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    pointerEvents: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  icon: {
    fontSize: '28px',
  },
  title: {
    margin: 0,
    color: '#fff',
    fontSize: '18px',
  },
  text: {
    color: '#ccc',
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  details: {
    marginBottom: '16px',
    padding: '16px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
  },
  option: {
    marginBottom: '12px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: '#e94560',
  },
  optionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  optionDesc: {
    color: '#888',
    fontSize: '12px',
    marginLeft: '26px',
    marginTop: '4px',
  },
  buttons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  buttonPrimary: {
    padding: '10px 20px',
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  buttonSecondary: {
    padding: '10px 20px',
    background: 'transparent',
    color: '#ccc',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  links: {
    marginTop: '16px',
    textAlign: 'center',
    fontSize: '12px',
  },
  link: {
    color: '#4a9eff',
    textDecoration: 'none',
  },
  separator: {
    color: '#666',
    margin: '0 8px',
  },
};

export default GDPRConsent;

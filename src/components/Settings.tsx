/**
 * Settings - Page de parametres utilisateur
 *
 * Preferences de jeu, sons, notifications, compte
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Settings.css';

interface SettingsData {
  sounds: {
    enabled: boolean;
    volume: number;
    music: boolean;
    effects: boolean;
  };
  display: {
    theme: 'dark' | 'light' | 'auto';
    animations: boolean;
    showHints: boolean;
    confirmMoves: boolean;
  };
  notifications: {
    dailyReminder: boolean;
    tournamentAlerts: boolean;
    achievementUnlock: boolean;
    newsletter: boolean;
  };
  gameplay: {
    autoQueen: boolean;
    highlightMoves: boolean;
    showTimer: boolean;
    pieceStyle: 'classic' | 'modern' | 'minimal';
  };
  privacy: {
    showOnlineStatus: boolean;
    allowChallenges: boolean;
    publicProfile: boolean;
  };
}

const DEFAULT_SETTINGS: SettingsData = {
  sounds: {
    enabled: true,
    volume: 70,
    music: true,
    effects: true,
  },
  display: {
    theme: 'dark',
    animations: true,
    showHints: true,
    confirmMoves: false,
  },
  notifications: {
    dailyReminder: true,
    tournamentAlerts: true,
    achievementUnlock: true,
    newsletter: false,
  },
  gameplay: {
    autoQueen: true,
    highlightMoves: true,
    showTimer: true,
    pieceStyle: 'classic',
  },
  privacy: {
    showOnlineStatus: true,
    allowChallenges: true,
    publicProfile: true,
  },
};

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<string>('sounds');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('dameselite_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('dameselite_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('dameselite_settings', JSON.stringify(DEFAULT_SETTINGS));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = <K extends keyof SettingsData>(
    category: K,
    key: keyof SettingsData[K],
    value: SettingsData[K][keyof SettingsData[K]]
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const tabs = [
    { id: 'sounds', icon: '🔊', label: t('settings.sounds', 'Sons') },
    { id: 'display', icon: '🎨', label: t('settings.display', 'Affichage') },
    { id: 'gameplay', icon: '🎮', label: t('settings.gameplay', 'Jeu') },
    { id: 'notifications', icon: '🔔', label: t('settings.notifications', 'Notifications') },
    { id: 'privacy', icon: '🔒', label: t('settings.privacy', 'Confidentialite') },
  ];

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        <div className="settings-header">
          <h2>{t('settings.title', 'Parametres')}</h2>
          <p>{t('settings.subtitle', 'Personnalisez votre experience')}</p>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">
          {/* Sons */}
          {activeTab === 'sounds' && (
            <div className="settings-section">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.soundEnabled', 'Sons actives')}</span>
                  <span className="setting-desc">{t('settings.soundEnabledDesc', 'Activer tous les sons du jeu')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.sounds.enabled}
                    onChange={e => updateSetting('sounds', 'enabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.volume', 'Volume')}</span>
                  <span className="setting-value">{settings.sounds.volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sounds.volume}
                  onChange={e => updateSetting('sounds', 'volume', parseInt(e.target.value))}
                  className="volume-slider"
                  disabled={!settings.sounds.enabled}
                />
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.music', 'Musique de fond')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.sounds.music}
                    onChange={e => updateSetting('sounds', 'music', e.target.checked)}
                    disabled={!settings.sounds.enabled}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.effects', 'Effets sonores')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.sounds.effects}
                    onChange={e => updateSetting('sounds', 'effects', e.target.checked)}
                    disabled={!settings.sounds.enabled}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}

          {/* Affichage */}
          {activeTab === 'display' && (
            <div className="settings-section">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.theme', 'Theme')}</span>
                </div>
                <select
                  value={settings.display.theme}
                  onChange={e => updateSetting('display', 'theme', e.target.value as 'dark' | 'light' | 'auto')}
                  className="setting-select"
                >
                  <option value="dark">{t('settings.themeDark', 'Sombre')}</option>
                  <option value="light">{t('settings.themeLight', 'Clair')}</option>
                  <option value="auto">{t('settings.themeAuto', 'Automatique')}</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.animations', 'Animations')}</span>
                  <span className="setting-desc">{t('settings.animationsDesc', 'Activer les animations fluides')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.display.animations}
                    onChange={e => updateSetting('display', 'animations', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.showHints', 'Afficher les indices')}</span>
                  <span className="setting-desc">{t('settings.showHintsDesc', 'Montrer les coups possibles')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.display.showHints}
                    onChange={e => updateSetting('display', 'showHints', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.confirmMoves', 'Confirmer les coups')}</span>
                  <span className="setting-desc">{t('settings.confirmMovesDesc', 'Demander confirmation avant de jouer')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.display.confirmMoves}
                    onChange={e => updateSetting('display', 'confirmMoves', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}

          {/* Gameplay */}
          {activeTab === 'gameplay' && (
            <div className="settings-section">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.pieceStyle', 'Style des pions')}</span>
                </div>
                <select
                  value={settings.gameplay.pieceStyle}
                  onChange={e => updateSetting('gameplay', 'pieceStyle', e.target.value as 'classic' | 'modern' | 'minimal')}
                  className="setting-select"
                >
                  <option value="classic">{t('settings.pieceClassic', 'Classique')}</option>
                  <option value="modern">{t('settings.pieceModern', 'Moderne')}</option>
                  <option value="minimal">{t('settings.pieceMinimal', 'Minimal')}</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.autoQueen', 'Promotion automatique')}</span>
                  <span className="setting-desc">{t('settings.autoQueenDesc', 'Promouvoir automatiquement en dame')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.gameplay.autoQueen}
                    onChange={e => updateSetting('gameplay', 'autoQueen', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.highlightMoves', 'Surligner les coups')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.gameplay.highlightMoves}
                    onChange={e => updateSetting('gameplay', 'highlightMoves', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.showTimer', 'Afficher le chrono')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.gameplay.showTimer}
                    onChange={e => updateSetting('gameplay', 'showTimer', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.dailyReminder', 'Rappel quotidien')}</span>
                  <span className="setting-desc">{t('settings.dailyReminderDesc', 'Rappel pour le puzzle du jour')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifications.dailyReminder}
                    onChange={e => updateSetting('notifications', 'dailyReminder', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.tournamentAlerts', 'Alertes tournois')}</span>
                  <span className="setting-desc">{t('settings.tournamentAlertsDesc', 'Notification avant les tournois')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifications.tournamentAlerts}
                    onChange={e => updateSetting('notifications', 'tournamentAlerts', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.achievementUnlock', 'Succes debloques')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifications.achievementUnlock}
                    onChange={e => updateSetting('notifications', 'achievementUnlock', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.newsletter', 'Newsletter')}</span>
                  <span className="setting-desc">{t('settings.newsletterDesc', 'Recevoir les actualites par email')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifications.newsletter}
                    onChange={e => updateSetting('notifications', 'newsletter', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}

          {/* Confidentialite */}
          {activeTab === 'privacy' && (
            <div className="settings-section">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.showOnlineStatus', 'Statut en ligne')}</span>
                  <span className="setting-desc">{t('settings.showOnlineStatusDesc', 'Montrer quand vous etes en ligne')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.privacy.showOnlineStatus}
                    onChange={e => updateSetting('privacy', 'showOnlineStatus', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.allowChallenges', 'Accepter les defis')}</span>
                  <span className="setting-desc">{t('settings.allowChallengesDesc', 'Permettre aux autres de vous defier')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.privacy.allowChallenges}
                    onChange={e => updateSetting('privacy', 'allowChallenges', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">{t('settings.publicProfile', 'Profil public')}</span>
                  <span className="setting-desc">{t('settings.publicProfileDesc', 'Rendre votre profil visible')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.privacy.publicProfile}
                    onChange={e => updateSetting('privacy', 'publicProfile', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="privacy-info">
                <p>{t('settings.privacyInfo', 'Vos donnees sont stockees localement et ne sont jamais partagees sans votre consentement.')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="settings-actions">
          <button className="reset-btn" onClick={resetSettings}>
            {t('settings.reset', 'Reinitialiser')}
          </button>
          <button className="save-btn" onClick={saveSettings}>
            {saved ? t('settings.saved', 'Sauvegarde!') : t('settings.save', 'Sauvegarder')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

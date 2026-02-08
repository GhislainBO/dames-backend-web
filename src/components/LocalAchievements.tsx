/**
 * LocalAchievements - Affiche les succes locaux
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  localAchievementsService,
  LocalAchievement,
  AchievementNotification,
} from '../services/LocalAchievementsService';
import './LocalAchievements.css';

interface LocalAchievementsProps {
  isOpen: boolean;
  onClose: () => void;
}

const LocalAchievements: React.FC<LocalAchievementsProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState<LocalAchievement[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [notification, setNotification] = useState<AchievementNotification | null>(null);
  const [claimMessage, setClaimMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadAchievements();
      checkNotifications();
    }
  }, [isOpen]);

  const loadAchievements = () => {
    setAchievements(localAchievementsService.getAllAchievements());
  };

  const checkNotifications = () => {
    const pending = localAchievementsService.getPendingNotifications();
    if (pending.length > 0) {
      setNotification(pending[0]);
    }
  };

  const dismissNotification = () => {
    localAchievementsService.clearNotifications();
    setNotification(null);
  };

  const handleClaimReward = (id: string) => {
    const reward = localAchievementsService.claimReward(id);
    if (reward > 0) {
      setClaimMessage(`+${reward} ${t('wallet.coins', 'jetons')}!`);
      setTimeout(() => setClaimMessage(''), 2000);
      loadAchievements();
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      games: t('localAchievements.categories.games', 'Parties'),
      wins: t('localAchievements.categories.wins', 'Victoires'),
      puzzle: t('localAchievements.categories.puzzle', 'Puzzles'),
      learning: t('localAchievements.categories.learning', 'Apprentissage'),
      streak: t('localAchievements.categories.streak', 'Series'),
      special: t('localAchievements.categories.special', 'Special'),
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      games: '#4CAF50',
      wins: '#FFD700',
      puzzle: '#9C27B0',
      learning: '#2196F3',
      streak: '#FF5722',
      special: '#E91E63',
    };
    return colors[category] || '#888';
  };

  const filteredAchievements = filter === 'all'
    ? achievements
    : achievements.filter(a => a.category === filter);

  const stats = localAchievementsService.getStats();
  const unclaimedCount = achievements.filter(a => a.unlockedAt && !a.rewardClaimed).length;

  if (!isOpen) return null;

  return (
    <div className="local-achievements-overlay" onClick={onClose}>
      <div className="local-achievements-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        <h2>{t('localAchievements.title', 'Succes Locaux')}</h2>

        {/* Notification de nouveau succes */}
        {notification && (
          <div className="achievement-notification">
            <div className="notif-content">
              <span className="notif-icon">{notification.icon}</span>
              <div className="notif-info">
                <h4>{t('localAchievements.unlocked', 'Succes debloque!')}</h4>
                <p>{notification.name}</p>
              </div>
              <span className="notif-reward">+{notification.reward}</span>
            </div>
            <button onClick={dismissNotification}>{t('common.ok', 'OK')}</button>
          </div>
        )}

        {/* Message de reclamation */}
        {claimMessage && (
          <div className="claim-message">{claimMessage}</div>
        )}

        {/* Stats */}
        <div className="achievements-summary">
          <div className="summary-item">
            <span className="summary-value">{stats.unlocked}/{stats.total}</span>
            <span className="summary-label">{t('localAchievements.completed', 'Debloques')}</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{stats.claimedRewards}</span>
            <span className="summary-label">{t('localAchievements.earned', 'Gagnes')}</span>
          </div>
          {unclaimedCount > 0 && (
            <div className="summary-item highlight">
              <span className="summary-value">{unclaimedCount}</span>
              <span className="summary-label">{t('localAchievements.toClaim', 'A reclamer')}</span>
            </div>
          )}
        </div>

        {/* Filtres */}
        <div className="category-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('localAchievements.all', 'Tous')}
          </button>
          {['games', 'wins', 'puzzle', 'learning', 'streak', 'special'].map(cat => (
            <button
              key={cat}
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
              style={{ '--cat-color': getCategoryColor(cat) } as React.CSSProperties}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Liste des achievements */}
        <div className="achievements-list">
          {filteredAchievements.map(achievement => (
            <div
              key={achievement.id}
              className={`achievement-card ${achievement.unlockedAt ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon" style={{
                background: achievement.unlockedAt
                  ? getCategoryColor(achievement.category)
                  : '#444'
              }}>
                {achievement.icon}
              </div>

              <div className="achievement-info">
                <h4>{achievement.name}</h4>
                <p>{achievement.description}</p>

                {/* Progress bar */}
                {!achievement.unlockedAt && (
                  <div className="achievement-progress">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(achievement.progress / achievement.requirement) * 100}%`,
                        background: getCategoryColor(achievement.category),
                      }}
                    />
                    <span className="progress-text">
                      {achievement.progress}/{achievement.requirement}
                    </span>
                  </div>
                )}

                <span
                  className="achievement-category"
                  style={{ background: getCategoryColor(achievement.category) }}
                >
                  {getCategoryLabel(achievement.category)}
                </span>
              </div>

              <div className="achievement-reward">
                {achievement.unlockedAt ? (
                  achievement.rewardClaimed ? (
                    <span className="claimed-badge">
                      {t('localAchievements.claimed', 'Reclame')}
                    </span>
                  ) : (
                    <button
                      className="claim-btn"
                      onClick={() => handleClaimReward(achievement.id)}
                    >
                      +{achievement.reward}
                    </button>
                  )
                ) : (
                  <span className="reward-locked">{achievement.reward}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocalAchievements;

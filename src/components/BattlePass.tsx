/**
 * BattlePass - Pass Saisonnier avec récompenses et missions
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import './BattlePass.css';

const API_URL = 'https://dames-backend-production.up.railway.app';

interface Mission {
  id: string;
  type: 'daily' | 'weekly';
  name: string;
  description: string;
  target: number;
  xpReward: number;
}

interface UserMission {
  odMission: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

interface SeasonReward {
  level: number;
  freeReward: {
    type: 'coins' | 'cosmetic' | 'none';
    amount?: number;
    itemName?: string;
  };
  premiumReward: {
    type: 'coins' | 'cosmetic';
    amount?: number;
    itemName?: string;
  };
}

interface Season {
  id: string;
  name: string;
  endDate: string;
  maxLevel: number;
  xpPerLevel: number;
  premiumPrice: number;
  rewards: SeasonReward[];
  missions: {
    daily: Mission[];
    weekly: Mission[];
  };
}

interface UserProgress {
  isPremium: boolean;
  xp: number;
  level: number;
  xpForNextLevel: number;
  xpInCurrentLevel: number;
  claimedRewards: number[];
  missions: UserMission[];
}

interface BattlePassProps {
  isOpen: boolean;
  onClose: () => void;
  onBalanceChange?: () => void;
}

function BattlePass({ isOpen, onClose, onBalanceChange }: BattlePassProps) {
  const { t } = useTranslation();
  const { token, isAuthenticated } = useAuth();
  const [season, setSeason] = useState<Season | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'rewards' | 'missions'>('rewards');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupérer la saison
      const seasonRes = await fetch(`${API_URL}/api/battlepass/season`);
      const seasonData = await seasonRes.json();
      if (seasonData.success) {
        setSeason(seasonData.season);
        setTimeRemaining(seasonData.timeRemaining);
      }

      // Récupérer la progression si connecté
      if (isAuthenticated && token) {
        const progressRes = await fetch(`${API_URL}/api/battlepass/progress`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const progressData = await progressRes.json();
        if (progressData.success) {
          setProgress(progressData.progress);
        }
      }
    } catch (error) {
      console.error('Erreur chargement Battle Pass:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchasePremium = async () => {
    if (!isAuthenticated) {
      setMessage(t('battlePass.loginRequired'));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/battlepass/purchase-premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (data.success) {
        setMessage(t('battlePass.premiumActivated'));
        fetchData();
        onBalanceChange?.();
      } else {
        setMessage(data.error || t('common.error'));
      }
    } catch (error) {
      setMessage(t('errors.connectionFailed'));
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleClaimMission = async (missionId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/battlepass/claim-mission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ missionId }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage(`+${data.xp} XP!`);
        fetchData();
      } else {
        setMessage(data.error || t('common.error'));
      }
    } catch (error) {
      setMessage(t('errors.connectionFailed'));
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleClaimReward = async (level: number) => {
    try {
      const res = await fetch(`${API_URL}/api/battlepass/claim-reward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ level }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.reward.type === 'coins') {
          setMessage(`+${data.reward.amount} ${t('wallet.coins')}!`);
          onBalanceChange?.();
        } else {
          setMessage(t('battlePass.cosmeticUnlocked'));
        }
        fetchData();
      } else {
        setMessage(data.error || t('common.error'));
      }
    } catch (error) {
      setMessage(t('errors.connectionFailed'));
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const getMissionProgress = (missionId: string): UserMission | undefined => {
    return progress?.missions.find(m => m.odMission === missionId);
  };

  const canClaimReward = (level: number, isPremiumReward: boolean): boolean => {
    if (!progress) return false;
    if (progress.level < level) return false;
    if (progress.claimedRewards.includes(level)) return false;
    if (isPremiumReward && !progress.isPremium) return false;
    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="battlepass-overlay" onClick={onClose}>
      <div className="battlepass-modal" onClick={e => e.stopPropagation()}>
        <button className="battlepass-close" onClick={onClose}>&times;</button>

        {/* Header */}
        <div className="battlepass-header">
          <div className="season-info">
            <h2>{season?.name || t('battlePass.title')}</h2>
            <span className="time-remaining">
              {timeRemaining.days}d {timeRemaining.hours}h {t('battlePass.remaining')}
            </span>
          </div>

          {progress && (
            <div className="level-info">
              <span className="current-level">{t('battlePass.level')} {progress.level}</span>
              <div className="xp-bar">
                <div
                  className="xp-fill"
                  style={{ width: `${(progress.xpInCurrentLevel / progress.xpForNextLevel) * 100}%` }}
                />
              </div>
              <span className="xp-text">{progress.xpInCurrentLevel}/{progress.xpForNextLevel} XP</span>
            </div>
          )}
        </div>

        {message && <div className="battlepass-message">{message}</div>}

        {/* Premium Banner */}
        {progress && !progress.isPremium && (
          <div className="premium-banner">
            <div className="premium-content">
              <span className="premium-icon">⭐</span>
              <div className="premium-text">
                <h3>{t('battlePass.getPremium')}</h3>
                <p>{t('battlePass.premiumBenefits')}</p>
              </div>
              <button className="premium-btn" onClick={handlePurchasePremium}>
                {season?.premiumPrice} 🪙
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="battlepass-tabs">
          <button
            className={`tab ${activeTab === 'rewards' ? 'active' : ''}`}
            onClick={() => setActiveTab('rewards')}
          >
            {t('battlePass.rewards')}
          </button>
          <button
            className={`tab ${activeTab === 'missions' ? 'active' : ''}`}
            onClick={() => setActiveTab('missions')}
          >
            {t('battlePass.missions')}
          </button>
        </div>

        {loading ? (
          <p className="loading-text">{t('common.loading')}</p>
        ) : activeTab === 'rewards' ? (
          /* Rewards Track */
          <div className="rewards-track">
            {season?.rewards.slice(0, 20).map(reward => (
              <div
                key={reward.level}
                className={`reward-item ${progress && progress.level >= reward.level ? 'unlocked' : 'locked'}`}
              >
                <div className="reward-level">{reward.level}</div>

                {/* Free Reward */}
                <div
                  className={`reward-box free ${
                    reward.freeReward.type === 'none' ? 'empty' : ''
                  } ${progress?.claimedRewards.includes(reward.level) && reward.freeReward.type !== 'none' ? 'claimed' : ''}`}
                  onClick={() => canClaimReward(reward.level, false) && reward.freeReward.type !== 'none' && handleClaimReward(reward.level)}
                >
                  {reward.freeReward.type === 'coins' ? (
                    <>🪙 {reward.freeReward.amount}</>
                  ) : reward.freeReward.type === 'cosmetic' ? (
                    <>🎨</>
                  ) : (
                    <span className="empty-slot">-</span>
                  )}
                </div>

                {/* Premium Reward */}
                <div
                  className={`reward-box premium ${
                    !progress?.isPremium ? 'locked-premium' : ''
                  } ${progress?.claimedRewards.includes(reward.level) ? 'claimed' : ''}`}
                  onClick={() => canClaimReward(reward.level, true) && handleClaimReward(reward.level)}
                >
                  {reward.premiumReward.type === 'coins' ? (
                    <>🪙 {reward.premiumReward.amount}</>
                  ) : (
                    <>🎨 {reward.premiumReward.itemName?.substring(0, 8)}</>
                  )}
                  {!progress?.isPremium && <span className="lock-icon">🔒</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Missions */
          <div className="missions-container">
            <div className="missions-section">
              <h3>{t('battlePass.dailyMissions')}</h3>
              {season?.missions.daily.map(mission => {
                const userMission = getMissionProgress(mission.id);
                return (
                  <div key={mission.id} className={`mission-card ${userMission?.completed ? 'completed' : ''}`}>
                    <div className="mission-info">
                      <span className="mission-name">{mission.name}</span>
                      <span className="mission-desc">{mission.description}</span>
                      <div className="mission-progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(((userMission?.progress || 0) / mission.target) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="mission-progress-text">
                        {userMission?.progress || 0}/{mission.target}
                      </span>
                    </div>
                    <div className="mission-reward">
                      <span className="xp-reward">+{mission.xpReward} XP</span>
                      {userMission?.completed && !userMission.claimed ? (
                        <button className="claim-btn" onClick={() => handleClaimMission(mission.id)}>
                          {t('achievements.claim')}
                        </button>
                      ) : userMission?.claimed ? (
                        <span className="claimed-badge">✓</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="missions-section">
              <h3>{t('battlePass.weeklyMissions')}</h3>
              {season?.missions.weekly.map(mission => {
                const userMission = getMissionProgress(mission.id);
                return (
                  <div key={mission.id} className={`mission-card weekly ${userMission?.completed ? 'completed' : ''}`}>
                    <div className="mission-info">
                      <span className="mission-name">{mission.name}</span>
                      <span className="mission-desc">{mission.description}</span>
                      <div className="mission-progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(((userMission?.progress || 0) / mission.target) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="mission-progress-text">
                        {userMission?.progress || 0}/{mission.target}
                      </span>
                    </div>
                    <div className="mission-reward">
                      <span className="xp-reward">+{mission.xpReward} XP</span>
                      {userMission?.completed && !userMission.claimed ? (
                        <button className="claim-btn" onClick={() => handleClaimMission(mission.id)}>
                          {t('achievements.claim')}
                        </button>
                      ) : userMission?.claimed ? (
                        <span className="claimed-badge">✓</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="login-warning">
            {t('battlePass.loginRequired')}
          </div>
        )}
      </div>
    </div>
  );
}

export default BattlePass;

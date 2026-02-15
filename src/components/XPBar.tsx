/**
 * XP BAR - Barre de progression XP Premium
 * Phase 1 - Visible dans le header
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { progressionService, PlayerLevel, DailyStreak } from '../services/ProgressionService';
import './XPBar.css';

interface XPBarProps {
  compact?: boolean;
}

function XPBar({ compact = false }: XPBarProps) {
  const { t } = useTranslation();
  const [level, setLevel] = useState<PlayerLevel>(progressionService.getProgression());
  const [streak, setStreak] = useState<DailyStreak>(progressionService.getDailyStreak());
  const [showDetails, setShowDetails] = useState(false);
  const [showRewardClaimed, setShowRewardClaimed] = useState(false);
  const [claimedReward, setClaimedReward] = useState<{ xp: number; coins: number } | null>(null);

  // Rafraîchir les données périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      setLevel(progressionService.getProgression());
      setStreak(progressionService.getDailyStreak());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Écouter les changements de progression (événement custom)
  useEffect(() => {
    const handleProgressUpdate = () => {
      setLevel(progressionService.getProgression());
      setStreak(progressionService.getDailyStreak());
    };

    window.addEventListener('progressionUpdate', handleProgressUpdate);
    return () => window.removeEventListener('progressionUpdate', handleProgressUpdate);
  }, []);

  const handleClaimDaily = () => {
    const reward = progressionService.claimDailyReward();
    if (reward) {
      setClaimedReward({ xp: reward.xp, coins: reward.coins });
      setShowRewardClaimed(true);
      setLevel(progressionService.getProgression());
      setStreak(progressionService.getDailyStreak());

      // Dispatch event pour mettre à jour le wallet
      window.dispatchEvent(new CustomEvent('coinsEarned', { detail: { amount: reward.coins } }));

      setTimeout(() => {
        setShowRewardClaimed(false);
        setClaimedReward(null);
      }, 3000);
    }
  };

  const progressPercent = Math.min((level.currentXP / level.xpForNextLevel) * 100, 100);

  if (compact) {
    return (
      <div className="xp-bar-compact" onClick={() => setShowDetails(!showDetails)}>
        <div className="xp-level-badge">
          <span className="level-number">{level.level}</span>
        </div>
        <div className="xp-progress-mini">
          <div className="xp-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        {streak.currentStreak > 0 && (
          <div className="streak-badge-mini">
            <span className="streak-flame">🔥</span>
            <span className="streak-count">{streak.currentStreak}</span>
          </div>
        )}

        {showDetails && (
          <div className="xp-details-dropdown">
            <div className="xp-details-header">
              <span className="level-badge-large">{level.badge}</span>
              <div className="level-info">
                <span className="level-title">{level.title}</span>
                <span className="level-number-large">Niveau {level.level}</span>
              </div>
            </div>

            <div className="xp-progress-detailed">
              <div className="xp-progress-bar-large">
                <div className="xp-progress-fill-large" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="xp-numbers">
                <span>{level.currentXP.toLocaleString()} XP</span>
                <span>{level.xpForNextLevel.toLocaleString()} XP</span>
              </div>
            </div>

            <div className="streak-section">
              <div className="streak-header">
                <span className="streak-icon">🔥</span>
                <span className="streak-label">{t('xp.dailyStreak', 'Serie quotidienne')}</span>
              </div>
              <div className="streak-info">
                <span className="streak-days">{streak.currentStreak} {t('xp.days', 'jours')}</span>
                {streak.canClaim && (
                  <button className="claim-daily-btn" onClick={(e) => { e.stopPropagation(); handleClaimDaily(); }}>
                    <span>🎁</span>
                    <span>{t('xp.claim', 'Reclamer')}</span>
                    <span className="reward-preview">+{streak.nextReward} XP</span>
                  </button>
                )}
                {!streak.canClaim && (
                  <span className="claimed-today">{t('xp.claimedToday', 'Reclame!')}</span>
                )}
              </div>
            </div>

            <div className="weekly-progress">
              <span className="weekly-label">{t('xp.weeklyProgress', 'Progres hebdomadaire')}</span>
              <div className="weekly-dots">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div
                    key={day}
                    className={`weekly-dot ${day <= streak.currentStreak ? 'completed' : ''} ${day === 7 ? 'bonus' : ''}`}
                  >
                    {day === 7 ? '🎁' : day <= streak.currentStreak ? '✓' : day}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showRewardClaimed && claimedReward && (
          <div className="reward-notification">
            <span className="reward-icon">🎉</span>
            <span className="reward-text">+{claimedReward.xp} XP</span>
            <span className="reward-coins">+{claimedReward.coins} 🪙</span>
          </div>
        )}
      </div>
    );
  }

  // Version complète pour la page profil ou menu
  return (
    <div className="xp-bar-full">
      <div className="xp-header">
        <div className="level-display">
          <span className="level-badge-icon">{level.badge}</span>
          <div className="level-text">
            <span className="level-title">{level.title}</span>
            <span className="level-number">Niveau {level.level}</span>
          </div>
        </div>

        <div className="streak-display">
          <span className="streak-flame">🔥</span>
          <span className="streak-count">{streak.currentStreak}</span>
          <span className="streak-label">{t('xp.days', 'jours')}</span>
        </div>
      </div>

      <div className="xp-progress-container">
        <div className="xp-progress-bar">
          <div className="xp-progress-fill" style={{ width: `${progressPercent}%` }}>
            <div className="xp-progress-shine" />
          </div>
        </div>
        <div className="xp-progress-labels">
          <span className="xp-current">{level.currentXP.toLocaleString()} XP</span>
          <span className="xp-next">Niveau {level.level + 1}: {level.xpForNextLevel.toLocaleString()} XP</span>
        </div>
      </div>

      {streak.canClaim && (
        <button className="claim-daily-btn-large" onClick={handleClaimDaily}>
          <span className="claim-icon">🎁</span>
          <div className="claim-text">
            <span className="claim-title">{t('xp.dailyReward', 'Recompense quotidienne')}</span>
            <span className="claim-subtitle">+{streak.nextReward} XP</span>
          </div>
        </button>
      )}
    </div>
  );
}

export default XPBar;

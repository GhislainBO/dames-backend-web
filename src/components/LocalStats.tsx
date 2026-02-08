/**
 * LocalStats - Affiche les statistiques locales du joueur
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { localStatsService, LocalStats as StatsType } from '../services/LocalStatsService';
import './LocalStats.css';

interface LocalStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

function LocalStats({ isOpen, onClose }: LocalStatsProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<StatsType>(localStatsService.getStats());
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStats(localStatsService.getStats());
    }
  }, [isOpen]);

  const levelInfo = localStatsService.getLevel();
  const winRate = localStatsService.getWinRate();

  const handleReset = () => {
    localStatsService.resetStats();
    setStats(localStatsService.getStats());
    setShowConfirmReset(false);
  };

  if (!isOpen) return null;

  return (
    <div className="localstats-overlay" onClick={onClose}>
      <div className="localstats-modal" onClick={e => e.stopPropagation()}>
        <button className="localstats-close" onClick={onClose}>&times;</button>

        <h2>{t('stats.title', 'Statistiques')}</h2>

        {/* Niveau et progression */}
        <div className="level-section">
          <div className="level-badge">
            <span className="level-number">{levelInfo.level}</span>
          </div>
          <div className="level-info">
            <span className="level-title">{levelInfo.title}</span>
            <div className="level-progress-container">
              <div
                className="level-progress-bar"
                style={{ width: `${levelInfo.progress}%` }}
              />
            </div>
            <span className="level-next">
              {stats.wins} / {levelInfo.nextLevel} {t('stats.wins', 'victoires')}
            </span>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.gamesPlayed}</span>
            <span className="stat-label">{t('stats.gamesPlayed', 'Parties')}</span>
          </div>
          <div className="stat-card wins">
            <span className="stat-value">{stats.wins}</span>
            <span className="stat-label">{t('stats.wins', 'Victoires')}</span>
          </div>
          <div className="stat-card losses">
            <span className="stat-value">{stats.losses}</span>
            <span className="stat-label">{t('stats.losses', 'Defaites')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.draws}</span>
            <span className="stat-label">{t('stats.draws', 'Egalites')}</span>
          </div>
        </div>

        {/* Taux de victoire */}
        <div className="winrate-section">
          <div className="winrate-circle">
            <svg viewBox="0 0 36 36">
              <path
                className="winrate-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="winrate-progress"
                strokeDasharray={`${winRate}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="winrate-text">{winRate}%</span>
          </div>
          <span className="winrate-label">{t('stats.winRate', 'Taux de victoire')}</span>
        </div>

        {/* Series et records */}
        <div className="records-section">
          <h3>{t('stats.records', 'Records')}</h3>
          <div className="records-grid">
            <div className="record-item">
              <span className="record-icon">🔥</span>
              <span className="record-value">{stats.currentStreak}</span>
              <span className="record-label">{t('stats.currentStreak', 'Serie actuelle')}</span>
            </div>
            <div className="record-item">
              <span className="record-icon">⭐</span>
              <span className="record-value">{stats.bestStreak}</span>
              <span className="record-label">{t('stats.bestStreak', 'Meilleure serie')}</span>
            </div>
            <div className="record-item">
              <span className="record-icon">⚡</span>
              <span className="record-value">{localStatsService.formatDuration(stats.fastestWin)}</span>
              <span className="record-label">{t('stats.fastestWin', 'Victoire rapide')}</span>
            </div>
            <div className="record-item">
              <span className="record-icon">⏱️</span>
              <span className="record-value">{localStatsService.formatDuration(stats.longestGame)}</span>
              <span className="record-label">{t('stats.longestGame', 'Plus longue partie')}</span>
            </div>
          </div>
        </div>

        {/* Totaux */}
        <div className="totals-section">
          <div className="total-item">
            <span className="total-label">{t('stats.totalCaptures', 'Captures totales')}</span>
            <span className="total-value">{stats.totalCaptures}</span>
          </div>
          <div className="total-item">
            <span className="total-label">{t('stats.totalPromotions', 'Promotions')}</span>
            <span className="total-value">{stats.totalPromotions}</span>
          </div>
        </div>

        {/* Derniere partie */}
        {stats.lastPlayedAt && (
          <div className="last-played">
            {t('stats.lastPlayed', 'Derniere partie')}: {new Date(stats.lastPlayedAt).toLocaleDateString()}
          </div>
        )}

        {/* Reset */}
        {!showConfirmReset ? (
          <button className="reset-btn" onClick={() => setShowConfirmReset(true)}>
            {t('stats.reset', 'Reinitialiser')}
          </button>
        ) : (
          <div className="confirm-reset">
            <p>{t('stats.confirmReset', 'Confirmer la reinitialisation ?')}</p>
            <div className="confirm-buttons">
              <button className="confirm-yes" onClick={handleReset}>
                {t('common.yes', 'Oui')}
              </button>
              <button className="confirm-no" onClick={() => setShowConfirmReset(false)}>
                {t('common.no', 'Non')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LocalStats;

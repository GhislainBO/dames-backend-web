/**
 * HallOfFame - Page des meilleurs joueurs
 *
 * Top 10 joueurs mis a jour manuellement ou via leaderboard
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './HallOfFame.css';

interface HallOfFamePlayer {
  rank: number;
  username: string;
  elo: number;
  wins: number;
  country?: string;
  title?: string;
  avatar?: string;
}

interface HallOfFameProps {
  isOpen: boolean;
  onClose: () => void;
}

// Donnees statiques (mise a jour manuelle chaque semaine)
const TOP_PLAYERS: HallOfFamePlayer[] = [
  { rank: 1, username: 'GrandMaster_X', elo: 2150, wins: 342, country: 'FR', title: 'Grand Maitre' },
  { rank: 2, username: 'DameKiller99', elo: 2080, wins: 298, country: 'BE', title: 'Maitre' },
  { rank: 3, username: 'CheckersPro', elo: 2045, wins: 275, country: 'NL', title: 'Maitre' },
  { rank: 4, username: 'TacticalGenius', elo: 1998, wins: 256, country: 'FR', title: 'Expert' },
  { rank: 5, username: 'SwiftCapture', elo: 1965, wins: 234, country: 'SN', title: 'Expert' },
  { rank: 6, username: 'DiagonalMaster', elo: 1942, wins: 221, country: 'CI', title: 'Expert' },
  { rank: 7, username: 'KingMaker2024', elo: 1918, wins: 198, country: 'FR', title: 'Classe A' },
  { rank: 8, username: 'StrategicMind', elo: 1895, wins: 187, country: 'CA', title: 'Classe A' },
  { rank: 9, username: 'CaptureKing', elo: 1872, wins: 176, country: 'CH', title: 'Classe A' },
  { rank: 10, username: 'DamesEliteChamp', elo: 1856, wins: 165, country: 'FR', title: 'Classe A' },
];

const RECORDS = [
  { label: 'Plus longue serie de victoires', value: '23 parties', holder: 'GrandMaster_X' },
  { label: 'Partie la plus rapide', value: '1:42', holder: 'SwiftCapture' },
  { label: 'Plus de captures en une partie', value: '18 pieces', holder: 'DameKiller99' },
  { label: 'Plus de puzzles resolus', value: '156 puzzles', holder: 'TacticalGenius' },
];

const HallOfFame: React.FC<HallOfFameProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'players' | 'records'>('players');

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return { emoji: '🥇', class: 'gold' };
      case 2: return { emoji: '🥈', class: 'silver' };
      case 3: return { emoji: '🥉', class: 'bronze' };
      default: return { emoji: `#${rank}`, class: 'default' };
    }
  };

  const getCountryFlag = (country?: string) => {
    const flags: Record<string, string> = {
      'FR': '🇫🇷',
      'BE': '🇧🇪',
      'NL': '🇳🇱',
      'SN': '🇸🇳',
      'CI': '🇨🇮',
      'CA': '🇨🇦',
      'CH': '🇨🇭',
    };
    return flags[country || ''] || '🌍';
  };

  if (!isOpen) return null;

  return (
    <div className="hall-of-fame-overlay" onClick={onClose}>
      <div className="hall-of-fame-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        <div className="hall-header">
          <div className="trophy-icon">🏆</div>
          <h2>{t('hallOfFame.title', 'Hall of Fame')}</h2>
          <p className="hall-subtitle">{t('hallOfFame.subtitle', 'Les legendes de DAMESELITE')}</p>
        </div>

        {/* Onglets */}
        <div className="hall-tabs">
          <button
            className={`tab-btn ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => setActiveTab('players')}
          >
            {t('hallOfFame.topPlayers', 'Top 10 Joueurs')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            {t('hallOfFame.records', 'Records')}
          </button>
        </div>

        {activeTab === 'players' ? (
          <div className="players-list">
            {TOP_PLAYERS.map(player => {
              const badge = getRankBadge(player.rank);
              return (
                <div key={player.rank} className={`player-card rank-${badge.class}`}>
                  <div className="player-rank">
                    <span className={`rank-badge ${badge.class}`}>{badge.emoji}</span>
                  </div>

                  <div className="player-avatar">
                    {player.avatar ? (
                      <img src={player.avatar} alt={player.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="country-flag">{getCountryFlag(player.country)}</span>
                  </div>

                  <div className="player-info">
                    <h4 className="player-name">{player.username}</h4>
                    <span className="player-title">{player.title}</span>
                  </div>

                  <div className="player-stats">
                    <div className="stat">
                      <span className="stat-value">{player.elo}</span>
                      <span className="stat-label">ELO</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{player.wins}</span>
                      <span className="stat-label">{t('hallOfFame.wins', 'Victoires')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="records-list">
            {RECORDS.map((record, index) => (
              <div key={index} className="record-card">
                <div className="record-icon">🏅</div>
                <div className="record-info">
                  <h4>{record.label}</h4>
                  <p className="record-value">{record.value}</p>
                  <span className="record-holder">
                    {t('hallOfFame.heldBy', 'Detenu par')} {record.holder}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="hall-footer">
          <p>{t('hallOfFame.updateInfo', 'Mis a jour chaque semaine')}</p>
          <p className="join-text">
            {t('hallOfFame.joinUs', 'Jouez et grimpez dans le classement!')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HallOfFame;

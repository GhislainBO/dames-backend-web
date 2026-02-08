/**
 * ProfileEnhanced - Page de profil amelioree
 *
 * Statistiques detaillees, historique, graphiques
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ProfileEnhanced.css';

interface GameHistoryEntry {
  id: string;
  date: string;
  opponent: string;
  mode: 'ai' | 'pvp' | 'online';
  result: 'win' | 'loss' | 'draw';
  duration: number; // in seconds
  moves: number;
  eloChange?: number;
}

interface ProfileStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  totalPlayTime: number; // in seconds
  averageGameDuration: number;
  totalMoves: number;
  favoriteMode: string;
  memberSince: string;
  lastPlayed: string;
  eloHistory: { date: string; elo: number }[];
}

interface ProfileEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileEnhanced: React.FC<ProfileEnhancedProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'graphs'>('overview');
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'wins' | 'losses'>('all');

  useEffect(() => {
    loadStats();
    loadHistory();
  }, []);

  const loadStats = () => {
    const savedStats = localStorage.getItem('dameselite_stats');
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        setStats({
          totalGames: parsed.gamesPlayed || 0,
          wins: parsed.wins || 0,
          losses: parsed.losses || 0,
          draws: parsed.draws || 0,
          winRate: parsed.gamesPlayed ? Math.round((parsed.wins / parsed.gamesPlayed) * 100) : 0,
          currentStreak: parsed.currentStreak || 0,
          bestStreak: parsed.bestStreak || 0,
          totalPlayTime: parsed.totalPlayTime || 0,
          averageGameDuration: parsed.gamesPlayed ? Math.round(parsed.totalPlayTime / parsed.gamesPlayed) : 0,
          totalMoves: parsed.totalMoves || 0,
          favoriteMode: parsed.favoriteMode || 'ai',
          memberSince: parsed.memberSince || new Date().toISOString(),
          lastPlayed: parsed.lastPlayed || '',
          eloHistory: parsed.eloHistory || [],
        });
      } catch (e) {
        console.error('Error loading stats:', e);
      }
    }
  };

  const loadHistory = () => {
    const savedHistory = localStorage.getItem('dameselite_game_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading history:', e);
      }
    } else {
      // Demo data
      setHistory([
        {
          id: '1',
          date: new Date(Date.now() - 3600000).toISOString(),
          opponent: 'IA Medium',
          mode: 'ai',
          result: 'win',
          duration: 420,
          moves: 35,
        },
        {
          id: '2',
          date: new Date(Date.now() - 7200000).toISOString(),
          opponent: 'IA Hard',
          mode: 'ai',
          result: 'loss',
          duration: 600,
          moves: 42,
        },
        {
          id: '3',
          date: new Date(Date.now() - 86400000).toISOString(),
          opponent: 'Joueur Local',
          mode: 'pvp',
          result: 'win',
          duration: 300,
          moves: 28,
        },
      ]);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return t('profile.minutesAgo', '{{count}} min', { count: diffMins });
    if (diffHours < 24) return t('profile.hoursAgo', '{{count}}h', { count: diffHours });
    if (diffDays < 7) return t('profile.daysAgo', '{{count}}j', { count: diffDays });
    return date.toLocaleDateString();
  };

  const getResultIcon = (result: string): string => {
    switch (result) {
      case 'win': return '🏆';
      case 'loss': return '💔';
      case 'draw': return '🤝';
      default: return '❓';
    }
  };

  const getModeIcon = (mode: string): string => {
    switch (mode) {
      case 'ai': return '🤖';
      case 'pvp': return '👥';
      case 'online': return '🌐';
      default: return '🎮';
    }
  };

  const filteredHistory = history.filter(entry => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'wins') return entry.result === 'win';
    if (historyFilter === 'losses') return entry.result === 'loss';
    return true;
  });

  // Simple bar chart renderer
  const renderBarChart = () => {
    if (!stats) return null;
    const maxValue = Math.max(stats.wins, stats.losses, stats.draws, 1);

    return (
      <div className="bar-chart">
        <div className="bar-item">
          <div className="bar-label">{t('profile.wins', 'Victoires')}</div>
          <div className="bar-container">
            <div
              className="bar bar-wins"
              style={{ width: `${(stats.wins / maxValue) * 100}%` }}
            />
          </div>
          <div className="bar-value">{stats.wins}</div>
        </div>
        <div className="bar-item">
          <div className="bar-label">{t('profile.losses', 'Defaites')}</div>
          <div className="bar-container">
            <div
              className="bar bar-losses"
              style={{ width: `${(stats.losses / maxValue) * 100}%` }}
            />
          </div>
          <div className="bar-value">{stats.losses}</div>
        </div>
        <div className="bar-item">
          <div className="bar-label">{t('profile.draws', 'Nuls')}</div>
          <div className="bar-container">
            <div
              className="bar bar-draws"
              style={{ width: `${(stats.draws / maxValue) * 100}%` }}
            />
          </div>
          <div className="bar-value">{stats.draws}</div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="profile-enhanced-overlay" onClick={onClose}>
      <div className="profile-enhanced-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        {/* Header */}
        <div className="profile-enhanced-header">
          <div className="profile-avatar-large">
            <span>👤</span>
          </div>
          <div className="profile-info">
            <h2>{t('profile.title', 'Mon Profil')}</h2>
            <p className="member-since">
              {t('profile.memberSince', 'Membre depuis')} {stats?.memberSince ? new Date(stats.memberSince).toLocaleDateString() : '-'}
            </p>
          </div>
          <div className="profile-level">
            <span className="level-badge">
              {stats && stats.wins >= 100 ? '🏆 Maitre' :
               stats && stats.wins >= 50 ? '⭐ Expert' :
               stats && stats.wins >= 25 ? '🎯 Confirme' :
               stats && stats.wins >= 10 ? '📈 Apprenti' : '🌱 Debutant'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            {t('profile.overview', 'Apercu')}
          </button>
          <button
            className={`profile-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            {t('profile.history', 'Historique')}
          </button>
          <button
            className={`profile-tab ${activeTab === 'graphs' ? 'active' : ''}`}
            onClick={() => setActiveTab('graphs')}
          >
            {t('profile.graphs', 'Graphiques')}
          </button>
        </div>

        {/* Content */}
        <div className="profile-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="overview-content">
              {/* Quick Stats */}
              <div className="quick-stats">
                <div className="stat-card main">
                  <span className="stat-icon">🎮</span>
                  <span className="stat-number">{stats.totalGames}</span>
                  <span className="stat-label">{t('profile.gamesPlayed', 'Parties')}</span>
                </div>
                <div className="stat-card win">
                  <span className="stat-icon">🏆</span>
                  <span className="stat-number">{stats.winRate}%</span>
                  <span className="stat-label">{t('profile.winRate', 'Victoires')}</span>
                </div>
                <div className="stat-card streak">
                  <span className="stat-icon">🔥</span>
                  <span className="stat-number">{stats.currentStreak}</span>
                  <span className="stat-label">{t('profile.streak', 'Serie')}</span>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="detailed-stats">
                <div className="stats-row">
                  <span className="stats-label">{t('profile.totalPlayTime', 'Temps de jeu total')}</span>
                  <span className="stats-value">{formatDuration(stats.totalPlayTime)}</span>
                </div>
                <div className="stats-row">
                  <span className="stats-label">{t('profile.avgDuration', 'Duree moyenne')}</span>
                  <span className="stats-value">{formatDuration(stats.averageGameDuration)}</span>
                </div>
                <div className="stats-row">
                  <span className="stats-label">{t('profile.totalMoves', 'Coups joues')}</span>
                  <span className="stats-value">{stats.totalMoves}</span>
                </div>
                <div className="stats-row">
                  <span className="stats-label">{t('profile.bestStreak', 'Meilleure serie')}</span>
                  <span className="stats-value">{stats.bestStreak} 🔥</span>
                </div>
                <div className="stats-row">
                  <span className="stats-label">{t('profile.favoriteMode', 'Mode prefere')}</span>
                  <span className="stats-value">{getModeIcon(stats.favoriteMode)} {stats.favoriteMode.toUpperCase()}</span>
                </div>
                {stats.lastPlayed && (
                  <div className="stats-row">
                    <span className="stats-label">{t('profile.lastPlayed', 'Derniere partie')}</span>
                    <span className="stats-value">{formatDate(stats.lastPlayed)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="history-content">
              <div className="history-filters">
                <button
                  className={`filter-btn ${historyFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('all')}
                >
                  {t('profile.all', 'Tous')}
                </button>
                <button
                  className={`filter-btn ${historyFilter === 'wins' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('wins')}
                >
                  🏆 {t('profile.winsOnly', 'Victoires')}
                </button>
                <button
                  className={`filter-btn ${historyFilter === 'losses' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('losses')}
                >
                  💔 {t('profile.lossesOnly', 'Defaites')}
                </button>
              </div>

              <div className="history-list">
                {filteredHistory.length === 0 ? (
                  <div className="no-history">
                    <p>{t('profile.noHistory', 'Aucune partie enregistree')}</p>
                  </div>
                ) : (
                  filteredHistory.map(entry => (
                    <div key={entry.id} className={`history-entry result-${entry.result}`}>
                      <div className="entry-result">
                        <span className="result-icon">{getResultIcon(entry.result)}</span>
                      </div>
                      <div className="entry-details">
                        <div className="entry-opponent">
                          {getModeIcon(entry.mode)} {entry.opponent}
                        </div>
                        <div className="entry-meta">
                          <span>{formatDate(entry.date)}</span>
                          <span>{entry.moves} coups</span>
                          <span>{formatDuration(entry.duration)}</span>
                        </div>
                      </div>
                      {entry.eloChange && (
                        <div className={`entry-elo ${entry.eloChange > 0 ? 'positive' : 'negative'}`}>
                          {entry.eloChange > 0 ? '+' : ''}{entry.eloChange}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Graphs Tab */}
          {activeTab === 'graphs' && stats && (
            <div className="graphs-content">
              <div className="graph-section">
                <h3>{t('profile.resultsBreakdown', 'Repartition des resultats')}</h3>
                {renderBarChart()}
              </div>

              <div className="graph-section">
                <h3>{t('profile.performanceByMode', 'Performance par mode')}</h3>
                <div className="mode-stats">
                  <div className="mode-stat">
                    <span className="mode-icon">🤖</span>
                    <span className="mode-name">vs IA</span>
                    <span className="mode-games">{Math.floor(stats.totalGames * 0.6)} parties</span>
                  </div>
                  <div className="mode-stat">
                    <span className="mode-icon">👥</span>
                    <span className="mode-name">Local</span>
                    <span className="mode-games">{Math.floor(stats.totalGames * 0.25)} parties</span>
                  </div>
                  <div className="mode-stat">
                    <span className="mode-icon">🌐</span>
                    <span className="mode-name">En ligne</span>
                    <span className="mode-games">{Math.floor(stats.totalGames * 0.15)} parties</span>
                  </div>
                </div>
              </div>

              <div className="graph-section">
                <h3>{t('profile.achievements', 'Progression')}</h3>
                <div className="progress-bars">
                  <div className="progress-item">
                    <span className="progress-label">Parties jouees</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min((stats.totalGames / 100) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="progress-value">{stats.totalGames}/100</span>
                  </div>
                  <div className="progress-item">
                    <span className="progress-label">Victoires</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill wins"
                        style={{ width: `${Math.min((stats.wins / 50) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="progress-value">{stats.wins}/50</span>
                  </div>
                  <div className="progress-item">
                    <span className="progress-label">Serie max</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill streak"
                        style={{ width: `${Math.min((stats.bestStreak / 10) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="progress-value">{stats.bestStreak}/10</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileEnhanced;

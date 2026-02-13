/**
 * Leaderboard - Affiche le classement des joueurs
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Leaderboard.css';

const API_URL = 'https://dames-backend-production.up.railway.app';

interface LeaderboardEntry {
  id: string;
  username: string;
  elo: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDraw: number;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

function Leaderboard({ isOpen, onClose }: LeaderboardProps) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const getRank = (elo: number): { name: string; color: string } => {
    if (elo >= 2400) return { name: t('ranks.grandMaster'), color: '#ffd700' };
    if (elo >= 2200) return { name: t('ranks.master'), color: '#c0c0c0' };
    if (elo >= 2000) return { name: t('ranks.expert'), color: '#cd7f32' };
    if (elo >= 1800) return { name: t('ranks.classA'), color: '#4a9eff' };
    if (elo >= 1600) return { name: t('ranks.classB'), color: '#2ecc71' };
    if (elo >= 1400) return { name: t('ranks.classC'), color: '#f39c12' };
    if (elo >= 1200) return { name: t('ranks.classD'), color: '#e74c3c' };
    return { name: t('ranks.beginner'), color: '#95a5a6' };
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/leaderboard?limit=50`);
      const data = await response.json();
      setEntries(data);
    } catch (err) {
      setError(t('errors.connectionFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="leaderboard-overlay" onClick={onClose}>
      <div className="leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        <button className="leaderboard-close" onClick={onClose}>
          &times;
        </button>

        <h2>{t('leaderboard.title')}</h2>

        {isLoading ? (
          <div className="leaderboard-loading">{t('common.loading')}</div>
        ) : error ? (
          <div className="leaderboard-error">{error}</div>
        ) : entries.length === 0 ? (
          <div className="leaderboard-empty">{t('leaderboard.noPlayers')}</div>
        ) : (
          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('leaderboard.player')}</th>
                  <th>{t('leaderboard.elo')}</th>
                  <th>{t('leaderboard.rank')}</th>
                  <th>{t('leaderboard.winsShort')}</th>
                  <th>{t('leaderboard.lossesShort')}</th>
                  <th>{t('leaderboard.drawsShort')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const rank = getRank(entry.elo);

                  return (
                    <tr key={entry.id} className={index < 3 ? `top-${index + 1}` : ''}>
                      <td className="rank-number">{index + 1}</td>
                      <td className="player-name">{entry.username}</td>
                      <td className="player-elo">{entry.elo}</td>
                      <td>
                        <span className="player-rank" style={{ color: rank.color }}>
                          {rank.name}
                        </span>
                      </td>
                      <td className="stat wins">{entry.gamesWon}</td>
                      <td className="stat losses">{entry.gamesLost}</td>
                      <td className="stat draws">{entry.gamesDraw}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;

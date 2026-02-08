/**
 * Tournaments - Liste et inscription aux tournois
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/NotificationService';
import './Tournaments.css';

const API_URL = 'https://dames-backend-production.up.railway.app';

interface Tournament {
  id: string;
  name: string;
  description: string;
  format: string;
  status: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  minParticipants: number;
  participants: { userId: string; username: string }[];
  prizes: { rank: number; percentage: number; amount?: number }[];
  startTime: string;
}

interface TournamentsProps {
  isOpen: boolean;
  onClose: () => void;
  onBalanceChange?: () => void;
}

function Tournaments({ isOpen, onClose, onBalanceChange }: TournamentsProps) {
  const { t, i18n } = useTranslation();
  const { token, isAuthenticated, user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTournaments();
    }
  }, [isOpen]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tournaments`);
      const data = await response.json();
      if (data.success) {
        setTournaments(data.tournaments);
      }
    } catch (error) {
      console.error('Erreur chargement tournois:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (tournamentId: string) => {
    if (!isAuthenticated) {
      setMessage(t('tournaments.loginRequired'));
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/tournaments/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tournamentId }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage(t('tournaments.registerSuccess'));
        onBalanceChange?.();
        fetchTournaments();
        // Programmer un rappel 15 min avant le tournoi
        const tournament = tournaments.find(t => t.id === tournamentId);
        if (tournament) {
          notificationService.scheduleTournamentReminder(
            tournament.id,
            tournament.name,
            new Date(tournament.startTime)
          );
        }
      } else {
        setMessage(data.error || t('common.error'));
      }
    } catch (error) {
      setMessage(t('errors.connectionFailed'));
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleUnregister = async (tournamentId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tournaments/unregister`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tournamentId }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage(t('tournaments.unregisterSuccess'));
        onBalanceChange?.();
        fetchTournaments();
      } else {
        setMessage(data.error || t('common.error'));
      }
    } catch (error) {
      setMessage(t('errors.connectionFailed'));
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const locale = i18n.language === 'ar' ? 'ar-SA' :
                   i18n.language === 'de' ? 'de-DE' :
                   i18n.language === 'es' ? 'es-ES' :
                   i18n.language === 'pt' ? 'pt-BR' :
                   i18n.language === 'en' ? 'en-US' : 'fr-FR';
    return date.toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return t('tournaments.startsSoon');

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return t('tournaments.startsIn', { time: `${days}d ${hours % 24}h` });
    }
    return t('tournaments.startsIn', { time: `${hours}h ${minutes}min` });
  };

  const isRegistered = (tournament: Tournament) => {
    return tournament.participants.some(p => p.userId === user?.id);
  };

  if (!isOpen) return null;

  return (
    <div className="tournaments-overlay" onClick={onClose}>
      <div className="tournaments-modal" onClick={e => e.stopPropagation()}>
        <button className="tournaments-close" onClick={onClose}>&times;</button>

        <h2>{t('tournaments.title')}</h2>

        {message && <div className="tournaments-message">{message}</div>}

        {!isAuthenticated && (
          <div className="tournaments-warning">
            {t('tournaments.loginRequired')}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888' }}>{t('common.loading')}</p>
        ) : tournaments.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888' }}>{t('tournaments.noTournaments')}</p>
        ) : (
          <div className="tournaments-list">
            {tournaments.map(tournament => (
              <div
                key={tournament.id}
                className={`tournament-card ${isRegistered(tournament) ? 'registered' : ''}`}
              >
                <div className="tournament-header">
                  <h3>{tournament.name}</h3>
                  <span className="tournament-time">{getTimeUntil(tournament.startTime)}</span>
                </div>

                <p className="tournament-description">{tournament.description}</p>

                <div className="tournament-info">
                  <div className="info-item">
                    <span className="info-label">{t('tournaments.entryFee')}</span>
                    <span className="info-value fee">{tournament.entryFee}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">{t('tournaments.prizePool')}</span>
                    <span className="info-value prize">{tournament.prizePool}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">{t('tournaments.players')}</span>
                    <span className="info-value">
                      {tournament.participants.length}/{tournament.maxParticipants}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">{t('tournaments.start')}</span>
                    <span className="info-value">{formatDate(tournament.startTime)}</span>
                  </div>
                </div>

                <div className="tournament-prizes">
                  <span className="prizes-label">{t('tournaments.prizes')}:</span>
                  {tournament.prizes.map((prize, i) => (
                    <span key={i} className={`prize-badge rank-${prize.rank}`}>
                      {prize.rank === 1 ? '' : prize.rank === 2 ? '' : prize.rank === 3 ? '' : `${prize.rank}e`}
                      {' '}{prize.amount || `${prize.percentage}%`}
                    </span>
                  ))}
                </div>

                {tournament.participants.length > 0 && (
                  <div className="tournament-participants">
                    <span className="participants-label">{t('tournaments.participants')}:</span>
                    <span className="participants-list">
                      {tournament.participants.slice(0, 5).map(p => p.username).join(', ')}
                      {tournament.participants.length > 5 && ` +${tournament.participants.length - 5}`}
                    </span>
                  </div>
                )}

                <div className="tournament-actions">
                  {isRegistered(tournament) ? (
                    <button
                      className="unregister-btn"
                      onClick={() => handleUnregister(tournament.id)}
                    >
                      {t('tournaments.unregister')}
                    </button>
                  ) : (
                    <button
                      className="register-btn"
                      onClick={() => handleRegister(tournament.id)}
                      disabled={tournament.participants.length >= tournament.maxParticipants}
                    >
                      {tournament.participants.length >= tournament.maxParticipants
                        ? t('tournaments.full')
                        : `${t('tournaments.register')} (${tournament.entryFee})`}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Tournaments;

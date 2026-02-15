/**
 * PLAYER PANEL - Panneau joueur avec avatar, timer et captures
 * Phase 1 - Écran de partie premium
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './PlayerPanel.css';

// Avatars et noms des niveaux IA
const AI_PROFILES: { [key: string]: { name: string; avatar: string; title: string } } = {
  beginner: { name: 'Timide', avatar: '🐣', title: 'Debutant' },
  easy: { name: 'Prudent', avatar: '🦊', title: 'Facile' },
  medium: { name: 'Tacticien', avatar: '🦉', title: 'Moyen' },
  hard: { name: 'Stratege', avatar: '🦅', title: 'Difficile' },
  expert: { name: 'Maitre', avatar: '🐉', title: 'Expert' },
};

interface PlayerPanelProps {
  color: 'white' | 'black';
  isCurrentTurn: boolean;
  pieceCount: number;
  kingCount: number;
  capturedCount: number;
  isAI?: boolean;
  aiDifficulty?: string;
  playerName?: string;
  playerLevel?: number;
  // Timer props
  timeRemaining?: number; // en secondes
  timerActive?: boolean;
  onTimeOut?: () => void;
  isGameOver?: boolean;
}

function PlayerPanel({
  color,
  isCurrentTurn,
  pieceCount,
  kingCount,
  capturedCount,
  isAI = false,
  aiDifficulty = 'medium',
  playerName = 'Joueur',
  playerLevel = 1,
  timeRemaining,
  timerActive = false,
  onTimeOut,
  isGameOver = false,
}: PlayerPanelProps) {
  const { t } = useTranslation();
  const [time, setTime] = useState(timeRemaining || 0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Gestion du timer
  useEffect(() => {
    if (timeRemaining !== undefined) {
      setTime(timeRemaining);
    }
  }, [timeRemaining]);

  useEffect(() => {
    if (timerActive && !isGameOver && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onTimeOut?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive, isGameOver, onTimeOut]);

  // Formater le temps
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Déterminer le profil IA
  const aiProfile = isAI ? AI_PROFILES[aiDifficulty] || AI_PROFILES.medium : null;

  // Classes CSS
  const panelClasses = [
    'player-panel',
    `player-${color}`,
    isCurrentTurn && !isGameOver ? 'active-turn' : '',
    isGameOver ? 'game-over' : '',
    time !== undefined && time <= 30 && isCurrentTurn ? 'time-warning' : '',
    time !== undefined && time <= 10 && isCurrentTurn ? 'time-critical' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={panelClasses}>
      {/* Avatar et info joueur */}
      <div className="player-info">
        <div className={`player-avatar ${color}`}>
          {isAI ? (
            <span className="ai-avatar">{aiProfile?.avatar}</span>
          ) : (
            <span className="player-initial">
              {playerName.charAt(0).toUpperCase()}
            </span>
          )}
          {isCurrentTurn && !isGameOver && (
            <div className="turn-indicator-dot" />
          )}
        </div>

        <div className="player-details">
          <span className="player-name">
            {isAI ? aiProfile?.name : playerName}
          </span>
          <span className="player-subtitle">
            {isAI ? (
              <span className="ai-difficulty">
                <span className="ai-icon">🤖</span>
                {aiProfile?.title}
              </span>
            ) : (
              <span className="player-level">
                Niveau {playerLevel}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Timer (si activé) */}
      {timeRemaining !== undefined && (
        <div className={`player-timer ${timerActive ? 'active' : ''}`}>
          <div className="timer-display">
            <span className="timer-icon">⏱️</span>
            <span className="timer-value">{formatTime(time)}</span>
          </div>
          {time <= 30 && (
            <div className="timer-progress">
              <div
                className="timer-progress-fill"
                style={{ width: `${(time / 30) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Compteur de pièces */}
      <div className="player-pieces">
        <div className="pieces-display">
          <div className={`piece-indicator ${color}`}>
            <span className="piece-count">{pieceCount}</span>
            {kingCount > 0 && (
              <span className="king-indicator">
                <span className="crown">👑</span>
                <span className="king-count">{kingCount}</span>
              </span>
            )}
          </div>
        </div>

        {/* Pièces capturées */}
        <div className="captured-display">
          <span className="captured-label">{t('game.captured', 'Prises')}</span>
          <div className="captured-pieces">
            {Array.from({ length: Math.min(capturedCount, 10) }).map((_, i) => (
              <div
                key={i}
                className={`captured-piece ${color === 'white' ? 'black' : 'white'}`}
                style={{ transform: `translateX(${i * -4}px)` }}
              />
            ))}
            {capturedCount > 10 && (
              <span className="captured-extra">+{capturedCount - 10}</span>
            )}
            {capturedCount === 0 && (
              <span className="no-captures">-</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerPanel;

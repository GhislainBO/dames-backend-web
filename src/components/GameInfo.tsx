import React from 'react';
import { useTranslation } from 'react-i18next';

interface GameInfoProps {
  onNewGame: () => void;
  onBackToMenu: () => void;
}

function GameInfo({ onNewGame, onBackToMenu }: GameInfoProps) {
  const { t } = useTranslation();

  return (
    <div className="game-info">
      <h3>{t('gameInfo.title')}</h3>

      <div className="info-row">
        <span className="info-label">{t('gameInfo.rules')}</span>
        <span className="info-value">FMJD 10×10</span>
      </div>

      <div className="info-row">
        <span className="info-label">{t('gameInfo.capture')}</span>
        <span className="info-value">{t('gameInfo.majority')}</span>
      </div>

      <p style={{ marginTop: '20px', fontSize: '0.85rem', color: '#888' }}>
        {t('gameInfo.instructions')}
      </p>

      <div className="game-info-buttons">
        <button className="info-btn new-game" onClick={onNewGame}>
          {t('game.newGame')}
        </button>
        <button className="info-btn back" onClick={onBackToMenu}>
          {t('game.backToMenu')}
        </button>
      </div>
    </div>
  );
}

export default GameInfo;

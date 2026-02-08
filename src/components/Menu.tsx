import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Difficulty } from '../game/types';
import { adMobService } from '../services/AdMobService';
import Leaderboard from './Leaderboard';
import Tutorial from './Tutorial';
import Shop from './Shop';
import Tournaments from './Tournaments';
import Achievements from './Achievements';
import BattlePass from './BattlePass';
import PromotionalOffers from './PromotionalOffers';
import LanguageSelector from './LanguageSelector';
import LocalStats from './LocalStats';

interface MenuProps {
  onStartGame: (mode: 'pvp' | 'ai' | 'online', difficulty?: Difficulty, color?: 'white' | 'black') => void;
}

function Menu({ onStartGame }: MenuProps) {
  const { t } = useTranslation();
  const [showAISettings, setShowAISettings] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showTournaments, setShowTournaments] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showBattlePass, setShowBattlePass] = useState(false);
  const [showPromotions, setShowPromotions] = useState(false);
  const [showLocalStats, setShowLocalStats] = useState(false);

  const toggleAISettings = () => {
    setShowAISettings(!showAISettings);
  };

  const handleStartAIGame = () => {
    onStartGame('ai', difficulty, playerColor);
  };

  return (
    <div className="menu">
      <div className="menu-header">
        <LanguageSelector compact />
      </div>

      <h2>{t('menu.title')}</h2>

      <div className="menu-buttons">
        <button className={`menu-btn primary ${showAISettings ? 'active' : ''}`} onClick={toggleAISettings}>
          {t('menu.playVsAI')}
        </button>

        {showAISettings && (
          <div className="ai-settings">
            <div className="setting-group">
              <label>{t('ai.difficulty')}</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              >
                <option value="beginner">{t('ai.beginner')}</option>
                <option value="easy">{t('ai.easy')}</option>
                <option value="medium">{t('ai.medium')}</option>
                <option value="hard">{t('ai.hard')}</option>
                <option value="expert">{t('ai.expert')}</option>
              </select>
            </div>

            <div className="setting-group">
              <label>{t('ai.yourColor')}</label>
              <select
                value={playerColor}
                onChange={(e) => setPlayerColor(e.target.value as 'white' | 'black')}
              >
                <option value="white">{t('ai.white')}</option>
                <option value="black">{t('ai.black')}</option>
              </select>
            </div>

            <button className="menu-btn start-game" onClick={handleStartAIGame}>
              {t('menu.start')}
            </button>
          </div>
        )}

        <button
          className="menu-btn secondary"
          onClick={() => onStartGame('pvp')}
        >
          {t('menu.pvp')}
        </button>

        <button
          className="menu-btn online"
          onClick={() => onStartGame('online')}
        >
          {t('menu.online')}
        </button>

        <button
          className="menu-btn secondary"
          onClick={() => setShowLeaderboard(true)}
        >
          {t('menu.leaderboard')}
        </button>

        <button
          className="menu-btn tutorial"
          onClick={() => setShowTutorial(true)}
        >
          {t('menu.tutorial')}
        </button>

        <button
          className="menu-btn shop"
          onClick={() => setShowShop(true)}
        >
          {t('menu.shop')}
        </button>

        {/* Offres promotionnelles - uniquement sur Web (pas sur mobile/Google Play) */}
        {!adMobService.isNative() && (
          <button
            className="menu-btn promotions"
            onClick={() => setShowPromotions(true)}
          >
            {t('promotions.title')}
          </button>
        )}

        <button
          className="menu-btn battlepass"
          onClick={() => setShowBattlePass(true)}
        >
          {t('battlePass.title')}
        </button>

        <button
          className="menu-btn tournament"
          onClick={() => setShowTournaments(true)}
        >
          {t('menu.tournaments')}
        </button>

        <button
          className="menu-btn achievements"
          onClick={() => setShowAchievements(true)}
        >
          {t('menu.achievements')}
        </button>

        <button
          className="menu-btn stats"
          onClick={() => setShowLocalStats(true)}
        >
          {t('menu.stats', 'Statistiques')}
        </button>

      </div>

      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      <Tutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      <Shop
        isOpen={showShop}
        onClose={() => setShowShop(false)}
      />

      <Tournaments
        isOpen={showTournaments}
        onClose={() => setShowTournaments(false)}
      />

      <Achievements
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
      />

      <BattlePass
        isOpen={showBattlePass}
        onClose={() => setShowBattlePass(false)}
      />

      <PromotionalOffers
        isOpen={showPromotions}
        onClose={() => setShowPromotions(false)}
      />

      <LocalStats
        isOpen={showLocalStats}
        onClose={() => setShowLocalStats(false)}
      />
    </div>
  );
}

export default Menu;

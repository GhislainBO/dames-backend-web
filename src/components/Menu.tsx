import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Difficulty } from '../game/types';
import { adMobService } from '../services/AdMobService';
import PremiumButton from './PremiumButton';
import Leaderboard from './Leaderboard';
import Tutorial from './Tutorial';
import Shop from './Shop';
import Tournaments from './Tournaments';
import Achievements from './Achievements';
import BattlePass from './BattlePass';
import PromotionalOffers from './PromotionalOffers';
import LocalStats from './LocalStats';
import DailyPuzzle from './DailyPuzzle';
import LocalAchievements from './LocalAchievements';
import HallOfFame from './HallOfFame';
import Blog from './Blog';
import Community from './Community';
import Support from './Support';
import Resources from './Resources';
import Partners from './Partners';
import Settings from './Settings';
import ProfileEnhanced from './ProfileEnhanced';

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
  const [showDailyPuzzle, setShowDailyPuzzle] = useState(false);
  const [showLocalAchievements, setShowLocalAchievements] = useState(false);
  const [showHallOfFame, setShowHallOfFame] = useState(false);
  const [showBlog, setShowBlog] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showPartners, setShowPartners] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMoreModes, setShowMoreModes] = useState(false);

  const toggleAISettings = () => {
    setShowAISettings(!showAISettings);
  };

  const handleStartAIGame = () => {
    onStartGame('ai', difficulty, playerColor);
  };

  return (
    <div className="menu">
      <h2 className="ds-text-shimmer">{t('menu.title')}</h2>

      {/* === CTA PRINCIPAL - JOUER RAPIDE === */}
      <div className="menu-cta">
        <button className="ds-btn ds-btn-cta" onClick={toggleAISettings}>
          <span style={{ marginRight: '12px', fontSize: '1.5rem' }}>▶</span>
          {t('menu.quickPlay', 'JOUER RAPIDE')}
        </button>

        {showAISettings && (
          <div className="ai-settings ds-card-lit" style={{ marginTop: '16px' }}>
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

            <button className="ds-btn ds-btn-cta ds-btn-full" onClick={handleStartAIGame}>
              <span style={{ marginRight: '8px' }}>▶</span>
              {t('menu.start')}
            </button>
          </div>
        )}
      </div>

      {/* === GRILLE DE MODES PRINCIPAUX === */}
      <div className="menu-modes-grid">
        {/* Solo vs IA */}
        <div className="mode-card solo" onClick={toggleAISettings}>
          <span className="mode-card-icon">🤖</span>
          <span className="mode-card-title">{t('menu.solo', 'Solo')}</span>
          <span className="mode-card-desc">{t('menu.vsAI', 'vs IA')}</span>
        </div>

        {/* Multijoueur en ligne */}
        <div className="mode-card multiplayer" onClick={() => onStartGame('online')}>
          <span className="mode-card-icon">🌐</span>
          <span className="mode-card-title">{t('menu.online')}</span>
          <span className="mode-card-desc">{t('menu.ranked', 'Classé')}</span>
          <span className="mode-card-badge">Live</span>
        </div>

        {/* 2 Joueurs local */}
        <div className="mode-card" onClick={() => onStartGame('pvp')}>
          <span className="mode-card-icon">👥</span>
          <span className="mode-card-title">{t('menu.pvp')}</span>
          <span className="mode-card-desc">{t('menu.local', 'Local')}</span>
        </div>

        {/* Puzzles */}
        <div className="mode-card puzzle" onClick={() => setShowDailyPuzzle(true)}>
          <span className="mode-card-icon">🧩</span>
          <span className="mode-card-title">{t('menu.puzzles', 'Puzzles')}</span>
          <span className="mode-card-desc">{t('menu.daily', 'Quotidien')}</span>
          <span className="mode-card-badge new">+XP</span>
        </div>

        {/* Tournois */}
        <div className="mode-card tournament" onClick={() => setShowTournaments(true)}>
          <span className="mode-card-icon">🏆</span>
          <span className="mode-card-title">{t('menu.tournaments')}</span>
          <span className="mode-card-desc">Blitz Arena</span>
          <span className="mode-card-badge gold">🔥</span>
        </div>

        {/* Classement */}
        <div className="mode-card" onClick={() => setShowLeaderboard(true)}>
          <span className="mode-card-icon">📊</span>
          <span className="mode-card-title">{t('menu.leaderboard')}</span>
          <span className="mode-card-desc">{t('menu.rankings', 'Ligues')}</span>
        </div>
      </div>

      {/* === BARRE DE NAVIGATION BAS === */}
      <div className="menu-bottom-nav">
        <button className="menu-nav-btn" onClick={() => setShowShop(true)}>
          <span className="menu-nav-btn-icon">🛒</span>
          <span>{t('menu.shop')}</span>
        </button>

        <button className="menu-nav-btn" onClick={() => setShowProfile(true)}>
          <span className="menu-nav-btn-icon">👤</span>
          <span>{t('menu.profile', 'Profil')}</span>
        </button>

        <button className="menu-nav-btn" onClick={() => setShowTutorial(true)}>
          <span className="menu-nav-btn-icon">📖</span>
          <span>{t('menu.tutorial')}</span>
        </button>

        <button className="menu-nav-btn" onClick={() => setShowSettings(true)}>
          <span className="menu-nav-btn-icon">⚙️</span>
          <span>{t('menu.settings', 'Options')}</span>
        </button>
      </div>

      {/* === SECTION AUTRES MODES === */}
      <div className="menu-more-section">
        <button
          className="menu-more-toggle"
          onClick={() => setShowMoreModes(!showMoreModes)}
        >
          <span>{showMoreModes ? '▲' : '▼'}</span>
          <span>{t('menu.moreModes', 'Plus de modes')}</span>
        </button>

        {showMoreModes && (
          <div className="menu-more-content">
            <PremiumButton
              variant="emerald"
              fullWidth
              onClick={() => setShowAchievements(true)}
              icon={<span>🎖</span>}
            >
              {t('menu.achievements')}
            </PremiumButton>

            <PremiumButton
              variant="secondary"
              fullWidth
              onClick={() => setShowLocalStats(true)}
              icon={<span>📈</span>}
            >
              {t('menu.stats', 'Statistiques')}
            </PremiumButton>

            <PremiumButton
              variant="emerald"
              fullWidth
              onClick={() => setShowLocalAchievements(true)}
              icon={<span>🏅</span>}
            >
              {t('menu.localAchievements', 'Succes Locaux')}
            </PremiumButton>

            <PremiumButton
              variant="outline-gold"
              fullWidth
              onClick={() => setShowHallOfFame(true)}
              icon={<span>👑</span>}
            >
              {t('menu.hallOfFame', 'Hall of Fame')}
            </PremiumButton>

            <PremiumButton
              variant="tournament"
              fullWidth
              onClick={() => setShowBattlePass(true)}
              icon={<span>⭐</span>}
            >
              {t('battlePass.title')}
            </PremiumButton>

            {!adMobService.isNative() && (
              <PremiumButton
                variant="ruby"
                fullWidth
                onClick={() => setShowPromotions(true)}
                icon={<span>🎁</span>}
              >
                {t('promotions.title')}
              </PremiumButton>
            )}

            <PremiumButton
              variant="secondary"
              fullWidth
              onClick={() => setShowBlog(true)}
              icon={<span>📰</span>}
            >
              {t('menu.blog', 'Blog & Actualites')}
            </PremiumButton>

            <PremiumButton
              variant="secondary"
              fullWidth
              onClick={() => setShowCommunity(true)}
              icon={<span>🌍</span>}
            >
              {t('menu.community', 'Communaute')}
            </PremiumButton>

            <PremiumButton
              variant="ruby"
              fullWidth
              onClick={() => setShowSupport(true)}
              icon={<span>❤️</span>}
            >
              {t('menu.support', 'Nous Soutenir')}
            </PremiumButton>

            <PremiumButton
              variant="secondary"
              fullWidth
              onClick={() => setShowResources(true)}
              icon={<span>📚</span>}
            >
              {t('menu.resources', 'Ressources')}
            </PremiumButton>

            <PremiumButton
              variant="secondary"
              fullWidth
              onClick={() => setShowPartners(true)}
              icon={<span>🤝</span>}
            >
              {t('menu.partners', 'Partenaires')}
            </PremiumButton>
          </div>
        )}
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

      {showDailyPuzzle && (
        <DailyPuzzle onClose={() => setShowDailyPuzzle(false)} />
      )}

      <LocalAchievements
        isOpen={showLocalAchievements}
        onClose={() => setShowLocalAchievements(false)}
      />

      <HallOfFame
        isOpen={showHallOfFame}
        onClose={() => setShowHallOfFame(false)}
      />

      <Blog
        isOpen={showBlog}
        onClose={() => setShowBlog(false)}
      />

      <Community
        isOpen={showCommunity}
        onClose={() => setShowCommunity(false)}
      />

      <Support
        isOpen={showSupport}
        onClose={() => setShowSupport(false)}
      />

      <Resources
        isOpen={showResources}
        onClose={() => setShowResources(false)}
      />

      <Partners
        isOpen={showPartners}
        onClose={() => setShowPartners(false)}
      />

      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <ProfileEnhanced
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
}

export default Menu;

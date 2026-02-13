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

  const toggleAISettings = () => {
    setShowAISettings(!showAISettings);
  };

  const handleStartAIGame = () => {
    onStartGame('ai', difficulty, playerColor);
  };

  return (
    <div className="menu">
      <h2 className="ds-text-gold">{t('menu.title')}</h2>

      <div className="menu-buttons">
        {/* === CTA PRINCIPAL - JOUER === */}
        <PremiumButton
          variant="play"
          size="lg"
          fullWidth
          onClick={toggleAISettings}
          icon={<span>♟</span>}
        >
          {t('menu.playVsAI')}
        </PremiumButton>

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

            <PremiumButton
              variant="emerald"
              fullWidth
              onClick={handleStartAIGame}
              icon={<span>▶</span>}
            >
              {t('menu.start')}
            </PremiumButton>
          </div>
        )}

        {/* === MODES DE JEU === */}
        <PremiumButton
          variant="secondary"
          fullWidth
          onClick={() => onStartGame('pvp')}
          icon={<span>👥</span>}
        >
          {t('menu.pvp')}
        </PremiumButton>

        <PremiumButton
          variant="tournament"
          fullWidth
          onClick={() => onStartGame('online')}
          icon={<span>🌐</span>}
        >
          {t('menu.online')}
        </PremiumButton>

        {/* === TOURNOIS === */}
        <PremiumButton
          variant="tournament"
          fullWidth
          onClick={() => setShowTournaments(true)}
          icon={<span>🏆</span>}
        >
          {t('menu.tournaments')}
        </PremiumButton>

        {/* === CLASSEMENT === */}
        <PremiumButton
          variant="secondary"
          fullWidth
          onClick={() => setShowLeaderboard(true)}
          icon={<span>📊</span>}
        >
          {t('menu.leaderboard')}
        </PremiumButton>

        {/* === PUZZLE DU JOUR === */}
        <PremiumButton
          variant="outline-gold"
          fullWidth
          onClick={() => setShowDailyPuzzle(true)}
          icon={<span>🧩</span>}
        >
          {t('menu.puzzle', 'Puzzle du Jour')}
        </PremiumButton>

        {/* === TUTORIEL === */}
        <PremiumButton
          variant="secondary"
          fullWidth
          onClick={() => setShowTutorial(true)}
          icon={<span>📖</span>}
        >
          {t('menu.tutorial')}
        </PremiumButton>

        {/* === BOUTIQUE === */}
        <PremiumButton
          variant="play"
          fullWidth
          onClick={() => setShowShop(true)}
          icon={<span>🛒</span>}
        >
          {t('menu.shop')}
        </PremiumButton>

        {/* Offres promotionnelles - uniquement sur Web (pas sur mobile/Google Play) */}
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

        {/* === BATTLE PASS === */}
        <button
          className="menu-btn battlepass"
          onClick={() => setShowBattlePass(true)}
        >
          {t('battlePass.title')}
        </button>

        {/* === SUCCES === */}
        <PremiumButton
          variant="emerald"
          fullWidth
          onClick={() => setShowAchievements(true)}
          icon={<span>🎖</span>}
        >
          {t('menu.achievements')}
        </PremiumButton>

        {/* === STATISTIQUES === */}
        <PremiumButton
          variant="secondary"
          fullWidth
          onClick={() => setShowLocalStats(true)}
          icon={<span>📈</span>}
        >
          {t('menu.stats', 'Statistiques')}
        </PremiumButton>

        {/* === SUCCES LOCAUX === */}
        <PremiumButton
          variant="emerald"
          fullWidth
          onClick={() => setShowLocalAchievements(true)}
          icon={<span>🏅</span>}
        >
          {t('menu.localAchievements', 'Succes Locaux')}
        </PremiumButton>

        {/* === HALL OF FAME === */}
        <PremiumButton
          variant="outline-gold"
          fullWidth
          onClick={() => setShowHallOfFame(true)}
          icon={<span>👑</span>}
        >
          {t('menu.hallOfFame', 'Hall of Fame')}
        </PremiumButton>

        {/* === BLOG === */}
        <PremiumButton
          variant="secondary"
          fullWidth
          onClick={() => setShowBlog(true)}
          icon={<span>📰</span>}
        >
          {t('menu.blog', 'Blog & Actualites')}
        </PremiumButton>

        {/* === COMMUNAUTE === */}
        <PremiumButton
          variant="secondary"
          fullWidth
          onClick={() => setShowCommunity(true)}
          icon={<span>🌍</span>}
        >
          {t('menu.community', 'Communaute')}
        </PremiumButton>

        {/* === SUPPORT === */}
        <PremiumButton
          variant="ruby"
          fullWidth
          onClick={() => setShowSupport(true)}
          icon={<span>❤️</span>}
        >
          {t('menu.support', 'Nous Soutenir')}
        </PremiumButton>

        {/* === RESSOURCES === */}
        <PremiumButton
          variant="secondary"
          fullWidth
          onClick={() => setShowResources(true)}
          icon={<span>📚</span>}
        >
          {t('menu.resources', 'Ressources')}
        </PremiumButton>

        {/* === PARTENAIRES === */}
        <PremiumButton
          variant="secondary"
          fullWidth
          onClick={() => setShowPartners(true)}
          icon={<span>🤝</span>}
        >
          {t('menu.partners', 'Partenaires')}
        </PremiumButton>

        {/* === PROFIL === */}
        <PremiumButton
          variant="profile"
          fullWidth
          onClick={() => setShowProfile(true)}
          icon={<span>👤</span>}
        >
          {t('menu.profile', 'Mon Profil')}
        </PremiumButton>

        {/* === PARAMETRES === */}
        <PremiumButton
          variant="secondary"
          fullWidth
          onClick={() => setShowSettings(true)}
          icon={<span>⚙️</span>}
        >
          {t('menu.settings', 'Parametres')}
        </PremiumButton>

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

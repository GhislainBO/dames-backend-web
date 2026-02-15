import React, { useState, useEffect } from 'react';
import GameBoard from './components/GameBoard';
import Menu from './components/Menu';
import GameInfo from './components/GameInfo';
import Lobby from './components/Lobby';
import OnlineGame from './components/OnlineGame';
import UserProfile from './components/UserProfile';
import Wallet from './components/Wallet';
import XPBar from './components/XPBar';
import BannerAd from './components/BannerAd';
import InterstitialAd from './components/InterstitialAd';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CosmeticsProvider } from './context/CosmeticsContext';
import LanguageSelector from './components/LanguageSelector';
import { Difficulty } from './game/types';
import { adMobService } from './services/AdMobService';
import { notificationService } from './services/NotificationService';

type GameMode = 'menu' | 'pvp' | 'ai' | 'online-lobby' | 'online-game';

interface Player {
  id: string;
  username: string;
  color?: 'white' | 'black';
  isReady: boolean;
}

interface OnlineGameInfo {
  roomId: string;
  playerId: string;
  initialPlayers: Player[];
}

function App() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [gameKey, setGameKey] = useState(0);
  const [onlineGameInfo, setOnlineGameInfo] = useState<OnlineGameInfo | null>(null);

  // Initialiser les services au demarrage
  useEffect(() => {
    notificationService.initialize();
  }, []);

  const handleStartGame = (mode: 'pvp' | 'ai' | 'online', diff?: Difficulty, color?: 'white' | 'black') => {
    if (mode === 'online') {
      setGameMode('online-lobby');
    } else {
      if (diff) setDifficulty(diff);
      if (color) setPlayerColor(color);
      setGameMode(mode);
      setGameKey(prev => prev + 1);
    }
  };

  const handleJoinRoom = (roomId: string, playerId: string, players: Player[]) => {
    setOnlineGameInfo({ roomId, playerId, initialPlayers: players });
    setGameMode('online-game');
  };

  const handleLeaveOnlineGame = () => {
    setOnlineGameInfo(null);
    setGameMode('online-lobby');
  };

  const handleBackToMenu = () => {
    setGameMode('menu');
    setOnlineGameInfo(null);
  };

  const handleNewGame = () => {
    setGameKey(prev => prev + 1);
  };

  const renderContent = () => {
    switch (gameMode) {
      case 'menu':
        return <Menu onStartGame={handleStartGame} />;

      case 'online-lobby':
        return (
          <Lobby
            onJoinRoom={handleJoinRoom}
            onBack={handleBackToMenu}
          />
        );

      case 'online-game':
        return onlineGameInfo ? (
          <OnlineGame
            roomId={onlineGameInfo.roomId}
            playerId={onlineGameInfo.playerId}
            initialPlayers={onlineGameInfo.initialPlayers}
            onLeave={handleLeaveOnlineGame}
          />
        ) : null;

      default:
        return (
          <div className="game-container">
            <GameBoard
              key={gameKey}
              mode={gameMode as 'pvp' | 'ai'}
              difficulty={difficulty}
              playerColor={playerColor}
            />
            <GameInfo
              onNewGame={handleNewGame}
              onBackToMenu={handleBackToMenu}
            />
          </div>
        );
    }
  };

  return (
    <AuthProvider>
      <CosmeticsProvider>
        <SocketProvider>
          <AppContent
            gameMode={gameMode}
            renderContent={renderContent}
          />
        </SocketProvider>
      </CosmeticsProvider>
    </AuthProvider>
  );
}

// Composant interne pour accéder au contexte Auth
function AppContent({ gameMode, renderContent }: { gameMode: GameMode; renderContent: () => React.ReactNode }) {
  const { user } = useAuth();
  const [adMobReady, setAdMobReady] = useState(false);

  // Initialiser AdMob et marquer comme prêt
  useEffect(() => {
    const initAdMob = async () => {
      try {
        await adMobService.initialize();
        // Délai supplémentaire pour Android
        await new Promise(resolve => setTimeout(resolve, 500));
        setAdMobReady(true);
      } catch (error) {
        console.error('AdMob init error:', error);
        setAdMobReady(true); // Continuer même en cas d'erreur
      }
    };
    initAdMob();
  }, []);

  // Mettre à jour le statut premium dans AdMobService
  useEffect(() => {
    adMobService.setPremiumStatus(user?.isPremium || false);
  }, [user?.isPremium]);

  // Afficher la bannière sauf dans le menu et pendant le jeu
  useEffect(() => {
    if (!adMobReady) return;

    if (gameMode === 'menu') {
      adMobService.showBanner();
    } else {
      adMobService.hideBanner();
    }
  }, [gameMode, adMobReady]);

  return (
    <div className="app ds-bg-premium">
      <header className="app-header">
        <div className="header-brand">
          <h1>DAMESELITE</h1>
          <span className="header-subtitle">FMJD 10×10 • RÈGLES INTERNATIONALES</span>
        </div>
        <div className="header-right">
          <XPBar compact />
          <LanguageSelector compact />
          <Wallet />
          <UserProfile />
        </div>
      </header>

      <main className="app-main">
        {renderContent()}
      </main>

      <footer className="app-footer">
        <p>Regles FMJD - Developpe avec React + Phaser.js</p>
      </footer>

      {/* Composants publicitaires globaux */}
      <BannerAd position="bottom" />
      <InterstitialAd />
    </div>
  );
}

export default App;

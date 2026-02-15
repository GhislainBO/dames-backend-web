import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Phaser from 'phaser';
import { Difficulty } from '../game/types';
import { DraughtsScene, SceneCallbacks, sceneCallbacksRef, GameState } from '../game/DraughtsScene';
import GameHistory from './GameHistory';
import AudioControl from './AudioControl';
import PlayerPanel from './PlayerPanel';
import { useCosmetics, hexToNumber } from '../context/CosmeticsContext';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/NotificationService';
import { adMobService } from '../services/AdMobService';
import { localStatsService } from '../services/LocalStatsService';
import { progressionService, XP_REWARDS } from '../services/ProgressionService';
import './GameBoard.css';

const API_URL = 'https://dames-backend-production.up.railway.app';

interface GameBoardProps {
  mode: 'pvp' | 'ai';
  difficulty: Difficulty;
  playerColor: 'white' | 'black';
}

// Composant pour les confettis de victoire
function VictoryConfetti({ show }: { show: boolean }) {
  if (!show) return null;

  const confetti = Array.from({ length: 50 }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const duration = 2 + Math.random() * 2;
    const size = 8 + Math.random() * 8;
    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ff9ff3', '#54a0ff'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const rotation = Math.random() * 360;

    return (
      <div
        key={i}
        className="confetti-piece"
        style={{
          left: `${left}%`,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          transform: `rotate(${rotation}deg)`,
        }}
      />
    );
  });

  return <div className="victory-confetti">{confetti}</div>;
}

function GameBoard({ mode, difficulty, playerColor }: GameBoardProps) {
  const { t } = useTranslation();
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DraughtsScene | null>(null);
  const { equipped } = useCosmetics();
  const { token, isAuthenticated, user } = useAuth();

  // Refs pour éviter le problème de stale closure
  const tokenRef = useRef(token);
  const isAuthenticatedRef = useRef(isAuthenticated);

  // Mettre à jour les refs quand les valeurs changent
  useEffect(() => {
    tokenRef.current = token;
    isAuthenticatedRef.current = isAuthenticated;
  }, [token, isAuthenticated]);

  // État de l'historique
  const [moves, setMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isReplayMode, setIsReplayMode] = useState(false);

  // État du jeu
  const [gameState, setGameState] = useState<GameState>({
    currentTurn: 'white',
    whitePieces: 20,
    blackPieces: 20,
    whiteKings: 0,
    blackKings: 0,
    capturedByWhite: 0,
    capturedByBlack: 0,
    isGameOver: false,
  });

  // Confettis de victoire
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'loss' | 'draw' | null>(null);

  // Démarrer la session de jeu pour les stats locales
  useEffect(() => {
    localStatsService.startGame(mode, difficulty, playerColor);
  }, [mode, difficulty, playerColor]);

  // Callbacks pour la scène
  const handleMoveHistoryChange = useCallback((newMoves: string[], index: number) => {
    setMoves(newMoves);
    setCurrentMoveIndex(index);
  }, []);

  const handleGameStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleGameOver = useCallback(async (winner: string, reason: string) => {
    // Utiliser les refs pour avoir les valeurs actuelles (évite stale closure)
    const currentToken = tokenRef.current;
    const currentIsAuthenticated = isAuthenticatedRef.current;

    console.log(`[GameOver] Partie terminée: ${winner} - ${reason}`);
    console.log(`[GameOver] isAuthenticated: ${currentIsAuthenticated}, token: ${currentToken ? 'présent' : 'absent'}, mode: ${mode}`);

    // Déterminer le résultat
    let result: 'win' | 'loss' | 'draw';
    if (winner === 'draw') {
      result = 'draw';
    } else {
      const winnerColor = winner.replace('_wins', '');
      if (mode === 'pvp') {
        result = 'win'; // En PvP, on considère toujours une victoire
      } else {
        result = winnerColor === playerColor ? 'win' : 'loss';
      }
    }

    setGameResult(result);

    // Afficher les confettis si victoire
    if (result === 'win') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }

    // Enregistrer dans les stats locales
    localStatsService.endGame(result);

    // Attribuer l'XP selon le résultat
    if (mode === 'ai') {
      if (result === 'win') {
        const xpKey = `WIN_AI_${difficulty.toUpperCase()}` as keyof typeof XP_REWARDS;
        progressionService.addXP(XP_REWARDS[xpKey] || XP_REWARDS.WIN_AI_MEDIUM);
      } else if (result === 'loss') {
        progressionService.addXP(XP_REWARDS.LOSS);
      } else {
        progressionService.addXP(XP_REWARDS.DRAW);
      }
    } else if (mode === 'pvp') {
      if (result === 'win') {
        progressionService.addXP(XP_REWARDS.WIN_PVP);
      } else {
        progressionService.addXP(XP_REWARDS.DRAW);
      }
    }
    // Dispatch event pour mettre à jour l'XP bar
    window.dispatchEvent(new CustomEvent('progressionUpdate'));

    // Afficher une publicité interstitielle après la partie
    adMobService.showInterstitialAd();

    // Envoyer le résultat au serveur si connecté
    if (currentIsAuthenticated && currentToken && mode === 'ai') {
      console.log(`[GameOver] Envoi du résultat: ${result}`);
      try {
        const response = await fetch(`${API_URL}/api/game/result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`,
          },
          body: JSON.stringify({ result, mode: `IA ${difficulty}` }),
        });
        const data = await response.json();
        console.log(`[GameOver] Réponse serveur:`, data);

        if (data.success) {
          console.log('[GameOver] Résultat enregistré:', data.stats);
          // Notifier les nouveaux succès
          if (data.newAchievements?.length > 0) {
            for (const ach of data.newAchievements) {
              notificationService.sendImmediateNotification(
                'Nouveau succes!',
                `${ach.icon} ${ach.name} - ${ach.reward} jetons a reclamer`
              );
            }
          }
        } else {
          console.error('[GameOver] Erreur serveur:', data.error);
        }
      } catch (error) {
        console.error('[GameOver] Erreur envoi résultat:', error);
      }
    } else {
      console.log(`[GameOver] Pas d'envoi: isAuthenticated=${currentIsAuthenticated}, token=${!!currentToken}, mode=${mode}`);
    }
  }, [mode, playerColor, difficulty]);

  // Mettre à jour les callbacks dans le ref global quand ils changent
  useEffect(() => {
    sceneCallbacksRef.current = {
      onMoveHistoryChange: handleMoveHistoryChange,
      onGameOver: handleGameOver,
      onGameStateChange: handleGameStateChange,
    };
  }, [handleMoveHistoryChange, handleGameOver, handleGameStateChange]);

  // Initialisation de Phaser
  useEffect(() => {
    if (!containerRef.current) return;

    const callbacks: SceneCallbacks = {
      onMoveHistoryChange: handleMoveHistoryChange,
      onGameOver: handleGameOver,
      onGameStateChange: handleGameStateChange,
    };

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 600,
      height: 600,
      parent: containerRef.current,
      backgroundColor: '#1a1a2e',
      scene: DraughtsScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 600,
        height: 600,
        min: {
          width: 300,
          height: 300,
        },
        max: {
          width: 600,
          height: 600,
        },
      },
    };

    gameRef.current = new Phaser.Game(config);

    // Convertir les couleurs hex en nombres pour Phaser
    const cosmeticsColors = {
      board: {
        lightSquare: hexToNumber(equipped.boardTheme.lightSquare),
        darkSquare: hexToNumber(equipped.boardTheme.darkSquare),
        highlight: hexToNumber(equipped.boardTheme.highlight),
        validMove: hexToNumber(equipped.boardTheme.validMove),
      },
      pieces: {
        whiteColor: hexToNumber(equipped.pieceStyle.whiteColor),
        whiteBorder: hexToNumber(equipped.pieceStyle.whiteBorder),
        blackColor: hexToNumber(equipped.pieceStyle.blackColor),
        blackBorder: hexToNumber(equipped.pieceStyle.blackBorder),
        kingSymbol: equipped.pieceStyle.kingSymbol,
      },
    };

    gameRef.current.registry.set('gameConfig', {
      mode,
      difficulty,
      playerColor,
      callbacks,
      cosmetics: cosmeticsColors,
    });

    // Récupérer la référence à la scène après son démarrage
    const checkScene = setInterval(() => {
      if (gameRef.current) {
        const scene = gameRef.current.registry.get('sceneInstance');
        if (scene) {
          sceneRef.current = scene;
          clearInterval(checkScene);
        }
      }
    }, 100);

    return () => {
      clearInterval(checkScene);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      sceneRef.current = null;
    };
  }, [mode, difficulty, playerColor, handleMoveHistoryChange, handleGameOver, handleGameStateChange, equipped]);

  // Contrôles de replay
  const handleMoveClick = useCallback((index: number) => {
    if (sceneRef.current) {
      sceneRef.current.goToMove(index);
      setIsReplayMode(true);
    }
  }, []);

  const handleFirst = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.goToFirst();
    }
  }, []);

  const handlePrevious = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.goToPrevious();
    }
  }, []);

  const handleNext = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.goToNext();
    }
  }, []);

  const handleLast = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.goToLast();
    }
  }, []);

  const handleToggleReplay = useCallback(() => {
    if (sceneRef.current) {
      const newMode = !isReplayMode;
      sceneRef.current.setReplayMode(newMode);
      setIsReplayMode(newMode);
    }
  }, [isReplayMode]);

  // Export PDN
  const handleExportPDN = useCallback(() => {
    if (sceneRef.current) {
      const pdn = sceneRef.current.exportPDN();

      // Créer un fichier et le télécharger
      const blob = new Blob([pdn], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `partie_${new Date().toISOString().split('T')[0]}.pdn`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, []);

  // Import PDN
  const handleImportPDN = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdn,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && sceneRef.current) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            const success = sceneRef.current?.loadPDN(content);
            if (!success) {
              alert(t('history.pdnError'));
            }
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [t]);

  // Déterminer la classe CSS du conteneur
  const containerClass = gameState.isGameOver
    ? gameResult === 'win'
      ? 'phaser-container game-won'
      : gameResult === 'loss'
      ? 'phaser-container game-lost'
      : 'phaser-container'
    : 'phaser-container';

  return (
    <div className="game-board-wrapper">
      <VictoryConfetti show={showConfetti} />

      <div className="game-board-container">
        <div ref={containerRef} className={containerClass} />
      </div>

      <div className="game-sidebar">
        <div className="sidebar-header">
          <AudioControl />
        </div>

        {/* Indicateur de tour */}
        <div className={`turn-indicator ${gameState.currentTurn}-turn`}>
          {gameState.isGameOver ? (
            <span className="game-over-text">
              {gameResult === 'win' && t('game.victory', 'Victoire!')}
              {gameResult === 'loss' && t('game.defeat', 'Defaite')}
              {gameResult === 'draw' && t('game.draw', 'Egalite')}
            </span>
          ) : (
            <span>
              {gameState.currentTurn === 'white'
                ? t('game.whiteTurn', 'Tour des Blancs')
                : t('game.blackTurn', 'Tour des Noirs')}
              {mode === 'ai' && gameState.currentTurn === playerColor && (
                <span className="your-turn"> - {t('game.yourTurn', 'A vous!')}</span>
              )}
            </span>
          )}
        </div>

        {/* Panneaux joueurs */}
        <div className="players-section">
          <PlayerPanel
            color="white"
            isCurrentTurn={gameState.currentTurn === 'white'}
            pieceCount={gameState.whitePieces}
            kingCount={gameState.whiteKings}
            capturedCount={gameState.capturedByWhite}
            isAI={mode === 'ai' && playerColor === 'black'}
            aiDifficulty={difficulty}
            playerName={mode === 'ai' && playerColor === 'white' ? (user?.username || t('game.you', 'Vous')) : (mode === 'pvp' ? t('game.player1', 'Joueur 1') : undefined)}
            isGameOver={gameState.isGameOver}
          />
          <div className="vs-divider-premium">
            <span className="vs-text">VS</span>
          </div>
          <PlayerPanel
            color="black"
            isCurrentTurn={gameState.currentTurn === 'black'}
            pieceCount={gameState.blackPieces}
            kingCount={gameState.blackKings}
            capturedCount={gameState.capturedByBlack}
            isAI={mode === 'ai' && playerColor === 'white'}
            aiDifficulty={difficulty}
            playerName={mode === 'ai' && playerColor === 'black' ? (user?.username || t('game.you', 'Vous')) : (mode === 'pvp' ? t('game.player2', 'Joueur 2') : undefined)}
            isGameOver={gameState.isGameOver}
          />
        </div>

        <GameHistory
          moves={moves}
          currentMoveIndex={currentMoveIndex}
          onMoveClick={handleMoveClick}
          onFirst={handleFirst}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onLast={handleLast}
          onExportPDN={handleExportPDN}
          onImportPDN={handleImportPDN}
          isReplayMode={isReplayMode}
          onToggleReplay={handleToggleReplay}
        />
      </div>
    </div>
  );
}

export default GameBoard;

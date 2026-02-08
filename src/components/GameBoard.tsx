import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Phaser from 'phaser';
import { Difficulty } from '../game/types';
import { DraughtsScene, SceneCallbacks, sceneCallbacksRef } from '../game/DraughtsScene';
import GameHistory from './GameHistory';
import AudioControl from './AudioControl';
import { useCosmetics, hexToNumber } from '../context/CosmeticsContext';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/NotificationService';
import { adMobService } from '../services/AdMobService';
import './GameBoard.css';

const API_URL = 'https://dames-backend-production.up.railway.app';

interface GameBoardProps {
  mode: 'pvp' | 'ai';
  difficulty: Difficulty;
  playerColor: 'white' | 'black';
}

function GameBoard({ mode, difficulty, playerColor }: GameBoardProps) {
  const { t } = useTranslation();
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DraughtsScene | null>(null);
  const { equipped } = useCosmetics();
  const { token, isAuthenticated } = useAuth();

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

  // Callbacks pour la scène
  const handleMoveHistoryChange = useCallback((newMoves: string[], index: number) => {
    setMoves(newMoves);
    setCurrentMoveIndex(index);
  }, []);

  const handleGameOver = useCallback(async (winner: string, reason: string) => {
    // Utiliser les refs pour avoir les valeurs actuelles (évite stale closure)
    const currentToken = tokenRef.current;
    const currentIsAuthenticated = isAuthenticatedRef.current;

    console.log(`[GameOver] Partie terminée: ${winner} - ${reason}`);
    console.log(`[GameOver] isAuthenticated: ${currentIsAuthenticated}, token: ${currentToken ? 'présent' : 'absent'}, mode: ${mode}`);

    // Afficher une publicité interstitielle après la partie
    adMobService.showInterstitialAd();

    // Envoyer le résultat au serveur si connecté
    if (currentIsAuthenticated && currentToken && mode === 'ai') {
      let result: 'win' | 'loss' | 'draw';
      if (winner === 'draw') {
        result = 'draw';
      } else {
        // winner est 'white_wins' ou 'black_wins', on extrait la couleur
        const winnerColor = winner.replace('_wins', '');
        console.log(`[GameOver] winnerColor: ${winnerColor}, playerColor: ${playerColor}`);
        if (winnerColor === playerColor) {
          result = 'win';
        } else {
          result = 'loss';
        }
      }

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
                'Nouveau succès!',
                `${ach.icon} ${ach.name} - ${ach.reward} jetons à réclamer`
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
    };
  }, [handleMoveHistoryChange, handleGameOver]);

  // Initialisation de Phaser
  useEffect(() => {
    if (!containerRef.current) return;

    const callbacks: SceneCallbacks = {
      onMoveHistoryChange: handleMoveHistoryChange,
      onGameOver: handleGameOver,
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
  }, [mode, difficulty, playerColor, handleMoveHistoryChange, handleGameOver, equipped]);

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

  return (
    <div className="game-board-wrapper">
      <div className="game-board-container">
        <div ref={containerRef} className="phaser-container" />
      </div>
      <div className="game-sidebar">
        <div className="sidebar-header">
          <AudioControl />
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

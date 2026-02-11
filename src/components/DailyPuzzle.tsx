/**
 * DailyPuzzle - Composant pour le puzzle quotidien
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { dailyPuzzleService, DailyPuzzle as DailyPuzzleType, PuzzleResult } from '../services/DailyPuzzleService';
import { localAchievementsService } from '../services/LocalAchievementsService';
import { socialShareService } from '../services/SocialShareService';
import './DailyPuzzle.css';

interface DailyPuzzleProps {
  onClose: () => void;
}

type CellState = 'empty' | 'white' | 'black' | 'whiteKing' | 'blackKing' | 'selected' | 'hint';

interface BoardCell {
  state: CellState;
  isPlayable: boolean;
  position: number; // 1-50 notation
}

const DailyPuzzle: React.FC<DailyPuzzleProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [puzzle, setPuzzle] = useState<DailyPuzzleType | null>(null);
  const [board, setBoard] = useState<BoardCell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [moves, setMoves] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [currentCapture, setCurrentCapture] = useState<string>(''); // Pour les multi-captures en cours
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [alreadySolved, setAlreadySolved] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mode test pour parcourir tous les puzzles
  const [testMode, setTestMode] = useState(false);
  const [testPuzzleIndex, setTestPuzzleIndex] = useState(0);
  const titleClickCount = useRef(0);
  const titleClickTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialiser le puzzle
  useEffect(() => {
    const todayPuzzle = dailyPuzzleService.getPuzzleOfDay();
    setPuzzle(todayPuzzle);

    const todayResult = dailyPuzzleService.getTodayResult();
    if (todayResult?.solved) {
      setAlreadySolved(true);
      setSolved(true);
    }

    initializeBoard(todayPuzzle);
  }, []);

  // Activer le mode test (triple clic sur le titre)
  const handleTitleClick = () => {
    titleClickCount.current++;

    if (titleClickTimer.current) {
      clearTimeout(titleClickTimer.current);
    }

    if (titleClickCount.current >= 3) {
      // Triple clic détecté - activer/désactiver le mode test
      setTestMode(prev => !prev);
      if (!testMode) {
        // Entrer en mode test - charger le premier puzzle
        const firstPuzzle = dailyPuzzleService.getPuzzleByIndex(0);
        setPuzzle(firstPuzzle);
        setTestPuzzleIndex(0);
        resetPuzzleState();
        initializeBoard(firstPuzzle);
      } else {
        // Quitter le mode test - revenir au puzzle du jour
        const todayPuzzle = dailyPuzzleService.getPuzzleOfDay();
        setPuzzle(todayPuzzle);
        resetPuzzleState();
        initializeBoard(todayPuzzle);
      }
      titleClickCount.current = 0;
    } else {
      titleClickTimer.current = setTimeout(() => {
        titleClickCount.current = 0;
      }, 500);
    }
  };

  // Réinitialiser l'état du puzzle
  const resetPuzzleState = () => {
    setMoves([]);
    setSelectedCell(null);
    setFailed(false);
    setShowHint(false);
    setUsedHint(false);
    setCurrentCapture('');
    setSolved(false);
    setAlreadySolved(false);
    setAttempts(0);
    setTimeElapsed(0);
  };

  // Navigation en mode test
  const goToPuzzle = (index: number) => {
    const newPuzzle = dailyPuzzleService.getPuzzleByIndex(index);
    setPuzzle(newPuzzle);
    setTestPuzzleIndex(index);
    resetPuzzleState();
    initializeBoard(newPuzzle);
  };

  const goToPreviousPuzzle = () => {
    const newIndex = testPuzzleIndex - 1;
    goToPuzzle(newIndex);
  };

  const goToNextPuzzle = () => {
    const newIndex = testPuzzleIndex + 1;
    goToPuzzle(newIndex);
  };

  // Timer
  useEffect(() => {
    if (!solved && !alreadySolved && puzzle) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [solved, alreadySolved, puzzle]);

  // Convertir row/col en notation 1-50
  const toNotation = (row: number, col: number): number => {
    // Seulement les cases jouables (cases sombres)
    if ((row + col) % 2 === 0) return 0; // Case claire, pas jouable
    const playableRow = row;
    const playableCol = Math.floor(col / 2);
    return playableRow * 5 + playableCol + 1;
  };

  // Convertir notation 1-50 en row/col
  const fromNotation = (pos: number): { row: number; col: number } => {
    const row = Math.floor((pos - 1) / 5);
    const colIndex = (pos - 1) % 5;
    const col = colIndex * 2 + (row % 2 === 0 ? 1 : 0);
    return { row, col };
  };

  // Initialiser le plateau avec les pieces du puzzle
  const initializeBoard = (puzzleData: DailyPuzzleType) => {
    const newBoard: BoardCell[][] = [];

    for (let row = 0; row < 10; row++) {
      const rowCells: BoardCell[] = [];
      for (let col = 0; col < 10; col++) {
        const isPlayable = (row + col) % 2 === 1;
        const position = isPlayable ? toNotation(row, col) : 0;
        rowCells.push({
          state: 'empty',
          isPlayable,
          position,
        });
      }
      newBoard.push(rowCells);
    }

    // Placer les pieces
    puzzleData.pieces.forEach(piece => {
      const { row, col, color, isKing } = piece;
      if (row >= 0 && row < 10 && col >= 0 && col < 10) {
        if (color === 'white') {
          newBoard[row][col].state = isKing ? 'whiteKing' : 'white';
        } else {
          newBoard[row][col].state = isKing ? 'blackKing' : 'black';
        }
      }
    });

    setBoard(newBoard);
  };

  // Vérifie si des captures sont disponibles depuis une position
  // Note: En dames internationales, les pions PEUVENT capturer en arrière!
  const hasMoreCaptures = (boardState: BoardCell[][], row: number, col: number, playerColor: string): boolean => {
    const directions = [[-2, -2], [-2, 2], [2, -2], [2, 2]];

    for (const [dr, dc] of directions) {
      // En dames internationales, les captures sont possibles dans TOUTES les directions
      // (même en arrière pour les pions)

      const midRow = row + dr / 2;
      const midCol = col + dc / 2;
      const newRow = row + dr;
      const newCol = col + dc;

      if (newRow < 0 || newRow >= 10 || newCol < 0 || newCol >= 10) continue;

      const midCell = boardState[midRow]?.[midCol];
      const targetCell = boardState[newRow]?.[newCol];

      if (!midCell || !targetCell) continue;

      // Vérifier s'il y a une pièce adverse au milieu et une case vide à la destination
      const isEnemyPiece =
        (playerColor === 'white' && (midCell.state === 'black' || midCell.state === 'blackKing')) ||
        (playerColor === 'black' && (midCell.state === 'white' || midCell.state === 'whiteKing'));

      if (isEnemyPiece && targetCell.state === 'empty') {
        return true;
      }
    }
    return false;
  };

  // Gerer le clic sur une case
  const handleCellClick = (row: number, col: number) => {
    if (solved || alreadySolved || !puzzle) return;

    const cell = board[row][col];
    if (!cell.isPlayable) return;

    const playerColor = puzzle.playerColor;

    // Si aucune piece selectionnee
    if (!selectedCell) {
      // Selectionner une piece du joueur
      const isPlayerPiece =
        (playerColor === 'white' && (cell.state === 'white' || cell.state === 'whiteKing')) ||
        (playerColor === 'black' && (cell.state === 'black' || cell.state === 'blackKing'));

      if (isPlayerPiece) {
        setSelectedCell({ row, col });
      }
    } else {
      // Essayer de jouer le coup
      const fromPos = toNotation(selectedCell.row, selectedCell.col);
      const toPos = toNotation(row, col);

      if (fromPos && toPos) {
        // Verifier si c'est une capture
        const isCapture = Math.abs(row - selectedCell.row) >= 2;

        // Deplacer la piece sur le plateau (visuellement)
        const newBoard = [...board.map(r => r.map(c => ({ ...c })))];
        newBoard[row][col].state = newBoard[selectedCell.row][selectedCell.col].state;
        newBoard[selectedCell.row][selectedCell.col].state = 'empty';

        // Si capture, retirer la piece capturee
        if (isCapture) {
          const midRow = Math.floor((row + selectedCell.row) / 2);
          const midCol = Math.floor((col + selectedCell.col) / 2);
          newBoard[midRow][midCol].state = 'empty';
        }

        setBoard(newBoard);

        if (isCapture) {
          // Construire la notation de multi-capture
          const newCaptureNotation = currentCapture
            ? `${currentCapture}x${toPos}`
            : `${fromPos}x${toPos}`;

          // Vérifier s'il y a d'autres captures disponibles
          if (hasMoreCaptures(newBoard, row, col, playerColor)) {
            // Multi-capture en cours - garder la pièce sélectionnée
            setCurrentCapture(newCaptureNotation);
            setSelectedCell({ row, col });
          } else {
            // Fin de la capture - enregistrer le coup complet
            const newMoves = [...moves, newCaptureNotation];
            setMoves(newMoves);
            setCurrentCapture('');
            setSelectedCell(null);
            checkSolution(newMoves);
          }
        } else {
          // Déplacement simple (pas de capture)
          const moveStr = `${fromPos}-${toPos}`;
          const newMoves = [...moves, moveStr];
          setMoves(newMoves);
          setCurrentCapture('');
          setSelectedCell(null);
          checkSolution(newMoves);
        }
      } else {
        setSelectedCell(null);
        setCurrentCapture('');
      }
    }
  };

  // Verifier si la solution est correcte
  const checkSolution = (currentMoves: string[]) => {
    if (!puzzle) return;

    // Solution partielle - continuer
    if (currentMoves.length < puzzle.solution.length) {
      // Verifier si le debut est correct
      const isCorrectSoFar = currentMoves.every((move, i) => {
        const playerMove = move.toLowerCase().replace(/\s/g, '');
        const solutionMove = puzzle.solution[i].toLowerCase().replace(/\s/g, '');
        return playerMove === solutionMove;
      });

      if (!isCorrectSoFar) {
        setFailed(true);
        setAttempts(prev => prev + 1);
        setTimeout(() => {
          setFailed(false);
          setMoves([]);
          initializeBoard(puzzle);
        }, 1500);
      }
      return;
    }

    // Solution complete
    const isCorrect = dailyPuzzleService.checkSolution(puzzle, currentMoves);

    if (isCorrect) {
      setSolved(true);
      if (timerRef.current) clearInterval(timerRef.current);

      // Sauvegarder le resultat
      const result: PuzzleResult = {
        date: puzzle.date,
        puzzleId: puzzle.id,
        solved: true,
        attempts: attempts + 1,
        timeSeconds: timeElapsed,
        usedHint,
      };
      dailyPuzzleService.saveResult(result);

      // Trigger achievements
      const stats = dailyPuzzleService.getStats();
      localAchievementsService.onPuzzleCompleted({
        usedHint,
        puzzleStreak: stats.currentStreak,
        totalSolved: stats.totalSolved,
      });
    } else {
      setFailed(true);
      setAttempts(prev => prev + 1);
      setTimeout(() => {
        setFailed(false);
        setMoves([]);
        initializeBoard(puzzle);
      }, 1500);
    }
  };

  // Afficher l'indice - montre le premier coup visuellement
  const handleShowHint = () => {
    if (!puzzle || puzzle.solution.length === 0) return;

    setShowHint(true);
    setUsedHint(true);

    // Extraire la case de départ du premier coup de la solution
    const firstMove = puzzle.solution[0];
    const fromPos = parseInt(firstMove.split(/[-x]/)[0]);

    if (fromPos > 0 && fromPos <= 50) {
      const { row, col } = fromNotation(fromPos);
      // Sélectionner automatiquement la pièce à jouer
      setSelectedCell({ row, col });
    }
  };

  // Reinitialiser - reset complet du plateau
  const handleReset = () => {
    if (!puzzle) return;

    // Reset tous les états
    setMoves([]);
    setSelectedCell(null);
    setFailed(false);
    setShowHint(false);
    setCurrentCapture('');

    // Recréer le plateau depuis zéro
    const newBoard: BoardCell[][] = [];
    for (let row = 0; row < 10; row++) {
      const rowCells: BoardCell[] = [];
      for (let col = 0; col < 10; col++) {
        const isPlayable = (row + col) % 2 === 1;
        const position = isPlayable ? toNotation(row, col) : 0;
        rowCells.push({
          state: 'empty',
          isPlayable,
          position,
        });
      }
      newBoard.push(rowCells);
    }

    // Replacer les pièces originales
    puzzle.pieces.forEach(piece => {
      const { row, col, color, isKing } = piece;
      if (row >= 0 && row < 10 && col >= 0 && col < 10) {
        if (color === 'white') {
          newBoard[row][col].state = isKing ? 'whiteKing' : 'white';
        } else {
          newBoard[row][col].state = isKing ? 'blackKing' : 'black';
        }
      }
    });

    setBoard(newBoard);
  };

  // Partager le resultat
  const handleShare = async () => {
    if (!puzzle) return;

    const stats = dailyPuzzleService.getStats();
    const shareText = t('puzzle.shareText',
      "J'ai resolu le puzzle du jour sur DAMESELITE en {{time}} ! Serie de {{streak}} jours.",
      { time: dailyPuzzleService.formatTime(timeElapsed), streak: stats.currentStreak }
    );

    const shared = await socialShareService.shareWithImage(
      {
        type: 'puzzle',
        title: t('puzzle.solved', 'Puzzle Resolu!'),
        subtitle: puzzle.date,
        stats: [
          { label: t('puzzle.time', 'Temps'), value: dailyPuzzleService.formatTime(timeElapsed) },
          { label: t('puzzle.attempts', 'Essais'), value: (attempts + 1).toString() },
          { label: t('puzzle.streak', 'Serie'), value: `${stats.currentStreak}` },
        ],
        primaryColor: '#9C27B0',
      },
      shareText
    );

    if (!shared) {
      // Fallback: copier le texte
      await socialShareService.copyShareLink(shareText);
    }
  };

  // Rendu d'une piece
  const renderPiece = (state: CellState) => {
    if (state === 'empty' || state === 'selected' || state === 'hint') return null;

    const isWhite = state === 'white' || state === 'whiteKing';
    const isKing = state === 'whiteKing' || state === 'blackKing';

    return (
      <div className={`puzzle-piece ${isWhite ? 'white' : 'black'} ${isKing ? 'king' : ''}`}>
        {isKing && <span className="crown">♔</span>}
      </div>
    );
  };

  // Stats du puzzle
  const stats = dailyPuzzleService.getStats();

  if (!puzzle) {
    return (
      <div className="daily-puzzle-overlay">
        <div className="daily-puzzle-modal">
          <div className="puzzle-loading">
            {t('puzzle.loading', 'Chargement...')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-puzzle-overlay">
      <div className="daily-puzzle-modal">
        <button className="puzzle-close-btn" onClick={onClose}>×</button>

        <div className="puzzle-header">
          <h2 onClick={handleTitleClick} style={{ cursor: 'pointer' }}>
            {testMode ? '🧪 Mode Test' : t('puzzle.title', 'Puzzle du Jour')}
          </h2>
          <div className="puzzle-date">{puzzle.date}</div>
          {testMode && (
            <div className="test-navigation">
              <button className="test-nav-btn" onClick={goToPreviousPuzzle}>◀ Précédent</button>
              <span className="test-nav-info">{testPuzzleIndex + 1} / {dailyPuzzleService.getTotalPuzzles()}</span>
              <button className="test-nav-btn" onClick={goToNextPuzzle}>Suivant ▶</button>
            </div>
          )}
        </div>

        {!showStats ? (
          <>
            <div className="puzzle-info">
              <h3>{puzzle.title}</h3>
              <p>{puzzle.description}</p>
              <div className="puzzle-meta">
                <span className={`difficulty ${puzzle.difficulty}`}>
                  {t(`puzzle.difficulty.${puzzle.difficulty}`, puzzle.difficulty)}
                </span>
                <span className="player-color">
                  {t('puzzle.playAs', 'Jouez les')} {puzzle.playerColor === 'white' ? t('puzzle.white', 'Blancs') : t('puzzle.black', 'Noirs')}
                </span>
              </div>
            </div>

            <div className="puzzle-timer">
              {dailyPuzzleService.formatTime(timeElapsed)}
            </div>

            <div className={`puzzle-board ${failed ? 'shake' : ''} ${solved ? 'solved' : ''}`}>
              {board.map((row, rowIndex) => (
                <div key={rowIndex} className="puzzle-row">
                  {row.map((cell, colIndex) => (
                    <div
                      key={colIndex}
                      className={`puzzle-cell ${cell.isPlayable ? 'dark' : 'light'} ${
                        selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? 'selected' : ''
                      }`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {cell.isPlayable && cell.position > 0 && (
                        <span className="cell-number">{cell.position}</span>
                      )}
                      {renderPiece(cell.state)}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {solved && (
              <div className="puzzle-success">
                <h3>{t('puzzle.solved', 'Bravo!')}</h3>
                <p>
                  {alreadySolved
                    ? t('puzzle.alreadySolved', 'Vous avez deja resolu ce puzzle.')
                    : t('puzzle.congratulations', 'Puzzle resolu en {{time}} avec {{attempts}} essai(s).', {
                        time: dailyPuzzleService.formatTime(timeElapsed),
                        attempts: attempts + 1,
                      })
                  }
                </p>
                <div className="puzzle-success-buttons">
                  <button className="btn-stats" onClick={() => setShowStats(true)}>
                    {t('puzzle.viewStats', 'Voir les statistiques')}
                  </button>
                  <button className="btn-share" onClick={handleShare}>
                    {t('puzzle.share', 'Partager')}
                  </button>
                </div>
              </div>
            )}

            {!solved && (
              <div className="puzzle-controls">
                <button className="btn-hint" onClick={handleShowHint} disabled={showHint}>
                  {t('puzzle.hint', 'Indice')}
                </button>
                <button className="btn-reset" onClick={handleReset}>
                  {t('puzzle.reset', 'Recommencer')}
                </button>
              </div>
            )}

            {showHint && (
              <div className="puzzle-hint">
                <strong>{t('puzzle.hintLabel', 'Indice:')}</strong> {puzzle.hint}
              </div>
            )}

            <div className="puzzle-attempts">
              {t('puzzle.attempts', 'Essais')}: {attempts}
            </div>
          </>
        ) : (
          <div className="puzzle-stats">
            <h3>{t('puzzle.stats', 'Statistiques')}</h3>

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.totalSolved}</div>
                <div className="stat-label">{t('puzzle.totalSolved', 'Resolus')}</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.currentStreak}</div>
                <div className="stat-label">{t('puzzle.currentStreak', 'Serie actuelle')}</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.bestStreak}</div>
                <div className="stat-label">{t('puzzle.bestStreak', 'Meilleure serie')}</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{dailyPuzzleService.formatTime(stats.averageTime)}</div>
                <div className="stat-label">{t('puzzle.averageTime', 'Temps moyen')}</div>
              </div>
            </div>

            <div className="streak-display">
              <div className="streak-icon">🔥</div>
              <div className="streak-info">
                <span className="streak-number">{stats.currentStreak}</span>
                <span className="streak-text">{t('puzzle.dayStreak', 'jours consecutifs')}</span>
              </div>
            </div>

            <button className="btn-back" onClick={() => setShowStats(false)}>
              {t('puzzle.backToPuzzle', 'Retour au puzzle')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyPuzzle;

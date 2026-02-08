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
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [alreadySolved, setAlreadySolved] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Gerer le clic sur une case
  const handleCellClick = (row: number, col: number) => {
    if (solved || alreadySolved || !puzzle) return;

    const cell = board[row][col];
    if (!cell.isPlayable) return;

    // Si aucune piece selectionnee
    if (!selectedCell) {
      // Selectionner une piece du joueur
      const playerColor = puzzle.playerColor;
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
        const move = `${fromPos}-${toPos}`;
        const captureMove = `${fromPos}x${toPos}`;

        // Verifier si c'est une capture
        const isCapture = Math.abs(row - selectedCell.row) >= 2;
        const moveStr = isCapture ? captureMove : move;

        // Ajouter le coup
        const newMoves = [...moves, moveStr];
        setMoves(newMoves);

        // Deplacer la piece sur le plateau (visuellement)
        const newBoard = [...board.map(r => [...r])];
        newBoard[row][col].state = newBoard[selectedCell.row][selectedCell.col].state;
        newBoard[selectedCell.row][selectedCell.col].state = 'empty';

        // Si capture, retirer la piece capturee
        if (isCapture) {
          const midRow = (row + selectedCell.row) / 2;
          const midCol = (col + selectedCell.col) / 2;
          newBoard[Math.floor(midRow)][Math.floor(midCol)].state = 'empty';
        }

        setBoard(newBoard);
        setSelectedCell(null);

        // Verifier la solution
        checkSolution(newMoves);
      } else {
        setSelectedCell(null);
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

  // Afficher l'indice
  const handleShowHint = () => {
    setShowHint(true);
    setUsedHint(true);
  };

  // Reinitialiser
  const handleReset = () => {
    if (puzzle) {
      setMoves([]);
      setSelectedCell(null);
      setFailed(false);
      initializeBoard(puzzle);
    }
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
          <h2>{t('puzzle.title', 'Puzzle du Jour')}</h2>
          <div className="puzzle-date">{puzzle.date}</div>
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

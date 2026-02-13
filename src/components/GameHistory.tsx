/**
 * GameHistory - Composant d'historique et de replay des parties
 */

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './GameHistory.css';

interface MoveRecord {
  moveNumber: number;
  whiteMove?: string;
  blackMove?: string;
}

interface GameHistoryProps {
  moves: string[];
  currentMoveIndex: number;
  onMoveClick: (index: number) => void;
  onFirst: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onLast: () => void;
  onExportPDN: () => void;
  onImportPDN: () => void;
  isReplayMode: boolean;
  onToggleReplay: () => void;
}

function GameHistory({
  moves,
  currentMoveIndex,
  onMoveClick,
  onFirst,
  onPrevious,
  onNext,
  onLast,
  onExportPDN,
  onImportPDN,
  isReplayMode,
  onToggleReplay,
}: GameHistoryProps) {
  const { t } = useTranslation();
  const historyRef = useRef<HTMLDivElement>(null);

  // Convertir la liste de coups en paires (blanc, noir)
  const moveRecords: MoveRecord[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    moveRecords.push({
      moveNumber: Math.floor(i / 2) + 1,
      whiteMove: moves[i],
      blackMove: moves[i + 1],
    });
  }

  // Auto-scroll vers le coup actuel
  useEffect(() => {
    if (historyRef.current && !isReplayMode) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [moves.length, isReplayMode]);

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isReplayMode) return;

      switch (e.key) {
        case 'ArrowLeft':
          onPrevious();
          break;
        case 'ArrowRight':
          onNext();
          break;
        case 'Home':
          onFirst();
          break;
        case 'End':
          onLast();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReplayMode, onPrevious, onNext, onFirst, onLast]);

  const getMoveClass = (index: number) => {
    if (index === currentMoveIndex) return 'move current';
    if (index < currentMoveIndex) return 'move played';
    return 'move';
  };

  return (
    <div className="game-history">
      <div className="history-header">
        <h3>{t('history.title')}</h3>
        <div className="history-actions">
          <button
            className={`btn-icon ${isReplayMode ? 'active' : ''}`}
            onClick={onToggleReplay}
            title={isReplayMode ? t('history.exitReplay') : t('history.replayMode')}
          >
            {isReplayMode ? '▶' : '⏸'}
          </button>
        </div>
      </div>

      <div className="moves-list" ref={historyRef}>
        {moveRecords.length === 0 ? (
          <div className="no-moves">{t('history.noMoves')}</div>
        ) : (
          <table className="moves-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('history.white')}</th>
                <th>{t('history.black')}</th>
              </tr>
            </thead>
            <tbody>
              {moveRecords.map((record, rowIndex) => (
                <tr key={record.moveNumber}>
                  <td className="move-number">{record.moveNumber}.</td>
                  <td>
                    {record.whiteMove && (
                      <span
                        className={getMoveClass(rowIndex * 2)}
                        onClick={() => onMoveClick(rowIndex * 2)}
                      >
                        {record.whiteMove}
                      </span>
                    )}
                  </td>
                  <td>
                    {record.blackMove && (
                      <span
                        className={getMoveClass(rowIndex * 2 + 1)}
                        onClick={() => onMoveClick(rowIndex * 2 + 1)}
                      >
                        {record.blackMove}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isReplayMode && (
        <div className="replay-controls">
          <button onClick={onFirst} title={t('history.start')} disabled={currentMoveIndex < 0}>
            ⏮
          </button>
          <button onClick={onPrevious} title={t('history.previous')} disabled={currentMoveIndex < 0}>
            ◀
          </button>
          <span className="move-counter">
            {currentMoveIndex + 1} / {moves.length}
          </span>
          <button onClick={onNext} title={t('history.next')} disabled={currentMoveIndex >= moves.length - 1}>
            ▶
          </button>
          <button onClick={onLast} title={t('history.end')} disabled={currentMoveIndex >= moves.length - 1}>
            ⏭
          </button>
        </div>
      )}

      <div className="export-controls">
        <button className="btn-export" onClick={onExportPDN} title={t('history.exportPDN')}>
          📥 {t('history.export')}
        </button>
        <button className="btn-import" onClick={onImportPDN} title={t('history.importPDN')}>
          📤 {t('history.import')}
        </button>
      </div>
    </div>
  );
}

export default GameHistory;

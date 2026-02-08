/**
 * MinimaxAI - Intelligence Artificielle avec Minimax et Alpha-Beta
 *
 * Implémente :
 * - Algorithme Minimax pour explorer l'arbre de jeu
 * - Élagage Alpha-Beta pour optimiser la recherche
 * - Table de transposition pour éviter les recalculs
 * - Niveaux de difficulté très différenciés
 * - Recherche de quiescence pour les captures
 */

import { DraughtsEngine } from '../engine/DraughtsEngine';
import { MoveGenerator } from '../engine/MoveGenerator';
import { Board } from '../engine/Board';
import { Color, Move, PieceType, FMJD_RULES } from '../engine/types';
import { Evaluator } from './Evaluator';

/** Niveaux de difficulté */
export enum Difficulty {
  BEGINNER = 'beginner',
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

/** Configuration par niveau - optimisé pour le navigateur */
const DIFFICULTY_CONFIG: Record<Difficulty, {
  depth: number;
  quiescenceDepth: number; // Profondeur max de la recherche de quiescence
  randomness: number; // 0-100, pourcentage de chance de faire un coup sous-optimal
  evaluationNoise: number; // Bruit ajouté à l'évaluation
  considerTopMoves: number; // Nombre de meilleurs coups à considérer (pour ajouter de la variété)
  maxTimeMs: number; // Temps maximum de réflexion
}> = {
  [Difficulty.BEGINNER]: {
    depth: 1,
    quiescenceDepth: 0,
    randomness: 60, // 60% de chance de faire un mauvais coup
    evaluationNoise: 150,
    considerTopMoves: 5,
    maxTimeMs: 500,
  },
  [Difficulty.EASY]: {
    depth: 2,
    quiescenceDepth: 1,
    randomness: 35,
    evaluationNoise: 80,
    considerTopMoves: 4,
    maxTimeMs: 1000,
  },
  [Difficulty.MEDIUM]: {
    depth: 3,
    quiescenceDepth: 2,
    randomness: 15,
    evaluationNoise: 30,
    considerTopMoves: 3,
    maxTimeMs: 2000,
  },
  [Difficulty.HARD]: {
    depth: 4,
    quiescenceDepth: 2,
    randomness: 5,
    evaluationNoise: 10,
    considerTopMoves: 2,
    maxTimeMs: 3000,
  },
  [Difficulty.EXPERT]: {
    depth: 5,
    quiescenceDepth: 3,
    randomness: 0,
    evaluationNoise: 0,
    considerTopMoves: 1,
    maxTimeMs: 5000,
  },
};

/** Entrée de la table de transposition */
interface TranspositionEntry {
  depth: number;
  score: number;
  flag: 'exact' | 'lower' | 'upper';
  bestMove?: Move;
}

export interface AIResult {
  move: Move;
  score: number;
  nodesEvaluated: number;
  depth: number;
  timeMs: number;
}

export class MinimaxAI {
  private evaluator: Evaluator;
  private moveGenerator: MoveGenerator;
  private transpositionTable: Map<string, TranspositionEntry>;
  private nodesEvaluated: number;
  private maxTableSize: number;
  private searchStartTime: number;
  private maxSearchTime: number;
  private searchAborted: boolean;

  constructor(maxTableSize: number = 100000) {
    this.evaluator = new Evaluator();
    this.moveGenerator = new MoveGenerator(FMJD_RULES);
    this.transpositionTable = new Map();
    this.nodesEvaluated = 0;
    this.maxTableSize = maxTableSize;
    this.searchStartTime = 0;
    this.maxSearchTime = 5000;
    this.searchAborted = false;
  }

  /**
   * Trouve le meilleur coup pour le joueur actuel
   */
  getBestMove(engine: DraughtsEngine, difficulty: Difficulty = Difficulty.MEDIUM): AIResult | null {
    this.searchStartTime = Date.now();
    this.nodesEvaluated = 0;
    this.searchAborted = false;

    const config = DIFFICULTY_CONFIG[difficulty];
    this.maxSearchTime = config.maxTimeMs;

    const color = engine.getCurrentPlayer();
    const legalMoves = engine.getLegalMoves();

    if (legalMoves.length === 0) {
      return null;
    }

    // Un seul coup possible : le jouer immédiatement
    if (legalMoves.length === 1) {
      return {
        move: legalMoves[0],
        score: 0,
        nodesEvaluated: 1,
        depth: 0,
        timeMs: Date.now() - this.searchStartTime,
      };
    }

    // Pour le niveau débutant, ajouter beaucoup de hasard
    if (difficulty === Difficulty.BEGINNER && Math.random() * 100 < config.randomness) {
      const randomIndex = Math.floor(Math.random() * legalMoves.length);
      return {
        move: legalMoves[randomIndex],
        score: 0,
        nodesEvaluated: 1,
        depth: 0,
        timeMs: Date.now() - this.searchStartTime,
      };
    }

    // Évaluer tous les coups
    const moveScores: { move: Move; score: number }[] = [];
    const isMaximizing = color === Color.WHITE;

    for (const move of legalMoves) {
      // Vérifier le timeout
      if (this.isTimeUp()) {
        break;
      }

      const clonedEngine = engine.clone();
      clonedEngine.makeMove(move);

      let score = this.minimax(
        clonedEngine,
        config.depth - 1,
        -Infinity,
        Infinity,
        !isMaximizing,
        config.quiescenceDepth
      );

      // Ajouter du bruit à l'évaluation selon le niveau
      if (config.evaluationNoise > 0) {
        score += (Math.random() - 0.5) * 2 * config.evaluationNoise;
      }

      moveScores.push({ move, score });
    }

    // Si aucun coup évalué (timeout immédiat), retourner un coup aléatoire
    if (moveScores.length === 0) {
      const randomIndex = Math.floor(Math.random() * legalMoves.length);
      return {
        move: legalMoves[randomIndex],
        score: 0,
        nodesEvaluated: this.nodesEvaluated,
        depth: 0,
        timeMs: Date.now() - this.searchStartTime,
      };
    }

    // Trier les coups par score
    moveScores.sort((a, b) => {
      return isMaximizing ? b.score - a.score : a.score - b.score;
    });

    // Sélectionner parmi les meilleurs coups selon le niveau
    let selectedIndex = 0;
    if (config.considerTopMoves > 1 && moveScores.length > 1) {
      const topCount = Math.min(config.considerTopMoves, moveScores.length);

      // Pour les niveaux faciles, parfois choisir un coup sous-optimal
      if (Math.random() * 100 < config.randomness) {
        selectedIndex = Math.floor(Math.random() * topCount);
      }
    }

    const bestMove = moveScores[selectedIndex];

    return {
      move: bestMove.move,
      score: bestMove.score,
      nodesEvaluated: this.nodesEvaluated,
      depth: config.depth,
      timeMs: Date.now() - this.searchStartTime,
    };
  }

  /**
   * Vérifie si le temps de recherche est écoulé
   */
  private isTimeUp(): boolean {
    return Date.now() - this.searchStartTime > this.maxSearchTime;
  }

  /**
   * Algorithme Minimax avec élagage Alpha-Beta
   */
  private minimax(
    engine: DraughtsEngine,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    quiescenceDepth: number
  ): number {
    this.nodesEvaluated++;

    // Vérifier le timeout périodiquement
    if (this.nodesEvaluated % 1000 === 0 && this.isTimeUp()) {
      this.searchAborted = true;
      return 0;
    }

    if (this.searchAborted) {
      return 0;
    }

    const board = engine.getBoard();
    const boardHash = board.getHash() + (isMaximizing ? 'W' : 'B') + depth;

    // Vérifie la table de transposition
    const cached = this.transpositionTable.get(boardHash);
    if (cached && cached.depth >= depth) {
      if (cached.flag === 'exact') {
        return cached.score;
      } else if (cached.flag === 'lower') {
        alpha = Math.max(alpha, cached.score);
      } else if (cached.flag === 'upper') {
        beta = Math.min(beta, cached.score);
      }
      if (alpha >= beta) {
        return cached.score;
      }
    }

    // Condition d'arrêt : profondeur atteinte ou partie terminée
    if (depth === 0 || engine.isGameOver()) {
      // Recherche de quiescence pour éviter l'effet horizon
      if (quiescenceDepth > 0 && depth === 0) {
        return this.quiescenceSearch(engine, alpha, beta, isMaximizing, quiescenceDepth);
      }
      const score = this.evaluator.evaluate(board);
      this.storeTransposition(boardHash, depth, score, 'exact');
      return score;
    }

    const legalMoves = engine.getLegalMoves();

    // Plus de coups légaux = défaite pour le joueur actuel
    if (legalMoves.length === 0) {
      const currentColor = engine.getCurrentPlayer();
      const score = currentColor === Color.WHITE ? -15000 + (10 - depth) : 15000 - (10 - depth);
      return score;
    }

    // Trie les coups pour optimiser l'élagage
    const sortedMoves = this.orderMoves(legalMoves, board);

    if (isMaximizing) {
      let maxScore = -Infinity;

      for (const move of sortedMoves) {
        const clonedEngine = engine.clone();
        clonedEngine.makeMove(move);

        const score = this.minimax(clonedEngine, depth - 1, alpha, beta, false, quiescenceDepth);

        if (this.searchAborted) return 0;

        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);

        if (beta <= alpha) {
          break;
        }
      }

      const flag = maxScore <= alpha ? 'upper' : maxScore >= beta ? 'lower' : 'exact';
      this.storeTransposition(boardHash, depth, maxScore, flag);

      return maxScore;
    } else {
      let minScore = Infinity;

      for (const move of sortedMoves) {
        const clonedEngine = engine.clone();
        clonedEngine.makeMove(move);

        const score = this.minimax(clonedEngine, depth - 1, alpha, beta, true, quiescenceDepth);

        if (this.searchAborted) return 0;

        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);

        if (beta <= alpha) {
          break;
        }
      }

      const flag = minScore <= alpha ? 'upper' : minScore >= beta ? 'lower' : 'exact';
      this.storeTransposition(boardHash, depth, minScore, flag);

      return minScore;
    }
  }

  /**
   * Recherche de quiescence - continue la recherche tant qu'il y a des captures
   */
  private quiescenceSearch(
    engine: DraughtsEngine,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    maxDepth: number
  ): number {
    this.nodesEvaluated++;

    // Vérifier le timeout
    if (this.searchAborted) {
      return 0;
    }

    const board = engine.getBoard();
    const standPat = this.evaluator.evaluate(board);

    if (maxDepth === 0) {
      return standPat;
    }

    if (isMaximizing) {
      if (standPat >= beta) return beta;
      if (standPat > alpha) alpha = standPat;
    } else {
      if (standPat <= alpha) return alpha;
      if (standPat < beta) beta = standPat;
    }

    const legalMoves = engine.getLegalMoves();

    // Filtrer seulement les captures
    const captures = legalMoves.filter(m => m.captures.length > 0);

    if (captures.length === 0) {
      return standPat;
    }

    // Limiter le nombre de captures à analyser pour éviter les timeouts
    const maxCapturesToAnalyze = 3;
    const sortedCaptures = captures
      .sort((a, b) => b.captures.length - a.captures.length)
      .slice(0, maxCapturesToAnalyze);

    if (isMaximizing) {
      let maxScore = standPat;

      for (const move of sortedCaptures) {
        if (this.searchAborted) return maxScore;

        const clonedEngine = engine.clone();
        clonedEngine.makeMove(move);

        const score = this.quiescenceSearch(clonedEngine, alpha, beta, false, maxDepth - 1);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);

        if (beta <= alpha) break;
      }

      return maxScore;
    } else {
      let minScore = standPat;

      for (const move of sortedCaptures) {
        if (this.searchAborted) return minScore;

        const clonedEngine = engine.clone();
        clonedEngine.makeMove(move);

        const score = this.quiescenceSearch(clonedEngine, alpha, beta, true, maxDepth - 1);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);

        if (beta <= alpha) break;
      }

      return minScore;
    }
  }

  /**
   * Ordonne les coups pour optimiser l'élagage Alpha-Beta
   */
  private orderMoves(moves: Move[], board: Board): Move[] {
    return moves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Priorité maximale aux captures multiples
      scoreA += a.captures.length * 1000;
      scoreB += b.captures.length * 1000;

      // Bonus pour les promotions
      if (a.isPromotion) scoreA += 500;
      if (b.isPromotion) scoreB += 500;

      // Bonus pour capturer des dames
      for (const cap of a.captures) {
        const piece = board.getPiece(cap);
        if (piece && piece.type === PieceType.KING) {
          scoreA += 300;
        }
      }
      for (const cap of b.captures) {
        const piece = board.getPiece(cap);
        if (piece && piece.type === PieceType.KING) {
          scoreB += 300;
        }
      }

      // Bonus pour aller vers le centre
      const centerBonus = (pos: { row: number; col: number }) => {
        const centerDist = Math.abs(pos.row - 4.5) + Math.abs(pos.col - 4.5);
        return Math.max(0, 10 - centerDist * 2);
      };

      scoreA += centerBonus(a.to);
      scoreB += centerBonus(b.to);

      return scoreB - scoreA;
    });
  }

  /**
   * Stocke une entrée dans la table de transposition
   */
  private storeTransposition(
    hash: string,
    depth: number,
    score: number,
    flag: 'exact' | 'lower' | 'upper'
  ): void {
    if (this.transpositionTable.size >= this.maxTableSize) {
      const keysToDelete = Array.from(this.transpositionTable.keys())
        .slice(0, Math.floor(this.maxTableSize * 0.2));
      for (const key of keysToDelete) {
        this.transpositionTable.delete(key);
      }
    }

    this.transpositionTable.set(hash, { depth, score, flag });
  }

  /**
   * Vide la table de transposition
   */
  clearTranspositionTable(): void {
    this.transpositionTable.clear();
  }

  /**
   * Retourne les statistiques de la table de transposition
   */
  getTableStats(): { size: number; maxSize: number } {
    return {
      size: this.transpositionTable.size,
      maxSize: this.maxTableSize,
    };
  }
}

/**
 * DraughtsEngine - Moteur de jeu de dames internationales 10x10
 *
 * Gère :
 * - L'état complet d'une partie
 * - L'exécution et la validation des coups
 * - La détection de fin de partie
 * - L'historique des coups
 */

import { Board } from './Board';
import { MoveGenerator } from './MoveGenerator';
import {
  Color,
  PieceType,
  Move,
  GameState,
  GameResult,
  GameEndReason,
  Position,
  RuleConfig,
  FMJD_RULES,
} from './types';
import { positionToManoury, moveToNotation } from './notation';

export interface GameInfo {
  result: GameResult;
  reason: GameEndReason;
  winner: Color | null;
  moveCount: number;
  currentPlayer: Color;
}

export interface MoveResult {
  success: boolean;
  error?: string;
  move?: Move;
  captured?: Position[];
  isPromotion?: boolean;
  gameOver?: boolean;
  gameInfo?: GameInfo;
}

export class DraughtsEngine {
  private board: Board;
  private moveGenerator: MoveGenerator;
  private currentPlayer: Color;
  private moveHistory: Move[];
  private positionHistory: string[];
  private halfMoveClock: number; // Coups sans capture ni mouvement de pion
  private rules: RuleConfig;
  private gameResult: GameResult;
  private gameEndReason: GameEndReason;

  constructor(rules: RuleConfig = FMJD_RULES) {
    this.rules = rules;
    this.board = new Board(rules.boardSize);
    this.moveGenerator = new MoveGenerator(rules);
    this.currentPlayer = Color.WHITE; // Blancs commencent
    this.moveHistory = [];
    this.positionHistory = [];
    this.halfMoveClock = 0;
    this.gameResult = GameResult.ONGOING;
    this.gameEndReason = GameEndReason.NONE;
  }

  /**
   * Initialise une nouvelle partie
   */
  newGame(): void {
    this.board = new Board(this.rules.boardSize);
    this.board.setupInitialPosition();
    this.currentPlayer = Color.WHITE;
    this.moveHistory = [];
    this.positionHistory = [this.board.getHash()];
    this.halfMoveClock = 0;
    this.gameResult = GameResult.ONGOING;
    this.gameEndReason = GameEndReason.NONE;
  }

  /**
   * Récupère tous les coups légaux pour le joueur actuel
   */
  getLegalMoves(): Move[] {
    if (this.gameResult !== GameResult.ONGOING) {
      return [];
    }
    return this.moveGenerator.generateAllMoves(this.board, this.currentPlayer);
  }

  /**
   * Exécute un coup
   */
  makeMove(move: Move): MoveResult {
    // Vérifie que la partie est en cours
    if (this.gameResult !== GameResult.ONGOING) {
      return {
        success: false,
        error: 'La partie est terminée',
      };
    }

    // Vérifie que le coup est légal
    const legalMoves = this.getLegalMoves();
    const matchingMove = legalMoves.find(m =>
      m.from.row === move.from.row &&
      m.from.col === move.from.col &&
      m.to.row === move.to.row &&
      m.to.col === move.to.col
    );

    if (!matchingMove) {
      return {
        success: false,
        error: 'Coup illégal',
      };
    }

    // Utilise le coup complet (avec toutes les captures détectées)
    const fullMove = matchingMove;

    // Récupère la pièce à déplacer
    const piece = this.board.getPiece(fullMove.from);
    if (!piece) {
      return {
        success: false,
        error: 'Aucune pièce à cette position',
      };
    }

    // Exécute le déplacement
    this.board.movePiece(fullMove.from, fullMove.to);

    // Supprime les pièces capturées
    for (const captured of fullMove.captures) {
      this.board.removePiece(captured);
    }

    // Gère la promotion
    let promoted = false;
    if (fullMove.isPromotion && piece.type === PieceType.PAWN) {
      this.board.promotePiece(fullMove.to);
      promoted = true;
    }

    // Met à jour le compteur de demi-coups
    if (fullMove.captures.length > 0 || piece.type === PieceType.PAWN) {
      this.halfMoveClock = 0;
    } else {
      this.halfMoveClock++;
    }

    // Enregistre le coup dans l'historique
    this.moveHistory.push(fullMove);

    // Enregistre la position pour la détection des répétitions
    this.positionHistory.push(this.board.getHash());

    // Change de joueur
    this.currentPlayer = this.currentPlayer === Color.WHITE ? Color.BLACK : Color.WHITE;

    // Vérifie la fin de partie
    this.checkGameEnd();

    return {
      success: true,
      move: fullMove,
      captured: fullMove.captures,
      isPromotion: promoted,
      gameOver: this.gameResult !== GameResult.ONGOING,
      gameInfo: this.getGameInfo(),
    };
  }

  /**
   * Exécute un coup à partir des positions (from, to)
   */
  makeMoveFromPositions(from: Position, to: Position): MoveResult {
    const move: Move = {
      from,
      to,
      captures: [],
      path: [from, to],
      isPromotion: false,
    };
    return this.makeMove(move);
  }

  /**
   * Exécute un coup en notation Manoury (ex: "32-28" ou "32x23")
   */
  makeMoveFromNotation(notation: string): MoveResult {
    const match = notation.match(/^(\d+)[-x](\d+)$/);
    if (!match) {
      return {
        success: false,
        error: 'Notation invalide',
      };
    }

    const fromSquare = parseInt(match[1], 10);
    const toSquare = parseInt(match[2], 10);

    // Trouve le coup correspondant parmi les coups légaux
    const legalMoves = this.getLegalMoves();
    const matchingMove = legalMoves.find(m => {
      const fromManoury = positionToManoury(m.from);
      const toManoury = positionToManoury(m.to);
      return fromManoury === fromSquare && toManoury === toSquare;
    });

    if (!matchingMove) {
      return {
        success: false,
        error: `Coup ${notation} illégal`,
      };
    }

    return this.makeMove(matchingMove);
  }

  /**
   * Vérifie les conditions de fin de partie
   */
  private checkGameEnd(): void {
    const opponentMoves = this.moveGenerator.generateAllMoves(this.board, this.currentPlayer);

    // Plus de coups légaux = défaite
    if (opponentMoves.length === 0) {
      const opponentPieces = this.board.countPieces(this.currentPlayer);

      if (opponentPieces.total === 0) {
        // Plus de pièces
        this.gameEndReason = GameEndReason.NO_PIECES;
      } else {
        // Bloqué (plus de coups possibles)
        this.gameEndReason = GameEndReason.NO_MOVES;
      }

      this.gameResult = this.currentPlayer === Color.WHITE
        ? GameResult.BLACK_WINS
        : GameResult.WHITE_WINS;
      return;
    }

    // Règle des 25 coups sans capture (50 demi-coups)
    if (this.halfMoveClock >= 50) {
      this.gameResult = GameResult.DRAW;
      this.gameEndReason = GameEndReason.FIFTY_MOVE_RULE;
      return;
    }

    // Règle des 3 répétitions
    const currentHash = this.board.getHash();
    const repetitions = this.positionHistory.filter(h => h === currentHash).length;
    if (repetitions >= 3) {
      this.gameResult = GameResult.DRAW;
      this.gameEndReason = GameEndReason.THREEFOLD_REPETITION;
      return;
    }
  }

  /**
   * Permet à un joueur d'abandonner
   */
  resign(color: Color): void {
    if (this.gameResult !== GameResult.ONGOING) {
      return;
    }
    this.gameResult = color === Color.WHITE ? GameResult.BLACK_WINS : GameResult.WHITE_WINS;
    this.gameEndReason = GameEndReason.RESIGNATION;
  }

  /**
   * Propose une nulle (les deux joueurs doivent accepter)
   */
  declareDraw(): void {
    if (this.gameResult !== GameResult.ONGOING) {
      return;
    }
    this.gameResult = GameResult.DRAW;
    this.gameEndReason = GameEndReason.AGREEMENT;
  }

  /**
   * Récupère les informations de la partie
   */
  getGameInfo(): GameInfo {
    let winner: Color | null = null;
    if (this.gameResult === GameResult.WHITE_WINS) {
      winner = Color.WHITE;
    } else if (this.gameResult === GameResult.BLACK_WINS) {
      winner = Color.BLACK;
    }

    return {
      result: this.gameResult,
      reason: this.gameEndReason,
      winner,
      moveCount: this.moveHistory.length,
      currentPlayer: this.currentPlayer,
    };
  }

  /**
   * Récupère l'état complet du jeu
   */
  getGameState(): GameState {
    return {
      board: this.board.getSquares(),
      currentPlayer: this.currentPlayer,
      moveHistory: [...this.moveHistory],
      halfMoveClock: this.halfMoveClock,
      positionHistory: [...this.positionHistory],
    };
  }

  /**
   * Récupère le plateau
   */
  getBoard(): Board {
    return this.board;
  }

  /**
   * Récupère le joueur actuel
   */
  getCurrentPlayer(): Color {
    return this.currentPlayer;
  }

  /**
   * Vérifie si la partie est terminée
   */
  isGameOver(): boolean {
    return this.gameResult !== GameResult.ONGOING;
  }

  /**
   * Récupère l'historique des coups en notation Manoury
   */
  getMoveHistory(): string[] {
    return this.moveHistory.map(m => {
      const from = positionToManoury(m.from);
      const to = positionToManoury(m.to);
      const separator = m.captures.length > 0 ? 'x' : '-';
      return `${from}${separator}${to}`;
    });
  }

  /**
   * Récupère l'historique complet formaté
   */
  getFormattedHistory(): string {
    const moves = this.getMoveHistory();
    let result = '';
    for (let i = 0; i < moves.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moves[i];
      const blackMove = moves[i + 1] || '';
      result += `${moveNumber}. ${whiteMove} ${blackMove}\n`;
    }
    return result.trim();
  }

  /**
   * Affichage du plateau
   */
  toString(): string {
    let result = this.board.toString();
    result += `\nTrait aux ${this.currentPlayer === Color.WHITE ? 'Blancs' : 'Noirs'}`;
    result += ` | Coup #${this.moveHistory.length + 1}`;

    const whitePieces = this.board.countPieces(Color.WHITE);
    const blackPieces = this.board.countPieces(Color.BLACK);
    result += `\nBlancs: ${whitePieces.pawns}p + ${whitePieces.kings}d = ${whitePieces.total}`;
    result += ` | Noirs: ${blackPieces.pawns}p + ${blackPieces.kings}d = ${blackPieces.total}`;

    if (this.gameResult !== GameResult.ONGOING) {
      result += `\n\n*** PARTIE TERMINÉE ***`;
      result += `\nRésultat: ${this.gameResult}`;
      result += `\nRaison: ${this.gameEndReason}`;
    }

    return result;
  }

  /**
   * Clone le moteur (pour les simulations IA)
   */
  clone(): DraughtsEngine {
    const clone = new DraughtsEngine(this.rules);
    clone.board = this.board.clone();
    clone.currentPlayer = this.currentPlayer;
    clone.moveHistory = [...this.moveHistory];
    clone.positionHistory = [...this.positionHistory];
    clone.halfMoveClock = this.halfMoveClock;
    clone.gameResult = this.gameResult;
    clone.gameEndReason = this.gameEndReason;
    return clone;
  }

  /**
   * Exporte l'état actuel en notation FEN simplifiée
   * Format: [pièces]-[joueur]-[demi-coups]
   * Pièces: w=pion blanc, W=dame blanche, b=pion noir, B=dame noire, .=vide
   */
  toFEN(): string {
    let pieces = '';

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        // Seulement les cases jouables
        if ((row + col) % 2 === 1) {
          const piece = this.board.getPiece({ row, col });
          if (!piece) {
            pieces += '.';
          } else if (piece.color === Color.WHITE) {
            pieces += piece.type === PieceType.KING ? 'W' : 'w';
          } else {
            pieces += piece.type === PieceType.KING ? 'B' : 'b';
          }
        }
      }
    }

    const player = this.currentPlayer === Color.WHITE ? 'W' : 'B';
    return `${pieces}-${player}-${this.halfMoveClock}`;
  }

  /**
   * Charge un état depuis une notation FEN simplifiée
   */
  loadFEN(fen: string): boolean {
    try {
      const parts = fen.split('-');
      if (parts.length < 2) return false;

      const pieces = parts[0];
      const player = parts[1];
      const halfMoves = parts[2] ? parseInt(parts[2]) : 0;

      // Réinitialiser le plateau
      this.board = new Board(this.rules.boardSize);

      // Placer les pièces
      let pieceIndex = 0;
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          if ((row + col) % 2 === 1) {
            if (pieceIndex < pieces.length) {
              const char = pieces[pieceIndex];
              const pos = { row, col };

              switch (char) {
                case 'w':
                  this.board.setPiece(pos, { color: Color.WHITE, type: PieceType.PAWN });
                  break;
                case 'W':
                  this.board.setPiece(pos, { color: Color.WHITE, type: PieceType.KING });
                  break;
                case 'b':
                  this.board.setPiece(pos, { color: Color.BLACK, type: PieceType.PAWN });
                  break;
                case 'B':
                  this.board.setPiece(pos, { color: Color.BLACK, type: PieceType.KING });
                  break;
                // '.' = case vide, on ne fait rien
              }
              pieceIndex++;
            }
          }
        }
      }

      // Définir le joueur actuel
      this.currentPlayer = player === 'W' ? Color.WHITE : Color.BLACK;
      this.halfMoveClock = halfMoves;

      // Réinitialiser le résultat (la partie peut continuer)
      this.gameResult = GameResult.ONGOING;
      this.gameEndReason = GameEndReason.NONE;

      return true;
    } catch (e) {
      console.error('Erreur lors du chargement FEN:', e);
      return false;
    }
  }
}

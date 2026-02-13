/**
 * Evaluator - Fonction d'évaluation des positions
 *
 * Évalue la qualité d'une position pour un joueur.
 * Score positif = avantage Blancs
 * Score négatif = avantage Noirs
 */

import { Board } from '../engine/Board';
import { MoveGenerator } from '../engine/MoveGenerator';
import { Color, PieceType, Position, FMJD_RULES } from '../engine/types';

/** Poids des différents facteurs d'évaluation */
const WEIGHTS = {
  // Matériel
  PAWN_VALUE: 100,
  KING_VALUE: 350,

  // Position
  CENTER_BONUS: 8,
  ADVANCE_BONUS: 4,
  BACK_ROW_BONUS: 12,
  EDGE_PENALTY: -3,

  // Sécurité
  PROTECTED_PIECE_BONUS: 6,
  THREATENED_PIECE_PENALTY: -15,

  // Structure
  CONNECTED_PIECES_BONUS: 5,
  ISOLATED_PIECE_PENALTY: -8,
  FORMATION_BONUS: 10,

  // Mobilité
  MOBILITY_BONUS: 3,
  KING_MOBILITY_BONUS: 2,

  // Contrôle
  DIAGONAL_CONTROL_BONUS: 4,
  TEMPO_BONUS: 5,

  // Fin de partie
  KING_VS_PAWN_BONUS: 20,
  OPPOSITION_BONUS: 15,
};

/** Cases centrales du plateau (plus stratégiques) */
const CENTER_SQUARES: Position[] = [
  { row: 3, col: 3 }, { row: 3, col: 5 }, { row: 3, col: 7 },
  { row: 4, col: 2 }, { row: 4, col: 4 }, { row: 4, col: 6 },
  { row: 5, col: 3 }, { row: 5, col: 5 }, { row: 5, col: 7 },
  { row: 6, col: 2 }, { row: 6, col: 4 }, { row: 6, col: 6 },
];

/** Diagonales principales (contrôle stratégique) */
const MAIN_DIAGONALS: Position[][] = [
  // Grande diagonale
  [{ row: 0, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 3 }, { row: 3, col: 4 }, { row: 4, col: 5 }, { row: 5, col: 6 }, { row: 6, col: 7 }, { row: 7, col: 8 }, { row: 8, col: 9 }],
  [{ row: 1, col: 0 }, { row: 2, col: 1 }, { row: 3, col: 2 }, { row: 4, col: 3 }, { row: 5, col: 4 }, { row: 6, col: 5 }, { row: 7, col: 6 }, { row: 8, col: 7 }, { row: 9, col: 8 }],
];

export class Evaluator {
  private moveGenerator: MoveGenerator;

  constructor() {
    this.moveGenerator = new MoveGenerator(FMJD_RULES);
  }

  /**
   * Évalue une position
   * @returns Score positif = avantage Blancs, négatif = avantage Noirs
   */
  evaluate(board: Board): number {
    // Vérifie d'abord les positions terminales
    const terminal = this.evaluateTerminalPosition(board);
    if (terminal !== null) {
      return terminal;
    }

    let score = 0;

    // Matériel (le plus important)
    score += this.evaluateMaterial(board) * 1.0;

    // Position des pièces
    score += this.evaluatePosition(board) * 0.8;

    // Sécurité des pièces
    score += this.evaluateSafety(board) * 0.7;

    // Structure et formation
    score += this.evaluateStructure(board) * 0.6;

    // Mobilité
    score += this.evaluateMobility(board) * 0.5;

    // Contrôle du plateau
    score += this.evaluateControl(board) * 0.4;

    // Facteurs de fin de partie
    score += this.evaluateEndgame(board) * 0.6;

    return Math.round(score);
  }

  /**
   * Évalue les positions terminales
   */
  private evaluateTerminalPosition(board: Board): number | null {
    const white = board.countPieces(Color.WHITE);
    const black = board.countPieces(Color.BLACK);

    if (white.total === 0) return -15000;
    if (black.total === 0) return 15000;

    return null;
  }

  /**
   * Évalue le matériel (nombre et type de pièces)
   */
  private evaluateMaterial(board: Board): number {
    const white = board.countPieces(Color.WHITE);
    const black = board.countPieces(Color.BLACK);

    const whiteMaterial = white.pawns * WEIGHTS.PAWN_VALUE + white.kings * WEIGHTS.KING_VALUE;
    const blackMaterial = black.pawns * WEIGHTS.PAWN_VALUE + black.kings * WEIGHTS.KING_VALUE;

    return whiteMaterial - blackMaterial;
  }

  /**
   * Évalue la position des pièces sur le plateau
   */
  private evaluatePosition(board: Board): number {
    let score = 0;

    const whitePieces = board.getPiecesByColor(Color.WHITE);
    const blackPieces = board.getPiecesByColor(Color.BLACK);

    for (const { pos, piece } of whitePieces) {
      score += this.evaluatePiecePosition(pos, piece.type, Color.WHITE);
    }

    for (const { pos, piece } of blackPieces) {
      score -= this.evaluatePiecePosition(pos, piece.type, Color.BLACK);
    }

    return score;
  }

  /**
   * Évalue la position d'une pièce individuelle
   */
  private evaluatePiecePosition(pos: Position, type: PieceType, color: Color): number {
    let bonus = 0;

    // Bonus pour le contrôle du centre
    if (this.isCenter(pos)) {
      bonus += WEIGHTS.CENTER_BONUS;
    }

    // Pénalité pour les bords (moins de mobilité)
    if (pos.col === 0 || pos.col === 9) {
      bonus += WEIGHTS.EDGE_PENALTY;
    }

    if (type === PieceType.PAWN) {
      // Bonus d'avancement progressif pour les pions
      if (color === Color.WHITE) {
        // Les blancs avancent vers le haut (row diminue)
        const advancement = 9 - pos.row;
        // Bonus exponentiel pour les pions proches de la promotion
        bonus += advancement * WEIGHTS.ADVANCE_BONUS;
        if (advancement >= 7) bonus += 15; // Proche de la promotion
        if (advancement >= 8) bonus += 25; // Très proche
      } else {
        const advancement = pos.row;
        bonus += advancement * WEIGHTS.ADVANCE_BONUS;
        if (advancement >= 7) bonus += 15;
        if (advancement >= 8) bonus += 25;
      }

      // Bonus pour les pions sur la rangée arrière (protection)
      if (color === Color.WHITE && pos.row === 9) {
        bonus += WEIGHTS.BACK_ROW_BONUS;
      } else if (color === Color.BLACK && pos.row === 0) {
        bonus += WEIGHTS.BACK_ROW_BONUS;
      }
    } else {
      // Dame : bonus pour position centrale forte
      if (this.isCenter(pos)) {
        bonus += WEIGHTS.CENTER_BONUS * 1.5;
      }
    }

    return bonus;
  }

  /**
   * Évalue la sécurité des pièces (protégées vs menacées)
   */
  private evaluateSafety(board: Board): number {
    let score = 0;

    const whitePieces = board.getPiecesByColor(Color.WHITE);
    const blackPieces = board.getPiecesByColor(Color.BLACK);

    // Évalue la sécurité des pièces blanches
    for (const { pos } of whitePieces) {
      if (this.isPieceProtected(board, pos, Color.WHITE)) {
        score += WEIGHTS.PROTECTED_PIECE_BONUS;
      }
      if (this.isPieceThreatened(board, pos, Color.WHITE)) {
        score += WEIGHTS.THREATENED_PIECE_PENALTY;
      }
    }

    // Évalue la sécurité des pièces noires
    for (const { pos } of blackPieces) {
      if (this.isPieceProtected(board, pos, Color.BLACK)) {
        score -= WEIGHTS.PROTECTED_PIECE_BONUS;
      }
      if (this.isPieceThreatened(board, pos, Color.BLACK)) {
        score -= WEIGHTS.THREATENED_PIECE_PENALTY;
      }
    }

    return score;
  }

  /**
   * Vérifie si une pièce est protégée par une autre de même couleur
   */
  private isPieceProtected(board: Board, pos: Position, color: Color): boolean {
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const behindDir = color === Color.WHITE ? 1 : -1;

    for (const [dr, dc] of directions) {
      // Vérifie derrière (protection)
      if (dr === behindDir) {
        const protectorRow = pos.row + dr;
        const protectorCol = pos.col + dc;
        if (protectorRow >= 0 && protectorRow < 10 && protectorCol >= 0 && protectorCol < 10) {
          const protector = board.getPiece({ row: protectorRow, col: protectorCol });
          if (protector && protector.color === color) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Vérifie si une pièce peut être capturée
   */
  private isPieceThreatened(board: Board, pos: Position, color: Color): boolean {
    const opponentColor = color === Color.WHITE ? Color.BLACK : Color.WHITE;
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    for (const [dr, dc] of directions) {
      const attackerRow = pos.row + dr;
      const attackerCol = pos.col + dc;
      const landingRow = pos.row - dr;
      const landingCol = pos.col - dc;

      if (attackerRow >= 0 && attackerRow < 10 && attackerCol >= 0 && attackerCol < 10 &&
          landingRow >= 0 && landingRow < 10 && landingCol >= 0 && landingCol < 10) {
        const attacker = board.getPiece({ row: attackerRow, col: attackerCol });
        const landing = board.getPiece({ row: landingRow, col: landingCol });

        if (attacker && attacker.color === opponentColor && !landing) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Évalue la structure des pièces (connexion, formation)
   */
  private evaluateStructure(board: Board): number {
    let score = 0;

    const whitePieces = board.getPiecesByColor(Color.WHITE);
    const blackPieces = board.getPiecesByColor(Color.BLACK);

    // Évalue les connexions blanches
    for (const { pos } of whitePieces) {
      const connections = this.countConnections(board, pos, Color.WHITE);
      if (connections > 0) {
        score += connections * WEIGHTS.CONNECTED_PIECES_BONUS;
      } else {
        score += WEIGHTS.ISOLATED_PIECE_PENALTY;
      }
    }

    // Évalue les connexions noires
    for (const { pos } of blackPieces) {
      const connections = this.countConnections(board, pos, Color.BLACK);
      if (connections > 0) {
        score -= connections * WEIGHTS.CONNECTED_PIECES_BONUS;
      } else {
        score -= WEIGHTS.ISOLATED_PIECE_PENALTY;
      }
    }

    // Bonus pour formation en triangle/losange
    score += this.evaluateFormations(board, Color.WHITE);
    score -= this.evaluateFormations(board, Color.BLACK);

    return score;
  }

  /**
   * Compte les pièces connectées (adjacentes en diagonale)
   */
  private countConnections(board: Board, pos: Position, color: Color): number {
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    let connections = 0;

    for (const [dr, dc] of directions) {
      const newRow = pos.row + dr;
      const newCol = pos.col + dc;
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
        const piece = board.getPiece({ row: newRow, col: newCol });
        if (piece && piece.color === color) {
          connections++;
        }
      }
    }

    return connections;
  }

  /**
   * Évalue les formations stratégiques (triangles, etc.)
   */
  private evaluateFormations(board: Board, color: Color): number {
    let bonus = 0;
    const pieces = board.getPiecesByColor(color);

    // Cherche des formations en triangle
    for (const { pos } of pieces) {
      // Triangle vers le bas (pour blancs) ou vers le haut (pour noirs)
      const dir = color === Color.WHITE ? 1 : -1;

      const left = board.getPiece({ row: pos.row + dir, col: pos.col - 1 });
      const right = board.getPiece({ row: pos.row + dir, col: pos.col + 1 });

      if (left && left.color === color && right && right.color === color) {
        bonus += WEIGHTS.FORMATION_BONUS;
      }
    }

    return bonus;
  }

  /**
   * Évalue la mobilité (nombre de coups disponibles)
   */
  private evaluateMobility(board: Board): number {
    let score = 0;

    // Compte les coups pour les blancs
    const whiteMoves = this.moveGenerator.generateAllMoves(board, Color.WHITE);
    score += whiteMoves.length * WEIGHTS.MOBILITY_BONUS;

    // Compte les coups pour les noirs
    const blackMoves = this.moveGenerator.generateAllMoves(board, Color.BLACK);
    score -= blackMoves.length * WEIGHTS.MOBILITY_BONUS;

    // Bonus supplémentaire pour les captures disponibles
    const whiteCaptures = whiteMoves.filter(m => m.captures.length > 0);
    const blackCaptures = blackMoves.filter(m => m.captures.length > 0);

    score += whiteCaptures.length * WEIGHTS.TEMPO_BONUS;
    score -= blackCaptures.length * WEIGHTS.TEMPO_BONUS;

    return score;
  }

  /**
   * Évalue le contrôle du plateau
   */
  private evaluateControl(board: Board): number {
    let score = 0;

    // Contrôle des diagonales principales
    for (const diagonal of MAIN_DIAGONALS) {
      let whiteControl = 0;
      let blackControl = 0;

      for (const pos of diagonal) {
        const piece = board.getPiece(pos);
        if (piece) {
          if (piece.color === Color.WHITE) whiteControl++;
          else blackControl++;
        }
      }

      score += (whiteControl - blackControl) * WEIGHTS.DIAGONAL_CONTROL_BONUS;
    }

    return score;
  }

  /**
   * Évalue les facteurs de fin de partie
   */
  private evaluateEndgame(board: Board): number {
    const white = board.countPieces(Color.WHITE);
    const black = board.countPieces(Color.BLACK);

    // Si peu de pièces, les dames deviennent plus importantes
    if (white.total + black.total <= 8) {
      let score = 0;

      // Avantage de dame vs pion en fin de partie
      if (white.kings > black.kings) {
        score += (white.kings - black.kings) * WEIGHTS.KING_VS_PAWN_BONUS;
      } else if (black.kings > white.kings) {
        score -= (black.kings - white.kings) * WEIGHTS.KING_VS_PAWN_BONUS;
      }

      // Centralisation des dames en fin de partie
      const whitePieces = board.getPiecesByColor(Color.WHITE);
      const blackPieces = board.getPiecesByColor(Color.BLACK);

      for (const { pos, piece } of whitePieces) {
        if (piece.type === PieceType.KING && this.isCenter(pos)) {
          score += WEIGHTS.CENTER_BONUS * 2;
        }
      }

      for (const { pos, piece } of blackPieces) {
        if (piece.type === PieceType.KING && this.isCenter(pos)) {
          score -= WEIGHTS.CENTER_BONUS * 2;
        }
      }

      return score;
    }

    return 0;
  }

  /**
   * Vérifie si une position est au centre du plateau
   */
  private isCenter(pos: Position): boolean {
    return CENTER_SQUARES.some(c => c.row === pos.row && c.col === pos.col);
  }

  /**
   * Évalue si la position est terminale (victoire/défaite)
   */
  evaluateTerminal(board: Board, color: Color, hasLegalMoves: boolean): number | null {
    const myPieces = board.countPieces(color);
    const opponentColor = color === Color.WHITE ? Color.BLACK : Color.WHITE;
    const opponentPieces = board.countPieces(opponentColor);

    if (opponentPieces.total === 0) {
      return color === Color.WHITE ? 15000 : -15000;
    }

    if (myPieces.total === 0) {
      return color === Color.WHITE ? -15000 : 15000;
    }

    if (!hasLegalMoves) {
      return color === Color.WHITE ? -15000 : 15000;
    }

    return null;
  }
}

/**
 * MoveGenerator - Génération des coups légaux
 *
 * Gère :
 * - Déplacements simples des pions (diagonale avant, 1 case)
 * - Déplacements des dames volantes (toute la diagonale)
 * - Captures simples et rafles multiples
 * - Règle de prise majoritaire (FMJD)
 */

import { Board } from './Board';
import {
  Position,
  Move,
  Color,
  PieceType,
  Piece,
  RuleConfig,
  FMJD_RULES,
} from './types';
import { isValidPosition, isPlayableSquare } from './notation';

/** Directions diagonales : [deltaRow, deltaCol] */
const DIAGONAL_DIRECTIONS: [number, number][] = [
  [-1, -1], // Haut-gauche
  [-1, +1], // Haut-droite
  [+1, -1], // Bas-gauche
  [+1, +1], // Bas-droite
];

export class MoveGenerator {
  private rules: RuleConfig;

  constructor(rules: RuleConfig = FMJD_RULES) {
    this.rules = rules;
  }

  /**
   * Génère tous les coups légaux pour un joueur
   * Applique la règle de prise obligatoire et majoritaire
   */
  generateAllMoves(board: Board, color: Color): Move[] {
    const pieces = board.getPiecesByColor(color);
    let allMoves: Move[] = [];

    // D'abord, cherche toutes les captures possibles
    let allCaptures: Move[] = [];
    for (const { pos, piece } of pieces) {
      const captures = this.generateCaptures(board, pos, piece);
      allCaptures = allCaptures.concat(captures);
    }

    // Si des captures existent, on DOIT capturer (prise obligatoire)
    if (allCaptures.length > 0 && this.rules.mandatoryCapture) {
      // Règle de prise majoritaire : garder seulement les captures avec le max de prises
      if (this.rules.majorityCapture) {
        const maxCaptures = Math.max(...allCaptures.map(m => m.captures.length));
        return allCaptures.filter(m => m.captures.length === maxCaptures);
      }
      return allCaptures;
    }

    // Sinon, génère les déplacements simples
    for (const { pos, piece } of pieces) {
      const simpleMoves = this.generateSimpleMoves(board, pos, piece);
      allMoves = allMoves.concat(simpleMoves);
    }

    return allMoves;
  }

  /**
   * Génère les déplacements simples (sans capture) pour une pièce
   */
  generateSimpleMoves(board: Board, pos: Position, piece: Piece): Move[] {
    if (piece.type === PieceType.PAWN) {
      return this.generatePawnMoves(board, pos, piece.color);
    } else {
      return this.generateKingMoves(board, pos, piece.color);
    }
  }

  /**
   * Déplacements simples d'un pion
   * - Diagonale avant uniquement
   * - Une seule case
   */
  private generatePawnMoves(board: Board, pos: Position, color: Color): Move[] {
    const moves: Move[] = [];
    const forwardDir = color === Color.WHITE ? -1 : +1; // Blancs montent, Noirs descendent

    // Deux directions diagonales avant
    const directions: [number, number][] = [
      [forwardDir, -1],
      [forwardDir, +1],
    ];

    for (const [dr, dc] of directions) {
      const newRow = pos.row + dr;
      const newCol = pos.col + dc;

      if (
        isValidPosition(newRow, newCol, this.rules.boardSize) &&
        isPlayableSquare(newRow, newCol) &&
        board.isEmpty({ row: newRow, col: newCol })
      ) {
        const to = { row: newRow, col: newCol };
        moves.push({
          from: pos,
          to,
          captures: [],
          path: [pos, to],
          isPromotion: board.isPromotionRow(to, color),
        });
      }
    }

    return moves;
  }

  /**
   * Déplacements simples d'une dame (dame volante)
   * - Toutes les diagonales
   * - Toute distance jusqu'à une pièce ou le bord
   */
  private generateKingMoves(board: Board, pos: Position, color: Color): Move[] {
    const moves: Move[] = [];

    for (const [dr, dc] of DIAGONAL_DIRECTIONS) {
      let distance = 1;

      while (true) {
        const newRow = pos.row + dr * distance;
        const newCol = pos.col + dc * distance;

        if (!isValidPosition(newRow, newCol, this.rules.boardSize)) {
          break; // Hors du plateau
        }

        const targetPos = { row: newRow, col: newCol };

        if (!board.isEmpty(targetPos)) {
          break; // Case occupée, on s'arrête
        }

        moves.push({
          from: pos,
          to: targetPos,
          captures: [],
          path: [pos, targetPos],
          isPromotion: false, // Une dame est déjà promue
        });

        distance++;
      }
    }

    return moves;
  }

  /**
   * Génère toutes les captures possibles pour une pièce
   * Inclut les rafles multiples (captures en chaîne)
   */
  generateCaptures(board: Board, pos: Position, piece: Piece): Move[] {
    if (piece.type === PieceType.PAWN) {
      return this.generatePawnCaptures(board, pos, piece.color);
    } else {
      return this.generateKingCaptures(board, pos, piece.color);
    }
  }

  /**
   * Captures d'un pion
   * - Peut capturer en avant ET en arrière (règle FMJD)
   * - Saute par-dessus l'adversaire et atterrit sur la case suivante
   */
  private generatePawnCaptures(board: Board, pos: Position, color: Color): Move[] {
    const allCaptures: Move[] = [];

    // Explore toutes les séquences de capture possibles
    this.findCaptureSequences(
      board,
      pos,
      color,
      PieceType.PAWN,
      [],      // Pièces déjà capturées
      [pos],   // Chemin parcouru
      allCaptures
    );

    return allCaptures;
  }

  /**
   * Captures d'une dame volante
   * - Peut capturer à distance
   * - Peut s'arrêter sur n'importe quelle case après la pièce capturée
   */
  private generateKingCaptures(board: Board, pos: Position, color: Color): Move[] {
    const allCaptures: Move[] = [];

    this.findCaptureSequences(
      board,
      pos,
      color,
      PieceType.KING,
      [],
      [pos],
      allCaptures
    );

    return allCaptures;
  }

  /**
   * Recherche récursive de toutes les séquences de capture
   */
  private findCaptureSequences(
    board: Board,
    currentPos: Position,
    color: Color,
    pieceType: PieceType,
    capturedPositions: Position[],
    path: Position[],
    results: Move[]
  ): void {
    const continuations = this.findSingleCaptures(
      board,
      currentPos,
      color,
      pieceType,
      capturedPositions
    );

    if (continuations.length === 0) {
      // Fin de la rafle - enregistre le coup si au moins une capture
      if (capturedPositions.length > 0) {
        const lastPos = path[path.length - 1];
        results.push({
          from: path[0],
          to: lastPos,
          captures: [...capturedPositions],
          path: [...path],
          isPromotion: pieceType === PieceType.PAWN && board.isPromotionRow(lastPos, color),
        });
      }
      return;
    }

    // Continue la rafle pour chaque capture possible
    for (const { landingPos, capturedPos } of continuations) {
      const newCaptured = [...capturedPositions, capturedPos];
      const newPath = [...path, landingPos];

      // Récursion pour trouver les captures suivantes
      this.findCaptureSequences(
        board,
        landingPos,
        color,
        pieceType,
        newCaptured,
        newPath,
        results
      );
    }
  }

  /**
   * Trouve les captures simples possibles depuis une position
   * (une seule pièce capturée à la fois)
   */
  private findSingleCaptures(
    board: Board,
    pos: Position,
    color: Color,
    pieceType: PieceType,
    alreadyCaptured: Position[]
  ): { landingPos: Position; capturedPos: Position }[] {
    const captures: { landingPos: Position; capturedPos: Position }[] = [];

    // Pour les pions : capture dans toutes les directions (avant et arrière en FMJD)
    // Pour les dames : capture à distance dans toutes les directions
    const directions = this.rules.backwardCapture || pieceType === PieceType.KING
      ? DIAGONAL_DIRECTIONS
      : this.getForwardDirections(color);

    for (const [dr, dc] of directions) {
      if (pieceType === PieceType.PAWN) {
        // Pion : capture adjacente
        const capturedPos = { row: pos.row + dr, col: pos.col + dc };
        const landingPos = { row: pos.row + 2 * dr, col: pos.col + 2 * dc };

        if (this.isValidCapture(board, capturedPos, landingPos, color, alreadyCaptured)) {
          captures.push({ landingPos, capturedPos });
        }
      } else {
        // Dame volante : capture à distance
        let distance = 1;
        let foundOpponent: Position | null = null;

        while (true) {
          const checkPos = { row: pos.row + dr * distance, col: pos.col + dc * distance };

          if (!isValidPosition(checkPos.row, checkPos.col, this.rules.boardSize)) {
            break;
          }

          const piece = board.getPiece(checkPos);

          if (piece === null) {
            // Case vide
            if (foundOpponent) {
              // On a trouvé un adversaire avant, on peut atterrir ici
              if (!this.isAlreadyCaptured(checkPos, alreadyCaptured)) {
                captures.push({ landingPos: checkPos, capturedPos: foundOpponent });
              }
            }
          } else if (piece.color !== color) {
            // Pièce adverse
            if (foundOpponent) {
              // Deux adversaires d'affilée, on ne peut pas continuer
              break;
            }
            if (!this.isAlreadyCaptured(checkPos, alreadyCaptured)) {
              foundOpponent = checkPos;
            } else {
              // Déjà capturée dans cette rafle, on ne peut pas la resauter
              break;
            }
          } else {
            // Notre propre pièce, on s'arrête
            break;
          }

          distance++;
        }
      }
    }

    return captures;
  }

  /**
   * Vérifie si une capture simple est valide (pour les pions)
   */
  private isValidCapture(
    board: Board,
    capturedPos: Position,
    landingPos: Position,
    color: Color,
    alreadyCaptured: Position[]
  ): boolean {
    // Position de capture dans les limites
    if (!isValidPosition(capturedPos.row, capturedPos.col, this.rules.boardSize)) {
      return false;
    }

    // Position d'atterrissage dans les limites
    if (!isValidPosition(landingPos.row, landingPos.col, this.rules.boardSize)) {
      return false;
    }

    // Case d'atterrissage jouable
    if (!isPlayableSquare(landingPos.row, landingPos.col)) {
      return false;
    }

    // La pièce à capturer est un adversaire
    if (!board.isOpponent(capturedPos, color)) {
      return false;
    }

    // La pièce n'a pas déjà été capturée dans cette rafle
    if (this.isAlreadyCaptured(capturedPos, alreadyCaptured)) {
      return false;
    }

    // La case d'atterrissage est vide
    if (!board.isEmpty(landingPos)) {
      return false;
    }

    return true;
  }

  /**
   * Vérifie si une position a déjà été capturée
   */
  private isAlreadyCaptured(pos: Position, captured: Position[]): boolean {
    return captured.some(c => c.row === pos.row && c.col === pos.col);
  }

  /**
   * Retourne les directions avant pour une couleur
   */
  private getForwardDirections(color: Color): [number, number][] {
    const forwardDir = color === Color.WHITE ? -1 : +1;
    return [
      [forwardDir, -1],
      [forwardDir, +1],
    ];
  }

  /**
   * Vérifie si un coup est légal
   */
  isMoveLegal(board: Board, color: Color, move: Move): boolean {
    const legalMoves = this.generateAllMoves(board, color);
    return legalMoves.some(m =>
      m.from.row === move.from.row &&
      m.from.col === move.from.col &&
      m.to.row === move.to.row &&
      m.to.col === move.to.col &&
      m.captures.length === move.captures.length
    );
  }

  /**
   * Vérifie si le joueur a des coups disponibles
   */
  hasLegalMoves(board: Board, color: Color): boolean {
    return this.generateAllMoves(board, color).length > 0;
  }
}

/**
 * Classe Board - Représentation du damier 10x10
 *
 * Disposition initiale (règles FMJD) :
 * - Noirs (cases 1-20) : lignes 0-3 (haut du plateau)
 * - Vide (cases 21-30) : lignes 4-5 (milieu)
 * - Blancs (cases 31-50) : lignes 6-9 (bas du plateau)
 *
 * Les Blancs jouent en premier et montent vers le haut.
 * Les Noirs descendent vers le bas.
 */

import {
  BoardGrid,
  Square,
  Piece,
  Color,
  PieceType,
  Position,
  FMJD_RULES,
} from './types';
import { isPlayableSquare, isValidPosition, positionToManoury } from './notation';

export class Board {
  private squares: BoardGrid;
  private readonly size: number;

  constructor(size: number = FMJD_RULES.boardSize) {
    this.size = size;
    this.squares = this.createEmptyBoard();
  }

  /**
   * Crée un plateau vide
   */
  private createEmptyBoard(): BoardGrid {
    const board: BoardGrid = [];
    for (let row = 0; row < this.size; row++) {
      const rowArray: Square[] = [];
      for (let col = 0; col < this.size; col++) {
        rowArray.push(null);
      }
      board.push(rowArray);
    }
    return board;
  }

  /**
   * Initialise le plateau avec la position de départ
   */
  setupInitialPosition(): void {
    this.squares = this.createEmptyBoard();

    // Pions noirs sur les lignes 0-3 (cases 1-20)
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < this.size; col++) {
        if (isPlayableSquare(row, col)) {
          this.squares[row][col] = {
            color: Color.BLACK,
            type: PieceType.PAWN,
          };
        }
      }
    }

    // Pions blancs sur les lignes 6-9 (cases 31-50)
    for (let row = 6; row < 10; row++) {
      for (let col = 0; col < this.size; col++) {
        if (isPlayableSquare(row, col)) {
          this.squares[row][col] = {
            color: Color.WHITE,
            type: PieceType.PAWN,
          };
        }
      }
    }
  }

  /**
   * Récupère la pièce à une position donnée
   */
  getPiece(pos: Position): Square {
    if (!isValidPosition(pos.row, pos.col, this.size)) {
      return null;
    }
    return this.squares[pos.row][pos.col];
  }

  /**
   * Place une pièce à une position donnée
   */
  setPiece(pos: Position, piece: Square): boolean {
    if (!isValidPosition(pos.row, pos.col, this.size)) {
      return false;
    }
    if (!isPlayableSquare(pos.row, pos.col)) {
      return false;
    }
    this.squares[pos.row][pos.col] = piece;
    return true;
  }

  /**
   * Supprime une pièce à une position donnée
   */
  removePiece(pos: Position): Square {
    const piece = this.getPiece(pos);
    if (piece) {
      this.squares[pos.row][pos.col] = null;
    }
    return piece;
  }

  /**
   * Déplace une pièce d'une position à une autre
   */
  movePiece(from: Position, to: Position): boolean {
    const piece = this.getPiece(from);
    if (!piece) {
      return false;
    }
    if (!isPlayableSquare(to.row, to.col)) {
      return false;
    }
    this.squares[from.row][from.col] = null;
    this.squares[to.row][to.col] = piece;
    return true;
  }

  /**
   * Promeut un pion en dame
   */
  promotePiece(pos: Position): boolean {
    const piece = this.getPiece(pos);
    if (!piece || piece.type !== PieceType.PAWN) {
      return false;
    }
    this.squares[pos.row][pos.col] = {
      color: piece.color,
      type: PieceType.KING,
    };
    return true;
  }

  /**
   * Vérifie si une position est sur la ligne de promotion
   */
  isPromotionRow(pos: Position, color: Color): boolean {
    if (color === Color.WHITE) {
      return pos.row === 0; // Blancs promus en haut
    } else {
      return pos.row === this.size - 1; // Noirs promus en bas
    }
  }

  /**
   * Récupère toutes les pièces d'une couleur
   */
  getPiecesByColor(color: Color): { pos: Position; piece: Piece }[] {
    const pieces: { pos: Position; piece: Piece }[] = [];
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const piece = this.squares[row][col];
        if (piece && piece.color === color) {
          pieces.push({ pos: { row, col }, piece });
        }
      }
    }
    return pieces;
  }

  /**
   * Compte les pièces par couleur
   */
  countPieces(color: Color): { pawns: number; kings: number; total: number } {
    let pawns = 0;
    let kings = 0;
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const piece = this.squares[row][col];
        if (piece && piece.color === color) {
          if (piece.type === PieceType.PAWN) {
            pawns++;
          } else {
            kings++;
          }
        }
      }
    }
    return { pawns, kings, total: pawns + kings };
  }

  /**
   * Vérifie si une case est vide
   */
  isEmpty(pos: Position): boolean {
    return this.getPiece(pos) === null;
  }

  /**
   * Vérifie si une case contient une pièce adverse
   */
  isOpponent(pos: Position, color: Color): boolean {
    const piece = this.getPiece(pos);
    return piece !== null && piece.color !== color;
  }

  /**
   * Clone le plateau (pour les simulations)
   */
  clone(): Board {
    const newBoard = new Board(this.size);
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const piece = this.squares[row][col];
        if (piece) {
          newBoard.squares[row][col] = { ...piece };
        }
      }
    }
    return newBoard;
  }

  /**
   * Génère une clé unique représentant l'état du plateau
   * Utilisé pour la détection des répétitions et les tables de transposition
   */
  getHash(): string {
    let hash = '';
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const piece = this.squares[row][col];
        if (piece) {
          const colorChar = piece.color === Color.WHITE ? 'w' : 'b';
          const typeChar = piece.type === PieceType.PAWN ? 'p' : 'k';
          hash += `${row}${col}${colorChar}${typeChar}`;
        }
      }
    }
    return hash;
  }

  /**
   * Affichage textuel du plateau pour le débogage
   *
   * Légende :
   * - b = pion noir, B = dame noire
   * - w = pion blanc, W = dame blanche
   * - . = case vide jouable
   * - (espace) = case non jouable
   */
  toString(): string {
    let result = '\n    0 1 2 3 4 5 6 7 8 9\n';
    result += '   ─────────────────────\n';

    for (let row = 0; row < this.size; row++) {
      result += `${row} │ `;
      for (let col = 0; col < this.size; col++) {
        if (!isPlayableSquare(row, col)) {
          result += '  ';
        } else {
          const piece = this.squares[row][col];
          if (!piece) {
            result += '. ';
          } else if (piece.color === Color.BLACK) {
            result += piece.type === PieceType.PAWN ? 'b ' : 'B ';
          } else {
            result += piece.type === PieceType.PAWN ? 'w ' : 'W ';
          }
        }
      }
      // Affiche les numéros Manoury sur le côté
      const firstSquare = positionToManoury({ row, col: row % 2 === 0 ? 1 : 0 });
      const lastSquare = positionToManoury({ row, col: row % 2 === 0 ? 9 : 8 });
      result += `│ ${firstSquare}-${lastSquare}\n`;
    }

    result += '   ─────────────────────\n';
    return result;
  }

  /**
   * Retourne la taille du plateau
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Retourne le tableau interne (pour les tests)
   */
  getSquares(): BoardGrid {
    return this.squares;
  }
}

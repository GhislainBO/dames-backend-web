/**
 * Conversion entre coordonnées (row, col) et notation Manoury (1-50)
 *
 * Le damier 10x10 a 50 cases jouables (cases noires/foncées).
 * La numérotation Manoury va de 1 à 50 :
 * - Case 1 : coin supérieur gauche (côté Noirs)
 * - Case 50 : coin inférieur droit (côté Blancs)
 *
 * Disposition (les X sont les cases jouables) :
 *    0 1 2 3 4 5 6 7 8 9  (colonnes)
 * 0  . 1 . 2 . 3 . 4 . 5
 * 1  6 . 7 . 8 . 9 .10 .
 * 2  .11 .12 .13 .14 .15
 * 3  16 .17 .18 .19 .20 .
 * 4  .21 .22 .23 .24 .25
 * 5  26 .27 .28 .29 .30 .
 * 6  .31 .32 .33 .34 .35
 * 7  36 .37 .38 .39 .40 .
 * 8  .41 .42 .43 .44 .45
 * 9  46 .47 .48 .49 .50 .
 * (lignes)
 */

import { Position, SquareNumber } from './types';

/**
 * Vérifie si une position est une case jouable (case noire/foncée)
 */
export function isPlayableSquare(row: number, col: number): boolean {
  // Une case est jouable si (row + col) est impair
  return (row + col) % 2 === 1;
}

/**
 * Vérifie si une position est dans les limites du plateau
 */
export function isValidPosition(row: number, col: number, boardSize: number = 10): boolean {
  return row >= 0 && row < boardSize && col >= 0 && col < boardSize;
}

/**
 * Convertit une position (row, col) en numéro Manoury (1-50)
 * Retourne null si la position n'est pas une case jouable
 */
export function positionToManoury(pos: Position): SquareNumber | null {
  const { row, col } = pos;

  if (!isValidPosition(row, col) || !isPlayableSquare(row, col)) {
    return null;
  }

  // Chaque ligne a 5 cases jouables
  // Pour les lignes paires (0, 2, 4, 6, 8), les cases jouables sont aux colonnes 1, 3, 5, 7, 9
  // Pour les lignes impaires (1, 3, 5, 7, 9), les cases jouables sont aux colonnes 0, 2, 4, 6, 8

  const squaresBeforeRow = row * 5;
  const squareInRow = row % 2 === 0 ? Math.floor(col / 2) : Math.floor((col + 1) / 2);

  return squaresBeforeRow + squareInRow + 1;
}

/**
 * Convertit un numéro Manoury (1-50) en position (row, col)
 * Retourne null si le numéro est invalide
 */
export function manouryToPosition(square: SquareNumber): Position | null {
  if (square < 1 || square > 50) {
    return null;
  }

  const index = square - 1;  // 0-indexed
  const row = Math.floor(index / 5);
  const posInRow = index % 5;

  // Pour les lignes paires, les colonnes jouables sont 1, 3, 5, 7, 9
  // Pour les lignes impaires, les colonnes jouables sont 0, 2, 4, 6, 8
  const col = row % 2 === 0 ? posInRow * 2 + 1 : posInRow * 2;

  return { row, col };
}

/**
 * Convertit un coup en notation Manoury
 * Format : "from-to" pour déplacement simple, "fromxto" pour capture
 * Exemple : "32-28" (déplacement), "32x23x14" (rafle multiple)
 */
export function moveToNotation(from: Position, to: Position, captures: Position[] = []): string {
  const fromSquare = positionToManoury(from);
  const toSquare = positionToManoury(to);

  if (fromSquare === null || toSquare === null) {
    return '';
  }

  if (captures.length === 0) {
    return `${fromSquare}-${toSquare}`;
  } else {
    return `${fromSquare}x${toSquare}`;
  }
}

/**
 * Parse une notation Manoury simple en positions
 * Supporte "32-28" et "32x28"
 */
export function parseNotation(notation: string): { from: Position; to: Position; isCapture: boolean } | null {
  const moveMatch = notation.match(/^(\d+)([-x])(\d+)$/);

  if (!moveMatch) {
    return null;
  }

  const fromSquare = parseInt(moveMatch[1], 10);
  const separator = moveMatch[2];
  const toSquare = parseInt(moveMatch[3], 10);

  const from = manouryToPosition(fromSquare);
  const to = manouryToPosition(toSquare);

  if (!from || !to) {
    return null;
  }

  return {
    from,
    to,
    isCapture: separator === 'x',
  };
}

/**
 * Représentation textuelle d'une position
 */
export function positionToString(pos: Position): string {
  const square = positionToManoury(pos);
  return square !== null ? square.toString() : `(${pos.row},${pos.col})`;
}

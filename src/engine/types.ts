/**
 * Types fondamentaux pour le moteur de dames internationales 10x10 (FMJD)
 */

/** Couleur des pièces */
export enum Color {
  WHITE = 'white',  // Blancs (jouent en premier, partent du bas)
  BLACK = 'black',  // Noirs (partent du haut)
}

/** Type de pièce */
export enum PieceType {
  PAWN = 'pawn',    // Pion
  KING = 'king',    // Dame (appelée "King" en anglais pour les dames)
}

/** Une pièce sur le plateau */
export interface Piece {
  color: Color;
  type: PieceType;
}

/**
 * Position sur le plateau
 * - row: ligne (0-9, 0 = haut du plateau côté Noirs)
 * - col: colonne (0-9, 0 = gauche)
 */
export interface Position {
  row: number;
  col: number;
}

/**
 * Numéro de case en notation Manoury (1-50)
 * Les cases jouables du damier 10x10 sont numérotées de 1 à 50
 */
export type SquareNumber = number;

/**
 * Un mouvement simple (sans capture)
 */
export interface SimpleMove {
  from: Position;
  to: Position;
}

/**
 * Une capture (prise d'une pièce adverse)
 */
export interface Capture {
  from: Position;
  to: Position;
  captured: Position;  // Position de la pièce capturée
}

/**
 * Un coup complet (peut être un déplacement simple ou une rafle)
 */
export interface Move {
  from: Position;
  to: Position;
  captures: Position[];      // Liste des pièces capturées (vide si déplacement simple)
  path: Position[];          // Chemin complet pour les rafles multiples
  isPromotion: boolean;      // True si le pion devient dame
}

/**
 * État d'une case du plateau
 * null = case vide ou case non jouable (cases blanches)
 */
export type Square = Piece | null;

/**
 * Représentation du plateau 10x10
 * Seules les cases noires (diagonales) sont jouables
 */
export type BoardGrid = Square[][];

/**
 * État complet d'une partie
 */
export interface GameState {
  board: BoardGrid;
  currentPlayer: Color;
  moveHistory: Move[];
  halfMoveClock: number;      // Compteur pour règle des 25 coups sans prise
  positionHistory: string[];  // Historique des positions (pour règle des 3 répétitions)
}

/**
 * Résultat d'une partie
 */
export enum GameResult {
  ONGOING = 'ongoing',
  WHITE_WINS = 'white_wins',
  BLACK_WINS = 'black_wins',
  DRAW = 'draw',
}

/**
 * Raison de fin de partie
 */
export enum GameEndReason {
  NONE = 'none',
  NO_PIECES = 'no_pieces',           // Plus de pièces
  NO_MOVES = 'no_moves',             // Plus de coups légaux
  RESIGNATION = 'resignation',       // Abandon
  THREEFOLD_REPETITION = 'threefold_repetition',  // 3 répétitions
  FIFTY_MOVE_RULE = 'fifty_move_rule',            // 25 coups sans prise (50 demi-coups)
  AGREEMENT = 'agreement',           // Accord mutuel
}

/**
 * Résultat de validation d'un coup
 */
export interface MoveValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Configuration des règles (pour supporter différentes variantes)
 */
export interface RuleConfig {
  boardSize: number;           // 10 pour FMJD
  mandatoryCapture: boolean;   // Prise obligatoire
  majorityCapture: boolean;    // Prise majoritaire (prendre le max de pièces)
  flyingKings: boolean;        // Dames volantes (déplacement longue distance)
  backwardCapture: boolean;    // Prise arrière pour les pions
  promotionOnPass: boolean;    // Promotion en passant par la dernière rangée (false en FMJD)
}

/**
 * Configuration par défaut : Règles FMJD 10x10
 */
export const FMJD_RULES: RuleConfig = {
  boardSize: 10,
  mandatoryCapture: true,
  majorityCapture: true,
  flyingKings: true,
  backwardCapture: true,
  promotionOnPass: false,  // Promotion uniquement si le pion s'arrête sur la dernière rangée
};

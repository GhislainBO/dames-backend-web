/**
 * DraughtsScene - Scène Phaser pour le jeu de dames
 * Utilise le moteur de jeu et l'IA Minimax
 * Supporte le mode replay et l'historique des coups
 * Inclut les effets sonores et animations
 */

import Phaser from 'phaser';
import { DraughtsEngine } from '@engine/DraughtsEngine';
import { Color, PieceType, Position, Move } from '@engine/types';
import { MinimaxAI, Difficulty } from '@ai/MinimaxAI';
import { positionToManoury } from '@engine/notation';
import { audioManager } from './AudioManager';

// Configuration
const BOARD_SIZE = 10;
const CELL_SIZE = 58;
const BOARD_OFFSET = 10;
const PIECE_RADIUS = 22;

// Position de la lumière (simulation 3D)
const LIGHT_ANGLE = -Math.PI / 4; // 45 degrés
const LIGHT_INTENSITY = 0.8;

// Couleurs par défaut (seront remplacées par les cosmétiques)
const DEFAULT_COLORS = {
  lightSquare: 0xf0d9b5,
  darkSquare: 0xb58863,
  selected: 0x7fff7f,
  legalMove: 0x90ee90,
  capture: 0xff6b6b,
  whitePiece: 0xffefd5,
  whitePieceStroke: 0xdaa520,
  blackPiece: 0x2c2c2c,
  blackPieceStroke: 0x1a1a1a,
  kingMark: 0xffd700,
  replayHighlight: 0x9966ff,
};

// Mapping des difficultés
const DIFFICULTY_MAP: Record<string, Difficulty> = {
  'beginner': Difficulty.BEGINNER,
  'easy': Difficulty.EASY,
  'medium': Difficulty.MEDIUM,
  'hard': Difficulty.HARD,
  'expert': Difficulty.EXPERT,
};

// Interface pour les callbacks vers React
export interface SceneCallbacks {
  onMoveHistoryChange?: (moves: string[], currentIndex: number) => void;
  onGameOver?: (winner: string, reason: string) => void;
}

// Objet global pour stocker les callbacks actuels (permet de les mettre à jour)
export const sceneCallbacksRef: { current: SceneCallbacks } = { current: {} };

export class DraughtsScene extends Phaser.Scene {
  // Moteur de jeu et IA
  private engine!: DraughtsEngine;
  private ai!: MinimaxAI;

  // Configuration
  private mode: 'pvp' | 'ai' = 'pvp';
  private difficulty: Difficulty = Difficulty.MEDIUM;
  private playerColor: Color = Color.WHITE;

  // Couleurs (peuvent être personnalisées via cosmétiques)
  private COLORS = { ...DEFAULT_COLORS };

  // État de l'interface
  private selectedPos: Position | null = null;
  private gameOver: boolean = false;
  private aiThinking: boolean = false;

  // Historique et replay
  private moveHistory: Move[] = [];
  private moveNotations: string[] = [];
  private replayMode: boolean = false;
  private replayIndex: number = -1;
  private savedEngineStates: string[] = []; // États du moteur pour replay

  // Callbacks
  private callbacks: SceneCallbacks = {};

  // Graphiques Phaser
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private piecesContainer!: Phaser.GameObjects.Container;
  private highlightGraphics!: Phaser.GameObjects.Graphics;
  private statusText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'DraughtsScene' });
  }

  create() {
    // Récupère la configuration
    const config = this.registry.get('gameConfig');
    if (config) {
      this.mode = config.mode;
      this.difficulty = DIFFICULTY_MAP[config.difficulty] || Difficulty.MEDIUM;
      this.playerColor = config.playerColor === 'white' ? Color.WHITE : Color.BLACK;
      this.callbacks = config.callbacks || {};
      // Aussi stocker dans le ref global pour les mises à jour
      sceneCallbacksRef.current = this.callbacks;

      // Appliquer les cosmétiques si présents
      if (config.cosmetics) {
        if (config.cosmetics.board) {
          this.COLORS.lightSquare = config.cosmetics.board.lightSquare;
          this.COLORS.darkSquare = config.cosmetics.board.darkSquare;
          this.COLORS.legalMove = config.cosmetics.board.validMove;
        }
        if (config.cosmetics.pieces) {
          this.COLORS.whitePiece = config.cosmetics.pieces.whiteColor;
          this.COLORS.whitePieceStroke = config.cosmetics.pieces.whiteBorder;
          this.COLORS.blackPiece = config.cosmetics.pieces.blackColor;
          this.COLORS.blackPieceStroke = config.cosmetics.pieces.blackBorder;
        }
      }
    }

    // Initialise le gestionnaire audio
    audioManager.initialize();

    // Initialise le moteur et l'IA
    this.engine = new DraughtsEngine();
    this.engine.newGame();
    this.ai = new MinimaxAI();

    // Sauvegarder l'état initial
    this.savedEngineStates = [this.engine.toFEN()];

    // Crée les graphiques
    this.boardGraphics = this.add.graphics();
    this.highlightGraphics = this.add.graphics();
    this.piecesContainer = this.add.container(0, 0);

    // Texte de statut
    this.statusText = this.add.text(300, 580, '', {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    // Texte d'info (niveau IA)
    this.infoText = this.add.text(300, 12, '', {
      fontSize: '12px',
      color: '#aaaaaa',
      align: 'center',
    }).setOrigin(0.5);

    if (this.mode === 'ai') {
      this.infoText.setText(`IA: ${this.getDifficultyName()}`);
    }

    // Dessine le plateau
    this.drawBoard();
    this.drawPieces();
    this.updateStatus();

    // Gestion des clics
    this.input.on('pointerdown', this.handleClick, this);

    // Si l'IA joue en premier (joueur = noir)
    if (this.mode === 'ai' && this.playerColor === Color.BLACK) {
      this.time.delayedCall(500, () => this.playAIMove());
    }

    // Exposer les méthodes pour React
    this.registry.set('sceneInstance', this);
  }

  /**
   * Retourne le nom de la difficulté
   */
  private getDifficultyName(): string {
    switch (this.difficulty) {
      case Difficulty.BEGINNER: return 'Débutant';
      case Difficulty.EASY: return 'Facile';
      case Difficulty.MEDIUM: return 'Moyen';
      case Difficulty.HARD: return 'Difficile';
      case Difficulty.EXPERT: return 'Expert';
      default: return 'Moyen';
    }
  }

  /**
   * Convertit un coup en notation PDN
   */
  private moveToNotation(move: Move): string {
    const from = positionToManoury(move.from);
    const to = positionToManoury(move.to);
    const separator = move.captures.length > 0 ? 'x' : '-';
    return `${from}${separator}${to}`;
  }

  /**
   * Notifie React des changements d'historique
   */
  private notifyHistoryChange() {
    if (sceneCallbacksRef.current.onMoveHistoryChange) {
      const index = this.replayMode ? this.replayIndex : this.moveNotations.length - 1;
      sceneCallbacksRef.current.onMoveHistoryChange(this.moveNotations, index);
    }
  }

  /**
   * Dessine le plateau luxueux avec effets 3D et lumière
   */
  private drawBoard() {
    this.boardGraphics.clear();

    const boardWidth = BOARD_SIZE * CELL_SIZE;
    const frameWidth = 12;

    // === OMBRE PORTÉE DOUCE DU PLATEAU ===
    for (let i = 5; i >= 1; i--) {
      this.boardGraphics.fillStyle(0x000000, 0.08);
      this.boardGraphics.fillRoundedRect(
        BOARD_OFFSET - frameWidth + i * 2,
        BOARD_OFFSET - frameWidth + i * 2 + 3,
        boardWidth + frameWidth * 2,
        boardWidth + frameWidth * 2,
        8
      );
    }

    // === CADRE EXTÉRIEUR LUXUEUX ===
    // Base du cadre (ébène foncé)
    const frameGradient = [0x1a0f0a, 0x2d1810, 0x3d2518, 0x4a2c1c, 0x3d2518, 0x2d1810];
    for (let i = 0; i < frameWidth; i++) {
      const colorIndex = Math.floor((i / frameWidth) * frameGradient.length);
      this.boardGraphics.fillStyle(frameGradient[colorIndex], 1);
      this.boardGraphics.fillRoundedRect(
        BOARD_OFFSET - frameWidth + i,
        BOARD_OFFSET - frameWidth + i,
        boardWidth + (frameWidth - i) * 2,
        boardWidth + (frameWidth - i) * 2,
        8 - i * 0.5
      );
    }

    // Incrustation dorée sur le cadre
    this.boardGraphics.lineStyle(1, 0xd4af37, 0.6);
    this.boardGraphics.strokeRoundedRect(
      BOARD_OFFSET - frameWidth + 3,
      BOARD_OFFSET - frameWidth + 3,
      boardWidth + frameWidth * 2 - 6,
      boardWidth + frameWidth * 2 - 6,
      6
    );
    this.boardGraphics.lineStyle(1, 0xd4af37, 0.3);
    this.boardGraphics.strokeRoundedRect(
      BOARD_OFFSET - 2,
      BOARD_OFFSET - 2,
      boardWidth + 4,
      boardWidth + 4,
      2
    );

    // === SURFACE DU PLATEAU ===
    // Fond légèrement enfoncé
    this.boardGraphics.fillStyle(0x1a1008, 1);
    this.boardGraphics.fillRect(BOARD_OFFSET - 1, BOARD_OFFSET - 1, boardWidth + 2, boardWidth + 2);

    // === DESSINER LES CASES ===
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const x = BOARD_OFFSET + col * CELL_SIZE;
        const y = BOARD_OFFSET + row * CELL_SIZE;
        const isDark = (row + col) % 2 !== 0;
        this.drawLuxurySquare(x, y, isDark, row, col);
      }
    }

    // === EFFET DE LUMIÈRE GLOBAL (vignette inversée) ===
    // Lumière venant du coin supérieur gauche
    const lightGradient = this.boardGraphics;
    lightGradient.fillStyle(0xffffff, 0.03);
    lightGradient.fillTriangle(
      BOARD_OFFSET, BOARD_OFFSET,
      BOARD_OFFSET + boardWidth, BOARD_OFFSET,
      BOARD_OFFSET, BOARD_OFFSET + boardWidth
    );

    // === REFLET SUBTIL SUR LE VERNIS ===
    this.boardGraphics.lineStyle(1, 0xffffff, 0.1);
    this.boardGraphics.beginPath();
    this.boardGraphics.moveTo(BOARD_OFFSET + 10, BOARD_OFFSET + 2);
    this.boardGraphics.lineTo(BOARD_OFFSET + boardWidth - 10, BOARD_OFFSET + 2);
    this.boardGraphics.strokePath();
  }

  /**
   * Dessine une case luxueuse avec effet marbre/bois précieux
   */
  private drawLuxurySquare(x: number, y: number, isDark: boolean, row: number, col: number) {
    // Couleurs nobles
    const baseColor = isDark ? this.COLORS.darkSquare : this.COLORS.lightSquare;

    // Palette pour cases foncées (acajou/ébène)
    const darkPalette = {
      base: 0x8b5a2b,
      dark: 0x5c3317,
      darker: 0x3d1f0d,
      light: 0xa67c52,
      grain: 0x4a2511,
      highlight: 0xc9956c,
    };

    // Palette pour cases claires (érable/bouleau)
    const lightPalette = {
      base: 0xf5deb3,
      dark: 0xe8cfa0,
      darker: 0xd4b896,
      light: 0xfff8e7,
      grain: 0xdec896,
      highlight: 0xfffef5,
    };

    const palette = isDark ? darkPalette : lightPalette;

    // === FOND DE BASE AVEC DÉGRADÉ SUBTIL ===
    // Simuler un dégradé diagonal (lumière)
    const lightFactor = (1 - (row + col) / (BOARD_SIZE * 2)) * 0.15;

    this.boardGraphics.fillStyle(this.adjustBrightness(palette.base, lightFactor), 1);
    this.boardGraphics.fillRect(x, y, CELL_SIZE, CELL_SIZE);

    // === TEXTURE DE BOIS PRÉCIEUX ===
    // Veines du bois (courbes organiques)
    const seed = row * 10 + col;
    this.boardGraphics.lineStyle(1, palette.grain, isDark ? 0.25 : 0.12);

    for (let i = 0; i < 6; i++) {
      const offsetY = y + 4 + i * 9 + (seed % 3);
      const curve = Math.sin(seed + i) * 3;

      this.boardGraphics.beginPath();
      this.boardGraphics.moveTo(x, offsetY + curve);

      // Courbe de Bézier pour veines naturelles
      for (let j = 0; j < CELL_SIZE; j += 8) {
        const waveY = offsetY + Math.sin((j + seed) * 0.1) * 2 + curve;
        this.boardGraphics.lineTo(x + j, waveY);
      }
      this.boardGraphics.lineTo(x + CELL_SIZE, offsetY + Math.sin(seed) * 2 + curve);
      this.boardGraphics.strokePath();
    }

    // === NŒUDS DU BOIS (occasionnels) ===
    if ((row * 7 + col * 13) % 17 === 0) {
      const knotX = x + 15 + (seed % 28);
      const knotY = y + 15 + ((seed * 3) % 28);
      this.boardGraphics.fillStyle(palette.darker, 0.3);
      this.boardGraphics.fillEllipse(knotX, knotY, 4, 3);
      this.boardGraphics.lineStyle(1, palette.grain, 0.2);
      this.boardGraphics.strokeEllipse(knotX, knotY, 6, 4);
    }

    // === EFFET DE PROFONDEUR (bords) ===
    // Ombre intérieure subtile (bas et droite)
    this.boardGraphics.fillStyle(0x000000, 0.08);
    this.boardGraphics.fillRect(x + CELL_SIZE - 2, y + 2, 2, CELL_SIZE - 2);
    this.boardGraphics.fillRect(x + 2, y + CELL_SIZE - 2, CELL_SIZE - 2, 2);

    // Lumière (haut et gauche)
    this.boardGraphics.fillStyle(0xffffff, isDark ? 0.06 : 0.1);
    this.boardGraphics.fillRect(x, y, CELL_SIZE, 1);
    this.boardGraphics.fillRect(x, y, 1, CELL_SIZE);

    // === REFLET DE VERNIS ===
    // Petit reflet spéculaire simulant le vernis brillant
    if ((row + col) % 3 === 0) {
      this.boardGraphics.fillStyle(0xffffff, 0.04);
      this.boardGraphics.fillEllipse(x + 20, y + 15, 15, 8);
    }

    // === SÉPARATION ENTRE LES CASES ===
    this.boardGraphics.lineStyle(1, 0x000000, 0.15);
    this.boardGraphics.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
  }

  /**
   * Ajuste la luminosité d'une couleur
   */
  private adjustBrightness(color: number, factor: number): number {
    let r = (color >> 16) & 0xff;
    let g = (color >> 8) & 0xff;
    let b = color & 0xff;

    r = Math.min(255, Math.max(0, Math.round(r * (1 + factor))));
    g = Math.min(255, Math.max(0, Math.round(g * (1 + factor))));
    b = Math.min(255, Math.max(0, Math.round(b * (1 + factor))));

    return (r << 16) | (g << 8) | b;
  }

  /**
   * Dessine les pièces depuis l'état du moteur
   */
  private drawPieces() {
    this.piecesContainer.removeAll(true);

    const board = this.engine.getBoard();

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board.getPiece({ row, col });
        if (piece) {
          this.drawPiece(row, col, piece.color, piece.type);
        }
      }
    }
  }

  /**
   * Dessine une pièce luxueuse avec effets de lumière réalistes
   */
  private drawPiece(row: number, col: number, color: Color, type: PieceType) {
    const x = BOARD_OFFSET + col * CELL_SIZE + CELL_SIZE / 2;
    const y = BOARD_OFFSET + row * CELL_SIZE + CELL_SIZE / 2;

    const graphics = this.add.graphics();
    this.piecesContainer.add(graphics);

    const isWhite = color === Color.WHITE;

    // === PALETTE DE COULEURS LUXUEUSES ===
    const whitePalette = {
      base: 0xfaf0e6,      // Lin
      mid: 0xf5e6d3,       // Crème
      dark: 0xe8d4b8,      // Beige
      darker: 0xd4bc98,    // Chamois
      edge: 0xc9a86c,      // Bord doré
      shadow: 0xa08060,    // Ombre chaude
      highlight: 0xffffff, // Blanc pur
      specular: 0xfffef8,  // Reflet spéculaire
    };

    const blackPalette = {
      base: 0x3d2b1f,      // Ébène
      mid: 0x2d1f15,       // Chocolat noir
      dark: 0x1f140d,      // Espresso
      darker: 0x130c07,    // Noir chaud
      edge: 0x4a3525,      // Bord acajou
      shadow: 0x0a0604,    // Ombre profonde
      highlight: 0x6b5344, // Reflet brun
      specular: 0x8b7355,  // Reflet cuivré
    };

    const p = isWhite ? whitePalette : blackPalette;
    const pieceHeight = 6;

    // === OMBRE PORTÉE RÉALISTE (plusieurs couches) ===
    for (let i = 4; i >= 0; i--) {
      const shadowAlpha = 0.12 - i * 0.02;
      const shadowOffset = 2 + i * 0.8;
      const shadowSize = PIECE_RADIUS + 2 - i * 0.3;
      graphics.fillStyle(0x000000, shadowAlpha);
      graphics.fillEllipse(x + shadowOffset, y + pieceHeight + shadowOffset, shadowSize, shadowSize * 0.4);
    }

    // === CÔTÉ DU PION (effet 3D cylindrique) ===
    for (let i = pieceHeight; i >= 0; i--) {
      // Dégradé du côté (plus sombre en bas, plus clair en haut)
      const sideRatio = i / pieceHeight;
      const sideColor = this.lerpColor(p.shadow, p.edge, sideRatio * 0.7);

      // Effet de lumière latérale
      graphics.fillStyle(sideColor, 1);
      graphics.fillCircle(x, y + i, PIECE_RADIUS);

      // Reflet sur le côté gauche (lumière)
      if (i > 1 && i < pieceHeight - 1) {
        graphics.fillStyle(p.highlight, 0.08 * sideRatio);
        graphics.beginPath();
        graphics.arc(x, y + i, PIECE_RADIUS - 1, Math.PI * 0.6, Math.PI * 1.1);
        graphics.fill();
      }
    }

    // === FACE SUPÉRIEURE (dégradé radial réaliste) ===
    // Couche de base
    const gradientSteps = 12;
    for (let i = gradientSteps; i >= 0; i--) {
      const ratio = i / gradientSteps;
      const radius = PIECE_RADIUS * (0.2 + ratio * 0.8);

      // Dégradé du centre vers le bord
      let gradColor: number;
      if (ratio > 0.7) {
        gradColor = this.lerpColor(p.dark, p.edge, (ratio - 0.7) / 0.3);
      } else if (ratio > 0.3) {
        gradColor = this.lerpColor(p.mid, p.dark, (ratio - 0.3) / 0.4);
      } else {
        gradColor = this.lerpColor(p.base, p.mid, ratio / 0.3);
      }

      graphics.fillStyle(gradColor, 1);
      graphics.fillCircle(x, y, radius);
    }

    // === VEINES DU BOIS SUBTILES ===
    graphics.lineStyle(1, p.darker, isWhite ? 0.08 : 0.15);
    for (let ring = 0.3; ring <= 0.8; ring += 0.15) {
      graphics.strokeCircle(x, y, PIECE_RADIUS * ring);
    }

    // === REFLET SPÉCULAIRE PRINCIPAL ===
    // Grand reflet ovale (lumière principale)
    graphics.fillStyle(p.specular, isWhite ? 0.5 : 0.2);
    graphics.fillEllipse(x - 4, y - 5, 10, 6);

    // Petit point de lumière intense
    graphics.fillStyle(0xffffff, isWhite ? 0.7 : 0.3);
    graphics.fillCircle(x - 6, y - 6, 3);

    // === REFLET SECONDAIRE (lumière ambiante) ===
    graphics.fillStyle(p.highlight, isWhite ? 0.15 : 0.08);
    graphics.fillEllipse(x + 6, y + 4, 6, 4);

    // === BORD BISEAUTÉ LUXUEUX ===
    // Anneau extérieur lumineux
    graphics.lineStyle(1.5, this.lerpColor(p.edge, p.highlight, 0.3), 0.6);
    graphics.strokeCircle(x, y, PIECE_RADIUS - 1);

    // Ombre intérieure du biseau
    graphics.lineStyle(1, p.shadow, 0.3);
    graphics.beginPath();
    graphics.arc(x, y, PIECE_RADIUS - 2, Math.PI * 0.5, Math.PI * 1.3);
    graphics.strokePath();

    // === EFFET DE VERNIS (subtil) ===
    graphics.fillStyle(0xffffff, 0.03);
    graphics.fillCircle(x - 2, y - 2, PIECE_RADIUS * 0.6);

    // === COURONNE DE DAME ===
    if (type === PieceType.KING) {
      this.drawLuxuryKingCrown(graphics, x, y, isWhite);
    }
  }

  /**
   * Dessine la couronne de dame (ancienne version)
   */
  private drawKingCrown(graphics: Phaser.GameObjects.Graphics, x: number, y: number, isWhite: boolean) {
    this.drawLuxuryKingCrown(graphics, x, y, isWhite);
  }

  /**
   * Dessine une couronne de dame luxueuse avec effets or et gemmes
   */
  private drawLuxuryKingCrown(graphics: Phaser.GameObjects.Graphics, x: number, y: number, isWhite: boolean) {
    // Palette or luxueux
    const gold = {
      dark: 0x8b6914,      // Or antique
      base: 0xd4af37,      // Or
      bright: 0xffd700,    // Or vif
      light: 0xffec8b,     // Or clair
      highlight: 0xfffacd, // Reflet
      shadow: 0x6b4c0a,    // Ombre
    };

    // Couleur de la gemme centrale (rubis pour blanc, saphir pour noir)
    const gem = isWhite
      ? { base: 0xdc143c, light: 0xff6b6b, dark: 0x8b0000 }  // Rubis
      : { base: 0x1e90ff, light: 0x87ceeb, dark: 0x00008b }; // Saphir

    // === OMBRE DE LA COURONNE ===
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillCircle(x + 1, y + 1, 12);

    // === BASE DE LA COURONNE (anneau d'or) ===
    // Anneau extérieur avec dégradé
    for (let i = 5; i >= 0; i--) {
      const ratio = i / 5;
      const ringColor = this.lerpColor(gold.shadow, gold.base, ratio);
      graphics.fillStyle(ringColor, 1);
      graphics.fillCircle(x, y, 12 - i * 0.3);
    }

    // === SURFACE DORÉE AVEC DÉGRADÉ ===
    const crownSteps = 8;
    for (let i = crownSteps; i >= 0; i--) {
      const ratio = i / crownSteps;
      const radius = 10 * (0.3 + ratio * 0.7);
      let crownColor: number;

      if (ratio > 0.6) {
        crownColor = this.lerpColor(gold.base, gold.dark, (ratio - 0.6) / 0.4);
      } else {
        crownColor = this.lerpColor(gold.bright, gold.base, ratio / 0.6);
      }

      graphics.fillStyle(crownColor, 1);
      graphics.fillCircle(x, y, radius);
    }

    // === REFLET PRINCIPAL SUR L'OR ===
    graphics.fillStyle(gold.highlight, 0.7);
    graphics.fillEllipse(x - 3, y - 4, 6, 3);
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(x - 4, y - 4, 2);

    // === GRAVURES DÉCORATIVES ===
    graphics.lineStyle(1, gold.shadow, 0.4);
    graphics.strokeCircle(x, y, 7);
    graphics.strokeCircle(x, y, 4);

    // === GEMME CENTRALE ===
    // Ombre de la gemme
    graphics.fillStyle(0x000000, 0.4);
    graphics.fillCircle(x + 0.5, y + 0.5, 4);

    // Corps de la gemme avec dégradé
    for (let i = 4; i >= 0; i--) {
      const gemRatio = i / 4;
      const gemColor = this.lerpColor(gem.light, gem.base, gemRatio);
      graphics.fillStyle(gemColor, 1);
      graphics.fillCircle(x, y, 3.5 - i * 0.3);
    }

    // Reflet de la gemme
    graphics.fillStyle(0xffffff, 0.6);
    graphics.fillEllipse(x - 1, y - 1.5, 2, 1.5);
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillCircle(x - 1.5, y - 1.5, 0.8);

    // === POINTS DÉCORATIFS (petites gemmes) ===
    const numPoints = 5;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(angle) * 7;
      const py = y + Math.sin(angle) * 7;

      // Mini gemme
      graphics.fillStyle(gold.bright, 1);
      graphics.fillCircle(px, py, 2);
      graphics.fillStyle(gold.highlight, 0.8);
      graphics.fillCircle(px - 0.5, py - 0.5, 1);
    }

    // === BORDURE BRILLANTE FINALE ===
    graphics.lineStyle(1, gold.light, 0.6);
    graphics.strokeCircle(x, y, 11);

    // Éclat lumineux en haut
    graphics.lineStyle(1, 0xffffff, 0.4);
    graphics.beginPath();
    graphics.arc(x, y, 11, -Math.PI * 0.8, -Math.PI * 0.2);
    graphics.strokePath();
  }

  /**
   * Interpole entre deux couleurs
   */
  private lerpColor(color1: number, color2: number, ratio: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return (r << 16) | (g << 8) | b;
  }

  /**
   * Met à jour les surbrillances avec effets visuels modernes
   */
  private updateHighlights() {
    this.highlightGraphics.clear();

    // En mode replay, surligner le dernier coup joué
    if (this.replayMode && this.replayIndex >= 0 && this.replayIndex < this.moveHistory.length) {
      const move = this.moveHistory[this.replayIndex];

      // Case de départ (avec dégradé)
      this.drawHighlightedSquare(
        move.from.col, move.from.row,
        0x9966ff, 0.25
      );

      // Case d'arrivée (plus lumineuse)
      this.drawHighlightedSquare(
        move.to.col, move.to.row,
        0x9966ff, 0.45
      );

      // Flèche de mouvement
      this.drawMoveArrow(move.from, move.to, 0x9966ff);

      return;
    }

    if (this.selectedPos) {
      // === SURBRILLANCE DE LA PIÈCE SÉLECTIONNÉE ===
      this.drawSelectedSquare(this.selectedPos.col, this.selectedPos.row);

      // === SURBRILLANCE DES COUPS LÉGAUX ===
      const legalMoves = this.engine.getLegalMoves();
      const movesForSelected = legalMoves.filter(
        m => m.from.row === this.selectedPos!.row && m.from.col === this.selectedPos!.col
      );

      for (const move of movesForSelected) {
        if (move.captures.length > 0) {
          // Case de capture (rouge avec effet pulsant)
          this.drawCaptureSquare(move.to.col, move.to.row);
        } else {
          // Case de déplacement (vert avec indicateur)
          this.drawMoveSquare(move.to.col, move.to.row);
        }
      }
    }
  }

  /**
   * Dessine une case surlignée avec dégradé
   */
  private drawHighlightedSquare(col: number, row: number, color: number, alpha: number) {
    const x = BOARD_OFFSET + col * CELL_SIZE;
    const y = BOARD_OFFSET + row * CELL_SIZE;
    const cx = x + CELL_SIZE / 2;
    const cy = y + CELL_SIZE / 2;

    // Fond principal
    this.highlightGraphics.fillStyle(color, alpha);
    this.highlightGraphics.fillRect(x, y, CELL_SIZE, CELL_SIZE);

    // Bordure lumineuse
    this.highlightGraphics.lineStyle(2, color, alpha + 0.3);
    this.highlightGraphics.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  }

  /**
   * Dessine la case de la pièce sélectionnée
   */
  private drawSelectedSquare(col: number, row: number) {
    const x = BOARD_OFFSET + col * CELL_SIZE;
    const y = BOARD_OFFSET + row * CELL_SIZE;
    const cx = x + CELL_SIZE / 2;
    const cy = y + CELL_SIZE / 2;

    // Halo lumineux vert
    this.highlightGraphics.fillStyle(0x44ff44, 0.15);
    this.highlightGraphics.fillRect(x, y, CELL_SIZE, CELL_SIZE);

    // Cercle de sélection
    this.highlightGraphics.lineStyle(3, 0x44ff44, 0.8);
    this.highlightGraphics.strokeCircle(cx, cy, PIECE_RADIUS + 4);

    // Effet de brillance intérieure
    this.highlightGraphics.lineStyle(1, 0xaaffaa, 0.5);
    this.highlightGraphics.strokeCircle(cx, cy, PIECE_RADIUS + 2);

    // Coins lumineux
    const cornerSize = 8;
    this.highlightGraphics.lineStyle(2, 0x88ff88, 0.9);
    // Coin haut-gauche
    this.highlightGraphics.beginPath();
    this.highlightGraphics.moveTo(x + 2, y + cornerSize + 2);
    this.highlightGraphics.lineTo(x + 2, y + 2);
    this.highlightGraphics.lineTo(x + cornerSize + 2, y + 2);
    this.highlightGraphics.strokePath();
    // Coin haut-droit
    this.highlightGraphics.beginPath();
    this.highlightGraphics.moveTo(x + CELL_SIZE - cornerSize - 2, y + 2);
    this.highlightGraphics.lineTo(x + CELL_SIZE - 2, y + 2);
    this.highlightGraphics.lineTo(x + CELL_SIZE - 2, y + cornerSize + 2);
    this.highlightGraphics.strokePath();
    // Coin bas-gauche
    this.highlightGraphics.beginPath();
    this.highlightGraphics.moveTo(x + 2, y + CELL_SIZE - cornerSize - 2);
    this.highlightGraphics.lineTo(x + 2, y + CELL_SIZE - 2);
    this.highlightGraphics.lineTo(x + cornerSize + 2, y + CELL_SIZE - 2);
    this.highlightGraphics.strokePath();
    // Coin bas-droit
    this.highlightGraphics.beginPath();
    this.highlightGraphics.moveTo(x + CELL_SIZE - cornerSize - 2, y + CELL_SIZE - 2);
    this.highlightGraphics.lineTo(x + CELL_SIZE - 2, y + CELL_SIZE - 2);
    this.highlightGraphics.lineTo(x + CELL_SIZE - 2, y + CELL_SIZE - cornerSize - 2);
    this.highlightGraphics.strokePath();
  }

  /**
   * Dessine une case de déplacement possible
   */
  private drawMoveSquare(col: number, row: number) {
    const x = BOARD_OFFSET + col * CELL_SIZE;
    const y = BOARD_OFFSET + row * CELL_SIZE;
    const cx = x + CELL_SIZE / 2;
    const cy = y + CELL_SIZE / 2;

    // Fond subtil
    this.highlightGraphics.fillStyle(0x44ff44, 0.12);
    this.highlightGraphics.fillRect(x, y, CELL_SIZE, CELL_SIZE);

    // Indicateur central (point)
    this.highlightGraphics.fillStyle(0x44ff44, 0.7);
    this.highlightGraphics.fillCircle(cx, cy, 8);

    // Anneau lumineux
    this.highlightGraphics.lineStyle(2, 0x88ff88, 0.4);
    this.highlightGraphics.strokeCircle(cx, cy, 12);

    // Halo extérieur
    this.highlightGraphics.fillStyle(0x44ff44, 0.15);
    this.highlightGraphics.fillCircle(cx, cy, 18);
  }

  /**
   * Dessine une case de capture possible
   */
  private drawCaptureSquare(col: number, row: number) {
    const x = BOARD_OFFSET + col * CELL_SIZE;
    const y = BOARD_OFFSET + row * CELL_SIZE;
    const cx = x + CELL_SIZE / 2;
    const cy = y + CELL_SIZE / 2;

    // Fond rouge
    this.highlightGraphics.fillStyle(0xff4444, 0.2);
    this.highlightGraphics.fillRect(x, y, CELL_SIZE, CELL_SIZE);

    // Croix de capture
    this.highlightGraphics.lineStyle(3, 0xff4444, 0.8);
    const crossSize = 10;
    this.highlightGraphics.beginPath();
    this.highlightGraphics.moveTo(cx - crossSize, cy - crossSize);
    this.highlightGraphics.lineTo(cx + crossSize, cy + crossSize);
    this.highlightGraphics.moveTo(cx + crossSize, cy - crossSize);
    this.highlightGraphics.lineTo(cx - crossSize, cy + crossSize);
    this.highlightGraphics.strokePath();

    // Cercle de danger
    this.highlightGraphics.lineStyle(2, 0xff6666, 0.6);
    this.highlightGraphics.strokeCircle(cx, cy, 16);

    // Pulsation (effet statique)
    this.highlightGraphics.fillStyle(0xff0000, 0.1);
    this.highlightGraphics.fillCircle(cx, cy, 22);

    // Bordure d'avertissement
    this.highlightGraphics.lineStyle(1, 0xff8888, 0.5);
    this.highlightGraphics.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
  }

  /**
   * Dessine une flèche de mouvement
   */
  private drawMoveArrow(from: Position, to: Position, color: number) {
    const fromX = BOARD_OFFSET + from.col * CELL_SIZE + CELL_SIZE / 2;
    const fromY = BOARD_OFFSET + from.row * CELL_SIZE + CELL_SIZE / 2;
    const toX = BOARD_OFFSET + to.col * CELL_SIZE + CELL_SIZE / 2;
    const toY = BOARD_OFFSET + to.row * CELL_SIZE + CELL_SIZE / 2;

    // Ligne de la flèche
    this.highlightGraphics.lineStyle(3, color, 0.6);
    this.highlightGraphics.beginPath();
    this.highlightGraphics.moveTo(fromX, fromY);
    this.highlightGraphics.lineTo(toX, toY);
    this.highlightGraphics.strokePath();

    // Pointe de la flèche
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowSize = 10;
    this.highlightGraphics.fillStyle(color, 0.8);
    this.highlightGraphics.beginPath();
    this.highlightGraphics.moveTo(toX, toY);
    this.highlightGraphics.lineTo(
      toX - arrowSize * Math.cos(angle - Math.PI / 6),
      toY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    this.highlightGraphics.lineTo(
      toX - arrowSize * Math.cos(angle + Math.PI / 6),
      toY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    this.highlightGraphics.closePath();
    this.highlightGraphics.fillPath();
  }

  /**
   * Met à jour le texte de statut
   */
  private updateStatus() {
    if (this.replayMode) {
      this.statusText.setText(`Mode Replay - Coup ${this.replayIndex + 1}/${this.moveHistory.length}`);
      return;
    }

    if (this.engine.isGameOver()) {
      const info = this.engine.getGameInfo();
      let message = '';
      if (info.result === 'white_wins') {
        message = 'Les Blancs gagnent !';
      } else if (info.result === 'black_wins') {
        message = 'Les Noirs gagnent !';
      } else {
        message = 'Match nul !';
      }
      this.statusText.setText(message);
      this.gameOver = true;
    } else if (this.aiThinking) {
      this.statusText.setText('L\'IA réfléchit...');
    } else {
      const currentPlayer = this.engine.getCurrentPlayer();
      const player = currentPlayer === Color.WHITE ? 'Blancs' : 'Noirs';
      const isYourTurn = this.mode === 'ai' && currentPlayer === this.playerColor;
      this.statusText.setText(`Tour des ${player}${isYourTurn ? ' (à vous !)' : ''}`);
    }
  }

  /**
   * Gère les clics sur le plateau
   */
  private handleClick(pointer: Phaser.Input.Pointer) {
    // Ignorer les clics en mode replay
    if (this.replayMode || this.gameOver || this.aiThinking) {
      if (this.replayMode) audioManager.play('invalid');
      return;
    }

    // Vérifie si c'est le tour de l'IA
    if (this.mode === 'ai' && this.engine.getCurrentPlayer() !== this.playerColor) {
      audioManager.play('invalid');
      return;
    }

    const col = Math.floor((pointer.x - BOARD_OFFSET) / CELL_SIZE);
    const row = Math.floor((pointer.y - BOARD_OFFSET) / CELL_SIZE);

    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return;
    }

    const board = this.engine.getBoard();
    const clickedPiece = board.getPiece({ row, col });
    const currentPlayer = this.engine.getCurrentPlayer();
    const legalMoves = this.engine.getLegalMoves();

    if (this.selectedPos) {
      const move = legalMoves.find(
        m =>
          m.from.row === this.selectedPos!.row &&
          m.from.col === this.selectedPos!.col &&
          m.to.row === row &&
          m.to.col === col
      );

      if (move) {
        this.executeMove(move);
        this.selectedPos = null;
        this.updateHighlights();
        return;
      }
    }

    if (clickedPiece && clickedPiece.color === currentPlayer) {
      const hasLegalMoves = legalMoves.some(
        m => m.from.row === row && m.from.col === col
      );

      if (hasLegalMoves) {
        audioManager.play('click');
        this.selectedPos = { row, col };
        this.updateHighlights();
      } else {
        audioManager.play('invalid');
      }
    } else {
      if (this.selectedPos) {
        audioManager.play('invalid');
      }
      this.selectedPos = null;
      this.updateHighlights();
    }
  }

  /**
   * Exécute un coup via le moteur
   */
  private executeMove(move: Move) {
    // Son de capture ou de déplacement
    if (move.captures.length > 0) {
      audioManager.play('capture');
      for (const captured of move.captures) {
        this.showCaptureEffect(captured);
      }
    } else {
      audioManager.play('move');
    }

    // Animation de déplacement de la pièce
    this.animateMove(move);

    this.engine.makeMove(move);

    // Enregistrer le coup dans l'historique
    this.moveHistory.push(move);
    this.moveNotations.push(this.moveToNotation(move));
    this.savedEngineStates.push(this.engine.toFEN());

    // Notifier React
    this.notifyHistoryChange();

    if (move.isPromotion) {
      audioManager.play('promotion');
      this.showPromotionEffect(move.to);
    }

    // Redessiner après l'animation
    this.time.delayedCall(150, () => {
      this.drawPieces();
      this.updateStatus();

      if (this.engine.isGameOver()) {
        this.gameOver = true;
        // Son de victoire ou défaite
        const info = this.engine.getGameInfo();
        const playerWon = (info.result === 'white_wins' && this.playerColor === Color.WHITE) ||
                          (info.result === 'black_wins' && this.playerColor === Color.BLACK);
        if (this.mode === 'ai') {
          audioManager.play(playerWon ? 'victory' : 'defeat');
        } else {
          audioManager.play('victory');
        }
        if (sceneCallbacksRef.current.onGameOver) {
          sceneCallbacksRef.current.onGameOver(info.result, info.reason);
        }
        return;
      }

      if (this.mode === 'ai' && this.engine.getCurrentPlayer() !== this.playerColor && !this.gameOver) {
        this.time.delayedCall(300, () => this.playAIMove());
      }
    });
  }

  /**
   * Animation de déplacement d'une pièce réaliste
   */
  private animateMove(move: Move) {
    const fromX = BOARD_OFFSET + move.from.col * CELL_SIZE + CELL_SIZE / 2;
    const fromY = BOARD_OFFSET + move.from.row * CELL_SIZE + CELL_SIZE / 2;
    const toX = BOARD_OFFSET + move.to.col * CELL_SIZE + CELL_SIZE / 2;
    const toY = BOARD_OFFSET + move.to.row * CELL_SIZE + CELL_SIZE / 2;

    // Créer une pièce temporaire pour l'animation
    const board = this.engine.getBoard();
    const piece = board.getPiece(move.from);
    if (!piece) return;

    const graphics = this.add.graphics();
    const isWhite = piece.color === Color.WHITE;

    // Couleurs réalistes
    const baseColor = isWhite ? 0xf5deb3 : 0x4a3728;
    const darkColor = isWhite ? 0xd4a574 : 0x2d1f15;
    const lightColor = isWhite ? 0xfff8dc : 0x6b4423;
    const edgeColor = isWhite ? 0xc4a060 : 0x1a1209;
    const rimColor = isWhite ? 0xe8d4a8 : 0x3d2a1a;

    // Ombre
    graphics.fillStyle(0x000000, 0.35);
    graphics.fillCircle(3, 4, PIECE_RADIUS + 1);

    // Épaisseur (côté du pion)
    for (let i = 5; i >= 0; i--) {
      const shade = this.lerpColor(edgeColor, darkColor, i / 5);
      graphics.fillStyle(shade, 1);
      graphics.fillCircle(0, i, PIECE_RADIUS);
    }

    // Face supérieure avec gradient
    const gradientSteps = 8;
    for (let i = gradientSteps; i >= 0; i--) {
      const ratio = i / gradientSteps;
      const radius = PIECE_RADIUS * (0.3 + ratio * 0.7);
      const gradColor = this.lerpColor(lightColor, baseColor, ratio);
      graphics.fillStyle(gradColor, 1);
      graphics.fillCircle(0, 0, radius);
    }

    // Reflet
    graphics.fillStyle(0xffffff, isWhite ? 0.4 : 0.15);
    graphics.fillEllipse(-5, -6, 12, 8);

    // Rainures
    graphics.lineStyle(1, isWhite ? 0xc9a86c : 0x352518, 0.3);
    graphics.strokeCircle(0, 0, PIECE_RADIUS * 0.7);
    graphics.strokeCircle(0, 0, PIECE_RADIUS * 0.5);

    // Bord
    graphics.lineStyle(2, rimColor, 0.8);
    graphics.strokeCircle(0, 0, PIECE_RADIUS - 1);

    // Couronne si dame
    if (piece.type === PieceType.KING) {
      this.drawAnimatedKingCrown(graphics, isWhite);
    }

    graphics.setPosition(fromX, fromY);

    // Animation avec léger effet de saut
    this.tweens.add({
      targets: graphics,
      x: toX,
      y: toY,
      duration: 180,
      ease: 'Quad.easeInOut',
      onComplete: () => graphics.destroy(),
    });

    // Effet d'élévation pendant le déplacement
    this.tweens.add({
      targets: graphics,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 90,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Dessine la couronne pour l'animation
   */
  private drawAnimatedKingCrown(graphics: Phaser.GameObjects.Graphics, isWhite: boolean) {
    const crownColor = 0xffd700;
    const crownDark = 0xb8860b;
    const crownHighlight = 0xffec8b;

    graphics.fillStyle(crownDark, 1);
    graphics.fillCircle(0, 0, 11);
    graphics.fillStyle(crownColor, 1);
    graphics.fillCircle(0, 0, 9);
    graphics.fillStyle(crownHighlight, 0.6);
    graphics.fillEllipse(-2, -3, 6, 4);

    graphics.fillStyle(isWhite ? 0x8b4513 : 0x1a1a1a, 1);
    graphics.fillCircle(0, 0, 3);

    const points = 5;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * 6;
      const py = Math.sin(angle) * 6;
      graphics.fillCircle(px, py, 1.5);
    }

    graphics.lineStyle(1.5, crownHighlight, 0.8);
    graphics.strokeCircle(0, 0, 10);
  }

  /**
   * Effet visuel de capture spectaculaire
   */
  private showCaptureEffect(pos: Position) {
    const x = BOARD_OFFSET + pos.col * CELL_SIZE + CELL_SIZE / 2;
    const y = BOARD_OFFSET + pos.row * CELL_SIZE + CELL_SIZE / 2;

    // === ONDE DE CHOC ===
    for (let i = 0; i < 3; i++) {
      const ring = this.add.circle(x, y, 5, 0x000000, 0);
      ring.setStrokeStyle(3 - i, 0xff4444, 0.8);

      this.tweens.add({
        targets: ring,
        scale: 4 + i,
        alpha: 0,
        duration: 400 + i * 100,
        delay: i * 50,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.destroy(),
      });
    }

    // === FLASH LUMINEUX CENTRAL ===
    const flash = this.add.circle(x, y, PIECE_RADIUS, 0xffffff, 0.8);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 150,
      ease: 'Power3',
      onComplete: () => flash.destroy(),
    });

    // === ÉCLATS DE LUMIÈRE ===
    const sparkColors = [0xffffff, 0xffdd44, 0xff8844, 0xff4444];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spark = this.add.graphics();

      // Dessiner une traînée lumineuse
      spark.fillStyle(sparkColors[i % sparkColors.length], 1);
      spark.fillEllipse(0, 0, 8, 3);
      spark.setPosition(x, y);
      spark.setRotation(angle);

      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 50,
        y: y + Math.sin(angle) * 50,
        alpha: 0,
        scaleX: 0.3,
        duration: 300,
        ease: 'Power2',
        onComplete: () => spark.destroy(),
      });
    }

    // === PARTICULES DE BOIS (débris) ===
    const woodColors = [0x8b4513, 0xa0522d, 0xcd853f, 0xd2691e, 0xdeb887];
    for (let i = 0; i < 20; i++) {
      const color = woodColors[Math.floor(Math.random() * woodColors.length)];
      const size = 2 + Math.random() * 4;
      const particle = this.add.rectangle(x, y, size, size * 0.6, color);
      particle.setRotation(Math.random() * Math.PI);

      const angle = Math.random() * Math.PI * 2;
      const distance = 25 + Math.random() * 35;
      const gravity = 40 + Math.random() * 30;

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance + gravity,
        rotation: particle.rotation + (Math.random() - 0.5) * 6,
        alpha: 0,
        scale: 0.3,
        duration: 400 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }

    // === FUMÉE/POUSSIÈRE ===
    for (let i = 0; i < 6; i++) {
      const smoke = this.add.circle(
        x + (Math.random() - 0.5) * 20,
        y + (Math.random() - 0.5) * 20,
        8 + Math.random() * 8,
        0x888888,
        0.3
      );

      this.tweens.add({
        targets: smoke,
        y: smoke.y - 30 - Math.random() * 20,
        x: smoke.x + (Math.random() - 0.5) * 30,
        scale: 2 + Math.random(),
        alpha: 0,
        duration: 600 + Math.random() * 300,
        delay: Math.random() * 100,
        ease: 'Sine.easeOut',
        onComplete: () => smoke.destroy(),
      });
    }
  }

  /**
   * Effet visuel de promotion magique et spectaculaire
   */
  private showPromotionEffect(pos: Position) {
    const x = BOARD_OFFSET + pos.col * CELL_SIZE + CELL_SIZE / 2;
    const y = BOARD_OFFSET + pos.row * CELL_SIZE + CELL_SIZE / 2;

    // === PILIER DE LUMIÈRE ===
    const pillar = this.add.graphics();
    pillar.fillStyle(0xffd700, 0.4);
    pillar.fillRect(-15, -100, 30, 100);
    pillar.fillStyle(0xffffff, 0.3);
    pillar.fillRect(-8, -100, 16, 100);
    pillar.setPosition(x, y);

    this.tweens.add({
      targets: pillar,
      alpha: 0,
      scaleY: 1.5,
      duration: 800,
      ease: 'Power2',
      onComplete: () => pillar.destroy(),
    });

    // === EXPLOSION DE LUMIÈRE DORÉE ===
    const burstColors = [0xffd700, 0xffec8b, 0xffffff, 0xdaa520];
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + layer * 0.15;
        const color = burstColors[Math.floor(Math.random() * burstColors.length)];

        const ray = this.add.graphics();
        ray.fillStyle(color, 0.8);
        ray.fillTriangle(0, 0, -3, -30 - layer * 10, 3, -30 - layer * 10);
        ray.setPosition(x, y);
        ray.setRotation(angle);

        this.tweens.add({
          targets: ray,
          scaleY: 2,
          alpha: 0,
          rotation: angle + 0.3,
          duration: 500 + layer * 100,
          delay: layer * 50,
          ease: 'Power2',
          onComplete: () => ray.destroy(),
        });
      }
    }

    // === ANNEAUX DORÉS CONCENTRIQUES ===
    for (let i = 0; i < 4; i++) {
      const ring = this.add.circle(x, y, 8, 0x000000, 0);
      ring.setStrokeStyle(3 - i * 0.5, 0xffd700, 0.9 - i * 0.2);

      this.tweens.add({
        targets: ring,
        scale: 4 + i * 1.5,
        alpha: 0,
        duration: 600 + i * 150,
        delay: i * 80,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.destroy(),
      });
    }

    // === ÉTOILES SCINTILLANTES ===
    for (let i = 0; i < 12; i++) {
      const star = this.add.star(x, y, 5, 4, 10, 0xffd700);
      star.setStrokeStyle(1, 0xffffff);
      const angle = (i / 12) * Math.PI * 2;
      const distance = 50 + Math.random() * 30;
      const delay = Math.random() * 200;

      // Animation spirale
      this.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance - 20,
        rotation: Math.PI * 3,
        scale: { from: 0.3, to: 1.2 },
        duration: 600,
        delay: delay,
        ease: 'Back.easeOut',
      });

      this.tweens.add({
        targets: star,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        delay: delay + 500,
        ease: 'Power2',
        onComplete: () => star.destroy(),
      });
    }

    // === PARTICULES MAGIQUES (paillettes) ===
    for (let i = 0; i < 30; i++) {
      const sparkle = this.add.circle(
        x + (Math.random() - 0.5) * 40,
        y + (Math.random() - 0.5) * 40,
        1 + Math.random() * 2,
        Math.random() > 0.5 ? 0xffd700 : 0xffffff,
        1
      );

      const targetY = sparkle.y - 60 - Math.random() * 40;
      const wobble = (Math.random() - 0.5) * 50;

      this.tweens.add({
        targets: sparkle,
        y: targetY,
        x: sparkle.x + wobble,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.3 },
        duration: 800 + Math.random() * 400,
        delay: Math.random() * 300,
        ease: 'Sine.easeOut',
        onComplete: () => sparkle.destroy(),
      });

      // Scintillement
      this.tweens.add({
        targets: sparkle,
        alpha: 0.3,
        yoyo: true,
        repeat: 3,
        duration: 100,
        delay: Math.random() * 200,
      });
    }

    // === HALO FINAL ===
    const halo = this.add.circle(x, y, PIECE_RADIUS + 5, 0xffd700, 0.5);
    this.tweens.add({
      targets: halo,
      scale: 2.5,
      alpha: 0,
      duration: 600,
      delay: 200,
      ease: 'Power2',
      onComplete: () => halo.destroy(),
    });

    // === COURONNE QUI DESCEND DU CIEL ===
    const crownIcon = this.add.graphics();
    crownIcon.fillStyle(0xffd700, 1);
    crownIcon.fillCircle(0, 0, 8);
    crownIcon.fillStyle(0xffffff, 0.5);
    crownIcon.fillCircle(-2, -2, 3);
    crownIcon.setPosition(x, y - 80);
    crownIcon.setScale(1.5);
    crownIcon.setAlpha(0);

    this.tweens.add({
      targets: crownIcon,
      y: y,
      alpha: { from: 0, to: 1 },
      scale: 1,
      duration: 400,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: crownIcon,
          alpha: 0,
          scale: 1.5,
          duration: 200,
          delay: 100,
          onComplete: () => crownIcon.destroy(),
        });
      },
    });
  }

  /**
   * Joue un coup de l'IA
   */
  private playAIMove() {
    if (this.gameOver || this.replayMode) return;

    this.aiThinking = true;
    this.updateStatus();

    this.time.delayedCall(100, () => {
      const result = this.ai.getBestMove(this.engine, this.difficulty);

      if (result) {
        console.log(`[IA ${this.getDifficultyName()}] Coup: profondeur=${result.depth}, ` +
          `nodes=${result.nodesEvaluated}, temps=${result.timeMs}ms, score=${result.score}`);

        this.aiThinking = false;
        this.executeMove(result.move);
      } else {
        this.aiThinking = false;
        this.updateStatus();
      }
    });
  }

  // ============ MÉTHODES PUBLIQUES POUR LE REPLAY ============

  /**
   * Active/désactive le mode replay
   */
  public setReplayMode(enabled: boolean) {
    this.replayMode = enabled;

    if (enabled) {
      this.replayIndex = this.moveHistory.length - 1;
    } else {
      // Restaurer le dernier état
      this.replayIndex = -1;
      this.restoreState(this.savedEngineStates.length - 1);
    }

    this.updateHighlights();
    this.updateStatus();
    this.notifyHistoryChange();
  }

  /**
   * Va au coup spécifié
   */
  public goToMove(index: number) {
    if (index < -1 || index >= this.moveHistory.length) return;

    this.replayMode = true;
    this.replayIndex = index;
    this.restoreState(index + 1); // +1 car savedEngineStates[0] est l'état initial

    this.drawPieces();
    this.updateHighlights();
    this.updateStatus();
    this.notifyHistoryChange();
  }

  /**
   * Va au premier coup
   */
  public goToFirst() {
    this.goToMove(-1);
  }

  /**
   * Va au coup précédent
   */
  public goToPrevious() {
    if (this.replayIndex > -1) {
      this.goToMove(this.replayIndex - 1);
    }
  }

  /**
   * Va au coup suivant
   */
  public goToNext() {
    if (this.replayIndex < this.moveHistory.length - 1) {
      this.goToMove(this.replayIndex + 1);
    }
  }

  /**
   * Va au dernier coup
   */
  public goToLast() {
    this.goToMove(this.moveHistory.length - 1);
  }

  /**
   * Restaure un état du moteur
   */
  private restoreState(stateIndex: number) {
    if (stateIndex >= 0 && stateIndex < this.savedEngineStates.length) {
      this.engine.loadFEN(this.savedEngineStates[stateIndex]);
    }
  }

  /**
   * Retourne l'historique des coups
   */
  public getMoveHistory(): string[] {
    return [...this.moveNotations];
  }

  /**
   * Retourne l'index actuel en mode replay
   */
  public getCurrentMoveIndex(): number {
    return this.replayMode ? this.replayIndex : this.moveNotations.length - 1;
  }

  /**
   * Retourne si le mode replay est actif
   */
  public isInReplayMode(): boolean {
    return this.replayMode;
  }

  /**
   * Exporte la partie en PDN
   */
  public exportPDN(): string {
    const info = this.engine.getGameInfo();
    const result = info.result === 'white_wins' ? '1-0' :
                   info.result === 'black_wins' ? '0-1' :
                   info.result === 'draw' ? '1/2-1/2' : '*';

    const headers = [
      `[Event "Partie de dames"]`,
      `[Site "T_C_C_DAMES"]`,
      `[Date "${new Date().toISOString().split('T')[0].replace(/-/g, '.')}"]`,
      `[White "${this.mode === 'ai' && this.playerColor === Color.BLACK ? 'IA' : 'Joueur'}"]`,
      `[Black "${this.mode === 'ai' && this.playerColor === Color.WHITE ? 'IA' : 'Joueur'}"]`,
      `[Result "${result}"]`,
      `[GameType "20"]`,
      '',
    ];

    // Coups avec numérotation
    let movesStr = '';
    for (let i = 0; i < this.moveNotations.length; i++) {
      if (i % 2 === 0) {
        movesStr += `${Math.floor(i / 2) + 1}. `;
      }
      movesStr += this.moveNotations[i] + ' ';
    }
    movesStr += result;

    return headers.join('\n') + movesStr;
  }

  /**
   * Charge une partie depuis un PDN
   */
  public loadPDN(pdnContent: string): boolean {
    try {
      // Parser simple - extraire les coups
      const movesMatch = pdnContent.match(/\d+[-x]\d+/g);
      if (!movesMatch) return false;

      // Réinitialiser la partie
      this.engine.newGame();
      this.moveHistory = [];
      this.moveNotations = [];
      this.savedEngineStates = [this.engine.toFEN()];
      this.gameOver = false;
      this.replayMode = false;

      // Jouer les coups
      for (const notation of movesMatch) {
        const parseResult = this.parseNotation(notation);
        if (!parseResult) continue;

        const legalMoves = this.engine.getLegalMoves();
        const move = legalMoves.find(
          m => m.from.row === parseResult.from.row &&
               m.from.col === parseResult.from.col &&
               m.to.row === parseResult.to.row &&
               m.to.col === parseResult.to.col
        );

        if (move) {
          this.engine.makeMove(move);
          this.moveHistory.push(move);
          this.moveNotations.push(notation);
          this.savedEngineStates.push(this.engine.toFEN());
        }
      }

      this.drawPieces();
      this.updateHighlights();
      this.updateStatus();
      this.notifyHistoryChange();

      return true;
    } catch (e) {
      console.error('Erreur lors du chargement du PDN:', e);
      return false;
    }
  }

  /**
   * Parse une notation PDN en positions
   */
  private parseNotation(notation: string): { from: Position; to: Position } | null {
    const match = notation.match(/^(\d+)[-x](\d+)$/);
    if (!match) return null;

    const fromSquare = parseInt(match[1]);
    const toSquare = parseInt(match[2]);

    // Conversion Manoury vers position
    const from = this.manouryToPos(fromSquare);
    const to = this.manouryToPos(toSquare);

    if (!from || !to) return null;

    return { from, to };
  }

  /**
   * Convertit une case Manoury en position
   */
  private manouryToPos(square: number): Position | null {
    if (square < 1 || square > 50) return null;

    const index = square - 1;
    const row = Math.floor(index / 5);
    const colOffset = row % 2 === 0 ? 1 : 0;
    const col = (index % 5) * 2 + colOffset;

    return { row, col };
  }
}

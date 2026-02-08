import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { useSocket } from '../context/SocketContext';

interface Player {
  id: string;
  username: string;
  color?: 'white' | 'black';
  isReady: boolean;
}

interface GameState {
  board: (Piece | null)[][];
  currentPlayer: 'white' | 'black';
  moveHistory: any[];
  capturedPieces: { white: number; black: number };
  status: 'ongoing' | 'white_wins' | 'black_wins' | 'draw';
}

interface Piece {
  color: 'white' | 'black';
  isKing: boolean;
}

interface OnlineGameProps {
  roomId: string;
  playerId: string;
  initialPlayers: Player[];
  onLeave: () => void;
}

// Variables globales pour la communication avec Phaser
let globalSocket: any = null;
let globalGameState: GameState | null = null;
let globalPlayerColor: 'white' | 'black' = 'white';
let globalOnStateUpdate: ((state: GameState) => void) | null = null;

// Scène Phaser définie en dehors du composant React
class OnlineGameScene extends Phaser.Scene {
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private pieces: Map<string, Phaser.GameObjects.Container> = new Map();
  private selectedPiece: { row: number; col: number } | null = null;
  private validMoves: Phaser.GameObjects.Graphics[] = [];

  private readonly BOARD_SIZE = 10;
  private readonly CELL_SIZE = 55;
  private readonly BOARD_OFFSET = 25;

  constructor() {
    super({ key: 'OnlineGameScene' });
  }

  create() {
    this.boardGraphics = this.add.graphics();
    this.drawBoard();

    // Appliquer l'état initial si disponible
    if (globalGameState) {
      this.renderGameState(globalGameState);
    }

    // S'abonner aux mises à jour
    globalOnStateUpdate = (state: GameState) => {
      this.renderGameState(state);
    };
  }

  drawBoard() {
    this.boardGraphics.clear();

    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        const x = this.BOARD_OFFSET + col * this.CELL_SIZE;
        const y = this.BOARD_OFFSET + row * this.CELL_SIZE;

        const isLight = (row + col) % 2 === 0;
        this.boardGraphics.fillStyle(isLight ? 0xf0d9b5 : 0xb58863);
        this.boardGraphics.fillRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
      }
    }

    // Bordure
    this.boardGraphics.lineStyle(3, 0x8b4513);
    this.boardGraphics.strokeRect(
      this.BOARD_OFFSET,
      this.BOARD_OFFSET,
      this.BOARD_SIZE * this.CELL_SIZE,
      this.BOARD_SIZE * this.CELL_SIZE
    );
  }

  renderGameState(state: GameState) {
    globalGameState = state;
    this.clearPieces();
    this.clearValidMoves();

    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        const piece = state.board[row][col];
        if (piece) {
          this.createPiece(row, col, piece, state.currentPlayer);
        }
      }
    }
  }

  clearPieces() {
    this.pieces.forEach((piece) => piece.destroy());
    this.pieces.clear();
  }

  createPiece(row: number, col: number, piece: Piece, currentPlayer: 'white' | 'black') {
    const x = this.BOARD_OFFSET + col * this.CELL_SIZE + this.CELL_SIZE / 2;
    const y = this.BOARD_OFFSET + row * this.CELL_SIZE + this.CELL_SIZE / 2;

    const container = this.add.container(x, y);
    const radius = this.CELL_SIZE * 0.38;

    // Ombre
    const shadow = this.add.circle(2, 2, radius, 0x000000, 0.3);
    container.add(shadow);

    // Pièce
    const mainColor = piece.color === 'white' ? 0xffffff : 0x2c2c2c;
    const main = this.add.circle(0, 0, radius, mainColor);
    main.setStrokeStyle(2, piece.color === 'white' ? 0xcccccc : 0x1a1a1a);
    container.add(main);

    // Couronne pour les dames
    if (piece.isKing) {
      const crown = this.add.circle(0, 0, radius * 0.5, 0xffd700);
      container.add(crown);
    }

    // Rendre interactif seulement si c'est notre tour et notre couleur
    if (piece.color === globalPlayerColor && currentPlayer === globalPlayerColor) {
      container.setSize(radius * 2, radius * 2);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => this.onPieceClick(row, col));
    }

    this.pieces.set(`${row}-${col}`, container);
  }

  onPieceClick(row: number, col: number) {
    if (!globalSocket) return;

    this.clearValidMoves();
    this.selectedPiece = { row, col };

    // Demander les coups légaux au serveur
    globalSocket.emit('getLegalMoves', { from: { row, col } }, (moves: { row: number; col: number; isCapture: boolean }[]) => {
      if (moves && moves.length > 0) {
        for (const move of moves) {
          this.addValidMoveIndicator(move.row, move.col, move.isCapture);
        }
      }
    });
  }

  addValidMoveIndicator(row: number, col: number, isCapture = false) {
    const x = this.BOARD_OFFSET + col * this.CELL_SIZE + this.CELL_SIZE / 2;
    const y = this.BOARD_OFFSET + row * this.CELL_SIZE + this.CELL_SIZE / 2;

    const graphics = this.add.graphics();
    graphics.fillStyle(isCapture ? 0xff6b6b : 0x90ee90, 0.7);
    graphics.fillCircle(x, y, this.CELL_SIZE * 0.25);

    graphics.setInteractive(
      new Phaser.Geom.Circle(x, y, this.CELL_SIZE * 0.4),
      Phaser.Geom.Circle.Contains
    );
    graphics.on('pointerdown', () => this.onMoveClick(row, col));

    this.validMoves.push(graphics);
  }

  clearValidMoves() {
    this.validMoves.forEach((g) => g.destroy());
    this.validMoves = [];
  }

  onMoveClick(toRow: number, toCol: number) {
    if (!this.selectedPiece || !globalSocket) return;

    globalSocket.emit('makeMove', {
      from: this.selectedPiece,
      to: { row: toRow, col: toCol },
    });

    this.clearValidMoves();
    this.selectedPiece = null;
  }
}

function OnlineGame({ roomId, playerId, initialPlayers, onLeave }: OnlineGameProps) {
  const { socket } = useSocket();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [myColor, setMyColor] = useState<'white' | 'black' | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [gameOver, setGameOver] = useState<{ winner: string; reason: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<{ username: string; message: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Mettre à jour le socket global
  useEffect(() => {
    globalSocket = socket;
  }, [socket]);

  // Mettre à jour la couleur globale
  useEffect(() => {
    if (myColor) {
      globalPlayerColor = myColor;
    }
  }, [myColor]);

  // Initialiser Phaser quand la partie démarre
  useEffect(() => {
    if (!gameStarted || !containerRef.current) return;

    // Éviter de recréer le jeu s'il existe déjà
    if (gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 600,
      height: 600,
      parent: containerRef.current,
      backgroundColor: '#1a1a2e',
      scene: OnlineGameScene,
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
      },
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      globalOnStateUpdate = null;
      globalGameState = null;
    };
  }, [gameStarted]);

  // Écouter les événements socket
  useEffect(() => {
    if (!socket) return;

    socket.on('playerJoined', (player: Player) => {
      setPlayers((prev) => [...prev, player]);
    });

    socket.on('playersUpdate', (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    });

    socket.on('playerLeft', (leftPlayerId: string) => {
      setPlayers((prev) => prev.filter((p) => p.id !== leftPlayerId));
    });

    socket.on('playerReady', (readyPlayerId: string) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === readyPlayerId ? { ...p, isReady: true } : p))
      );
    });

    socket.on('gameStarted', (state: GameState) => {
      globalGameState = state;
      setGameStarted(true);
      setCurrentPlayer(state.currentPlayer);
    });

    socket.on('moveMade', (data: { move: any; gameState: GameState }) => {
      setCurrentPlayer(data.gameState.currentPlayer);
      if (globalOnStateUpdate) {
        globalOnStateUpdate(data.gameState);
      } else {
        globalGameState = data.gameState;
      }
    });

    socket.on('gameOver', (data: { winner: string; reason: string }) => {
      setGameOver(data);
    });

    socket.on('chatMessage', (data: { username: string; message: string }) => {
      setChatMessages((prev) => [...prev, data]);
    });

    socket.on('error', (message: string) => {
      console.error('Erreur serveur:', message);
    });

    return () => {
      socket.off('playerJoined');
      socket.off('playersUpdate');
      socket.off('playerLeft');
      socket.off('playerReady');
      socket.off('gameStarted');
      socket.off('moveMade');
      socket.off('gameOver');
      socket.off('chatMessage');
      socket.off('error');
    };
  }, [socket]);

  // Récupérer les infos de la room
  useEffect(() => {
    const me = players.find((p) => p.id === playerId);
    if (me?.color) {
      setMyColor(me.color);
      globalPlayerColor = me.color;
    }
  }, [players, playerId]);

  const handleReady = () => {
    if (socket) {
      socket.emit('setReady', !isReady);
      setIsReady(!isReady);
    }
  };

  const handleResign = () => {
    if (socket && window.confirm('Êtes-vous sûr de vouloir abandonner ?')) {
      socket.emit('resign');
    }
  };

  const handleLeave = () => {
    if (socket) {
      socket.emit('leaveRoom');
    }
    onLeave();
  };

  const handleSendChat = () => {
    if (socket && chatInput.trim()) {
      socket.emit('sendMessage', chatInput.trim());
      setChatInput('');
    }
  };

  return (
    <div className="online-game">
      <div className="game-area">
        <div className="game-header">
          <h2>Partie en ligne</h2>
          {myColor && (
            <span className={`my-color ${myColor}`}>
              Vous jouez les {myColor === 'white' ? 'Blancs' : 'Noirs'}
            </span>
          )}
        </div>

        {!gameStarted ? (
          <div className="waiting-room">
            <h3>Salle d'attente</h3>
            <div className="players-list">
              {players.map((p) => (
                <div key={p.id} className={`player ${p.isReady ? 'ready' : ''}`}>
                  <span>{p.username}</span>
                  <span className="color">{p.color === 'white' ? '⚪' : '⚫'}</span>
                  <span className="status">{p.isReady ? '✓ Prêt' : 'En attente'}</span>
                </div>
              ))}
              {players.length < 2 && (
                <div className="waiting-opponent">
                  En attente d'un adversaire...
                </div>
              )}
            </div>
            <button
              className={`btn ${isReady ? 'secondary' : 'primary'}`}
              onClick={handleReady}
              disabled={players.length < 2}
            >
              {isReady ? 'Annuler' : 'Prêt !'}
            </button>
          </div>
        ) : (
          <>
            <div className="turn-indicator">
              Tour : {currentPlayer === 'white' ? 'Blancs ⚪' : 'Noirs ⚫'}
              {currentPlayer === myColor && ' (À vous !)'}
            </div>
            <div ref={containerRef} className="game-canvas" style={{ width: 600, height: 600 }} />
          </>
        )}

        {gameOver && (
          <div className="game-over-overlay">
            <div className="game-over-modal">
              <h2>Partie terminée</h2>
              <p className="winner">
                {gameOver.winner === 'draw'
                  ? 'Match nul !'
                  : `Les ${gameOver.winner === 'white' ? 'Blancs' : 'Noirs'} gagnent !`}
              </p>
              <p className="reason">{gameOver.reason}</p>
              <button className="btn primary" onClick={handleLeave}>
                Retour au lobby
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="side-panel">
        <div className="chat-section">
          <h3>Chat</h3>
          <div className="chat-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className="chat-message">
                <strong>{msg.username}:</strong> {msg.message}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Écrire un message..."
            />
            <button onClick={handleSendChat}>Envoyer</button>
          </div>
        </div>

        <div className="game-actions">
          {gameStarted && !gameOver && (
            <button className="btn danger" onClick={handleResign}>
              Abandonner
            </button>
          )}
          <button className="btn secondary" onClick={handleLeave}>
            Quitter
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnlineGame;

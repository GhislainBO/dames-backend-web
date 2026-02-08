/**
 * Types pour le frontend
 */

export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

export type PlayerColor = 'white' | 'black';

export type GameMode = 'pvp' | 'ai';

export interface GameConfig {
  mode: GameMode;
  difficulty: Difficulty;
  playerColor: PlayerColor;
}

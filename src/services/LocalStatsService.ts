/**
 * LocalStatsService - Gestion des statistiques locales via LocalStorage
 *
 * Stocke les statistiques de jeu localement pour les utilisateurs non connectés
 * et synchronise avec le serveur quand l'utilisateur se connecte
 */

export interface LocalStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
  totalCaptures: number;
  totalPromotions: number;
  fastestWin: number | null; // en secondes
  longestGame: number | null; // en secondes
  lastPlayedAt: string | null;
  createdAt: string;
}

export interface GameSession {
  startTime: number;
  mode: 'pvp' | 'ai';
  difficulty?: string;
  playerColor?: 'white' | 'black';
  captures: number;
  promotions: number;
}

const STORAGE_KEY = 'dameselite_local_stats';
const SESSION_KEY = 'dameselite_current_session';

class LocalStatsService {
  private stats: LocalStats;
  private currentSession: GameSession | null = null;

  constructor() {
    this.stats = this.loadStats();
  }

  /**
   * Charge les statistiques depuis localStorage
   */
  private loadStats(): LocalStats {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erreur chargement stats locales:', e);
    }

    // Valeurs par défaut
    return {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalCaptures: 0,
      totalPromotions: 0,
      fastestWin: null,
      longestGame: null,
      lastPlayedAt: null,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Sauvegarde les statistiques dans localStorage
   */
  private saveStats(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    } catch (e) {
      console.error('Erreur sauvegarde stats locales:', e);
    }
  }

  /**
   * Retourne les statistiques actuelles
   */
  getStats(): LocalStats {
    return { ...this.stats };
  }

  /**
   * Démarre une nouvelle session de jeu
   */
  startGame(mode: 'pvp' | 'ai', difficulty?: string, playerColor?: 'white' | 'black'): void {
    this.currentSession = {
      startTime: Date.now(),
      mode,
      difficulty,
      playerColor,
      captures: 0,
      promotions: 0,
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(this.currentSession));
    } catch (e) {
      // Ignorer les erreurs de stockage
    }
  }

  /**
   * Enregistre une capture pendant la partie
   */
  recordCapture(): void {
    if (this.currentSession) {
      this.currentSession.captures++;
    }
  }

  /**
   * Enregistre une promotion pendant la partie
   */
  recordPromotion(): void {
    if (this.currentSession) {
      this.currentSession.promotions++;
    }
  }

  /**
   * Termine la partie et enregistre le résultat
   */
  endGame(result: 'win' | 'loss' | 'draw'): void {
    if (!this.currentSession) {
      return;
    }

    const duration = Math.floor((Date.now() - this.currentSession.startTime) / 1000);

    this.stats.gamesPlayed++;
    this.stats.totalCaptures += this.currentSession.captures;
    this.stats.totalPromotions += this.currentSession.promotions;
    this.stats.lastPlayedAt = new Date().toISOString();

    // Mettre à jour les durées
    if (this.stats.longestGame === null || duration > this.stats.longestGame) {
      this.stats.longestGame = duration;
    }

    switch (result) {
      case 'win':
        this.stats.wins++;
        this.stats.currentStreak++;
        if (this.stats.currentStreak > this.stats.bestStreak) {
          this.stats.bestStreak = this.stats.currentStreak;
        }
        // Victoire la plus rapide
        if (this.stats.fastestWin === null || duration < this.stats.fastestWin) {
          this.stats.fastestWin = duration;
        }
        break;

      case 'loss':
        this.stats.losses++;
        this.stats.currentStreak = 0;
        break;

      case 'draw':
        this.stats.draws++;
        // Une égalité ne brise pas la série de victoires
        break;
    }

    this.saveStats();
    this.currentSession = null;

    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      // Ignorer
    }
  }

  /**
   * Calcule le taux de victoire
   */
  getWinRate(): number {
    if (this.stats.gamesPlayed === 0) return 0;
    return Math.round((this.stats.wins / this.stats.gamesPlayed) * 100);
  }

  /**
   * Calcule le niveau du joueur basé sur les victoires
   */
  getLevel(): { level: number; title: string; progress: number; nextLevel: number } {
    const wins = this.stats.wins;

    const levels = [
      { threshold: 0, title: 'Novice' },
      { threshold: 5, title: 'Apprenti' },
      { threshold: 15, title: 'Amateur' },
      { threshold: 30, title: 'Joueur' },
      { threshold: 50, title: 'Competent' },
      { threshold: 75, title: 'Avance' },
      { threshold: 100, title: 'Expert' },
      { threshold: 150, title: 'Maitre' },
      { threshold: 200, title: 'Grand Maitre' },
      { threshold: 300, title: 'Champion' },
      { threshold: 500, title: 'Legende' },
    ];

    let currentLevel = 0;
    let currentTitle = levels[0].title;
    let nextThreshold = levels[1].threshold;

    for (let i = levels.length - 1; i >= 0; i--) {
      if (wins >= levels[i].threshold) {
        currentLevel = i + 1;
        currentTitle = levels[i].title;
        nextThreshold = levels[i + 1]?.threshold || levels[i].threshold;
        break;
      }
    }

    const prevThreshold = levels[currentLevel - 1]?.threshold || 0;
    const progress = nextThreshold > prevThreshold
      ? Math.min(100, Math.round(((wins - prevThreshold) / (nextThreshold - prevThreshold)) * 100))
      : 100;

    return {
      level: currentLevel,
      title: currentTitle,
      progress,
      nextLevel: nextThreshold,
    };
  }

  /**
   * Formate une durée en texte lisible
   */
  formatDuration(seconds: number | null): string {
    if (seconds === null) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  /**
   * Réinitialise toutes les statistiques
   */
  resetStats(): void {
    this.stats = {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalCaptures: 0,
      totalPromotions: 0,
      fastestWin: null,
      longestGame: null,
      lastPlayedAt: null,
      createdAt: new Date().toISOString(),
    };
    this.saveStats();
  }

  /**
   * Exporte les statistiques en JSON
   */
  exportStats(): string {
    return JSON.stringify(this.stats, null, 2);
  }

  /**
   * Importe des statistiques depuis JSON
   */
  importStats(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      // Validation basique
      if (typeof imported.gamesPlayed === 'number' && typeof imported.wins === 'number') {
        this.stats = { ...this.stats, ...imported };
        this.saveStats();
        return true;
      }
    } catch (e) {
      console.error('Erreur import stats:', e);
    }
    return false;
  }
}

// Instance singleton
export const localStatsService = new LocalStatsService();
export default localStatsService;

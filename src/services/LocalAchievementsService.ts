/**
 * LocalAchievementsService - Systeme de succes stocke localement
 *
 * Fonctionne sans backend pour les joueurs non connectes
 */

export interface LocalAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'games' | 'wins' | 'puzzle' | 'learning' | 'streak' | 'special';
  requirement: number;
  progress: number;
  unlockedAt?: string;
  rewardClaimed: boolean;
  reward: number;
}

export interface AchievementNotification {
  id: string;
  name: string;
  icon: string;
  reward: number;
}

const STORAGE_KEY = 'dameselite_local_achievements';
const NOTIFICATION_KEY = 'dameselite_achievement_notifications';

// Definition des achievements locaux
const ACHIEVEMENTS_DEFINITIONS: Omit<LocalAchievement, 'progress' | 'unlockedAt' | 'rewardClaimed'>[] = [
  // Jeux
  {
    id: 'first_game',
    name: 'Premiere partie',
    description: 'Jouez votre premiere partie',
    icon: '🎮',
    category: 'games',
    requirement: 1,
    reward: 50,
  },
  {
    id: 'games_10',
    name: 'Joueur assidu',
    description: 'Jouez 10 parties',
    icon: '🎯',
    category: 'games',
    requirement: 10,
    reward: 100,
  },
  {
    id: 'games_50',
    name: 'Veteran',
    description: 'Jouez 50 parties',
    icon: '⭐',
    category: 'games',
    requirement: 50,
    reward: 250,
  },
  {
    id: 'games_100',
    name: 'Centurion',
    description: 'Jouez 100 parties',
    icon: '🏆',
    category: 'games',
    requirement: 100,
    reward: 500,
  },

  // Victoires
  {
    id: 'first_win',
    name: 'Premiere victoire',
    description: 'Gagnez votre premiere partie',
    icon: '🥇',
    category: 'wins',
    requirement: 1,
    reward: 75,
  },
  {
    id: 'wins_10',
    name: 'Gagnant',
    description: 'Gagnez 10 parties',
    icon: '🏅',
    category: 'wins',
    requirement: 10,
    reward: 150,
  },
  {
    id: 'wins_25',
    name: 'Champion',
    description: 'Gagnez 25 parties',
    icon: '👑',
    category: 'wins',
    requirement: 25,
    reward: 300,
  },
  {
    id: 'wins_50',
    name: 'Maitre',
    description: 'Gagnez 50 parties',
    icon: '🎖️',
    category: 'wins',
    requirement: 50,
    reward: 600,
  },

  // Puzzles
  {
    id: 'first_puzzle',
    name: 'Enigme resolue',
    description: 'Resolvez votre premier puzzle quotidien',
    icon: '🧩',
    category: 'puzzle',
    requirement: 1,
    reward: 50,
  },
  {
    id: 'puzzles_7',
    name: 'Semaine de puzzles',
    description: 'Resolvez 7 puzzles quotidiens',
    icon: '📅',
    category: 'puzzle',
    requirement: 7,
    reward: 150,
  },
  {
    id: 'puzzles_30',
    name: 'Mois de puzzles',
    description: 'Resolvez 30 puzzles quotidiens',
    icon: '📆',
    category: 'puzzle',
    requirement: 30,
    reward: 400,
  },
  {
    id: 'puzzle_no_hint',
    name: 'Genie',
    description: 'Resolvez 5 puzzles sans utiliser d\'indice',
    icon: '🧠',
    category: 'puzzle',
    requirement: 5,
    reward: 200,
  },

  // Apprentissage
  {
    id: 'tutorial_complete',
    name: 'Etudiant',
    description: 'Completez le tutoriel',
    icon: '📚',
    category: 'learning',
    requirement: 1,
    reward: 100,
  },
  {
    id: 'quiz_perfect',
    name: 'Expert des regles',
    description: 'Obtenez 100% au quiz du tutoriel',
    icon: '🎓',
    category: 'learning',
    requirement: 1,
    reward: 150,
  },

  // Series
  {
    id: 'streak_3',
    name: 'En forme',
    description: 'Gagnez 3 parties d\'affilee',
    icon: '🔥',
    category: 'streak',
    requirement: 3,
    reward: 100,
  },
  {
    id: 'streak_5',
    name: 'Imbattable',
    description: 'Gagnez 5 parties d\'affilee',
    icon: '💪',
    category: 'streak',
    requirement: 5,
    reward: 200,
  },
  {
    id: 'streak_10',
    name: 'Legendaire',
    description: 'Gagnez 10 parties d\'affilee',
    icon: '⚡',
    category: 'streak',
    requirement: 10,
    reward: 500,
  },
  {
    id: 'puzzle_streak_7',
    name: 'Perseverant',
    description: 'Resolvez les puzzles 7 jours consecutifs',
    icon: '📈',
    category: 'streak',
    requirement: 7,
    reward: 250,
  },

  // Special
  {
    id: 'captures_100',
    name: 'Chasseur',
    description: 'Capturez 100 pieces au total',
    icon: '🎪',
    category: 'special',
    requirement: 100,
    reward: 150,
  },
  {
    id: 'promotions_20',
    name: 'Roi des promotions',
    description: 'Promouvez 20 pions en dames',
    icon: '♔',
    category: 'special',
    requirement: 20,
    reward: 200,
  },
  {
    id: 'fast_win',
    name: 'Victoire eclair',
    description: 'Gagnez une partie en moins de 2 minutes',
    icon: '⚡',
    category: 'special',
    requirement: 1,
    reward: 150,
  },
  {
    id: 'ai_expert_win',
    name: 'Dompteur d\'IA',
    description: 'Battez l\'IA en mode Expert',
    icon: '🤖',
    category: 'special',
    requirement: 1,
    reward: 300,
  },
];

class LocalAchievementsService {
  private achievements: LocalAchievement[] = [];
  private pendingNotifications: AchievementNotification[] = [];

  constructor() {
    this.loadAchievements();
  }

  /**
   * Charge les achievements depuis localStorage
   */
  private loadAchievements(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.achievements = JSON.parse(saved);
        // Ajouter les nouveaux achievements si pas presents
        this.syncWithDefinitions();
      } else {
        this.initializeAchievements();
      }

      // Charger les notifications en attente
      const notifications = localStorage.getItem(NOTIFICATION_KEY);
      if (notifications) {
        this.pendingNotifications = JSON.parse(notifications);
      }
    } catch (e) {
      this.initializeAchievements();
    }
  }

  /**
   * Initialise les achievements avec les definitions
   */
  private initializeAchievements(): void {
    this.achievements = ACHIEVEMENTS_DEFINITIONS.map(def => ({
      ...def,
      progress: 0,
      rewardClaimed: false,
    }));
    this.saveAchievements();
  }

  /**
   * Synchronise avec les nouvelles definitions
   */
  private syncWithDefinitions(): void {
    const existingIds = new Set(this.achievements.map(a => a.id));

    ACHIEVEMENTS_DEFINITIONS.forEach(def => {
      if (!existingIds.has(def.id)) {
        this.achievements.push({
          ...def,
          progress: 0,
          rewardClaimed: false,
        });
      }
    });

    this.saveAchievements();
  }

  /**
   * Sauvegarde les achievements
   */
  private saveAchievements(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.achievements));
    } catch (e) {
      console.error('Erreur sauvegarde achievements:', e);
    }
  }

  /**
   * Sauvegarde les notifications
   */
  private saveNotifications(): void {
    try {
      localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(this.pendingNotifications));
    } catch (e) {
      console.error('Erreur sauvegarde notifications:', e);
    }
  }

  /**
   * Retourne tous les achievements
   */
  getAllAchievements(): LocalAchievement[] {
    return [...this.achievements];
  }

  /**
   * Retourne les achievements debloques
   */
  getUnlockedAchievements(): LocalAchievement[] {
    return this.achievements.filter(a => a.unlockedAt);
  }

  /**
   * Retourne les achievements non reclames
   */
  getUnclaimedAchievements(): LocalAchievement[] {
    return this.achievements.filter(a => a.unlockedAt && !a.rewardClaimed);
  }

  /**
   * Met a jour la progression d'un achievement
   */
  updateProgress(id: string, progress: number): AchievementNotification | null {
    const achievement = this.achievements.find(a => a.id === id);
    if (!achievement || achievement.unlockedAt) return null;

    achievement.progress = Math.min(progress, achievement.requirement);

    if (achievement.progress >= achievement.requirement && !achievement.unlockedAt) {
      achievement.unlockedAt = new Date().toISOString();

      const notification: AchievementNotification = {
        id: achievement.id,
        name: achievement.name,
        icon: achievement.icon,
        reward: achievement.reward,
      };

      this.pendingNotifications.push(notification);
      this.saveNotifications();
      this.saveAchievements();

      return notification;
    }

    this.saveAchievements();
    return null;
  }

  /**
   * Incremente la progression d'un achievement
   */
  incrementProgress(id: string, amount: number = 1): AchievementNotification | null {
    const achievement = this.achievements.find(a => a.id === id);
    if (!achievement) return null;

    return this.updateProgress(id, achievement.progress + amount);
  }

  /**
   * Reclame la recompense d'un achievement
   */
  claimReward(id: string): number {
    const achievement = this.achievements.find(a => a.id === id);
    if (!achievement || !achievement.unlockedAt || achievement.rewardClaimed) {
      return 0;
    }

    achievement.rewardClaimed = true;
    this.saveAchievements();

    return achievement.reward;
  }

  /**
   * Retourne les notifications en attente
   */
  getPendingNotifications(): AchievementNotification[] {
    return [...this.pendingNotifications];
  }

  /**
   * Efface les notifications en attente
   */
  clearNotifications(): void {
    this.pendingNotifications = [];
    this.saveNotifications();
  }

  /**
   * Evenement: partie terminee
   */
  onGameCompleted(data: {
    won: boolean;
    duration: number;
    captures: number;
    promotions: number;
    vsAI: boolean;
    aiDifficulty?: string;
  }): AchievementNotification[] {
    const notifications: AchievementNotification[] = [];

    // Parties jouees
    let notif = this.incrementProgress('first_game');
    if (notif) notifications.push(notif);

    notif = this.incrementProgress('games_10');
    if (notif) notifications.push(notif);

    notif = this.incrementProgress('games_50');
    if (notif) notifications.push(notif);

    notif = this.incrementProgress('games_100');
    if (notif) notifications.push(notif);

    // Victoires
    if (data.won) {
      notif = this.incrementProgress('first_win');
      if (notif) notifications.push(notif);

      notif = this.incrementProgress('wins_10');
      if (notif) notifications.push(notif);

      notif = this.incrementProgress('wins_25');
      if (notif) notifications.push(notif);

      notif = this.incrementProgress('wins_50');
      if (notif) notifications.push(notif);

      // Victoire rapide (moins de 2 minutes)
      if (data.duration < 120) {
        notif = this.updateProgress('fast_win', 1);
        if (notif) notifications.push(notif);
      }

      // Victoire contre IA Expert
      if (data.vsAI && data.aiDifficulty === 'expert') {
        notif = this.updateProgress('ai_expert_win', 1);
        if (notif) notifications.push(notif);
      }
    }

    // Captures
    notif = this.incrementProgress('captures_100', data.captures);
    if (notif) notifications.push(notif);

    // Promotions
    notif = this.incrementProgress('promotions_20', data.promotions);
    if (notif) notifications.push(notif);

    return notifications;
  }

  /**
   * Evenement: serie de victoires mise a jour
   */
  onStreakUpdated(streak: number): AchievementNotification[] {
    const notifications: AchievementNotification[] = [];

    if (streak >= 3) {
      const notif = this.updateProgress('streak_3', 1);
      if (notif) notifications.push(notif);
    }

    if (streak >= 5) {
      const notif = this.updateProgress('streak_5', 1);
      if (notif) notifications.push(notif);
    }

    if (streak >= 10) {
      const notif = this.updateProgress('streak_10', 1);
      if (notif) notifications.push(notif);
    }

    return notifications;
  }

  /**
   * Evenement: puzzle complete
   */
  onPuzzleCompleted(data: {
    usedHint: boolean;
    puzzleStreak: number;
    totalSolved: number;
  }): AchievementNotification[] {
    const notifications: AchievementNotification[] = [];

    // Premier puzzle
    let notif = this.updateProgress('first_puzzle', data.totalSolved);
    if (notif) notifications.push(notif);

    // Puzzles totaux
    notif = this.updateProgress('puzzles_7', data.totalSolved);
    if (notif) notifications.push(notif);

    notif = this.updateProgress('puzzles_30', data.totalSolved);
    if (notif) notifications.push(notif);

    // Puzzles sans indice
    if (!data.usedHint) {
      notif = this.incrementProgress('puzzle_no_hint');
      if (notif) notifications.push(notif);
    }

    // Serie de puzzles
    if (data.puzzleStreak >= 7) {
      notif = this.updateProgress('puzzle_streak_7', 1);
      if (notif) notifications.push(notif);
    }

    return notifications;
  }

  /**
   * Evenement: tutoriel complete
   */
  onTutorialCompleted(quizScore?: number): AchievementNotification[] {
    const notifications: AchievementNotification[] = [];

    const notif = this.updateProgress('tutorial_complete', 1);
    if (notif) notifications.push(notif);

    if (quizScore === 100) {
      const notif2 = this.updateProgress('quiz_perfect', 1);
      if (notif2) notifications.push(notif2);
    }

    return notifications;
  }

  /**
   * Statistiques des achievements
   */
  getStats(): {
    total: number;
    unlocked: number;
    claimed: number;
    totalRewards: number;
    claimedRewards: number;
  } {
    const total = this.achievements.length;
    const unlocked = this.achievements.filter(a => a.unlockedAt).length;
    const claimed = this.achievements.filter(a => a.rewardClaimed).length;
    const totalRewards = this.achievements.reduce((sum, a) => sum + a.reward, 0);
    const claimedRewards = this.achievements
      .filter(a => a.rewardClaimed)
      .reduce((sum, a) => sum + a.reward, 0);

    return { total, unlocked, claimed, totalRewards, claimedRewards };
  }

  /**
   * Reinitialise tous les achievements
   */
  reset(): void {
    this.initializeAchievements();
    this.pendingNotifications = [];
    this.saveNotifications();
  }
}

// Instance singleton
export const localAchievementsService = new LocalAchievementsService();
export default localAchievementsService;

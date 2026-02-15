/**
 * PROGRESSION SERVICE - Système XP, Niveaux et Daily Rewards
 * Phase 1 - Socle Premium
 */

export interface PlayerLevel {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  totalXP: number;
  title: string;
  badge: string;
}

export interface DailyStreak {
  currentStreak: number;
  lastClaimDate: string | null;
  canClaim: boolean;
  nextReward: number;
}

export interface DailyReward {
  day: number;
  xp: number;
  coins: number;
  claimed: boolean;
}

// Titres par niveau
const LEVEL_TITLES: { [key: number]: { title: string; badge: string } } = {
  1: { title: 'Novice', badge: '🎯' },
  5: { title: 'Apprenti', badge: '📚' },
  10: { title: 'Joueur', badge: '♟️' },
  15: { title: 'Tacticien', badge: '🧠' },
  20: { title: 'Stratège', badge: '⚔️' },
  25: { title: 'Expert', badge: '🏅' },
  30: { title: 'Maître', badge: '👑' },
  40: { title: 'Grand Maître', badge: '🏆' },
  50: { title: 'Légende', badge: '⭐' },
  75: { title: 'Champion', badge: '💎' },
  100: { title: 'Elite', badge: '🔱' },
};

// XP requis par niveau (formule progressive)
function getXPForLevel(level: number): number {
  // Formule: 100 * niveau * (1 + niveau/10)
  return Math.floor(100 * level * (1 + level / 10));
}

// Récompenses XP par action
export const XP_REWARDS = {
  WIN_AI_BEGINNER: 15,
  WIN_AI_EASY: 25,
  WIN_AI_MEDIUM: 40,
  WIN_AI_HARD: 60,
  WIN_AI_EXPERT: 100,
  WIN_PVP: 30,
  WIN_ONLINE: 50,
  DRAW: 10,
  LOSS: 5,
  PUZZLE_SOLVED: 20,
  DAILY_LOGIN: 25,
  STREAK_BONUS: 10, // par jour de streak
  FIRST_GAME_OF_DAY: 15,
  TOURNAMENT_PARTICIPATION: 30,
};

// Récompenses du daily streak
const DAILY_REWARDS: DailyReward[] = [
  { day: 1, xp: 25, coins: 50, claimed: false },
  { day: 2, xp: 35, coins: 75, claimed: false },
  { day: 3, xp: 50, coins: 100, claimed: false },
  { day: 4, xp: 65, coins: 125, claimed: false },
  { day: 5, xp: 85, coins: 150, claimed: false },
  { day: 6, xp: 100, coins: 200, claimed: false },
  { day: 7, xp: 150, coins: 300, claimed: false }, // Bonus semaine
];

class ProgressionService {
  private readonly STORAGE_KEY = 'dameselite_progression';
  private readonly STREAK_KEY = 'dameselite_streak';

  // Obtenir les données de progression
  getProgression(): PlayerLevel {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return this.calculateLevel(data.totalXP || 0);
    }
    return this.calculateLevel(0);
  }

  // Calculer le niveau à partir de l'XP total
  private calculateLevel(totalXP: number): PlayerLevel {
    let level = 1;
    let xpUsed = 0;

    while (true) {
      const xpNeeded = getXPForLevel(level);
      if (xpUsed + xpNeeded > totalXP) {
        break;
      }
      xpUsed += xpNeeded;
      level++;
    }

    const currentXP = totalXP - xpUsed;
    const xpForNextLevel = getXPForLevel(level);

    // Trouver le titre approprié
    let title = 'Novice';
    let badge = '🎯';
    const levels = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
    for (const lvl of levels) {
      if (level >= lvl) {
        title = LEVEL_TITLES[lvl].title;
        badge = LEVEL_TITLES[lvl].badge;
        break;
      }
    }

    return {
      level,
      currentXP,
      xpForNextLevel,
      totalXP,
      title,
      badge,
    };
  }

  // Ajouter de l'XP
  addXP(amount: number): { newLevel: PlayerLevel; leveledUp: boolean; levelsGained: number } {
    const oldProgression = this.getProgression();
    const newTotalXP = oldProgression.totalXP + amount;

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ totalXP: newTotalXP }));

    const newProgression = this.calculateLevel(newTotalXP);
    const leveledUp = newProgression.level > oldProgression.level;
    const levelsGained = newProgression.level - oldProgression.level;

    return {
      newLevel: newProgression,
      leveledUp,
      levelsGained,
    };
  }

  // Obtenir le streak quotidien
  getDailyStreak(): DailyStreak {
    const stored = localStorage.getItem(this.STREAK_KEY);
    const today = new Date().toDateString();

    if (!stored) {
      return {
        currentStreak: 0,
        lastClaimDate: null,
        canClaim: true,
        nextReward: DAILY_REWARDS[0].xp,
      };
    }

    const data = JSON.parse(stored);
    const lastClaim = data.lastClaimDate;

    if (!lastClaim) {
      return {
        currentStreak: 0,
        lastClaimDate: null,
        canClaim: true,
        nextReward: DAILY_REWARDS[0].xp,
      };
    }

    const lastClaimDate = new Date(lastClaim);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60 * 24));

    // Si déjà réclamé aujourd'hui
    if (diffDays === 0) {
      const nextDay = Math.min(data.currentStreak, 6);
      return {
        currentStreak: data.currentStreak,
        lastClaimDate: lastClaim,
        canClaim: false,
        nextReward: DAILY_REWARDS[nextDay].xp,
      };
    }

    // Si plus d'un jour passé, reset le streak
    if (diffDays > 1) {
      return {
        currentStreak: 0,
        lastClaimDate: lastClaim,
        canClaim: true,
        nextReward: DAILY_REWARDS[0].xp,
      };
    }

    // Un jour passé, peut réclamer
    const nextDay = Math.min(data.currentStreak, 6);
    return {
      currentStreak: data.currentStreak,
      lastClaimDate: lastClaim,
      canClaim: true,
      nextReward: DAILY_REWARDS[nextDay].xp,
    };
  }

  // Réclamer la récompense quotidienne
  claimDailyReward(): { xp: number; coins: number; newStreak: number } | null {
    const streak = this.getDailyStreak();

    if (!streak.canClaim) {
      return null;
    }

    const today = new Date().toDateString();
    const newStreak = streak.currentStreak + 1;
    const rewardDay = Math.min(newStreak - 1, 6);
    const reward = DAILY_REWARDS[rewardDay];

    // Sauvegarder le nouveau streak
    localStorage.setItem(this.STREAK_KEY, JSON.stringify({
      currentStreak: newStreak,
      lastClaimDate: today,
    }));

    // Ajouter l'XP
    this.addXP(reward.xp);

    return {
      xp: reward.xp,
      coins: reward.coins,
      newStreak,
    };
  }

  // Obtenir les récompenses de la semaine
  getWeeklyRewards(): DailyReward[] {
    const streak = this.getDailyStreak();
    return DAILY_REWARDS.map((reward, index) => ({
      ...reward,
      claimed: index < streak.currentStreak,
    }));
  }

  // Obtenir l'XP gagné pour une victoire selon le mode
  getWinXP(mode: 'pvp' | 'ai' | 'online', difficulty?: string): number {
    if (mode === 'pvp') return XP_REWARDS.WIN_PVP;
    if (mode === 'online') return XP_REWARDS.WIN_ONLINE;

    switch (difficulty) {
      case 'beginner': return XP_REWARDS.WIN_AI_BEGINNER;
      case 'easy': return XP_REWARDS.WIN_AI_EASY;
      case 'medium': return XP_REWARDS.WIN_AI_MEDIUM;
      case 'hard': return XP_REWARDS.WIN_AI_HARD;
      case 'expert': return XP_REWARDS.WIN_AI_EXPERT;
      default: return XP_REWARDS.WIN_AI_MEDIUM;
    }
  }
}

export const progressionService = new ProgressionService();

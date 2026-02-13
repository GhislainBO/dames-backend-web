/**
 * DailyPuzzleService - Gestion du puzzle quotidien
 *
 * Chaque jour, tous les joueurs ont le meme puzzle
 * Base sur la date pour garantir la coherence
 */

export interface PuzzlePosition {
  row: number;
  col: number;
  color: 'white' | 'black';
  isKing: boolean;
}

export interface DailyPuzzle {
  id: string;
  date: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  playerColor: 'white' | 'black';
  pieces: PuzzlePosition[];
  solution: string[]; // Sequence de coups en notation (ex: "23-18", "18x9")
  hint: string;
}

export interface PuzzleResult {
  date: string;
  puzzleId: string;
  solved: boolean;
  attempts: number;
  timeSeconds: number;
  usedHint: boolean;
}

const STORAGE_KEY = 'dameselite_puzzle_results';
const STREAK_KEY = 'dameselite_puzzle_streak';

// Collection de puzzles predefinies
const PUZZLES: Omit<DailyPuzzle, 'id' | 'date'>[] = [
  {
    title: 'Capture et promotion',
    description: 'Capturez et devenez dame en un coup.',
    difficulty: 'easy',
    playerColor: 'white',
    pieces: [
      { row: 2, col: 5, color: 'white', isKing: false },  // position 13
      { row: 1, col: 4, color: 'black', isKing: false },  // position 8
    ],
    solution: ['13x2'],
    hint: 'La capture mene directement a la promotion.',
  },
  {
    title: 'Double prise',
    description: 'Capturez deux pieces en un seul coup.',
    difficulty: 'easy',
    playerColor: 'white',
    pieces: [
      { row: 5, col: 4, color: 'white', isKing: false },
      { row: 4, col: 3, color: 'black', isKing: false },
      { row: 4, col: 5, color: 'black', isKing: false },
      { row: 2, col: 3, color: 'black', isKing: false },
    ],
    solution: ['28x17x8'],
    hint: 'Commencez par la piece de gauche.',
  },
  {
    title: 'Promotion decisive',
    description: 'Atteignez la derniere rangee pour devenir dame.',
    difficulty: 'easy',
    playerColor: 'white',
    pieces: [
      { row: 4, col: 3, color: 'white', isKing: false },  // position 22
      { row: 3, col: 4, color: 'black', isKing: false },  // position 18
      { row: 1, col: 4, color: 'black', isKing: false },  // position 8
    ],
    solution: ['22x13x2'],
    hint: 'La double capture en zigzag mene a la promotion.',
  },
  {
    title: 'Piege tactique',
    description: 'Forcez l\'adversaire a vous donner une piece.',
    difficulty: 'medium',
    playerColor: 'white',
    pieces: [
      { row: 4, col: 3, color: 'white', isKing: false },
      { row: 4, col: 5, color: 'white', isKing: false },
      { row: 3, col: 4, color: 'black', isKing: false },
      { row: 2, col: 5, color: 'black', isKing: false },
    ],
    solution: ['22-17'],
    hint: 'Sacrifiez une piece pour en gagner deux.',
  },
  {
    title: 'Attaque de dame',
    description: 'Utilisez votre dame pour capturer deux pieces.',
    difficulty: 'medium',
    playerColor: 'white',
    pieces: [
      { row: 6, col: 3, color: 'white', isKing: true },  // position 32
      { row: 5, col: 2, color: 'black', isKing: false }, // position 27
      { row: 3, col: 2, color: 'black', isKing: false }, // position 17
    ],
    solution: ['32x21x12'],
    hint: 'Capturez en diagonale vers le haut-gauche.',
  },
  {
    title: 'Triple capture',
    description: 'Trouvez la sequence de trois captures.',
    difficulty: 'medium',
    playerColor: 'white',
    pieces: [
      { row: 6, col: 5, color: 'white', isKing: false },  // position 33
      { row: 5, col: 4, color: 'black', isKing: false },  // position 28
      { row: 3, col: 2, color: 'black', isKing: false },  // position 17
      { row: 1, col: 2, color: 'black', isKing: false },  // position 7
    ],
    solution: ['33x22x11x2'],
    hint: 'Zigzaguez a travers les pieces adverses.',
  },
  {
    title: 'Finale de dames',
    description: 'Capturez les deux pions avec votre dame.',
    difficulty: 'hard',
    playerColor: 'white',
    pieces: [
      { row: 5, col: 4, color: 'white', isKing: true },   // position 28
      { row: 4, col: 3, color: 'black', isKing: false },  // position 22
      { row: 2, col: 1, color: 'black', isKing: false },  // position 11
    ],
    solution: ['28x17x6'],
    hint: 'Capturez en diagonale vers le haut-gauche.',
  },
  {
    title: 'Sacrifice gagnant',
    description: 'Sacrifiez une piece pour gagner la partie.',
    difficulty: 'hard',
    playerColor: 'white',
    pieces: [
      { row: 6, col: 3, color: 'white', isKing: false },  // position 32 - sacrifice
      { row: 7, col: 2, color: 'white', isKing: false },  // position 37 - counter
      { row: 4, col: 3, color: 'black', isKing: false },  // position 22
      { row: 4, col: 1, color: 'black', isKing: false },  // position 21
    ],
    solution: ['32-27', '37x26x17'],
    hint: 'Sacrifiez pour forcer une capture, puis contre-attaquez.',
  },
  {
    title: 'Choix decisif',
    description: 'Trouvez la bonne capture qui mene a la promotion.',
    difficulty: 'hard',
    playerColor: 'white',
    pieces: [
      { row: 4, col: 5, color: 'white', isKing: false },  // position 23
      { row: 3, col: 4, color: 'black', isKing: false },  // position 18
      { row: 3, col: 6, color: 'black', isKing: false },  // position 19
      { row: 1, col: 2, color: 'black', isKing: false },  // position 7
    ],
    solution: ['23x12x1'],
    hint: 'Une capture mene a la promotion, l\'autre non.',
  },
  {
    title: 'Rafle magistrale',
    description: 'Trouvez la rafle de 4 pieces.',
    difficulty: 'hard',
    playerColor: 'white',
    pieces: [
      { row: 7, col: 4, color: 'white', isKing: false },  // position 38
      { row: 6, col: 3, color: 'black', isKing: false },  // position 32
      { row: 6, col: 5, color: 'black', isKing: false },  // position 33
      { row: 4, col: 3, color: 'black', isKing: false },  // position 22
      { row: 4, col: 5, color: 'black', isKing: false },  // position 23
    ],
    solution: ['38x27x18x29x38'],
    hint: 'La cle est de commencer par le bon cote et revenir au depart.',
  },
];

// Fonction de hash simple pour convertir une date en index
function hashDate(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

class DailyPuzzleService {
  /**
   * Retourne le puzzle du jour
   */
  getPuzzleOfDay(): DailyPuzzle {
    const today = new Date().toISOString().split('T')[0];
    const seed = hashDate(today);
    const puzzleIndex = seed % PUZZLES.length;
    const basePuzzle = PUZZLES[puzzleIndex];

    return {
      ...basePuzzle,
      id: `puzzle-${today}`,
      date: today,
    };
  }

  /**
   * Retourne un puzzle par son index (pour le mode test)
   */
  getPuzzleByIndex(index: number): DailyPuzzle {
    const safeIndex = ((index % PUZZLES.length) + PUZZLES.length) % PUZZLES.length;
    const basePuzzle = PUZZLES[safeIndex];

    return {
      ...basePuzzle,
      id: `puzzle-test-${safeIndex}`,
      date: `Test #${safeIndex + 1}/${PUZZLES.length}`,
    };
  }

  /**
   * Retourne le nombre total de puzzles
   */
  getTotalPuzzles(): number {
    return PUZZLES.length;
  }

  /**
   * Verifie si le puzzle du jour a deja ete resolu
   */
  isPuzzleSolvedToday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    const results = this.getAllResults();
    return results.some(r => r.date === today && r.solved);
  }

  /**
   * Retourne le resultat du puzzle du jour
   */
  getTodayResult(): PuzzleResult | null {
    const today = new Date().toISOString().split('T')[0];
    const results = this.getAllResults();
    return results.find(r => r.date === today) || null;
  }

  /**
   * Enregistre un resultat de puzzle
   */
  saveResult(result: PuzzleResult): void {
    const results = this.getAllResults();

    // Remplacer si deja existe pour cette date
    const existingIndex = results.findIndex(r => r.date === result.date);
    if (existingIndex >= 0) {
      results[existingIndex] = result;
    } else {
      results.push(result);
    }

    // Garder seulement les 30 derniers jours
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const filtered = results.filter(r => new Date(r.date) >= cutoff);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Erreur sauvegarde resultat puzzle:', e);
    }

    // Mettre a jour la serie
    this.updateStreak(result);
  }

  /**
   * Retourne tous les resultats
   */
  getAllResults(): PuzzleResult[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Retourne les statistiques de puzzles
   */
  getStats(): {
    totalSolved: number;
    currentStreak: number;
    bestStreak: number;
    averageTime: number;
    hintsUsed: number;
  } {
    const results = this.getAllResults();
    const solved = results.filter(r => r.solved);
    const streak = this.getStreak();

    const totalTime = solved.reduce((sum, r) => sum + r.timeSeconds, 0);
    const hintsUsed = solved.filter(r => r.usedHint).length;

    return {
      totalSolved: solved.length,
      currentStreak: streak.current,
      bestStreak: streak.best,
      averageTime: solved.length > 0 ? Math.round(totalTime / solved.length) : 0,
      hintsUsed,
    };
  }

  /**
   * Retourne la serie actuelle et la meilleure serie
   */
  getStreak(): { current: number; best: number } {
    try {
      const saved = localStorage.getItem(STREAK_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // ignore
    }
    return { current: 0, best: 0 };
  }

  /**
   * Met a jour la serie apres un resultat
   */
  private updateStreak(result: PuzzleResult): void {
    const streak = this.getStreak();

    if (result.solved) {
      // Verifier si c'est un jour consecutif
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const results = this.getAllResults();
      const solvedYesterday = results.some(r => r.date === yesterdayStr && r.solved);

      if (solvedYesterday || streak.current === 0) {
        streak.current++;
      } else {
        // Verifier si c'est le meme jour (on ne reinitialise pas)
        const today = new Date().toISOString().split('T')[0];
        const alreadySolvedToday = results.some(r => r.date === today && r.solved && r !== result);
        if (!alreadySolvedToday) {
          streak.current = 1;
        }
      }

      if (streak.current > streak.best) {
        streak.best = streak.current;
      }
    }

    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
    } catch (e) {
      // ignore
    }
  }

  /**
   * Verifie si une sequence de coups est correcte
   */
  checkSolution(puzzle: DailyPuzzle, moves: string[]): boolean {
    if (moves.length !== puzzle.solution.length) {
      return false;
    }

    for (let i = 0; i < moves.length; i++) {
      // Normaliser les coups pour la comparaison
      const playerMove = moves[i].toLowerCase().replace(/\s/g, '');
      const solutionMove = puzzle.solution[i].toLowerCase().replace(/\s/g, '');

      if (playerMove !== solutionMove) {
        return false;
      }
    }

    return true;
  }

  /**
   * Formate le temps en mm:ss
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// Instance singleton
export const dailyPuzzleService = new DailyPuzzleService();
export default dailyPuzzleService;

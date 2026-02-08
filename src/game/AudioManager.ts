/**
 * AudioManager - Gestionnaire des effets sonores
 *
 * Gère tous les sons du jeu avec contrôle du volume et mute
 */

export type SoundType = 'move' | 'capture' | 'promotion' | 'victory' | 'defeat' | 'click' | 'invalid';

interface SoundConfig {
  volume: number;
  enabled: boolean;
}

class AudioManager {
  private sounds: Map<SoundType, HTMLAudioElement[]> = new Map();
  private config: SoundConfig = {
    volume: 0.5,
    enabled: true,
  };
  private initialized: boolean = false;

  /**
   * Initialise le gestionnaire audio avec les sons générés
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Créer les sons avec l'API Web Audio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Générer les sons programmatiquement
    this.sounds.set('move', [this.createToneSound(audioContext, 200, 0.1, 'sine')]);
    this.sounds.set('capture', [this.createToneSound(audioContext, 150, 0.15, 'square')]);
    this.sounds.set('promotion', [this.createChimeSound(audioContext)]);
    this.sounds.set('victory', [this.createVictorySound(audioContext)]);
    this.sounds.set('defeat', [this.createDefeatSound(audioContext)]);
    this.sounds.set('click', [this.createClickSound(audioContext)]);
    this.sounds.set('invalid', [this.createInvalidSound(audioContext)]);

    this.initialized = true;

    // Charger la configuration sauvegardée
    this.loadConfig();
  }

  /**
   * Crée un son de tonalité simple
   */
  private createToneSound(
    ctx: AudioContext,
    frequency: number,
    duration: number,
    type: OscillatorType
  ): HTMLAudioElement {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    // Créer un élément audio factice pour la compatibilité
    const audio = new Audio();
    (audio as any)._play = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.type = type;
      gain.gain.setValueAtTime(0.3 * this.config.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    };

    return audio;
  }

  /**
   * Crée un son de carillon pour la promotion
   */
  private createChimeSound(ctx: AudioContext): HTMLAudioElement {
    const audio = new Audio();
    (audio as any)._play = () => {
      const frequencies = [523, 659, 784, 1047]; // Do Mi Sol Do (octave)
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const startTime = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0.2 * this.config.volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    };
    return audio;
  }

  /**
   * Crée un son de victoire
   */
  private createVictorySound(ctx: AudioContext): HTMLAudioElement {
    const audio = new Audio();
    (audio as any)._play = () => {
      const frequencies = [392, 523, 659, 784]; // Sol Do Mi Sol
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const startTime = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(0.25 * this.config.volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    };
    return audio;
  }

  /**
   * Crée un son de défaite
   */
  private createDefeatSound(ctx: AudioContext): HTMLAudioElement {
    const audio = new Audio();
    (audio as any)._play = () => {
      const frequencies = [392, 349, 311, 262]; // Sol Fa Mi♭ Do (descendant)
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const startTime = ctx.currentTime + i * 0.2;
        gain.gain.setValueAtTime(0.2 * this.config.volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    };
    return audio;
  }

  /**
   * Crée un son de clic
   */
  private createClickSound(ctx: AudioContext): HTMLAudioElement {
    const audio = new Audio();
    (audio as any)._play = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.1 * this.config.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    };
    return audio;
  }

  /**
   * Crée un son d'action invalide
   */
  private createInvalidSound(ctx: AudioContext): HTMLAudioElement {
    const audio = new Audio();
    (audio as any)._play = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 100;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.15 * this.config.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    };
    return audio;
  }

  /**
   * Joue un son
   */
  play(type: SoundType): void {
    if (!this.config.enabled || !this.initialized) return;

    const soundList = this.sounds.get(type);
    if (soundList && soundList.length > 0) {
      const sound = soundList[0];
      if ((sound as any)._play) {
        try {
          (sound as any)._play();
        } catch (e) {
          // Ignorer les erreurs audio
        }
      }
    }
  }

  /**
   * Définit le volume (0-1)
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.saveConfig();
  }

  /**
   * Récupère le volume actuel
   */
  getVolume(): number {
    return this.config.volume;
  }

  /**
   * Active/désactive le son
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig();
  }

  /**
   * Vérifie si le son est activé
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Bascule l'état du son
   */
  toggle(): boolean {
    this.config.enabled = !this.config.enabled;
    this.saveConfig();
    return this.config.enabled;
  }

  /**
   * Sauvegarde la configuration dans localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('audioConfig', JSON.stringify(this.config));
    } catch (e) {
      // Ignorer les erreurs de localStorage
    }
  }

  /**
   * Charge la configuration depuis localStorage
   */
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('audioConfig');
      if (saved) {
        const config = JSON.parse(saved);
        this.config.volume = config.volume ?? 0.5;
        this.config.enabled = config.enabled ?? true;
      }
    } catch (e) {
      // Utiliser les valeurs par défaut
    }
  }
}

// Instance singleton
export const audioManager = new AudioManager();

export default audioManager;

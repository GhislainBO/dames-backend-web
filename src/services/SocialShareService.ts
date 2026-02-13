/**
 * SocialShareService - Partage social ameliore avec generation d'images
 *
 * Genere des images partageables pour les resultats de parties et puzzles
 */

export interface ShareData {
  type: 'victory' | 'puzzle' | 'achievement' | 'streak';
  title: string;
  subtitle?: string;
  stats?: { label: string; value: string }[];
  primaryColor?: string;
}

class SocialShareService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 600;
      this.canvas.height = 315; // Format Open Graph
      this.ctx = this.canvas.getContext('2d');
    }
  }

  /**
   * Genere une image de partage
   */
  async generateShareImage(data: ShareData): Promise<Blob | null> {
    if (!this.canvas || !this.ctx) return null;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Fond avec degrade
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Bordure decorative
    const primaryColor = data.primaryColor || '#ffd700';
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Logo/Icone selon le type
    const icon = this.getIconForType(data.type);
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = primaryColor;
    ctx.fillText(icon, width / 2, 80);

    // Titre
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(data.title, width / 2, 140);

    // Sous-titre
    if (data.subtitle) {
      ctx.font = '24px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(data.subtitle, width / 2, 175);
    }

    // Stats
    if (data.stats && data.stats.length > 0) {
      const startY = 210;
      const statWidth = width / data.stats.length;

      data.stats.forEach((stat, index) => {
        const x = statWidth * index + statWidth / 2;

        // Valeur
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = primaryColor;
        ctx.fillText(stat.value, x, startY);

        // Label
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(stat.label, x, startY + 25);
      });
    }

    // Branding
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = primaryColor;
    ctx.textAlign = 'center';
    ctx.fillText('DAMESELITE', width / 2, height - 25);

    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('Dames Internationales FMJD', width / 2, height - 10);

    // Convertir en blob
    return new Promise((resolve) => {
      this.canvas?.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }

  /**
   * Retourne l'icone pour le type de partage
   */
  private getIconForType(type: ShareData['type']): string {
    switch (type) {
      case 'victory': return '🏆';
      case 'puzzle': return '🧩';
      case 'achievement': return '🎖️';
      case 'streak': return '🔥';
      default: return '🎮';
    }
  }

  /**
   * Genere une image de victoire
   */
  async generateVictoryImage(data: {
    playerName: string;
    opponent: string;
    moves: number;
    duration: string;
  }): Promise<Blob | null> {
    return this.generateShareImage({
      type: 'victory',
      title: 'Victoire!',
      subtitle: `${data.playerName} vs ${data.opponent}`,
      stats: [
        { label: 'Coups', value: data.moves.toString() },
        { label: 'Duree', value: data.duration },
      ],
      primaryColor: '#4CAF50',
    });
  }

  /**
   * Genere une image de puzzle resolu
   */
  async generatePuzzleImage(data: {
    date: string;
    time: string;
    attempts: number;
    streak: number;
  }): Promise<Blob | null> {
    return this.generateShareImage({
      type: 'puzzle',
      title: 'Puzzle Resolu!',
      subtitle: `Puzzle du ${data.date}`,
      stats: [
        { label: 'Temps', value: data.time },
        { label: 'Essais', value: data.attempts.toString() },
        { label: 'Serie', value: `${data.streak} jours` },
      ],
      primaryColor: '#9C27B0',
    });
  }

  /**
   * Genere une image d'achievement
   */
  async generateAchievementImage(data: {
    name: string;
    description: string;
    icon: string;
  }): Promise<Blob | null> {
    return this.generateShareImage({
      type: 'achievement',
      title: data.name,
      subtitle: data.description,
      primaryColor: '#FFD700',
    });
  }

  /**
   * Genere une image de streak
   */
  async generateStreakImage(data: {
    type: 'wins' | 'puzzles';
    streak: number;
  }): Promise<Blob | null> {
    const typeLabel = data.type === 'wins' ? 'victoires' : 'puzzles';
    return this.generateShareImage({
      type: 'streak',
      title: `Serie de ${data.streak}!`,
      subtitle: `${data.streak} ${typeLabel} consecutives`,
      primaryColor: '#FF5722',
    });
  }

  /**
   * Partage avec l'API Web Share si disponible
   */
  async shareWithImage(data: ShareData, text: string): Promise<boolean> {
    try {
      const imageBlob = await this.generateShareImage(data);

      if (imageBlob && 'share' in navigator && 'canShare' in navigator) {
        const file = new File([imageBlob], 'dameselite-share.png', { type: 'image/png' });
        const shareData = {
          title: 'DAMESELITE',
          text: text,
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return true;
        }
      }

      // Fallback: partage sans image
      if ('share' in navigator) {
        await navigator.share({
          title: 'DAMESELITE',
          text: text,
          url: 'https://dames-backend-web.vercel.app',
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur partage:', error);
      return false;
    }
  }

  /**
   * Telecharge l'image de partage
   */
  async downloadShareImage(data: ShareData, filename: string = 'dameselite-share.png'): Promise<void> {
    const imageBlob = await this.generateShareImage(data);
    if (!imageBlob) return;

    const url = URL.createObjectURL(imageBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Partage sur Twitter/X
   */
  shareOnTwitter(text: string): void {
    const url = encodeURIComponent('https://dames-backend-web.vercel.app');
    const encodedText = encodeURIComponent(text);
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${url}`, '_blank');
  }

  /**
   * Partage sur Facebook
   */
  shareOnFacebook(): void {
    const url = encodeURIComponent('https://dames-backend-web.vercel.app');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  }

  /**
   * Partage sur WhatsApp
   */
  shareOnWhatsApp(text: string): void {
    const encodedText = encodeURIComponent(`${text}\nhttps://dames-backend-web.vercel.app`);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  }

  /**
   * Partage sur Telegram
   */
  shareOnTelegram(text: string): void {
    const url = encodeURIComponent('https://dames-backend-web.vercel.app');
    const encodedText = encodeURIComponent(text);
    window.open(`https://t.me/share/url?url=${url}&text=${encodedText}`, '_blank');
  }

  /**
   * Copie le lien de partage
   */
  async copyShareLink(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(`${text}\nhttps://dames-backend-web.vercel.app`);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Instance singleton
export const socialShareService = new SocialShareService();
export default socialShareService;

/**
 * NotificationService - Gestion des notifications locales
 */

import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

class NotificationService {
  private initialized = false;

  /**
   * Initialise le service de notifications
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    // Verifier si on est sur une plateforme native
    if (!Capacitor.isNativePlatform()) {
      console.log('Notifications: Mode web (notifications non disponibles)');
      return false;
    }

    try {
      // Demander la permission
      const permission = await LocalNotifications.requestPermissions();

      if (permission.display === 'granted') {
        this.initialized = true;
        console.log('Notifications: Initialisees avec succes');

        // Ecouter les clics sur les notifications
        LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
          console.log('Notification cliquee:', notification);
          this.handleNotificationClick(notification.notification.extra);
        });

        return true;
      } else {
        console.log('Notifications: Permission refusee');
        return false;
      }
    } catch (error) {
      console.error('Erreur initialisation notifications:', error);
      return false;
    }
  }

  /**
   * Gere le clic sur une notification
   */
  private handleNotificationClick(extra: any) {
    if (extra?.action === 'daily_bonus') {
      // Rediriger vers le wallet
      window.location.hash = '#wallet';
    } else if (extra?.action === 'tournament') {
      // Rediriger vers les tournois
      window.location.hash = '#tournaments';
    }
  }

  /**
   * Programme le rappel du bonus quotidien
   */
  async scheduleDailyBonusReminder(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!Capacitor.isNativePlatform()) return;

    try {
      // Annuler les anciennes notifications de bonus
      await this.cancelNotificationsByTag('daily_bonus');

      // Programmer pour demain a 10h
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const options: ScheduleOptions = {
        notifications: [
          {
            id: 1001,
            title: 'Bonus quotidien disponible !',
            body: 'Connectez-vous pour recuperer vos jetons gratuits',
            schedule: { at: tomorrow, allowWhileIdle: true },
            extra: { action: 'daily_bonus', tag: 'daily_bonus' },
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#FFD700',
          },
        ],
      };

      await LocalNotifications.schedule(options);
      console.log('Rappel bonus quotidien programme pour:', tomorrow);
    } catch (error) {
      console.error('Erreur programmation rappel bonus:', error);
    }
  }

  /**
   * Programme une notification de tournoi
   */
  async scheduleTournamentReminder(
    tournamentId: string,
    tournamentName: string,
    startTime: Date
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!Capacitor.isNativePlatform()) return;

    try {
      // Notification 15 minutes avant
      const reminderTime = new Date(startTime.getTime() - 15 * 60 * 1000);

      if (reminderTime <= new Date()) {
        console.log('Tournoi deja commence ou trop proche');
        return;
      }

      const notificationId = parseInt(tournamentId.replace(/\D/g, '').slice(0, 8)) || Date.now();

      const options: ScheduleOptions = {
        notifications: [
          {
            id: notificationId,
            title: 'Tournoi imminent !',
            body: `${tournamentName} commence dans 15 minutes`,
            schedule: { at: reminderTime, allowWhileIdle: true },
            extra: {
              action: 'tournament',
              tournamentId,
              tag: 'tournament'
            },
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#4A9EFF',
          },
        ],
      };

      await LocalNotifications.schedule(options);
      console.log('Rappel tournoi programme pour:', reminderTime);
    } catch (error) {
      console.error('Erreur programmation rappel tournoi:', error);
    }
  }

  /**
   * Envoie une notification immediate
   */
  async sendImmediateNotification(
    title: string,
    body: string,
    extra?: any
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!Capacitor.isNativePlatform()) {
      // Fallback web avec l'API Notification du navigateur
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
      return;
    }

    try {
      const options: ScheduleOptions = {
        notifications: [
          {
            id: Date.now(),
            title,
            body,
            extra,
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#FFD700',
          },
        ],
      };

      await LocalNotifications.schedule(options);
    } catch (error) {
      console.error('Erreur envoi notification:', error);
    }
  }

  /**
   * Notifie une victoire en tournoi
   */
  async notifyTournamentWin(tournamentName: string, prize: number): Promise<void> {
    await this.sendImmediateNotification(
      'Victoire en tournoi !',
      `Vous avez gagne ${prize} jetons dans ${tournamentName}`,
      { action: 'tournament' }
    );
  }

  /**
   * Notifie un achat reussi
   */
  async notifyPurchaseSuccess(coins: number): Promise<void> {
    await this.sendImmediateNotification(
      'Achat confirme',
      `${coins} jetons ont ete credites sur votre compte`,
      { action: 'wallet' }
    );
  }

  /**
   * Annule les notifications par tag
   */
  private async cancelNotificationsByTag(tag: string): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      const toCancel = pending.notifications
        .filter(n => n.extra?.tag === tag)
        .map(n => ({ id: n.id }));

      if (toCancel.length > 0) {
        await LocalNotifications.cancel({ notifications: toCancel });
      }
    } catch (error) {
      console.error('Erreur annulation notifications:', error);
    }
  }

  /**
   * Annule toutes les notifications
   */
  async cancelAll(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications.map(n => ({ id: n.id }))
        });
      }
    } catch (error) {
      console.error('Erreur annulation notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();

/**
 * FirebaseService - Gestion des notifications push Firebase
 *
 * Fonctionnalités:
 * - Notifications push pour bonus quotidien
 * - Rappels de tournois
 * - Notifications de match multijoueur
 * - Alertes promotionnelles
 */

import { Capacitor } from '@capacitor/core';

const API_URL = 'https://dames-backend-production.up.railway.app';

// Types pour les notifications (définis localement pour éviter les erreurs d'import)
interface PushNotificationSchema {
  title?: string;
  body?: string;
  data?: Record<string, string>;
}

interface ActionPerformed {
  notification: PushNotificationSchema;
}

interface Token {
  value: string;
}

// Import dynamique des plugins Capacitor (uniquement sur mobile)
let PushNotifications: any = null;
let LocalNotifications: any = null;

const loadCapacitorPlugins = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const pushModule = await import(/* @vite-ignore */ '@capacitor/push-notifications');
      PushNotifications = pushModule.PushNotifications;
    } catch (e) {
      console.log('Push notifications plugin not available');
    }
    try {
      const localModule = await import(/* @vite-ignore */ '@capacitor/local-notifications');
      LocalNotifications = localModule.LocalNotifications;
    } catch (e) {
      console.log('Local notifications plugin not available');
    }
  }
};

// Types de notifications
export type NotificationType =
  | 'daily_bonus'
  | 'tournament_start'
  | 'tournament_reminder'
  | 'match_invite'
  | 'match_your_turn'
  | 'promotion'
  | 'battle_pass'
  | 'friend_request';

export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Configuration
const NOTIFICATION_CHANNEL = 'dames_notifications';

class FirebaseService {
  private initialized = false;
  private isNativePlatform = false;
  private fcmToken: string | null = null;
  private notificationListeners: ((notification: NotificationData) => void)[] = [];

  constructor() {
    this.isNativePlatform = Capacitor.isNativePlatform();
  }

  /**
   * Initialise Firebase Push Notifications
   */
  async initialize(): Promise<void> {
    if (!this.isNativePlatform) {
      console.log('Firebase: Mode web - notifications locales uniquement');
      this.initialized = true;
      return;
    }

    // Charger les plugins Capacitor
    await loadCapacitorPlugins();

    if (!PushNotifications) {
      console.log('Firebase: Plugin push notifications non disponible');
      this.initialized = true;
      return;
    }

    if (this.initialized) return;

    try {
      // Demander la permission
      const permission = await PushNotifications.requestPermissions();

      if (permission.receive !== 'granted') {
        console.log('Firebase: Permission notifications refusée');
        return;
      }

      // Enregistrer pour les notifications push
      await PushNotifications.register();

      // Écouter le token FCM
      PushNotifications.addListener('registration', (token: Token) => {
        this.fcmToken = token.value;
        console.log('Firebase: Token FCM reçu', token.value.substring(0, 20) + '...');
        // Envoyer le token au backend
        this.sendTokenToBackend(token.value);
      });

      // Écouter les erreurs d'enregistrement
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Firebase: Erreur enregistrement', error);
      });

      // Écouter les notifications reçues (app au premier plan)
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Firebase: Notification reçue', notification);
        this.handleNotification(notification);
      });

      // Écouter les actions sur les notifications (tap)
      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('Firebase: Action sur notification', action);
        this.handleNotificationAction(action);
      });

      // Créer le canal de notification (Android)
      if (Capacitor.getPlatform() === 'android') {
        await LocalNotifications.createChannel({
          id: NOTIFICATION_CHANNEL,
          name: 'Dames - Notifications',
          description: 'Notifications du jeu de dames',
          importance: 4, // HIGH
          visibility: 1, // PUBLIC
          sound: 'notification.wav',
          vibration: true,
        });
      }

      this.initialized = true;
      console.log('Firebase: Initialisé avec succès');
    } catch (error) {
      console.error('Firebase: Erreur initialisation', error);
    }
  }

  /**
   * Retourne le token FCM actuel
   */
  getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Envoie le token FCM au backend
   */
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        console.log('Firebase: Pas de token auth, envoi différé');
        return;
      }

      const response = await fetch(`${API_URL}/api/notifications/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token,
          platform: Capacitor.getPlatform(),
        }),
      });

      if (response.ok) {
        console.log('Firebase: Token envoyé au backend');
      }
    } catch (error) {
      console.error('Firebase: Erreur envoi token', error);
    }
  }

  /**
   * Gère une notification reçue
   */
  private handleNotification(notification: PushNotificationSchema): void {
    const data: NotificationData = {
      type: (notification.data?.type as NotificationType) || 'promotion',
      title: notification.title || 'Dames',
      body: notification.body || '',
      data: notification.data,
    };

    // Notifier les listeners
    this.notificationListeners.forEach(listener => listener(data));
  }

  /**
   * Gère une action sur une notification (tap)
   */
  private handleNotificationAction(action: ActionPerformed): void {
    const notificationType = action.notification.data?.type as NotificationType;

    switch (notificationType) {
      case 'daily_bonus':
        // Naviguer vers la page de bonus
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/bonus' }));
        break;
      case 'tournament_start':
      case 'tournament_reminder':
        // Naviguer vers les tournois
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/tournaments' }));
        break;
      case 'match_invite':
      case 'match_your_turn':
        // Naviguer vers la partie
        const gameId = action.notification.data?.gameId;
        if (gameId) {
          window.dispatchEvent(new CustomEvent('navigate', { detail: `/game/${gameId}` }));
        }
        break;
      case 'battle_pass':
        // Naviguer vers le battle pass
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/battle-pass' }));
        break;
      case 'promotion':
        // Naviguer vers la boutique
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/shop' }));
        break;
      default:
        console.log('Firebase: Type de notification inconnu', notificationType);
    }
  }

  /**
   * Ajoute un listener pour les notifications
   */
  addNotificationListener(listener: (notification: NotificationData) => void): () => void {
    this.notificationListeners.push(listener);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(l => l !== listener);
    };
  }

  /**
   * Programme une notification locale (rappel bonus quotidien)
   */
  async scheduleDailyBonusReminder(hour: number = 10): Promise<void> {
    if (!LocalNotifications) {
      console.log('Firebase: Local notifications non disponible');
      return;
    }

    try {
      // Annuler les anciennes notifications de bonus
      await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

      // Calculer la prochaine occurrence
      const now = new Date();
      let scheduledTime = new Date();
      scheduledTime.setHours(hour, 0, 0, 0);

      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 1,
            title: '🎁 Bonus quotidien disponible !',
            body: 'Connectez-vous pour récupérer vos jetons gratuits',
            schedule: {
              at: scheduledTime,
              repeats: true,
              every: 'day',
            },
            channelId: NOTIFICATION_CHANNEL,
            actionTypeId: 'daily_bonus',
            extra: { type: 'daily_bonus' },
          },
        ],
      });

      console.log('Firebase: Rappel bonus quotidien programmé pour', scheduledTime);
    } catch (error) {
      console.error('Firebase: Erreur programmation notification', error);
    }
  }

  /**
   * Programme un rappel de tournoi
   */
  async scheduleTournamentReminder(tournamentId: string, startTime: Date, tournamentName: string): Promise<void> {
    if (!LocalNotifications) {
      console.log('Firebase: Local notifications non disponible');
      return;
    }

    try {
      const notificationId = parseInt(tournamentId, 10) || Date.now();
      const reminderTime = new Date(startTime.getTime() - 15 * 60 * 1000); // 15 min avant

      if (reminderTime <= new Date()) {
        console.log('Firebase: Tournoi trop proche, pas de rappel');
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: '🏆 Tournoi dans 15 minutes !',
            body: `Le tournoi "${tournamentName}" commence bientôt`,
            schedule: { at: reminderTime },
            channelId: NOTIFICATION_CHANNEL,
            extra: {
              type: 'tournament_reminder',
              tournamentId,
            },
          },
        ],
      });

      console.log('Firebase: Rappel tournoi programmé pour', reminderTime);
    } catch (error) {
      console.error('Firebase: Erreur programmation rappel tournoi', error);
    }
  }

  /**
   * Annule toutes les notifications programmées
   */
  async cancelAllNotifications(): Promise<void> {
    if (!LocalNotifications) return;

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
        console.log('Firebase: Toutes les notifications annulées');
      }
    } catch (error) {
      console.error('Firebase: Erreur annulation notifications', error);
    }
  }

  /**
   * Vérifie si les notifications sont activées
   */
  async areNotificationsEnabled(): Promise<boolean> {
    if (!this.isNativePlatform || !PushNotifications) return true;

    try {
      const permission = await PushNotifications.checkPermissions();
      return permission.receive === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Ouvre les paramètres de notification du système
   */
  async openNotificationSettings(): Promise<void> {
    // Cette fonctionnalité nécessite un plugin supplémentaire
    // ou peut être implémentée via App.openUrl avec le bon scheme
    console.log('Firebase: Ouverture paramètres notifications');
  }
}

// Singleton
export const firebaseService = new FirebaseService();

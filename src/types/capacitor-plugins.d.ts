/**
 * Type declarations for optional Capacitor plugins
 * These plugins are only used on native mobile platforms
 */

declare module '@capacitor/push-notifications' {
  export interface PushNotificationSchema {
    title?: string;
    body?: string;
    data?: Record<string, string>;
  }

  export interface ActionPerformed {
    notification: PushNotificationSchema;
  }

  export interface Token {
    value: string;
  }

  export interface PermissionStatus {
    receive: 'granted' | 'denied' | 'prompt';
  }

  export const PushNotifications: {
    requestPermissions(): Promise<PermissionStatus>;
    checkPermissions(): Promise<PermissionStatus>;
    register(): Promise<void>;
    addListener(event: string, callback: (data: any) => void): void;
  };
}

declare module '@capacitor/local-notifications' {
  export interface LocalNotificationSchema {
    id: number;
    title: string;
    body: string;
    schedule?: {
      at?: Date;
      repeats?: boolean;
      every?: string;
      allowWhileIdle?: boolean;
    };
    channelId?: string;
    actionTypeId?: string;
    extra?: Record<string, any>;
    smallIcon?: string;
    largeIcon?: string;
    iconColor?: string;
    sound?: string;
    attachments?: any[];
    group?: string;
    groupSummary?: boolean;
    ongoing?: boolean;
    autoCancel?: boolean;
  }

  export interface ScheduleOptions {
    notifications: LocalNotificationSchema[];
  }

  export interface PendingLocalNotificationSchema {
    id: number;
    title?: string;
    body?: string;
    extra?: Record<string, any>;
  }

  export interface PendingResult {
    notifications: PendingLocalNotificationSchema[];
  }

  export interface PermissionStatus {
    display: 'granted' | 'denied' | 'prompt';
  }

  export const LocalNotifications: {
    schedule(options: ScheduleOptions): Promise<void>;
    cancel(options: { notifications: { id: number }[] }): Promise<void>;
    getPending(): Promise<PendingResult>;
    requestPermissions(): Promise<PermissionStatus>;
    addListener(event: string, callback: (data: any) => void): void;
    createChannel(channel: {
      id: string;
      name: string;
      description?: string;
      importance?: number;
      visibility?: number;
      sound?: string;
      vibration?: boolean;
    }): Promise<void>;
  };
}

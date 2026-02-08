/**
 * AnalyticsService - Service d'analytics pour tracking
 *
 * Compatible avec Google Analytics, Plausible, ou custom
 */

type EventCategory = 'game' | 'user' | 'shop' | 'social' | 'navigation' | 'engagement';

interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
}

interface PageView {
  path: string;
  title?: string;
  referrer?: string;
}

interface UserProperties {
  userId?: string;
  username?: string;
  isPremium?: boolean;
  language?: string;
  gamesPlayed?: number;
  winRate?: number;
  [key: string]: string | boolean | number | undefined;
}

class AnalyticsService {
  private initialized = false;
  private debugMode = false;
  private userId: string | null = null;
  private sessionId: string;
  private sessionStartTime: number;
  private pageViewCount = 0;
  private eventQueue: AnalyticsEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.loadUserId();
  }

  /**
   * Initialize analytics (call once on app start)
   */
  init(options?: { debug?: boolean }) {
    if (this.initialized) return;

    this.debugMode = options?.debug || false;
    this.initialized = true;

    // Track session start
    this.trackEvent({
      category: 'user',
      action: 'session_start',
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent({
          category: 'user',
          action: 'session_background',
        });
      } else {
        this.trackEvent({
          category: 'user',
          action: 'session_foreground',
        });
      }
    });

    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
    });

    this.log('Analytics initialized');
  }

  /**
   * Track page view
   */
  trackPageView(pageView: PageView) {
    this.pageViewCount++;

    const data = {
      ...pageView,
      sessionId: this.sessionId,
      pageViewNumber: this.pageViewCount,
      timestamp: Date.now(),
    };

    this.log('Page view:', data);
    this.sendToAnalytics('pageview', data);
  }

  /**
   * Track custom event
   */
  trackEvent(event: AnalyticsEvent) {
    const data = {
      ...event,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    this.log('Event:', data);
    this.sendToAnalytics('event', data);
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: UserProperties) {
    if (properties.userId) {
      this.userId = properties.userId;
      localStorage.setItem('analytics_user_id', properties.userId);
    }

    this.log('User properties:', properties);
    this.sendToAnalytics('user_properties', properties as Record<string, unknown>);
  }

  /**
   * Track game events
   */
  trackGameStart(mode: string, difficulty?: string) {
    this.trackEvent({
      category: 'game',
      action: 'game_start',
      label: `${mode}${difficulty ? `_${difficulty}` : ''}`,
    });
  }

  trackGameEnd(result: 'win' | 'loss' | 'draw', duration: number, mode: string) {
    this.trackEvent({
      category: 'game',
      action: 'game_end',
      label: `${mode}_${result}`,
      value: Math.round(duration / 1000), // Duration in seconds
    });
  }

  trackMove(moveNumber: number) {
    // Only track every 10th move to reduce noise
    if (moveNumber % 10 === 0) {
      this.trackEvent({
        category: 'game',
        action: 'move_milestone',
        value: moveNumber,
      });
    }
  }

  /**
   * Track shop events
   */
  trackShopView(category: string) {
    this.trackEvent({
      category: 'shop',
      action: 'view_category',
      label: category,
    });
  }

  trackPurchase(itemId: string, price: number, currency: string = 'coins') {
    this.trackEvent({
      category: 'shop',
      action: 'purchase',
      label: `${itemId}_${currency}`,
      value: price,
    });
  }

  /**
   * Track social events
   */
  trackShare(platform: string, content: string) {
    this.trackEvent({
      category: 'social',
      action: 'share',
      label: `${platform}_${content}`,
    });
  }

  trackReferral(code: string) {
    this.trackEvent({
      category: 'social',
      action: 'referral_use',
      label: code,
    });
  }

  /**
   * Track engagement events
   */
  trackAchievementUnlock(achievementId: string) {
    this.trackEvent({
      category: 'engagement',
      action: 'achievement_unlock',
      label: achievementId,
    });
  }

  trackPuzzleComplete(puzzleId: string, attempts: number, timeSeconds: number) {
    this.trackEvent({
      category: 'engagement',
      action: 'puzzle_complete',
      label: puzzleId,
      value: timeSeconds,
    });
  }

  trackTutorialProgress(step: number, completed: boolean) {
    this.trackEvent({
      category: 'engagement',
      action: completed ? 'tutorial_complete' : 'tutorial_step',
      value: step,
    });
  }

  trackDailyStreak(streakDays: number) {
    this.trackEvent({
      category: 'engagement',
      action: 'daily_streak',
      value: streakDays,
    });
  }

  /**
   * Track errors
   */
  trackError(errorType: string, errorMessage: string) {
    this.trackEvent({
      category: 'user',
      action: 'error',
      label: `${errorType}: ${errorMessage}`,
    });
  }

  /**
   * Get session duration in seconds
   */
  getSessionDuration(): number {
    return Math.round((Date.now() - this.sessionStartTime) / 1000);
  }

  /**
   * Get analytics summary for debugging
   */
  getSummary() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      sessionDuration: this.getSessionDuration(),
      pageViews: this.pageViewCount,
      initialized: this.initialized,
    };
  }

  // Private methods

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadUserId() {
    this.userId = localStorage.getItem('analytics_user_id');
  }

  private trackSessionEnd() {
    const duration = this.getSessionDuration();
    this.trackEvent({
      category: 'user',
      action: 'session_end',
      value: duration,
    });
  }

  private sendToAnalytics(type: string, data: Record<string, unknown>) {
    // Store locally for now
    const analyticsData = JSON.parse(localStorage.getItem('dameselite_analytics') || '[]');
    analyticsData.push({
      type,
      data,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 100 events
    if (analyticsData.length > 100) {
      analyticsData.splice(0, analyticsData.length - 100);
    }

    localStorage.setItem('dameselite_analytics', JSON.stringify(analyticsData));

    // If Google Analytics is available, send there too
    if (typeof window !== 'undefined' && (window as any).gtag) {
      if (type === 'pageview') {
        (window as any).gtag('event', 'page_view', data);
      } else if (type === 'event') {
        (window as any).gtag('event', data.action, {
          event_category: data.category,
          event_label: data.label,
          value: data.value,
        });
      }
    }

    // If Plausible is available
    if (typeof window !== 'undefined' && (window as any).plausible) {
      if (type === 'event') {
        (window as any).plausible(data.action as string, { props: data });
      }
    }
  }

  private log(...args: unknown[]) {
    if (this.debugMode) {
      console.log('[Analytics]', ...args);
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;

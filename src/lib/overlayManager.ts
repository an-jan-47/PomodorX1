// Enhanced overlay management for cross-app persistence

interface TimerData {
  timeRemaining: number;
  sessionType: 'focus' | 'break';
  isRunning: boolean;
  currentSession: number;
  totalSessions: number;
}

export class PersistentOverlayManager {
  private worker: ServiceWorker | null = null;
  private notificationInstance: Notification | null = null;
  private overlayData: TimerData | null = null;
  private isActive: boolean = false;

  constructor() {
    this.initializeServiceWorker();
  }

  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/timer-sw.js');
        this.worker = registration.active;
        console.log('Enhanced overlay service worker ready');
      } catch (error) {
        console.error('Service worker failed:', error);
      }
    }
  }

  async enablePersistentMode(timerData: TimerData) {
    // Request permissions first
    const notificationPermission = await this.requestPermissions();
    
    if (!notificationPermission) {
      throw new Error('Notification permission required for persistent mode');
    }

    this.overlayData = timerData;
    this.isActive = true;

    // Start persistent notification system
    await this.startPersistentNotifications();

    // Register window state listeners
    this.setupWindowStateListeners();

    console.log('Persistent overlay mode enabled');
    return true;
  }

  private async requestPermissions(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  private async startPersistentNotifications() {
    // Create initial notification
    this.showTimerNotification();

    // Setup periodic updates
    setInterval(() => {
      if (this.isActive && this.overlayData) {
        this.updateTimerNotification();
      }
    }, 1000);
  }

  private showTimerNotification() {
    if (!this.overlayData) return;

    const { timeRemaining, sessionType, isRunning } = this.overlayData;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    this.notificationInstance = new Notification('PomodoroX Timer', {
      body: `${timeStr} - ${sessionType} ${isRunning ? '(Running)' : '(Paused)'}`,
      icon: '/favicon.ico',
      tag: 'pomodoro-persistent',
      requireInteraction: true,
      silent: true
    });

    this.notificationInstance.onclick = () => {
      window.focus();
      this.notificationInstance?.close();
    };
  }

  private updateTimerNotification() {
    if (this.notificationInstance) {
      this.notificationInstance.close();
    }
    this.showTimerNotification();
  }

  private setupWindowStateListeners() {
    // Handle window minimize/restore
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isActive) {
        console.log('Window hidden - maintaining persistent notifications');
      } else if (!document.hidden && this.isActive) {
        console.log('Window visible - overlay active');
      }
    });

    // Handle app switching
    window.addEventListener('blur', () => {
      if (this.isActive) {
        console.log('App lost focus - persistent mode active');
      }
    });

    window.addEventListener('focus', () => {
      if (this.isActive) {
        console.log('App gained focus - overlay restored');
      }
    });
  }

  updateTimer(newData: Partial<TimerData>) {
    this.overlayData = { ...this.overlayData, ...newData };
  }

  disablePersistentMode() {
    this.isActive = false;
    if (this.notificationInstance) {
      this.notificationInstance.close();
      this.notificationInstance = null;
    }
    console.log('Persistent overlay mode disabled');
  }

  isEnabled(): boolean {
    return this.isActive;
  }
}

// Global instance
export const overlayManager = new PersistentOverlayManager();

import { useState, useEffect, useCallback } from "react";

// Service Worker registration for background notifications
export const registerTimerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/timer-sw.js');
      console.log('Timer Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Timer Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Create persistent timer notification
export const createPersistentNotification = (
  title: string,
  body: string,
  options?: NotificationOptions
) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'pomodoro-timer',
      requireInteraction: true,
      persistent: true,
      ...options
    });
    
    return notification;
  }
  return null;
};

// Browser window detection utilities
export const useBrowserWindowState = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    const handleWindowBlur = () => {
      setIsMinimized(true);
    };

    const handleWindowFocus = () => {
      setIsMinimized(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  return { isVisible, isMinimized };
};

// Picture-in-Picture API for video overlay (experimental)
export const usePictureInPicture = () => {
  const [isPiPSupported] = useState('pictureInPictureEnabled' in document);
  const [isPiPActive, setIsPiPActive] = useState(false);

  const enterPictureInPicture = useCallback(async (videoElement: HTMLVideoElement) => {
    if (isPiPSupported && !isPiPActive) {
      try {
        await videoElement.requestPictureInPicture();
        setIsPiPActive(true);
      } catch (error) {
        console.error('Picture-in-Picture failed:', error);
      }
    }
  }, [isPiPSupported, isPiPActive]);

  const exitPictureInPicture = useCallback(async () => {
    if (isPiPSupported && isPiPActive) {
      try {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } catch (error) {
        console.error('Exit Picture-in-Picture failed:', error);
      }
    }
  }, [isPiPSupported, isPiPActive]);

  return {
    isPiPSupported,
    isPiPActive,
    enterPictureInPicture,
    exitPictureInPicture
  };
};

// Desktop notification with timer update
export class PersistentTimerNotification {
  private notification: Notification | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  async create(timeRemaining: number, sessionType: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }

    const title = sessionType === 'focus' ? '🍅 Focus Time' : '☕ Break Time';
    const body = `${this.formatTime(timeRemaining)} remaining`;

    this.notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'pomodoro-timer-persistent',
      requireInteraction: false,
      silent: false,
      persistent: true
    });

    return true;
  }

  startUpdating(timeRemaining: number, sessionType: string, onComplete: () => void) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    let currentTime = timeRemaining;

    this.updateInterval = setInterval(() => {
      currentTime -= 1;

      if (currentTime <= 0) {
        this.complete(sessionType);
        onComplete();
        return;
      }

      this.update(currentTime, sessionType);
    }, 1000);
  }

  update(timeRemaining: number, sessionType: string) {
    if (this.notification) {
      this.notification.close();
    }
    this.create(timeRemaining, sessionType);
  }

  complete(sessionType: string) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.notification) {
      this.notification.close();
    }

    // Create completion notification
    const title = sessionType === 'focus' ? '✅ Focus Complete!' : '✅ Break Complete!';
    const body = sessionType === 'focus' ? 'Time for a break!' : 'Time to focus again!';

    this.notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'pomodoro-timer-complete',
      requireInteraction: true,
      silent: false
    });
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.notification) {
      this.notification.close();
      this.notification = null;
    }
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

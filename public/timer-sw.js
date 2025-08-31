// Timer Service Worker for background functionality
const CACHE_NAME = 'pomodoro-timer-v1';

self.addEventListener('install', (event) => {
  console.log('Timer Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Timer Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Handle timer messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'START_TIMER':
      startBackgroundTimer(data);
      break;
    case 'STOP_TIMER':
      stopBackgroundTimer();
      break;
    case 'UPDATE_TIMER':
      updateTimerState(data);
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

let timerInterval;
let timerState = {
  timeRemaining: 0,
  isRunning: false,
  sessionType: 'focus',
  startTime: 0
};

function startBackgroundTimer(data) {
  timerState = { ...data, startTime: Date.now() };
  
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    timerState.timeRemaining -= 1;

    // Send update to all clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'TIMER_UPDATE',
          data: timerState
        });
      });
    });

    // Timer completed
    if (timerState.timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      
      // Show notification
      self.registration.showNotification('🍅 Pomodoro Timer', {
        body: timerState.sessionType === 'focus' 
          ? 'Focus session complete! Time for a break.' 
          : 'Break complete! Time to focus.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'pomodoro-complete',
        requireInteraction: true,
        actions: [
          {
            action: 'start-break',
            title: 'Start Break'
          },
          {
            action: 'start-focus',
            title: 'Start Focus'
          }
        ]
      });

      // Send completion message to clients
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'TIMER_COMPLETE',
            data: timerState
          });
        });
      });
    }
  }, 1000);
}

function stopBackgroundTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerState.isRunning = false;
}

function updateTimerState(data) {
  timerState = { ...timerState, ...data };
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;

  // Focus on existing window or open new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        // Focus existing window
        return clients[0].focus();
      } else {
        // Open new window
        return self.clients.openWindow('/');
      }
    }).then(client => {
      // Send action to client
      if (client) {
        client.postMessage({
          type: 'NOTIFICATION_ACTION',
          action: action
        });
      }
    })
  );
});

// Periodic background sync for timer accuracy
self.addEventListener('sync', (event) => {
  if (event.tag === 'timer-sync') {
    event.waitUntil(syncTimer());
  }
});

function syncTimer() {
  if (timerState.isRunning && timerState.startTime) {
    const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
    const newTimeRemaining = Math.max(0, timerState.timeRemaining - elapsed);
    
    if (newTimeRemaining !== timerState.timeRemaining) {
      timerState.timeRemaining = newTimeRemaining;
      timerState.startTime = Date.now();
      
      // Notify clients of sync update
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'TIMER_SYNC',
            data: timerState
          });
        });
      });
    }
  }
}

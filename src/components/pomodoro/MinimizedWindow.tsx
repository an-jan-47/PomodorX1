import React, { useEffect, useRef, useCallback } from "react";
import { useApp } from "@/hooks/useApp";

interface MinimizedWindowProps {
  timeRemaining: number;
  currentSessionType: "focus" | "shortBreak" | "longBreak";
  isRunning: boolean;
}

// Extend Window interface to include our custom sync function
declare global {
  interface Window {
    syncTimerState?: (timeLeft: number, isRunning: boolean, sessionType: string) => void;
  }
}

const MinimizedWindow: React.FC<MinimizedWindowProps> = ({
  timeRemaining,
  currentSessionType,
  isRunning
}) => {
  const { isMinimized, timerSettings, setIsMinimized } = useApp();
  const popupWindowRef = useRef<Window | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format time display with robust validation
  const formatTime = useCallback((seconds: number) => {
    // Handle NaN, negative, or invalid values
    if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) {
      return "00:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Calculate progress with all session types
  const getProgress = useCallback(() => {
    let totalDuration;
    switch (currentSessionType) {
      case "focus":
        totalDuration = timerSettings.focusDuration * 60;
        break;
      case "shortBreak":
        totalDuration = timerSettings.shortBreakDuration * 60;
        break;
      case "longBreak":
        totalDuration = timerSettings.longBreakDuration * 60;
        break;
      default:
        totalDuration = timerSettings.focusDuration * 60;
    }
    return Math.max(0, Math.min(100, ((totalDuration - timeRemaining) / totalDuration) * 100));
  }, [currentSessionType, timerSettings, timeRemaining]);

  // Update popup content with strict validation and immediate execution
  const updatePopupContent = useCallback(() => {
    if (popupWindowRef.current && !popupWindowRef.current.closed && popupWindowRef.current.syncTimerState) {
      try {
        // Ensure we have valid values before syncing
        const validTime = (typeof timeRemaining === 'number' && !isNaN(timeRemaining) && timeRemaining >= 0) ? timeRemaining : 0;
        const validRunning = typeof isRunning === 'boolean' ? isRunning : false;
        const validSession = currentSessionType || 'focus';
        
        // Call sync function
        popupWindowRef.current.syncTimerState(validTime, validRunning, validSession);
      } catch (error) {
        console.error('Failed to sync popup state:', error);
      }
    }
  }, [timeRemaining, isRunning, currentSessionType]);

  // Set up live synchronization with higher frequency for seamless updates
  const setupPopupSync = useCallback(() => {
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      
      // Much higher frequency sync for perfect synchronization (100ms)
      syncIntervalRef.current = setInterval(() => {
        if (popupWindowRef.current?.closed) {
          clearInterval(syncIntervalRef.current!);
          syncIntervalRef.current = null;
          setIsMinimized(false);
          return;
        }
        updatePopupContent();
      }, 100); // Increased from 250ms to 100ms for smoother updates
    }
  }, [updatePopupContent, setIsMinimized]);

  // Create enhanced persistent popup window with ultra-responsive design
  const createPersistentPopup = useCallback(() => {
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      updatePopupContent();
      return;
    }

    // Calculate ultra-compact popup dimensions for better small screen support
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;
    
    // Even smaller dimensions for ultra-compact mode
    const minWidth = 160;
    const minHeight = 120;
    const maxWidth = Math.min(300, screenWidth * 0.8);
    const maxHeight = Math.min(250, screenHeight * 0.7);
    
    const popupWidth = Math.max(minWidth, Math.min(maxWidth, 220));
    const popupHeight = Math.max(minHeight, Math.min(maxHeight, 160));
    
    const left = Math.max(0, screenWidth - popupWidth - 15);
    const top = Math.max(0, 15);

    const popupFeatures = [
      `width=${popupWidth}`,
      `height=${popupHeight}`,
      `top=${top}`,
      `left=${left}`,
      'toolbar=no',
      'menubar=no',
      'scrollbars=no',
      'resizable=yes',
      'status=no',
      'alwaysRaised=yes'
    ].join(',');

    const displayTime = formatTime(timeRemaining);
    const sessionName = currentSessionType === 'focus' ? 'Focus Time' : 'Break Time';
    const progressPercent = getProgress();

    const popupHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PomodoroX - ${sessionName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px;
            margin: 0;
            overflow: hidden;
        }
        
        .timer-container {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 12px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 280px;
            width: 100%;
            min-width: 200px;
        }
        
        .app-title {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 8px;
            opacity: 0.9;
        }
        
        .timer-display {
            font-size: 32px;
            font-weight: 800;
            font-family: 'Courier New', monospace;
            margin: 8px 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            letter-spacing: 1px;
            line-height: 1;
        }
        
        .session-info {
            font-size: 14px;
            margin-bottom: 8px;
            font-weight: 500;
            opacity: 0.9;
        }
        
        .progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            overflow: hidden;
            margin: 8px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #34d399);
            transition: width 0.3s ease;
            border-radius: 3px;
        }
        
        .status-display {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin: 8px 0;
            font-size: 11px;
            font-weight: 500;
        }
        
        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            display: inline-block;
        }
        
        .running { 
            background: #10b981; 
            animation: pulse 1s infinite;
        }
        
        .paused { 
            background: #f59e0b; 
        }
        
        .stopped { 
            background: #ef4444; 
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .close-button {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 500;
            margin-top: 8px;
            transition: all 0.2s ease;
        }
        
        .close-button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
        }
        
        /* Ultra compact mode for very small screens */
        @media (max-width: 220px) {
            body { padding: 4px; }
            .timer-container { 
                padding: 8px; 
                min-width: 160px;
                border-radius: 12px;
            }
            .app-title { font-size: 10px; margin-bottom: 4px; }
            .timer-display { font-size: 24px; margin: 4px 0; }
            .session-info { font-size: 11px; margin-bottom: 4px; }
            .progress-bar { height: 4px; margin: 4px 0; }
            .status-display { font-size: 9px; margin: 4px 0; gap: 4px; }
            .status-dot { width: 4px; height: 4px; }
            .close-button { padding: 4px 8px; font-size: 8px; margin-top: 4px; }
        }
        
        /* Micro mode for extremely small screens */
        @media (max-width: 180px) {
            .timer-container { 
                padding: 6px; 
                min-width: 140px;
                border-radius: 8px;
            }
            .app-title { font-size: 8px; margin-bottom: 2px; }
            .timer-display { font-size: 20px; margin: 2px 0; letter-spacing: 0; }
            .session-info { font-size: 9px; margin-bottom: 2px; }
            .progress-bar { height: 3px; margin: 2px 0; }
            .status-display { 
                font-size: 8px; 
                margin: 2px 0; 
                gap: 2px;
                flex-direction: column;
            }
            .status-dot { width: 3px; height: 3px; }
            .close-button { padding: 2px 6px; font-size: 7px; margin-top: 2px; }
        }
    </style>
</head>
<body>
    <div class="timer-container">
        <div class="app-title">🍅 PomodoroX</div>
        <div class="timer-display" id="timer">${displayTime}</div>
        <div class="session-info" id="session">${sessionName}</div>
        <div class="progress-bar">
            <div class="progress-fill" id="progress" style="width: ${progressPercent}%"></div>
        </div>
        <div class="status-display">
            <span class="status-dot ${isRunning ? 'running' : timeRemaining === 0 ? 'stopped' : 'paused'}" id="status-dot"></span>
            <span id="status-text">${isRunning ? 'Running' : timeRemaining === 0 ? 'Complete' : 'Paused'}</span>
        </div>
        <button class="close-button" onclick="closePopup()">Close</button>
    </div>

    <script>
        // Timer state variables with clear naming
        var timerSeconds = ${timeRemaining};
        var timerRunning = ${isRunning};
        var sessionName = '${currentSessionType}';
        
        // Timer configuration from settings
        var focusDuration = ${timerSettings.focusDuration * 60};
        var shortBreakDuration = ${timerSettings.shortBreakDuration * 60};
        var longBreakDuration = ${timerSettings.longBreakDuration * 60};
        
        // Safe time formatting function
        function formatTimerDisplay(seconds) {
            if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
                return "00:00";
            }
            var mins = Math.floor(seconds / 60);
            var secs = Math.floor(seconds % 60);
            return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
        }
        
        // Calculate progress percentage
        function calculateProgress() {
            if (typeof timerSeconds !== 'number' || isNaN(timerSeconds) || timerSeconds < 0) {
                return 0;
            }
            
            var totalDuration;
            if (sessionName === 'focus') {
                totalDuration = focusDuration;
            } else if (sessionName === 'shortBreak') {
                totalDuration = shortBreakDuration;
            } else if (sessionName === 'longBreak') {
                totalDuration = longBreakDuration;
            } else {
                totalDuration = focusDuration;
            }
            
            if (totalDuration <= 0) return 0;
            return Math.max(0, Math.min(100, ((totalDuration - timerSeconds) / totalDuration) * 100));
        }
        
        // Update all display elements
        function updateTimerDisplay() {
            var timerElement = document.getElementById('timer');
            var progressElement = document.getElementById('progress');
            var statusDot = document.getElementById('status-dot');
            var statusText = document.getElementById('status-text');
            
            if (timerElement) {
                timerElement.textContent = formatTimerDisplay(timerSeconds);
            }
            
            if (progressElement) {
                progressElement.style.width = calculateProgress() + '%';
            }
            
            if (statusDot && statusText) {
                if (timerRunning) {
                    statusDot.className = 'status-dot running';
                    statusText.textContent = 'Running';
                } else if (timerSeconds === 0) {
                    statusDot.className = 'status-dot stopped';
                    statusText.textContent = 'Complete';
                } else {
                    statusDot.className = 'status-dot paused';
                    statusText.textContent = 'Paused';
                }
            }
            
            // Update window title
            document.title = 'PomodoroX - ' + formatTimerDisplay(timerSeconds);
        }
        
        // Robust sync function - this is called from the parent window
        window.syncTimerState = function(newSeconds, newRunning, newSessionType) {
            // Strict validation
            if (typeof newSeconds !== 'number' || isNaN(newSeconds) || newSeconds < 0) {
                console.warn('Invalid timer seconds received:', newSeconds);
                return false;
            }
            
            if (typeof newRunning !== 'boolean') {
                console.warn('Invalid running state received:', newRunning);
                return false;
            }
            
            if (typeof newSessionType !== 'string' || !newSessionType) {
                console.warn('Invalid session type received:', newSessionType);
                return false;
            }
            
            // Update state variables
            timerSeconds = newSeconds;
            timerRunning = newRunning;
            sessionName = newSessionType;
            
            // Update session display if needed
            var sessionElement = document.getElementById('session');
            if (sessionElement) {
                var displayName = sessionName === 'focus' ? 'Focus Time' : 
                                sessionName === 'shortBreak' ? 'Short Break' : 'Long Break';
                sessionElement.textContent = displayName;
            }
            
            // Immediately update display
            updateTimerDisplay();
            return true;
        };
        
        // Close popup function
        function closePopup() {
            try {
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({ type: 'POPUP_CLOSED' }, '*');
                }
            } catch (e) {
                console.log('Could not notify parent');
            }
            window.close();
        }
        
        // Handle window close
        window.addEventListener('beforeunload', function() {
            try {
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({ type: 'POPUP_CLOSED' }, '*');
                }
            } catch (e) {}
        });
        
        // Initial display update
        updateTimerDisplay();
        
        // Focus window periodically (less aggressive)
        setInterval(function() {
            if (!document.hidden) {
                window.focus();
            }
        }, 10000);
    </script>
</body>
</html>`;

    try {
      // Use traditional document.write method for better compatibility
      popupWindowRef.current = window.open('', 'pomodoroTimer', popupFeatures);
      
      if (popupWindowRef.current) {
        // Write the HTML content directly to the popup
        popupWindowRef.current.document.open();
        popupWindowRef.current.document.write(popupHTML);
        popupWindowRef.current.document.close();
        
        // Set up synchronization after content is loaded
        setTimeout(() => {
          if (popupWindowRef.current && !popupWindowRef.current.closed) {
            setupPopupSync();
          }
        }, 100);
      }
    } catch (error) {
      console.error('Failed to create popup window:', error);
    }
  }, [timeRemaining, currentSessionType, isRunning, formatTime, getProgress, timerSettings, updatePopupContent, setupPopupSync]);

  // Auto-create popup when minimized
  useEffect(() => {
    if (isMinimized) {
      createPersistentPopup();
    } else {
      // Close popup when not minimized
      if (popupWindowRef.current && !popupWindowRef.current.closed) {
        popupWindowRef.current.close();
        popupWindowRef.current = null;
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    }
  }, [isMinimized, createPersistentPopup]);

  // Update popup when timer state changes
  useEffect(() => {
    updatePopupContent();
  }, [updatePopupContent]);

  // Listen for popup close messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'POPUP_CLOSED') {
        setIsMinimized(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [setIsMinimized]);

  // Handle popup close messages and timer synchronization
  useEffect(() => {
    const handlePopupMessage = (event: MessageEvent) => {
      if (event.data?.type === 'POPUP_CLOSED') {
        setIsMinimized(false);
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
          syncIntervalRef.current = null;
        }
      }
    };

    window.addEventListener('message', handlePopupMessage);

    return () => {
      window.removeEventListener('message', handlePopupMessage);
    };
  }, [setIsMinimized]);

  // Enhanced timer state synchronization - update immediately when props change
  useEffect(() => {
    if (isMinimized && popupWindowRef.current && !popupWindowRef.current.closed) {
      // Immediate update without waiting for interval
      updatePopupContent();
    }
  }, [timeRemaining, isRunning, currentSessionType, isMinimized, updatePopupContent]);

  // Additional immediate sync on any state change
  useEffect(() => {
    if (isMinimized) {
      // Force immediate sync whenever any timer property changes
      const timeoutId = setTimeout(() => {
        updatePopupContent();
      }, 0); // Execute on next tick
      
      return () => clearTimeout(timeoutId);
    }
  }, [timeRemaining, isRunning, currentSessionType, isMinimized, updatePopupContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (popupWindowRef.current && !popupWindowRef.current.closed) {
        popupWindowRef.current.close();
      }
    };
  }, []);

  // Only render persistent popup - no inline component
  return null;
};

export default MinimizedWindow;

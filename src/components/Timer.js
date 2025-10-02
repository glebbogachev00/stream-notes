import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Timer = ({ isEnabled }) => {
  const { theme } = useTheme();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [inputTime, setInputTime] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setJustFinished(true);
            playAlertSound();
            // Clear the finished state after 5 seconds
            setTimeout(() => setJustFinished(false), 5000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const playAlertSound = async () => {
    // Method 1: Try Web Audio API (most reliable)
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const audioContext = new AudioContext();
        
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        // Create a pleasant three-tone chime
        const createBeep = (freq, startTime, duration) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(freq, startTime);
          oscillator.type = 'sine';
          
          // Gentle fade in and out
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        };
        
        const now = audioContext.currentTime;
        // First sequence - immediate
        createBeep(880, now, 0.4);         // A5 note
        createBeep(1174, now + 0.5, 0.4);  // D6 note  
        createBeep(1318, now + 1.0, 0.6);  // E6 note - longer
        
        // Second sequence - after 1.8 seconds
        createBeep(880, now + 1.8, 0.4);   // A5 note
        createBeep(1174, now + 2.3, 0.4);  // D6 note  
        createBeep(1318, now + 2.8, 0.6);  // E6 note
        
        // Third sequence - after 3.6 seconds  
        createBeep(880, now + 3.6, 0.4);   // A5 note
        createBeep(1174, now + 4.1, 0.4);  // D6 note
        createBeep(1318, now + 4.6, 0.8);  // E6 note - longest final note
        return;
      }
    } catch {
      // Ignore audio API failures and fall back to alternative notification strategies
    }
    
    // Method 2: Simple HTML5 Audio fallback
    try {
      // Short beep sound - more reliable than long ones
      const beepDataUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYUDlGm4M+kUgUIkMvz1Wg3Bg4+ktrzxncrBSGA0fPYiTkIGGS57uGSQgoUVqnl66lUFAlGn+DyvmYUDlGm4M+kUgUIkMvz1Wg3Bg4+ktrzxncrBSGA0fPYiTkIGGS57uGSQgoUVqnl66lUFAlGn+DyvmYUDlGm4M+kUgUIkMvz1Wg3Bg4+ktrzxncrBSGA0fPYiTkIGGS57uGSQgoUVqnl66lUFAlGn+DyvmYUDlGm4M+kUgUIkMvz1Wg3Bg4+ktrzxncrBSGA0fPYiTkIGGS57uGSQgoUVqnl66lUFAlGn+DyvmYUDlGm4M+kUgUIkMvz1Wg3Bg4+ktrzxncrBSGA0fPYiTkIGGS57uGSQgoUVqnl66lUFAlGn+DyvmYUDlGm4M+kUgUIkMvz1Wg3Bg4+ktrzxncrBSGA0fPYiTkIGGS57uGSQgoUVqnl66lUFAlGn+DyvmYUDlGm4M+kUgUIkMvz1Wg3Bg4+ktrzxncrBSGA0fPYiTkIGGS57uGSQgoUVqnl66lUFAlGn+DyvmYUDlGm4M+kUgUIkMvz1Wg3Bg4+ktrzxncrBSGA0fPYiTkIGGS57uGSQgoUVqnl66lUFAlGn+DyvmYUDlGm4M+kUgUIkMvz1Wg3Bg==';
      
      // Play multiple beeps with delays for better notification
      const playBeep = async (delay = 0) => {
        return new Promise((resolve) => {
          setTimeout(async () => {
            try {
              const audio = new Audio(beepDataUrl);
              audio.volume = 0.4;
              await audio.play();
              resolve();
            } catch (e) {
              resolve(); // Continue even if one beep fails
            }
          }, delay);
        });
      };
      
      // Play 5 beeps over 4 seconds
      await Promise.all([
        playBeep(0),      // Immediate
        playBeep(800),    // 0.8s
        playBeep(1600),   // 1.6s  
        playBeep(2400),   // 2.4s
        playBeep(3200)    // 3.2s
      ]);
      
      return;
    } catch {
      // Ignore audio playback failures and try the next fallback option
    }
    
    // Method 3: Browser notification as final fallback
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('⏰ Timer Complete!', {
            body: 'Your focus session has ended.',
            icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIHN0cm9rZT0iIzMzNzMzOCIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0xNSA5LTYgNi00LTQiIHN0cm9rZT0iIzMzNzMzOCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+',
            tag: 'timer-finished'
          });
        }
      }
    } catch {
      // Ignore notification failures; they are non-blocking for timer completion
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimeInput = (input) => {
    const trimmed = input.trim().toLowerCase();
    
    // Handle formats like "5m", "1h", "30s", "1h30m", "5:30", "1:30:45"
    if (/^\d+[hms]?$/.test(trimmed)) {
      const num = parseInt(trimmed);
      const unit = trimmed.slice(-1);
      
      if (unit === 'h') return num * 3600;
      if (unit === 'm') return num * 60;
      if (unit === 's') return num;
      // Default to minutes if no unit
      return num * 60;
    }
    
    // Handle "1h30m" format
    const complexMatch = trimmed.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
    if (complexMatch && (complexMatch[1] || complexMatch[2] || complexMatch[3])) {
      const hours = parseInt(complexMatch[1] || 0);
      const minutes = parseInt(complexMatch[2] || 0);
      const seconds = parseInt(complexMatch[3] || 0);
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    // Handle "5:30" or "1:30:45" format
    const timeParts = trimmed.split(':').map(part => parseInt(part) || 0);
    if (timeParts.length === 2) {
      return timeParts[0] * 60 + timeParts[1]; // mm:ss
    }
    if (timeParts.length === 3) {
      return timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]; // hh:mm:ss
    }
    
    return null;
  };

  const handleSetTimer = () => {
    const seconds = parseTimeInput(inputTime);
    if (seconds && seconds > 0) {
      setTimeLeft(seconds);
      setInputTime('');
      setShowInput(false);
      setJustFinished(false);
    }
  };

  const handleStart = () => {
    if (timeLeft > 0) {
      setIsRunning(true);
      setJustFinished(false);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setJustFinished(false);
  };

  const handleInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSetTimer();
    }
    if (e.key === 'Escape') {
      setShowInput(false);
      setInputTime('');
    }
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <div className={`mb-6 p-4 ${theme.inputBg} ${theme.border} border rounded-sm`}>
      <div className="flex items-center justify-between gap-4">
        {/* Timer Display */}
        <div className="flex items-center gap-4">
          <div 
            className={`font-mono text-2xl font-light transition-all duration-300 ${justFinished ? 'text-red-500' : theme.text}`}
          >
            {timeLeft > 0 ? formatTime(timeLeft) : '0:00'}
          </div>
          
          {timeLeft === 0 && !justFinished && (
            <div className={`dynamic-text-xs font-light ${theme.textTertiary}`}>
              timer ready
            </div>
          )}
          
          {justFinished && (
            <div className="dynamic-text-xs font-light text-red-500 animate-pulse">
              time's up!
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {!showInput && !justFinished && (
            <button
              onClick={() => setShowInput(true)}
              className={`px-3 py-1 dynamic-text-xs font-light ${theme.text} ${theme.buttonHover} transition-colors rounded-sm`}
            >
              set
            </button>
          )}
          
          {showInput && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputTime}
                onChange={(e) => setInputTime(e.target.value)}
                onKeyDown={handleInputKeyPress}
                placeholder="5m, 1h30m, 25:00"
                className={`w-28 px-2 py-1 dynamic-text-xs font-light ${theme.text} ${theme.inputBg} ${theme.border} border rounded-sm focus:outline-none transition-colors`}
                style={{
                  boxShadow: `0 0 0 1px ${theme.focusBorder}`,
                }}
                autoFocus
              />
              <button
                onClick={handleSetTimer}
                className={`px-2 py-1 dynamic-text-xs font-light ${theme.text} ${theme.buttonHover} transition-colors rounded-sm`}
              >
                ok
              </button>
            </div>
          )}
          
          {timeLeft > 0 && !isRunning && !justFinished && (
            <button
              onClick={handleStart}
              className={`px-3 py-1 dynamic-text-xs font-light transition-colors rounded-sm`}
              style={{ 
                color: theme.themeAccent,
                backgroundColor: `${theme.themeAccent}15`
              }}
            >
              start
            </button>
          )}
          
          {isRunning && (
            <button
              onClick={handlePause}
              className={`px-3 py-1 dynamic-text-xs font-light ${theme.text} ${theme.buttonHover} transition-colors rounded-sm`}
            >
              pause
            </button>
          )}
          
          {(timeLeft > 0 || justFinished) && (
            <button
              onClick={handleReset}
              className={`px-2 py-1 dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors rounded-sm`}
            >
              reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Timer;

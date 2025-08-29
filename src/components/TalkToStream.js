import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

const TalkToStream = ({ onClose }) => {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: settings.personalityEnabled 
        ? "Hey! I'm Stream, your note-taking companion. What's on your mind?"
        : "Hello! I'm here to help you with your notes and answer questions about the app.",
      sender: 'stream',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getStreamResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // FAQ Responses
    if (message.includes('how') && (message.includes('work') || message.includes('use'))) {
      return settings.personalityEnabled 
        ? "I'm pretty simple! Just start typing your thoughts and I'll organize them for you. Your notes auto-save and disappear after a while (unless you save them permanently). It's like having a digital stream of consciousness!"
        : "Stream is a self-managing notes app. Type your thoughts, and they're automatically saved. Notes expire after a set time unless you save them permanently. Use the settings to customize timers and preferences.";
    }
    
    if (message.includes('save') || message.includes('permanent')) {
      return settings.personalityEnabled 
        ? "Love it! Just hit the save button on any note you want to keep forever. I'll move it to your saved collection where it'll live happily ever after!"
        : "To save a note permanently, click the save button that appears when you hover over any note. Saved notes are stored in the 'Saved Notes' section and won't expire.";
    }
    
    if (message.includes('delete') || message.includes('timer') || message.includes('expire')) {
      return settings.personalityEnabled 
        ? "Ah, my self-cleaning feature! Your notes naturally fade away like thoughts do - in 30 minutes, 2 hours, 8 hours, or 24 hours. You can change this in settings. It keeps your mind (and your notes) fresh!"
        : "Notes automatically delete based on your timer setting: 30 minutes, 2 hours, 8 hours, or 24 hours. Change this in Settings > Delete Timer. Save important notes to prevent deletion.";
    }
    
    if (message.includes('shortcut') || message.includes('keyboard') || message.includes('hotkey')) {
      return settings.personalityEnabled 
        ? "Ooh, I love efficiency! Cmd/Ctrl+Enter saves your current note, Tab cycles through notes, and Cmd/Ctrl+N creates a fresh one. I'm all about that smooth flow!"
        : "Keyboard shortcuts: Cmd/Ctrl+Enter to save current note, Tab to cycle through notes, Cmd/Ctrl+N for new note, Cmd/Ctrl+S to save permanently.";
    }
    
    if (message.includes('theme') || message.includes('dark') || message.includes('light')) {
      return settings.personalityEnabled 
        ? "Style matters! Toggle between light and dark themes in the settings. I look good in both, if I do say so myself!"
        : "Switch between light and dark themes in Settings. The theme affects the entire application interface.";
    }
    
    if (message.includes('export') || message.includes('backup')) {
      return settings.personalityEnabled 
        ? "Smart thinking! While I don't have export yet, your notes live safely in your browser's storage. Pro tip: save important notes permanently so they don't float away!"
        : "Notes are stored locally in your browser. For important content, use the save feature to prevent automatic deletion. Export functionality may be added in future updates.";
    }
    
    // Personality responses
    if (settings.personalityEnabled) {
      if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        return "Hey there! Ready to let your thoughts flow? I'm here to catch them all!";
      }
      
      if (message.includes('thank') || message.includes('thanks')) {
        return "Aw, you're so welcome! I love helping organize your brilliant thoughts!";
      }
      
      if (message.includes('love') || message.includes('like') || message.includes('great') || message.includes('awesome')) {
        return "That makes me so happy! I'm designed to make note-taking feel natural and effortless. Keep those thoughts flowing!";
      }
      
      if (message.includes('help') && !message.includes('how')) {
        return "I'm here for you! Ask me anything about how I work, or just start jotting down your thoughts. I'll take good care of them!";
      }
      
      if (message.includes('confused') || message.includes('lost') || message.includes('understand')) {
        return "No worries at all! Think of me like a gentle river for your thoughts - they flow in, I organize them, and they naturally clear out unless you want to keep them. Simple as that!";
      }
      
      if (message.includes('bye') || message.includes('goodbye') || message.includes('see you')) {
        return "Catch you later! Your thoughts will be here waiting when you get back. Keep flowing!";
      }
    }
    
    // Default responses
    const defaultResponses = settings.personalityEnabled 
      ? [
          "That's interesting! Want to jot that down as a note?",
          "I'm here to help with your notes and thoughts! What would you like to know?",
          "Tell me more! I love organizing thoughts and helping you capture ideas",
          "I'm designed to help with notes and answer questions about the app. What's on your mind?"
        ]
      : [
          "I can help with questions about the app or note-taking. What would you like to know?",
          "Ask me about features, shortcuts, or how to use the app effectively.",
          "I'm here to help you understand and use Stream's note-taking features.",
          "Feel free to ask about saving notes, timers, shortcuts, or any other app features."
        ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Add Stream's response after a brief delay
    setTimeout(() => {
      const streamMessage = {
        id: Date.now() + 1,
        content: getStreamResponse(userMessage.content),
        sender: 'stream',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, streamMessage]);
    }, 300);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className={`${theme.bg} w-full max-w-2xl h-[80vh] m-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme.borderSecondary}`}>
          <div>
            <h2 className={`text-xl font-light ${theme.text}`}>
              Talk to Stream
            </h2>
            <p className={`text-sm ${theme.textTertiary} font-light mt-1`}>
              {settings.personalityEnabled 
                ? "Your friendly note-taking companion"
                : "Get help with the app"
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className={`px-3 py-2 text-lg font-light ${theme.textTertiary} hover:${theme.text} transition-colors duration-200 rounded-full hover:${theme.bgSecondary}`}
            title="Close chat"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl font-light text-sm leading-relaxed ${
                  message.sender === 'user'
                    ? `${theme.bgSecondary} ${theme.text} ml-12`
                    : `${theme.borderSecondary} border ${theme.text} mr-12`
                }`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-6 border-t ${theme.borderSecondary}`}>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={settings.personalityEnabled ? "Share your thoughts..." : "Ask me anything..."}
                className={`w-full ${theme.text} ${theme.bg} border ${theme.borderSecondary} rounded-xl px-4 py-3 text-sm font-light leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200`}
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className={`px-4 py-3 rounded-xl text-sm font-light transition-all duration-200 ${
                inputValue.trim()
                  ? `${theme.text} ${theme.bgSecondary} hover:opacity-80 active:scale-95`
                  : `${theme.textTertiary} ${theme.borderSecondary} border cursor-not-allowed`
              }`}
              title="Send message (Enter)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className={`text-xs ${theme.textTertiary} font-light mt-2`}>
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default TalkToStream;
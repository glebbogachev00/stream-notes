import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { parseCommand, CommandExecutor } from '../services/commandService';

// Suggested Action Component - Mobile optimized
const SuggestedAction = ({ icon, title, description, onClick, theme, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full text-left p-4 sm:p-3 rounded-xl border transition-all duration-200 
      touch-manipulation min-h-[60px] sm:min-h-[auto]
      ${disabled 
        ? `${theme.borderSecondary} ${theme.textTertiary} cursor-not-allowed opacity-50`
        : `${theme.border} ${theme.buttonHover} hover:border-opacity-60 active:scale-[0.98] hover:shadow-sm`
      }
    `}
  >
    <div className="flex items-center gap-3 sm:gap-3">
      <div className={`
        flex-shrink-0 w-8 h-8 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center
        ${theme.inputBg} ${theme.textTertiary}
        ${disabled ? '' : 'group-hover:' + theme.text.replace('text-', '')}
      `}>
        {typeof icon === 'string' ? (
          <span className="text-lg sm:text-base">{icon}</span>
        ) : (
          <div className="w-4 h-4 sm:w-4 sm:h-4 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-base sm:text-sm font-medium ${theme.text} mb-0.5 sm:mb-1`}>
          {title}
        </h4>
        <p className={`text-sm sm:text-xs ${theme.textTertiary} font-light leading-relaxed`}>
          {description}
        </p>
      </div>
    </div>
  </button>
);

const StreamAssistant = ({ 
  noteActions,
  settingsActions,
  showToast
}) => {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const inputRef = useRef(null);
  const conversationRef = useRef(null);
  const scrollAnchorRef = useRef(null);

  // Create command executor instance
  const commandExecutor = new CommandExecutor(noteActions, settingsActions, showToast);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll to bottom with multiple approaches
  const scrollToBottom = () => {
    // Approach 1: scrollIntoView on anchor element
    if (scrollAnchorRef.current) {
      try {
        scrollAnchorRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
        return;
      } catch (e) {
        console.log('scrollIntoView failed:', e);
      }
    }
    
    // Approach 2: Direct scroll on conversation container
    if (conversationRef.current) {
      try {
        const container = conversationRef.current;
        container.scrollTop = container.scrollHeight;
        return;
      } catch (e) {
        console.log('Direct scroll failed:', e);
      }
    }
    
    // Approach 3: Query selector approach
    try {
      const scrollContainer = document.querySelector('[data-scroll="conversation"]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    } catch (e) {
      console.log('Query selector scroll failed:', e);
    }
  };

  useEffect(() => {
    // Set up MutationObserver to watch for conversation changes
    if (!conversationRef.current) return;
    
    const observer = new MutationObserver(() => {
      // Scroll when DOM changes are detected
      setTimeout(scrollToBottom, 50);
    });
    
    observer.observe(conversationRef.current, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Also trigger scroll on state changes
    if (conversation.length > 0) {
      setTimeout(scrollToBottom, 0);
      setTimeout(scrollToBottom, 100);
      setTimeout(scrollToBottom, 300);
    }
    
    return () => observer.disconnect();
  }, [conversation, isProcessing]);

  // Handle mobile keyboard opening/closing
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      // Re-scroll when viewport changes (keyboard opens/closes)
      setTimeout(scrollToBottom, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      // Opening - show welcome message if conversation is empty
      if (conversation.length === 0) {
        setConversation([{
          type: 'assistant',
          message: "Hey! I'm here to help with your notes. I can help you create, format, save, organize your notes, and manage your settings. Just tell me what you'd like to do!",
          timestamp: new Date()
        }]);
      }
      // Scroll to bottom when opening
      setTimeout(scrollToBottom, 200);
    }
    setIsOpen(!isOpen);
    setPendingConfirmation(null);
  };

  const buildContext = () => {
    const notes = noteActions.getNotes ? noteActions.getNotes() : [];
    const savedNotes = noteActions.getSavedNotes ? noteActions.getSavedNotes() : [];
    const folders = settings.folders || [];
    const themes = settingsActions.getAvailableThemes ? settingsActions.getAvailableThemes() : [];

    return {
      activeNotes: notes.length,
      savedNotes: savedNotes.length,
      folders,
      themes
    };
  };

  const addToConversation = (type, message, isHelp = false, isChat = false) => {
    setConversation(prev => {
      const newConversation = [...prev, {
        type,
        message,
        timestamp: new Date(),
        isHelp,
        isChat
      }];
      
      // Schedule scroll after React finishes updating DOM
      Promise.resolve().then(() => {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      });
      
      return newConversation;
    });
  };

  const clearChat = () => {
    setConversation([{
      type: 'assistant',
      message: "Hey! I'm here to help with your notes. I can help you create, format, save, organize your notes, and manage your settings. Just tell me what you'd like to do!",
      timestamp: new Date()
    }]);
    setPendingConfirmation(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userInput = input.trim();
    setInput('');
    
    // Add user message to conversation
    addToConversation('user', userInput);
    
    // Handle pending confirmation
    if (pendingConfirmation) {
      if (userInput.toLowerCase().includes('yes') || userInput.toLowerCase().includes('confirm')) {
        setIsProcessing(true);
        try {
          const result = await commandExecutor.execute(pendingConfirmation);
          addToConversation('assistant', result.message, result.isHelp, result.isChat);
          if (result.success && showToast) {
            showToast(result.message);
          }
        } catch (error) {
          addToConversation('assistant', "oops! something got a bit tangled up there. want to give it another try? 💧");
        }
        setIsProcessing(false);
        setPendingConfirmation(null);
        return;
      } else if (userInput.toLowerCase().includes('no') || userInput.toLowerCase().includes('cancel')) {
        addToConversation('assistant', "Okay, cancelled that action.");
        setPendingConfirmation(null);
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Parse command with AI
      const context = buildContext();
      console.log('Processing input:', userInput, 'Context:', context);
      const command = await parseCommand(userInput, context);
      console.log('Parsed command:', command);
      
      // Always add AI's natural response first if it exists
      if (command.naturalResponse) {
        addToConversation('assistant', command.naturalResponse, false, command.type === 'CHAT');
      }

      // Handle confirmation if needed
      if (command.needsConfirmation) {
        setPendingConfirmation(command);
        setIsProcessing(false);
        return;
      }

      // Execute command
      const result = await commandExecutor.execute(command);
      
      // Add execution result if it's different from the natural response
      if (result.message && result.message !== command.naturalResponse) {
        addToConversation('assistant', result.message, result.isHelp, result.isChat);
      }
      
      // Show toast for successful actions (except chat)
      if (result.success && showToast && !result.isChat && !result.isHelp) {
        showToast(result.message);
      }

    } catch (error) {
      console.error('Command processing error:', error);
      addToConversation('assistant', "hmm, I got a bit confused there! mind trying that again? I'm here to help your notes flow 💧");
    }

    setIsProcessing(false);
  };

  // Mobile-friendly keyboard handling moved to textarea onKeyDown

  const formatMessage = (message) => {
    // Simple markdown-like formatting
    return message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-gray-200 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>');
  };

  return (
    <>
      {/* Droplet Trigger */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-6 right-6 w-12 h-12 ${theme.bg} ${theme.border} border-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center group hover:scale-110 active:scale-95`}
        title="Talk to stream"
      >
        <div className="w-6 h-8 relative">
          {/* Droplet SVG matching the provided image */}
          <svg 
            className={`w-full h-full ${theme.text} group-hover:text-blue-500 transition-colors`}
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2c-4 0-8 6-8 10 0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-10-8-10z"/>
          </svg>
          
          {/* Pulse animation when processing */}
          {isProcessing && (
            <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-pulse"></div>
          )}
        </div>
      </button>

      {/* Assistant Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-30 sm:bg-opacity-20"
            onClick={handleToggle}
          />
          
          {/* Modal - Full screen on mobile, centered on desktop */}
          <div 
            data-modal="stream-assistant"
            className={`
              fixed inset-0 sm:relative sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2
              ${theme.bg} ${theme.border} 
              w-full h-full sm:w-[32rem] sm:h-[36rem] sm:max-h-[85vh]
              sm:border sm:rounded-xl shadow-2xl
              flex flex-col
              animate-in duration-200 ease-out
              slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95
            `}>
            
            {/* Header - Mobile optimized */}
            <div className={`
              flex items-center justify-between 
              px-4 py-3 sm:px-6 sm:py-4
              border-b ${theme.borderSecondary}
              bg-opacity-95 backdrop-blur-sm
              safe-top
            `}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${theme.inputBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <svg 
                    className={`w-4 h-5 ${theme.text}`}
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2c-4 0-8 6-8 10 0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-10-8-10z"/>
                  </svg>
                </div>
                <h2 className={`text-lg sm:text-base font-medium ${theme.text} select-none`}>
                  talk to stream
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Clear Chat Button - only show if conversation has more than welcome message */}
                {conversation.length > 1 && (
                  <button
                    onClick={clearChat}
                    className={`
                      p-2 -m-2 rounded-lg 
                      ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} 
                      hover:${theme.inputBg} 
                      transition-all duration-200
                      touch-manipulation
                      min-h-[44px] min-w-[44px] flex items-center justify-center
                    `}
                    aria-label="Clear chat"
                    title="Clear conversation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={handleToggle}
                  className={`
                    p-2 -m-2 rounded-lg 
                    ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} 
                    hover:${theme.inputBg} 
                    transition-all duration-200
                    touch-manipulation
                    min-h-[44px] min-w-[44px] flex items-center justify-center
                  `}
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {conversation.length === 1 && conversation[0].type === 'assistant' ? (
                /* Welcome State - Mobile optimized */
                <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                  {/* Avatar and Greeting */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${theme.inputBg} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <svg 
                        className={`w-6 h-7 ${theme.text}`}
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2c-4 0-8 6-8 10 0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-10-8-10z"/>
                      </svg>
                    </div>
                    <div className="flex-1 mt-1">
                      <h3 className={`text-xl sm:text-lg font-semibold ${theme.text} mb-2 leading-tight select-none`}>
                        How can I help you today?
                      </h3>
                      <p className={`text-base sm:text-sm ${theme.textTertiary} font-normal leading-relaxed select-none`}>
                        I can help you create, format, save, and organize your notes.
                      </p>
                    </div>
                  </div>

                  {/* Suggested Actions */}
                  <div className="space-y-3">
                    <SuggestedAction
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                      }
                      title="Create a note"
                      description="Write something new"
                      onClick={() => {
                        setInput("create a note about ");
                        inputRef.current?.focus();
                      }}
                      theme={theme}
                    />
                    
                    <SuggestedAction
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      }
                      title="Format my latest note"
                      description="Clean up with flow formatting"
                      onClick={() => {
                        setInput("format my latest note");
                        handleSubmit({ preventDefault: () => {} });
                      }}
                      theme={theme}
                      disabled={buildContext().activeNotes === 0}
                    />
                    
                    <SuggestedAction
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      }
                      title="Save all my notes"
                      description="Move active notes to saved"
                      onClick={() => {
                        setInput("save all my notes");
                        inputRef.current?.focus();
                      }}
                      theme={theme}
                      disabled={buildContext().activeNotes === 0}
                    />
                    
                    <SuggestedAction
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9M21 9H9M21 13H9" />
                        </svg>
                      }
                      title="Change theme"
                      description="Switch to a different theme"
                      onClick={() => {
                        setInput("change theme to ");
                        inputRef.current?.focus();
                      }}
                      theme={theme}
                    />
                  </div>
                </div>
              ) : (
                /* Conversation View - Mobile optimized */
                <div 
                  ref={conversationRef}
                  data-scroll="conversation"
                  className="flex-1 p-4 sm:p-4 pb-2 space-y-4 overflow-y-auto"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {conversation.map((msg, index) => (
                    <div 
                      key={index}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Assistant Avatar - only for first message or after user message */}
                      {msg.type === 'assistant' && (index === 0 || conversation[index - 1]?.type === 'user') && (
                        <div className={`w-8 h-8 mr-3 mt-1 ${theme.inputBg} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <svg 
                            className={`w-4 h-5 ${theme.textTertiary}`}
                            fill="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2c-4 0-8 6-8 10 0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-10-8-10z"/>
                          </svg>
                        </div>
                      )}
                      
                      {/* Spacer for continuation messages */}
                      {msg.type === 'assistant' && index > 0 && conversation[index - 1]?.type === 'assistant' && (
                        <div className="w-8 mr-3"></div>
                      )}
                      
                      <div className={`max-w-[80%] sm:max-w-[85%] ${
                        msg.type === 'user' 
                          ? 'bg-blue-500 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-sm' 
                          : `${theme.inputBg} ${theme.textSecondary} rounded-2xl ${index > 0 && conversation[index - 1]?.type === 'assistant' ? 'rounded-tl-md' : 'rounded-tl-2xl'} px-4 py-3 shadow-sm border ${theme.borderSecondary} border-opacity-50`
                      }`}>
                        <div 
                          className={`text-sm sm:text-sm font-normal leading-relaxed ${
                            msg.isHelp ? 'whitespace-pre-line' : ''
                          } ${msg.type === 'user' ? 'text-white' : ''}`}
                          dangerouslySetInnerHTML={{
                            __html: formatMessage(msg.message)
                          }}
                        />
                        <div className={`text-xs mt-2 opacity-60 ${
                          msg.type === 'user' ? 'text-white text-right' : theme.textTertiary + ' text-left'
                        }`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Processing indicator - Enhanced mobile version */}
                  {isProcessing && (
                    <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-200">
                      <div className="w-8 h-8 mr-3 mt-1">
                        <div className={`w-8 h-8 ${theme.inputBg} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <svg 
                            className={`w-4 h-5 ${theme.textTertiary}`}
                            fill="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2c-4 0-8 6-8 10 0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-10-8-10z"/>
                          </svg>
                        </div>
                      </div>
                      <div className={`${theme.inputBg} ${theme.textSecondary} rounded-2xl rounded-tl-2xl px-4 py-3 shadow-sm border ${theme.borderSecondary} border-opacity-50`}>
                        <div className="flex items-center gap-3">
                          <div className="flex space-x-1">
                            <div className={`w-2 h-2 ${theme.text.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                            <div className={`w-2 h-2 ${theme.text.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                            <div className={`w-2 h-2 ${theme.text.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className={`text-sm font-light ${theme.textTertiary}`}>thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Bottom padding for mobile keyboard */}
                  <div className="h-4 sm:h-2"></div>
                  
                  {/* Scroll anchor - invisible element for scrollIntoView */}
                  <div ref={scrollAnchorRef} className="h-1"></div>
                </div>
              )}
            </div>

            {/* Input Form - Mobile optimized */}
            <div className={`border-t ${theme.borderSecondary} bg-opacity-95 backdrop-blur-sm`}>
              <form onSubmit={handleSubmit} className="p-4 pb-safe">
                <div className="flex items-end gap-3">
                  <div className="flex-1 min-h-[44px] relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        // Auto-resize textarea
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                      onKeyDown={(e) => {
                        // Handle mobile-friendly shortcuts
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        } else if (e.key === 'Escape') {
                          setIsOpen(false);
                          setPendingConfirmation(null);
                        }
                      }}
                      placeholder={
                        pendingConfirmation 
                          ? "Type 'yes' to confirm or 'no' to cancel..."
                          : "Ask me to help with your notes..."
                      }
                      rows={1}
                      className={`
                        w-full bg-transparent resize-none
                        ${theme.text} placeholder:${theme.textTertiary} 
                        focus:outline-none 
                        text-base sm:text-sm font-normal leading-relaxed
                        py-3 px-0
                        touch-manipulation
                        overflow-hidden
                      `}
                      style={{ 
                        fontSize: '16px', // Prevents zoom on iOS
                        lineHeight: '1.5',
                        maxHeight: '120px'
                      }}
                      disabled={isProcessing}
                    />
                    
                    {/* Subtle border bottom */}
                    <div className={`absolute bottom-0 left-0 right-0 h-px ${theme.borderSecondary} opacity-30`}></div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!input.trim() || isProcessing}
                    className={`
                      min-w-[52px] h-11 px-4 rounded-full
                      flex items-center justify-center
                      touch-manipulation
                      transition-all duration-200
                      font-medium text-sm
                      ${
                        input.trim() && !isProcessing
                          ? `bg-blue-500 text-white shadow-sm hover:bg-blue-600 active:scale-95`
                          : `${theme.inputBg} ${theme.textTertiary} opacity-50 cursor-not-allowed`
                      }
                    `}
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2c-4 0-8 6-8 10 0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-10-8-10z"/>
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Input hint for mobile */}
                <div className={`mt-2 text-xs ${theme.textTertiary} opacity-60 text-center sm:hidden`}>
                  {pendingConfirmation ? "Waiting for confirmation" : "Tap send or press Enter to submit"}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StreamAssistant;
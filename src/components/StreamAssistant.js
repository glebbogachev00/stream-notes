import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { parseCommand, CommandExecutor } from '../services/commandService';

// Suggested Action Component
const SuggestedAction = ({ icon, title, description, onClick, theme, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
      disabled 
        ? `${theme.borderSecondary} ${theme.textTertiary} cursor-not-allowed opacity-50`
        : `${theme.border} ${theme.buttonHover} hover:border-gray-300`
    }`}
  >
    <div className="flex items-start gap-3">
      <div className={`flex-shrink-0 mt-0.5 ${theme.textTertiary} ${disabled ? '' : 'group-hover:' + theme.text.replace('text-', '')}`}>
        {typeof icon === 'string' ? (
          <span className="text-lg">{icon}</span>
        ) : (
          <div className="w-5 h-5 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`dynamic-text-sm font-light ${theme.text} mb-1`}>
          {title}
        </h4>
        <p className={`dynamic-text-xs ${theme.textTertiary} font-light`}>
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

  // Create command executor instance
  const commandExecutor = new CommandExecutor(noteActions, settingsActions, showToast);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Scroll to bottom of conversation
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

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
    setConversation(prev => [...prev, {
      type,
      message,
      timestamp: new Date(),
      isHelp,
      isChat
    }]);
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
          addToConversation('assistant', "Sorry, something went wrong. Please try again.");
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
      addToConversation('assistant', "Sorry, I had trouble processing that. Could you try again?");
    }

    setIsProcessing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setPendingConfirmation(null);
    }
  };

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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-20"
            onClick={handleToggle}
          />
          
          {/* Modal */}
          <div className={`relative ${theme.bg} ${theme.border} border w-full h-full sm:max-w-md sm:max-h-[70vh] sm:rounded-lg shadow-xl flex flex-col`}>
            
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${theme.borderSecondary}`}>
              <div className="flex items-center gap-2">
                <svg 
                  className={`w-5 h-6 ${theme.text}`}
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2c-4 0-8 6-8 10 0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-10-8-10z"/>
                </svg>
                <h2 className={`dynamic-text-base font-light ${theme.text}`}>
                  talk to stream
                </h2>
              </div>
              <button
                onClick={handleToggle}
                className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
              >
                [close]
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {conversation.length === 1 && conversation[0].type === 'assistant' ? (
                /* Welcome State - Similar to Claude's interface */
                <div className="p-6 space-y-6">
                  {/* Avatar and Greeting */}
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 ${theme.inputBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <svg 
                        className={`w-5 h-6 ${theme.text}`}
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2c-4 0-8 6-8 10 0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-10-8-10z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className={`dynamic-text-lg font-light ${theme.text} mb-2`}>
                        How can I help you today?
                      </h3>
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
                /* Conversation View */
                <div 
                  ref={conversationRef}
                  className="p-4 space-y-4"
                >
                  {conversation.map((msg, index) => (
                    <div 
                      key={index}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-3 rounded-lg ${
                        msg.type === 'user' 
                          ? `${theme.text} bg-blue-500 text-white` 
                          : `${theme.textSecondary} ${theme.inputBg}`
                      }`}>
                        <div 
                          className={`dynamic-text-sm font-light leading-relaxed ${
                            msg.isHelp ? 'whitespace-pre-line' : ''
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: formatMessage(msg.message)
                          }}
                        />
                        <div className={`dynamic-text-xs mt-1 opacity-60`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Processing indicator */}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className={`p-3 rounded-lg ${theme.textSecondary} ${theme.inputBg}`}>
                        <div className="flex items-center gap-2">
                          <div className={`animate-spin w-4 h-4 border-2 ${theme.borderSecondary} ${theme.text.replace('text-', 'border-t-')} rounded-full`}></div>
                          <span className="dynamic-text-sm font-light">thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className={`p-4 border-t ${theme.borderSecondary}`}>
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    pendingConfirmation 
                      ? "Type 'yes' to confirm or 'no' to cancel..."
                      : "Ask me to help with your notes..."
                  }
                  className={`flex-1 bg-transparent ${theme.text} placeholder:${theme.textTertiary} focus:outline-none border-b ${theme.border} pb-1 font-light dynamic-text-sm`}
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  className={`px-3 py-1 dynamic-text-sm font-light ${theme.text} border ${theme.border} rounded transition-colors ${
                    input.trim() && !isProcessing
                      ? `hover:${theme.textSecondary.replace('text-', 'hover:text-')}`
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default StreamAssistant;
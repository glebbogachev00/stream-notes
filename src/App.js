import React, { useState } from 'react';
import { useNotes } from './hooks/useNotes';
import { useToast } from './hooks/useToast';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { StorageProvider, useStorage } from './contexts/StorageContext';
import NoteInput from './components/NoteInput';
import NoteList from './components/NoteList';
import SavedNotes from './components/SavedNotes';
import ThemeToggle from './components/ThemeToggle';
import Onboarding from './components/Onboarding';
import SettingsModal from './components/SettingsModal';
import ArtGallery from './components/ArtGallery';
import StyleSelector from './components/StyleSelector';
import QuoteCollection from './components/QuoteCollection';
import Toast from './components/Toast';
import MatrixUnlockNotification from './components/MatrixUnlockNotification';
import FeedbackModal from './components/FeedbackModal';
import BackToTop from './components/BackToTop';
import { submitFeedback } from './utils/feedback';

function AppContent() {
  const [activeTab, setActiveTab] = useState('active');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [logoStyle, setLogoStyle] = useState(() => {
    return localStorage.getItem('stream-logo-style') || 'originalText';
  });
  const [styleSelectorOpen, setStyleSelectorOpen] = useState(false);
  const [pendingTransformId, setPendingTransformId] = useState(null);
  const [pendingFromSaved, setPendingFromSaved] = useState(false);
  const [showMatrixUnlock, setShowMatrixUnlock] = useState(false);

  const cycleLogo = () => {
    const styles = ['originalText', 'raindrop', 'samo'];
    const currentIndex = styles.indexOf(logoStyle);
    const nextStyle = styles[(currentIndex + 1) % styles.length];
    setLogoStyle(nextStyle);
    localStorage.setItem('stream-logo-style', nextStyle);
  };

  const handleTransformToArt = (id, fromSaved = false) => {
    setPendingTransformId(id);
    setPendingFromSaved(fromSaved);
    setStyleSelectorOpen(true);
  };

  const handleStyleSelect = (style) => {
    transformToArt(pendingTransformId, pendingFromSaved, style);
    setStyleSelectorOpen(false);
    setPendingTransformId(null);
    setPendingFromSaved(false);
  };

  const handleMatrixUnlock = () => {
    setShowMatrixUnlock(true);
  };

  const handleFeedbackSubmit = async (feedbackText) => {
    try {
      await submitFeedback(feedbackText);
      showToast("Feedback sent! Thanks for helping stream grow");
      setTimeout(() => setIsFeedbackOpen(false), 2000);
    } catch (error) {
      showToast(error.message || "Couldn't send feedback. Try again?");
    }
  };
  const { theme } = useTheme();
  const { settings } = useSettings();
  const { getSyncStatus } = useStorage();
  const { toasts, showToast, hideToast } = useToast();
  const {
    notes,
    savedNotes,
    artNotes,
    addNote,
    deleteNote,
    saveNote,
    deleteSavedNote,
    updateSavedNoteContent,
    updateSavedNoteProperties,
    transformToArt,
    deleteArtNote,
    updateArtNoteContent,
    getTimeInfo,
    updateNoteContent,
    updateNoteDeleteTimer,
    updateNoteProperties
  } = useNotes(settings.deleteTimer, showToast, settings.personalityEnabled);

  // Show onboarding if not completed
  if (!settings.onboardingCompleted) {
    return <Onboarding />;
  }

  const getFontSizeValue = (fontSize) => {
    const sizes = { sm: 14, base: 16, lg: 18, xl: 20 };
    return sizes[fontSize] || 16;
  };

  return (
    <div 
      className={`min-h-screen ${theme.bg} transition-all duration-200`}
      style={{ 
        letterSpacing: `${settings.letterSpacing}px`,
        '--base-font-size': `${getFontSizeValue(settings.fontSize)}px`
      }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <header className="flex items-start justify-between mb-12 sm:mb-16">
          <div>
            <div 
              className="flex items-center mb-2 cursor-pointer transition-all duration-300"
              onClick={cycleLogo}
            >
              {logoStyle === 'originalText' && (
                <h1 className={`dynamic-text-xl font-light ${theme.text} tracking-tight transition-all duration-300`}>
                  [stream]
                </h1>
              )}
              {logoStyle === 'raindrop' && (
                <svg 
                  className={`w-5 h-7 ${theme.text} transition-all duration-300`}
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2c-4 0-8 6-8 10 0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-10-8-10z"/>
                </svg>
              )}
              {logoStyle === 'samo' && (
                <div className="bg-black text-white px-3 py-1 rounded transform -rotate-1">
                  <span className="font-bold text-lg tracking-wide" style={{
                    textShadow: '1px 1px 2px rgba(255,255,255,0.1)',
                    letterSpacing: '1px'
                  }}>
                    [stream]©
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className={`dynamic-text-base ${theme.textSecondary} font-light`}>
                self-managing notes
              </p>
              {getSyncStatus() === 'synced' && (
                <span className={`dynamic-text-xs ${theme.textTertiary} font-light`}>
                  • synced
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className={`p-2 ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors dynamic-text-base`}
              title={settings.personalityEnabled ? "Help improve stream" : "Feedback"}
            >
              <svg className="w-1em h-1em" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors dynamic-text-base`}
              title="Settings"
            >
              <svg className="w-1em h-1em" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <ThemeToggle />
          </div>
        </header>

        <nav className="mb-8 sm:mb-12">
          <div className={`flex space-x-6 border-b ${theme.border} transition-all duration-200`}>
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-3 dynamic-text-base font-light transition-all duration-200 border-b ${
                activeTab === 'active'
                  ? `${theme.text} ${theme.text.replace('text-', 'border-')}`
                  : `${theme.textTertiary} hover:${theme.textSecondary.replace('text-', 'hover:text-')} border-transparent`
              }`}
            >
              active ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-3 dynamic-text-base font-light transition-all duration-200 border-b ${
                activeTab === 'saved'
                  ? `${theme.text} ${theme.text.replace('text-', 'border-')}`
                  : `${theme.textTertiary} hover:${theme.textSecondary.replace('text-', 'hover:text-')} border-transparent`
              }`}
            >
              saved ({savedNotes.length})
            </button>
            {settings.samoModeEnabled && (
              <button
                onClick={() => setActiveTab('art')}
                className={`pb-3 dynamic-text-base font-light transition-all duration-200 border-b ${
                  activeTab === 'art'
                    ? `${theme.text} ${theme.text.replace('text-', 'border-')}`
                    : `${theme.textTertiary} hover:${theme.textSecondary.replace('text-', 'hover:text-')} border-transparent`
                }`}
                title="samo mode transforms notes into street art inspired by jean-michel basquiat's legendary graffiti tag 'samo' - raw, authentic visual expression."
              >
                samo ({artNotes.length})
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
              </button>
            )}
            {settings.stealThisQuoteEnabled && (
              <button
                onClick={() => setActiveTab('quotes')}
                className={`pb-3 dynamic-text-base font-light transition-all duration-200 border-b ${
                  activeTab === 'quotes'
                    ? `${theme.text} ${theme.text.replace('text-', 'border-')}`
                    : `${theme.textTertiary} hover:${theme.textSecondary.replace('text-', 'hover:text-')} border-transparent`
                }`}
              >
                steal this quote
              </button>
            )}
          </div>
        </nav>

        <main>
          {activeTab === 'active' && (
            <div className="space-y-8">
              <NoteInput onAddNote={addNote} onMatrixUnlock={handleMatrixUnlock} />
              <NoteList
                notes={notes}
                onDeleteNote={deleteNote}
                onSaveNote={saveNote}
                onTransformToSAMO={handleTransformToArt}
                getTimeInfo={getTimeInfo}
                editingNoteId={editingNoteId}
                onSetEditingNoteId={setEditingNoteId}
                onUpdateNoteContent={updateNoteContent}
                onUpdateNoteDeleteTimer={updateNoteDeleteTimer}
                onUpdateNoteProperties={updateNoteProperties}
              />
            </div>
          )}

          {activeTab === 'saved' && (
            <SavedNotes
              savedNotes={savedNotes}
              onDeleteNote={deleteSavedNote}
              onUpdateNote={updateSavedNoteContent}
              onUpdateNoteProperties={updateSavedNoteProperties}
              onTransformToSAMO={handleTransformToArt}
              getTimeInfo={getTimeInfo}
            />
          )}

          {activeTab === 'art' && settings.samoModeEnabled && (
            <ArtGallery
              artNotes={artNotes}
              onDeleteNote={deleteArtNote}
              onUpdateNote={updateArtNoteContent}
            />
          )}

          {activeTab === 'quotes' && (
            <QuoteCollection />
          )}
        </main>
      </div>
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />

      
      <StyleSelector
        isOpen={styleSelectorOpen}
        onClose={() => setStyleSelectorOpen(false)}
        onSelectStyle={handleStyleSelect}
        noteContent={pendingTransformId ? (notes.find(n => n.id === pendingTransformId) || savedNotes.find(n => n.id === pendingTransformId))?.content : ''}
      />
      
      {/* Toast notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          onClose={() => hideToast(toast.id)}
          duration={toast.duration}
        />
      ))}

      {/* Matrix unlock notification */}
      {showMatrixUnlock && (
        <MatrixUnlockNotification 
          onClose={() => setShowMatrixUnlock(false)} 
        />
      )}
      
      <BackToTop />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <StorageProvider>
          <AppContent />
        </StorageProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
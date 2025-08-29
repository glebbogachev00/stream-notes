import React, { useState } from 'react';
import { useNotes } from './hooks/useNotes';
import { useToast } from './hooks/useToast';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import NoteInput from './components/NoteInput';
import NoteList from './components/NoteList';
import SavedNotes from './components/SavedNotes';
import ThemeToggle from './components/ThemeToggle';
import Onboarding from './components/Onboarding';
import SettingsModal from './components/SettingsModal';
import ArtGallery from './components/ArtGallery';
import Toast from './components/Toast';

function AppContent() {
  const [activeTab, setActiveTab] = useState('active');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [logoStyle, setLogoStyle] = useState(() => {
    return localStorage.getItem('stream-logo-style') || 'originalText';
  });

  const cycleLogo = () => {
    const styles = ['originalText', 'raindrop', 'samo'];
    const currentIndex = styles.indexOf(logoStyle);
    const nextStyle = styles[(currentIndex + 1) % styles.length];
    setLogoStyle(nextStyle);
    localStorage.setItem('stream-logo-style', nextStyle);
  };
  const { theme } = useTheme();
  const { settings } = useSettings();
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
    transformToArt,
    deleteArtNote,
    updateArtNoteContent,
    getTimeInfo,
    updateNoteContent
  } = useNotes(settings.deleteTimer, showToast, settings.personalityEnabled);

  // Show onboarding if not completed
  if (!settings.onboardingCompleted) {
    return <Onboarding />;
  }

  return (
    <div 
      className={`min-h-screen ${theme.bg} transition-all duration-200`}
      style={{ 
        fontSize: `${settings.fontSize}px`,
        '--base-font-size': `${settings.fontSize}px`,
        letterSpacing: `${settings.letterSpacing}px`
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
                    STREAM©
                  </span>
                </div>
              )}
            </div>
            <p className={`dynamic-text-sm ${theme.textSecondary} font-light`}>
              self-managing notes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors dynamic-text-sm`}
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
              className={`pb-3 dynamic-text-sm font-light transition-all duration-200 border-b ${
                activeTab === 'active'
                  ? `${theme.text} ${theme.text.replace('text-', 'border-')}`
                  : `${theme.textTertiary} hover:${theme.textSecondary.replace('text-', 'hover:text-')} border-transparent`
              }`}
            >
              active ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-3 dynamic-text-sm font-light transition-all duration-200 border-b ${
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
                className={`pb-3 dynamic-text-sm font-light transition-all duration-200 border-b flex items-center gap-2 ${
                  activeTab === 'art'
                    ? `${theme.text} ${theme.text.replace('text-', 'border-')}`
                    : `${theme.textTertiary} hover:${theme.textSecondary.replace('text-', 'hover:text-')} border-transparent`
                }`}
                title="SAMO mode transforms notes into street art inspired by Jean-Michel Basquiat's legendary graffiti tag 'SAMO©' - raw, authentic visual expression."
              >
                SAMO ({artNotes.length})
                <svg className={`w-3 h-3 ${theme.textTertiary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </button>
            )}
          </div>
        </nav>

        <main>
          {activeTab === 'active' && (
            <div className="space-y-8">
              <NoteInput onAddNote={addNote} />
              <NoteList
                notes={notes}
                onDeleteNote={deleteNote}
                onSaveNote={saveNote}
                onTransformToSAMO={transformToArt}
                getTimeInfo={getTimeInfo}
                editingNoteId={editingNoteId}
                onSetEditingNoteId={setEditingNoteId}
                onUpdateNoteContent={updateNoteContent}
              />
            </div>
          )}

          {activeTab === 'saved' && (
            <SavedNotes
              savedNotes={savedNotes}
              onDeleteNote={deleteSavedNote}
              onUpdateNote={updateSavedNoteContent}
              onTransformToSAMO={transformToArt}
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
        </main>
      </div>
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
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
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense, memo } from 'react';
import { useNotes } from './hooks/useNotes';
import { useToast } from './hooks/useToast';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { StorageProvider, useStorage } from './contexts/StorageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NoteInput from './components/NoteInput';
import NoteList from './components/NoteList';
import SavedNotes from './components/SavedNotes';
import ThemeToggle from './components/ThemeToggle';
import Onboarding from './components/Onboarding';
import Toast from './components/Toast';
import FolderFilter from './components/FolderFilter';
import SyncIcon from './components/icons/SyncIcon';
import CheckIcon from './components/icons/CheckIcon';
import StreamAssistant from './components/StreamAssistant';
import { submitFeedback } from './utils/feedback';

// Lazy load non-critical components with preloading hints
const SettingsModal = lazy(() => import(/* webpackChunkName: "settings" */ './components/SettingsModal'));
const ArtGallery = lazy(() => import(/* webpackChunkName: "art-gallery" */ './components/ArtGallery'));
const StyleSelector = lazy(() => import(/* webpackChunkName: "style-selector" */ './components/StyleSelector'));
const QuoteCollection = lazy(() => import(/* webpackChunkName: "quotes" */ './components/QuoteCollection'));
const EdgeUnlockNotification = lazy(() => import(/* webpackChunkName: "notifications" */ './components/EdgeUnlockNotification'));
const FeedbackModal = lazy(() => import(/* webpackChunkName: "feedback" */ './components/FeedbackModal'));
const BackToTop = lazy(() => import(/* webpackChunkName: "utilities" */ './components/BackToTop'));
const SyncAuthModal = lazy(() => import(/* webpackChunkName: "sync-auth" */ './components/SyncAuthModal'));

const AppContent = memo(() => {
  const [activeTab, setActiveTab] = useState('active');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [logoStyle, setLogoStyle] = useState(() => {
    const saved = localStorage.getItem('stream-logo-style');
    const validStyles = ['originalText', 'graffiti', 'raindrop'];
    return validStyles.includes(saved) ? saved : 'graffiti';
  });
  const [styleSelectorOpen, setStyleSelectorOpen] = useState(false);
  const [pendingTransformId, setPendingTransformId] = useState(null);
  const [pendingFromSaved, setPendingFromSaved] = useState(false);
  const [showEdgeUnlock, setShowEdgeUnlock] = useState(false);
  const [activeFolder, setActiveFolder] = useState('all');
  const [isSyncAuthOpen, setIsSyncAuthOpen] = useState(false);

  const cycleLogo = () => {
    const styles = ['originalText', 'graffiti', 'raindrop'];
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


  const handleEdgeUnlock = () => {
    setShowEdgeUnlock(true);
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
  const { theme, switchTheme, themes } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { user, loading: authLoading } = useAuth();
  const { getSyncStatus, syncStatus, syncNow } = useStorage();
  const { toasts, showToast, hideToast } = useToast();
  const {
    notes,
    savedNotes,
    artNotes,
    addNote,
    deleteNote,
    saveNote,
    saveAllActiveNotes,
    deleteAllNotes,
    deleteAllSavedNotes,
    deleteAllArtNotes,
    deleteSavedNote,
    updateSavedNoteContent,
    updateSavedNoteProperties,
    toggleSavedNotePin,
    transformToArt,
    deleteArtNote,
    updateArtNoteContent,
    getTimeInfo,
    updateNoteContent,
    updateNoteDeleteTimer,
    updateNoteProperties,
    toggleNotePin,
    toggleNoteTodo,
    toggleTodoCompletion,
    updateGlobalDeleteTimer,
    updateNoteFolder
  } = useNotes(
    settings.deleteTimer,
    showToast,
    settings.personalityEnabled,
    handleEdgeUnlock,
    activeFolder,
    settings.folders
  );

  // Track previous deleteTimer to detect changes
  const previousDeleteTimer = useRef(null);
  
  // Update global delete timer when setting changes
  useEffect(() => {
    if (previousDeleteTimer.current !== null && previousDeleteTimer.current !== settings.deleteTimer && updateGlobalDeleteTimer) {
      updateGlobalDeleteTimer(settings.deleteTimer);
    }
    previousDeleteTimer.current = settings.deleteTimer;
  }, [settings.deleteTimer, updateGlobalDeleteTimer]);

  // Auto-redirect to "All" when folders are disabled while viewing a folder
  useEffect(() => {
    if (!settings.foldersEnabled && activeFolder !== 'all') {
      setActiveFolder('all');
    }
  }, [settings.foldersEnabled, activeFolder]);

  useEffect(() => {
    if (activeFolder !== 'all' && !settings.folders.includes(activeFolder)) {
      setActiveFolder('all');
    }
  }, [activeFolder, settings.folders]);


  const handleSyncButtonClick = async () => {
    if (!user) {
      setIsSyncAuthOpen(true);
      return;
    }

    if (!syncNow || syncStatus === 'syncing') {
      return;
    }

    try {
      await syncNow();
      showToast('Sync complete');
    } catch (error) {
      showToast(error.message || 'Sync failed');
    }
  };

  const handleDeleteAllNotes = useCallback(async () => {
    setEditingNoteId(null);
    const { deletedCount: active } = await deleteAllNotes();
    const { deletedCount: saved } = await deleteAllSavedNotes();
    const { deletedCount: art } = await deleteAllArtNotes();
    const total = active + saved + art;

    if (!total) {
      showToast('Nothing in the stream to drain right now.');
      return;
    }

    const parts = [];
    if (active) parts.push(`${active} note${active === 1 ? '' : 's'}`);
    if (saved) parts.push(`${saved} saved note${saved === 1 ? '' : 's'}`);
    if (art) parts.push(`${art} art piece${art === 1 ? '' : 's'}`);
    const detail = parts.length ? ` (${parts.join(', ')})` : '';
    showToast(`Drained ${total} item${total === 1 ? '' : 's'}${detail}.`);
  }, [deleteAllNotes, deleteAllSavedNotes, deleteAllArtNotes, showToast]);

  const handleDeleteActiveNotes = useCallback(async () => {
    setEditingNoteId(null);
    const { deletedCount } = await deleteAllNotes();

    if (!deletedCount) {
      showToast('No active notes to clear.');
      return;
    }

    showToast(`Cleared ${deletedCount} active note${deletedCount === 1 ? '' : 's'}.`);
  }, [deleteAllNotes, showToast]);

  const handleSignOutKeepNotes = useCallback(() => {
    setEditingNoteId(null);
    showToast('Signed out. Your notes stay put.');
  }, [showToast]);

  const handleSignOutClearNotes = useCallback(async () => {
    setEditingNoteId(null);
    const { deletedCount: active } = await deleteAllNotes();
    const { deletedCount: saved } = await deleteAllSavedNotes();
    const { deletedCount: art } = await deleteAllArtNotes();
    const total = active + saved + art;
    showToast(total
      ? `Signed out and cleared ${total} item${total === 1 ? '' : 's'}.`
      : 'Signed out. Nothing to clear.');
  }, [deleteAllNotes, deleteAllSavedNotes, deleteAllArtNotes, showToast]);

  const getFontSizeValue = useCallback((fontSize) => {
    const sizes = { lg: 18, xl: 20, xxl: 22 };
    return sizes[fontSize] || 20;
  }, []);



  const filteredNotes = useMemo(() => {
    if (!notes.length) return [];
    return notes.filter(note => {
      if (activeFolder === 'all') return !note.folder; // Only show notes without folder in "All"
      return note.folder === activeFolder;
    });
  }, [notes, activeFolder]);

  const filteredSavedNotes = useMemo(() => {
    if (!savedNotes.length) return [];
    return savedNotes.filter(note => {
      if (activeFolder === 'all') return !note.folder; // Only show notes without folder in "All"
      return note.folder === activeFolder;
    });
  }, [savedNotes, activeFolder]);

  const hasAnyNotes = notes.length > 0 || savedNotes.length > 0 || artNotes.length > 0;
  const hasActiveNotes = notes.length > 0;

  // Show onboarding if not completed
  if (!settings.onboardingCompleted) {
    return <Onboarding />;
  }

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
              {logoStyle === 'graffiti' && (
                <div className="bg-black text-white px-3 py-1 rounded transform -rotate-1">
                  <span className="font-bold text-lg tracking-wide" style={{
                    textShadow: '1px 1px 2px rgba(255,255,255,0.1)',
                    letterSpacing: '1px'
                  }}>
                    [stream]©
                  </span>
                </div>
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
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const status = syncStatus || getSyncStatus();
                if (status === 'local') {
                  return null;
                }
                let label = 'synced';
                if (status === 'syncing') {
                  label = 'syncing…';
                } else if (status === 'error') {
                  label = 'sync error';
                } else if (status === 'idle') {
                  label = 'sync ready';
                }
                return (
                  <span className={`dynamic-text-xs ${theme.textTertiary} font-light`}>
                    • {label}
                  </span>
                );
              })()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncButtonClick}
              disabled={syncStatus === 'syncing' || authLoading}
              className={`p-2 ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors dynamic-text-base disabled:opacity-60 disabled:cursor-not-allowed`}
              title={user ? (syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'synced' ? 'Synced' : 'Sync now') : 'Sign in to sync'}
            >
              {syncStatus === 'synced' ? <CheckIcon /> : <SyncIcon />}
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

        {(activeTab === 'active' || activeTab === 'saved') && (
          <FolderFilter activeFolder={activeFolder} setActiveFolder={setActiveFolder} />
        )}

        <nav className="mb-8 sm:mb-12">
          <div className="flex space-x-6 transition-all duration-200">
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-3 dynamic-text-base font-light transition-all duration-200 border-b-2 ${
                activeTab === 'active'
                  ? `${theme.text} ${theme.themeAccent ? `border-[${theme.themeAccent}]` : theme.text.replace('text-', 'border-')} shadow-[0_2px_0_0_currentColor]`
                  : `${theme.textTertiary} hover:${theme.textSecondary.replace('text-', 'hover:text-')} border-transparent`
              }`}
            >
              active ({filteredNotes.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-3 dynamic-text-base font-light transition-all duration-200 border-b-2 ${
                activeTab === 'saved'
                  ? `${theme.text} ${theme.themeAccent ? `border-[${theme.themeAccent}]` : theme.text.replace('text-', 'border-')} shadow-[0_2px_0_0_currentColor]`
                  : `${theme.textTertiary} hover:${theme.textSecondary.replace('text-', 'hover:text-')} border-transparent`
              }`}
            >
              saved ({filteredSavedNotes.length})
            </button>
            {settings.samoModeEnabled && (
              <button
                onClick={() => setActiveTab('art')}
                className={`pb-3 dynamic-text-base font-light transition-all duration-200 border-b-2 ${
                  activeTab === 'art'
                    ? `${theme.text} ${theme.themeAccent ? `border-[${theme.themeAccent}]` : theme.text.replace('text-', 'border-')} shadow-[0_2px_0_0_currentColor]`
                    : `${theme.textTertiary} hover:${theme.textSecondary.replace('text-', 'hover:text-')} border-transparent`
                }`}
                title="samo mode transforms notes into street art inspired by jean-michel basquiat's legendary graffiti tag 'samo' - raw, authentic visual expression."
              >
                samo ({artNotes.length})
              </button>
            )}
            {settings.stealThisQuoteEnabled && (
              <button
                onClick={() => setActiveTab('quotes')}
                className={`pb-3 dynamic-text-base font-light transition-all duration-200 border-b-2 ${
                  activeTab === 'quotes'
                    ? `${theme.text} ${theme.themeAccent ? `border-[${theme.themeAccent}]` : theme.text.replace('text-', 'border-')} shadow-[0_2px_0_0_currentColor]`
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
              <NoteInput onAddNote={addNote} showToast={showToast} />
              <NoteList
                notes={filteredNotes}
                onDeleteNote={deleteNote}
                onSaveNote={saveNote}
                onTransformToSAMO={handleTransformToArt}
                getTimeInfo={(note) => getTimeInfo(note, settings.deleteTimer)}
                editingNoteId={editingNoteId}
                onSetEditingNoteId={setEditingNoteId}
                onUpdateNoteContent={updateNoteContent}
                onUpdateNoteDeleteTimer={updateNoteDeleteTimer}
                onUpdateNoteProperties={updateNoteProperties}
                onTogglePin={toggleNotePin}
                onToggleTodo={toggleNoteTodo}
                onToggleTodoCompletion={toggleTodoCompletion}
                onUpdateNoteFolder={updateNoteFolder}
              />
            </div>
          )}

          {activeTab === 'saved' && (
            <>
              <SavedNotes
                savedNotes={filteredSavedNotes}
                onDeleteNote={deleteSavedNote}
                onUpdateNote={updateSavedNoteContent}
                onUpdateNoteProperties={updateSavedNoteProperties}
                onToggleSavedNotePin={toggleSavedNotePin}
                onTransformToSAMO={handleTransformToArt}
                getTimeInfo={(note) => getTimeInfo(note, settings.deleteTimer)}
                onUpdateNoteFolder={updateNoteFolder}
              />
            </>
          )}

          {activeTab === 'art' && settings.samoModeEnabled && (
            <Suspense fallback={<div className={`text-center py-16 ${theme.textTertiary}`}>Loading gallery...</div>}>
              <ArtGallery
                artNotes={artNotes}
                onDeleteNote={deleteArtNote}
                onUpdateNote={updateArtNoteContent}
              />
            </Suspense>
          )}

          {activeTab === 'quotes' && (
            <Suspense fallback={<div className={`text-center py-16 ${theme.textTertiary}`}>Loading quotes...</div>}>
              <QuoteCollection />
            </Suspense>
          )}
        </main>
      </div>
      
      <Suspense fallback={null}>
        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onOpenAuthModal={() => setIsSyncAuthOpen(true)}
          showToast={showToast}
          onFeedback={() => setIsFeedbackOpen(true)}
          onDeleteAllNotes={handleDeleteAllNotes}
          onDeleteActiveNotes={handleDeleteActiveNotes}
          hasNotes={hasAnyNotes}
          hasActiveNotes={hasActiveNotes}
          onAfterSignOutKeep={handleSignOutKeepNotes}
          onAfterSignOutClear={handleSignOutClearNotes}
        />
      </Suspense>

      <Suspense fallback={null}>
        <FeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          onSubmit={handleFeedbackSubmit}
        />
      </Suspense>

      <Suspense fallback={null}>
        <StyleSelector
          isOpen={styleSelectorOpen}
          onClose={() => setStyleSelectorOpen(false)}
          onSelectStyle={handleStyleSelect}
          noteContent={pendingTransformId ? (notes.find(n => n.id === pendingTransformId) || savedNotes.find(n => n.id === pendingTransformId))?.content : ''}
        />
      </Suspense>
      
      {/* Toast notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          onClose={() => hideToast(toast.id)}
          duration={toast.duration}
        />
      ))}

      
      {/* Edge unlock notification */}
      {showEdgeUnlock && (
        <Suspense fallback={null}>
          <EdgeUnlockNotification 
            onClose={() => setShowEdgeUnlock(false)} 
          />
        </Suspense>
      )}
      
      <Suspense fallback={null}>
        <BackToTop />
      </Suspense>

      <Suspense fallback={null}>
        <SyncAuthModal
          isOpen={isSyncAuthOpen}
          onClose={() => setIsSyncAuthOpen(false)}
        />
      </Suspense>

      {/* Stream AI Assistant */}
      <StreamAssistant
        noteActions={{
          getNotes: () => notes,
          getSavedNotes: () => savedNotes,
          addNote,
          saveNote,
          saveAllNotes: saveAllActiveNotes,
          deleteNote,
          updateNoteContent,
          updateNoteFolder
        }}
        settingsActions={{
          getSettings: () => settings,
          getAvailableThemes: () => themes,
          switchTheme: switchTheme,
          updateSettings: updateSettings
        }}
        showToast={showToast}
      />

    </div>
  );
});

AppContent.displayName = 'AppContent';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ThemeProvider>
          <StorageProvider>
            <AppContent />
          </StorageProvider>
        </ThemeProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;

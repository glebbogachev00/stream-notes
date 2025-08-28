import React, { useState } from 'react';
import { useNotes } from './hooks/useNotes';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import NoteInput from './components/NoteInput';
import NoteList from './components/NoteList';
import SavedNotes from './components/SavedNotes';
import ThemeToggle from './components/ThemeToggle';

function AppContent() {
  const [activeTab, setActiveTab] = useState('active');
  const { theme } = useTheme();
  const {
    notes,
    savedNotes,
    addNote,
    deleteNote,
    saveNote,
    deleteSavedNote,
    getTimeInfo
  } = useNotes();

  return (
    <div className={`min-h-screen ${theme.bg} transition-all duration-200`}>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <header className="flex items-start justify-between mb-12 sm:mb-16">
          <div>
            <h1 className={`text-xl font-light ${theme.text} tracking-tight mb-2`}>
              [stream]
            </h1>
            <p className={`text-sm ${theme.textSecondary} font-light`}>
              self-managing notes
            </p>
          </div>
          <ThemeToggle />
        </header>

        <nav className="mb-8 sm:mb-12">
          <div className={`flex space-x-6 border-b ${theme.border} transition-all duration-200`}>
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-3 text-sm font-light transition-all duration-200 ${
                activeTab === 'active'
                  ? `${theme.text} border-b ${theme.text.replace('text-', 'border-')}`
                  : `${theme.textTertiary} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`
              }`}
            >
              active ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-3 text-sm font-light transition-all duration-200 ${
                activeTab === 'saved'
                  ? `${theme.text} border-b ${theme.text.replace('text-', 'border-')}`
                  : `${theme.textTertiary} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`
              }`}
            >
              saved ({savedNotes.length})
            </button>
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
                getTimeInfo={getTimeInfo}
              />
            </div>
          )}

          {activeTab === 'saved' && (
            <SavedNotes
              savedNotes={savedNotes}
              onDeleteNote={deleteSavedNote}
              getTimeInfo={getTimeInfo}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
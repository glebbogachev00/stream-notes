import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings, ORGANIZATION_STYLES, DELETE_TIMERS } from '../contexts/SettingsContext';
import CollapsibleSection from './CollapsibleSection';
import FontSizeControl from './FontSizeControl';
import { getUserTag, setUserTag, validateUserTag, formatUserTag, clearUserTag } from '../utils/tags';
import { sanitizeInput } from '../utils/security';
import { useStorage } from '../contexts/StorageContext';
import { useAuth } from '../contexts/AuthContext';
import { getSyncHistory, restoreSyncSnapshot, createSnapshotForKey } from '../utils/storage';
import ConfirmModal from './ConfirmModal';

const SettingsModal = ({
  isOpen,
  onClose,
  onOpenAuthModal,
  showToast,
  onFeedback,
  onDeleteAllNotes,
  onDeleteActiveNotes,
  hasNotes = true,
  hasActiveNotes = false,
  onAfterSignOutKeep = () => {},
  onAfterSignOutClear = () => {}
}) => {
  const { theme, switchTheme, themes, unlockMatrixTheme, unlockEdgeTheme } = useTheme();
  const { settings, updateSettings, resetSettings, togglePersonality } = useSettings();
  
  // Check and unlock themes for existing users who already have features enabled
  useEffect(() => {
    if (settings.enhancedEditingEnabled) {
      unlockMatrixTheme();
    }
    if (settings.foldersEnabled) {
      unlockEdgeTheme();
    }
  }, [settings.enhancedEditingEnabled, settings.foldersEnabled, unlockMatrixTheme, unlockEdgeTheme]);
  const { syncStatus, syncError } = useStorage();
  const { user, signOut, loading: authLoading, isConfigured: authConfigured } = useAuth();
  const [newUserTag, setNewUserTag] = useState('');
  const [tagError, setTagError] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [latestSavedBackup, setLatestSavedBackup] = useState(null);
  const [folderPendingDeletion, setFolderPendingDeletion] = useState('');
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showActiveDeleteConfirm, setShowActiveDeleteConfirm] = useState(false);
  const [isDeletingAllNotes, setIsDeletingAllNotes] = useState(false);
  const [isDeletingActiveNotes, setIsDeletingActiveNotes] = useState(false);
  const [showSignOutChoice, setShowSignOutChoice] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const userTag = getUserTag();

  const canDeleteAll = hasNotes && typeof onDeleteAllNotes === 'function';
  const canDeleteActive = hasActiveNotes && typeof onDeleteActiveNotes === 'function';

  const refreshBackupMetadata = useCallback(() => {
    const history = getSyncHistory('stream_saved_notes');
    setLatestSavedBackup(history && history.length ? history[0] : null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshBackupMetadata();
    }
  }, [isOpen, refreshBackupMetadata]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'never';
    try {
      return new Date(timestamp).toLocaleString();
    } catch (error) {
      return 'unknown';
    }
  };


  const broadcastUpdates = useCallback((keys) => {
    if (typeof window === 'undefined') return;
    const event = new CustomEvent('stream-sync-update', { detail: { keys } });
    window.dispatchEvent(event);
  }, []);


  const handleCreateSavedSnapshot = useCallback(() => {
    const saved = localStorage.getItem('stream_saved_notes');
    if (!saved || saved === '[]') {
      window.alert('You have no saved notes to back up yet.');
      return;
    }
    createSnapshotForKey('stream_saved_notes');
    refreshBackupMetadata();
    window.alert('Saved notes backup created.');
  }, [refreshBackupMetadata]);

  const handleRestoreSavedNotes = useCallback(() => {
    if (!latestSavedBackup) {
      window.alert('No backup available yet.');
      return;
    }
    const confirmed = window.confirm(`Restore saved notes from ${formatTimestamp(latestSavedBackup.timestamp)}? This will replace your current saved notes.`);
    if (!confirmed) {
      return;
    }
    const restored = restoreSyncSnapshot('stream_saved_notes', latestSavedBackup.timestamp);
    if (restored) {
      broadcastUpdates(['stream_saved_notes']);
      refreshBackupMetadata();
      window.alert('Saved notes restored successfully.');
    } else {
      window.alert('Unable to restore the backup.');
    }
  }, [latestSavedBackup, broadcastUpdates, refreshBackupMetadata]);

  const syncStatusLabel = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'syncing…';
      case 'synced':
        return 'up to date';
      case 'error':
        return 'error';
      case 'idle':
        return 'ready';
      default:
        return 'local only';
    }
  };

  const handleSyncToggle = () => {
    if (!user) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
      return;
    }
    updateSettings({ syncEnabled: !settings.syncEnabled });
  };

  const handleSignOutClick = () => {
    setShowSignOutChoice(true);
  };

  const handleDeleteAll = useCallback(async () => {
    if (!onDeleteAllNotes || isDeletingAllNotes) {
      return;
    }

    try {
      setIsDeletingAllNotes(true);
      await onDeleteAllNotes();
    } finally {
      setIsDeletingAllNotes(false);
      setShowDeleteAllConfirm(false);
    }
  }, [onDeleteAllNotes, isDeletingAllNotes]);

  const handleDeleteActiveOnly = useCallback(async () => {
    if (!onDeleteActiveNotes || isDeletingActiveNotes) {
      return;
    }

    try {
      setIsDeletingActiveNotes(true);
      await onDeleteActiveNotes();
      setShowActiveDeleteConfirm(false);
    } finally {
      setIsDeletingActiveNotes(false);
    }
  }, [onDeleteActiveNotes, isDeletingActiveNotes]);

  const performSignOut = useCallback(async (shouldClear) => {
    if (isSigningOut) {
      return;
    }

    try {
      setIsSigningOut(true);
      await signOut();
      updateSettings({ syncEnabled: false, syncKey: '' });
      if (shouldClear) {
        await onAfterSignOutClear();
      } else {
        await onAfterSignOutKeep();
      }
      setShowSignOutChoice(false);
      onClose?.();
    } catch (error) {
      console.error('sign out failed', error);
      if (showToast) {
        showToast(error.message || 'Sign out failed. Please try again.');
      }
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, signOut, updateSettings, onAfterSignOutClear, onAfterSignOutKeep, onClose, showToast]);

  const handleAddFolder = () => {
    const folderName = newFolder.trim();
    if (folderName && !settings.folders.includes(folderName)) {
      updateSettings({ folders: [...settings.folders, folderName] });
      setNewFolder('');
    }
  };

  const handleDeleteFolder = (folderName) => {
    setFolderPendingDeletion(folderName);
  };

  const handleConfirmFolderDeletion = useCallback(() => {
    if (!folderPendingDeletion) {
      return;
    }
    updateSettings({ folders: settings.folders.filter(f => f !== folderPendingDeletion) });
    setFolderPendingDeletion('');
  }, [folderPendingDeletion, settings.folders, updateSettings]);

  const handleCancelFolderDeletion = useCallback(() => {
    setFolderPendingDeletion('');
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleReset = () => {
    if (window.confirm('This will reset all preferences and show onboarding again. Continue?')) {
      resetSettings();
      clearUserTag();
      onClose();
      // Page will reload to show onboarding
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  const handleTagChange = () => {
    if (!newUserTag.trim()) {
      setTagError('Please enter a tag name');
      return;
    }

    const sanitized = sanitizeInput(newUserTag);
    if (!validateUserTag(sanitized)) {
      setTagError('Use only letters, numbers, hyphens, and underscores (2-15 characters)');
      return;
    }

    try {
      setUserTag(sanitized);
      setNewUserTag('');
      setTagError('');
      // No page refresh, modal stays open
    } catch (error) {
      setTagError(error.message);
    }
  };

  const handleResetOnboarding = () => {
    if (window.confirm('This will reset your onboarding status and show the onboarding process again. Continue?')) {
      updateSettings({ onboardingCompleted: false }); // Set onboardingCompleted to false
      window.location.reload(); // Reload the page to show onboarding
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-20 flex items-start justify-center p-4 z-50 pt-12 sm:pt-20"
      onClick={handleOverlayClick}
    >
      <div className={`${theme.bg} ${theme.border} border max-w-sm w-full p-4 sm:p-6 max-h-[80vh] sm:max-h-[70vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`dynamic-text-lg font-light ${theme.text}`}>
              {settings.personalityEnabled ? "stream's command center" : "application settings"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
          >
            [close]
          </button>
        </div>

        {/* CORE SETTINGS - Collapsible */}
        <div className="space-y-4 mb-8">
          <div className={`${theme.textTertiary} dynamic-text-xs font-light uppercase tracking-wider mb-4`}>
            Core Settings
          </div>

          {/* Sync */}
          <CollapsibleSection title="sync across devices">
            <div className="space-y-4">
              <div className="space-y-4">
                {!user && (
                  <div className="space-y-3">
                    <div className={`dynamic-text-xs ${theme.textTertiary}`}>
                      Sign in with your email to sync notes across devices. We&apos;ll send a one-time code.
                    </div>
                    <button
                      onClick={onOpenAuthModal}
                      className={`w-full border ${theme.border} px-3 py-2 dynamic-text-xs font-light ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')} transition-colors`}
                    >
                      sign in to sync
                    </button>
                    {!authConfigured && (
                      <div className={`dynamic-text-xs ${theme.textTertiary}`}>
                        (Set Supabase credentials to enable email login.)
                      </div>
                    )}
                  </div>
                )}

                {user && (
                  <div className="space-y-3">
                    <div className={`dynamic-text-xs ${theme.textTertiary}`}>
                      signed in as <span className={`${theme.text}`}>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSyncToggle}
                        className={`border ${theme.border} px-3 py-2 dynamic-text-xs font-light ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')} transition-colors`}
                      >
                        {settings.syncEnabled ? 'pause syncing' : 'resume syncing'}
                      </button>
                      <button
                        onClick={handleSignOutClick}
                        disabled={authLoading || isSigningOut}
                        className={`dynamic-text-xs font-light px-3 py-2 ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {isSigningOut ? 'signing out…' : 'sign out'}
                      </button>
                    </div>
                  </div>
                )}

                {settings.syncEnabled && (
                  <div className={`dynamic-text-xs font-light ${theme.text}`}>
                    {syncStatusLabel()} {syncStatus === 'synced' ? '✓' : syncStatus === 'syncing' ? '...' : ''}
                    {syncError && (
                      <div className="text-red-500 mt-1">
                        {syncError}
                      </div>
                    )}
                  </div>
                )}

                <div className={`mt-4 pt-4 border-t ${theme.borderSecondary} space-y-3`}> 
                  <div className={`dynamic-text-xs uppercase tracking-wider ${theme.textTertiary}`}>backups</div>
                  <div className={`dynamic-text-xs ${theme.text}`}>latest backup: {formatTimestamp(latestSavedBackup?.timestamp)}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={handleCreateSavedSnapshot}
                      className={`border ${theme.border} px-3 py-2 dynamic-text-xs font-light ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')} transition-colors`}
                    >
                      create backup
                    </button>
                    <button
                      onClick={handleRestoreSavedNotes}
                      className={`border ${theme.border} px-3 py-2 dynamic-text-xs font-light ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')} transition-colors`}
                    >
                      restore backup
                    </button>
                  </div>
                  <div className={`dynamic-text-xs ${theme.textTertiary} opacity-70`}> 
                    backups include saved notes and folders. sync automatically preserves your data.
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Typography */}
          <CollapsibleSection title="typography">
            <div className="space-y-4">
              {/* Font Sizing */}
              <div>
                <div className={`dynamic-text-xs ${theme.textTertiary} font-light mb-2`}>Font sizing</div>
                <FontSizeControl isAlwaysEditing={true} />
              </div>

              {/* Spacing */}
              <div>
                <div className={`dynamic-text-xs ${theme.textTertiary} font-light mb-2`}>Spacing</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSettings({ letterSpacing: Math.max(-1, (settings.letterSpacing || 0) - 0.5) })}
                    className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
                  >
                    [-]
                  </button>
                  <span className={`dynamic-text-xs font-light ${theme.text}`}>
                    {(settings.letterSpacing || 0)}px
                  </span>
                  <button
                    onClick={() => updateSettings({ letterSpacing: Math.min(5, (settings.letterSpacing || 0) + 0.5) })}
                    className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
                  >
                    [+]
                  </button>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Theme Options */}
          <CollapsibleSection title="theme">
            <div className="space-y-3">
              {themes.map((themeName) => {
                const isCurrent = theme.name === themeName;
                return (
                  <button
                    key={themeName}
                    onClick={() => switchTheme(themeName)}
                    className={`w-full text-left pb-3 border-b transition-all duration-200 ${
                      isCurrent
                        ? `${theme.border} ${theme.text}`
                        : `${theme.borderSecondary} ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
                    }`}
                  >
                    <div className="dynamic-text-xs font-light flex items-center justify-between">
                      <span>[{themeName}]</span>
                      {isCurrent && (
                        <span className={`text-xs ${theme.text}`}>current</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CollapsibleSection>



          {/* User Tag */}
          <CollapsibleSection title={settings.personalityEnabled ? "your signature" : "user tag"}>
            <div className="space-y-4">
              {userTag ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`dynamic-text-xs ${theme.textTertiary} font-light`}>
                      current tag:
                    </div>
                    <span 
                      className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${theme.text}`}
                      style={{ 
                        backgroundColor: `${theme.text}20`,
                        border: `1px solid ${theme.text}40`
                      }}
                    >
                      {formatUserTag(userTag)}
                    </span>
                  </div>
                  
                  <div className={`text-sm ${theme.text}`}>
                    [<input
                      type="text"
                      value={newUserTag}
                      onChange={(e) => {
                        const value = sanitizeInput(e.target.value);
                        setNewUserTag(value);
                        setTagError('');
                      }}
                      placeholder={userTag.name}
                      className={`bg-transparent ${theme.text} text-sm font-light focus:outline-none`}
                      style={{ margin: 0, padding: 0, border: 'none', width: `${(newUserTag || userTag.name).length}ch`, minWidth: '1ch', display: 'inline' }}
                      maxLength={15}
                    />]©
                    <button
                      onClick={handleTagChange}
                      disabled={!newUserTag.trim()}
                      className={`px-2 py-1 dynamic-text-xs font-light ${
                        newUserTag.trim() 
                          ? `${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}` 
                          : theme.textTertiary
                      } transition-colors`}
                    >
                      update
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`dynamic-text-xs ${theme.textTertiary} font-light text-center pb-2`}>
                    Create your unique signature to sign your notes.
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${theme.text}`}>[</span>
                    <input
                      type="text"
                      value={newUserTag}
                      onChange={(e) => {
                        const value = sanitizeInput(e.target.value);
                        setNewUserTag(value);
                        setTagError('');
                      }}
                      placeholder="your-tag"
                      className={`bg-transparent ${theme.text} text-sm font-light focus:outline-none border-b ${theme.borderSecondary} pb-1`}
                      size={newUserTag.length || 'your-tag'.length}
                      maxLength={15}
                    />
                    <span className={`text-sm ${theme.text}`}>]©</span>
                    <button
                      onClick={handleTagChange}
                      disabled={!newUserTag.trim()}
                      className={`px-2 py-1 dynamic-text-xs font-light ${
                        newUserTag.trim() 
                          ? `${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}` 
                          : theme.textTertiary
                      } transition-colors`}
                    >
                      create
                    </button>
                  </div>
                </div>
              )}
              
              {tagError && (
                <p className={`text-xs text-red-500 font-light`}>
                  {tagError}
                </p>
              )}
            </div>
          </CollapsibleSection>


          {/* Cleanup (Auto-delete) */}
          <CollapsibleSection title={settings.personalityEnabled ? "cleanup" : "auto-delete"}>
            <div className="space-y-3">
              {Object.entries(DELETE_TIMERS).map(([key, timer]) => (
                <button
                  key={key}
                  onClick={() => updateSettings({ deleteTimer: key })}
                  className={`w-full text-left pb-3 border-b transition-all duration-200 ${
                    settings.deleteTimer === key
                      ? `${theme.border} ${theme.text}`
                      : `${theme.borderSecondary} ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
                  }`}
                >
                  <div className="dynamic-text-xs font-light">
                    {timer.name.toLowerCase()}
                  </div>
                </button>
              ))}
            </div>
          </CollapsibleSection>

        </div>

        {/* ADD-ON SETTINGS - Collapsible Sections */}
        <div className="space-y-4">
          <div className={`${theme.textTertiary} dynamic-text-xs font-light uppercase tracking-wider mb-4`}>
            Add-on Settings
          </div>

          <CollapsibleSection title="reset">
            <div className="space-y-4">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    if (!canDeleteActive) {
                      if (showToast) {
                        showToast('No active notes to clear.');
                      }
                      return;
                    }
                    setShowActiveDeleteConfirm(true);
                  }}
                  disabled={!canDeleteActive}
                  className={`w-full text-left px-3 py-2 dynamic-text-xs font-light transition-colors rounded-sm ${
                    canDeleteActive ? 'text-orange-500 hover:text-orange-400 hover:bg-orange-500/5 cursor-pointer' : `${theme.textTertiary}`
                  }`}
                >
                  panic button: drain active notes
                </button>
              </div>

              <div className={`pt-3 border-t ${theme.borderSecondary} space-y-2`}>
                <button
                  type="button"
                  onClick={() => {
                    if (!canDeleteAll) {
                      if (showToast) {
                        showToast('Nothing to clear.');
                      }
                      return;
                    }
                    setShowDeleteAllConfirm(true);
                  }}
                  disabled={!canDeleteAll}
                  className={`w-full text-left px-3 py-2 dynamic-text-xs font-light transition-colors rounded-sm ${
                    canDeleteAll ? 'text-red-500 hover:text-red-400 hover:bg-red-500/5 cursor-pointer' : `${theme.textTertiary}`
                  }`}
                >
                  emergency reset: wipe everything
                </button>
              </div>
            </div>
          </CollapsibleSection>

          {/* Timer */}
          <CollapsibleSection title="timer">
            <div className="space-y-4">
              <div>
                <button
                  onClick={() => updateSettings({ timerEnabled: !settings.timerEnabled })}
                  className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
                >
                  <div className="dynamic-text-xs font-light">
                    {settings.timerEnabled ? 'hide timer' : 'show timer'}
                  </div>
                </button>
                <p className={`mt-2 dynamic-text-xs font-light ${theme.textTertiary}`}>
                  minimal focus timer above your notes. supports formats like 5m, 1h30m, 25:00
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Personality */}
          <CollapsibleSection title="personality">
            <div className="space-y-4">
              {/* Personality Toggle */}
              <div>
                <button
                  onClick={togglePersonality}
                  className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
                >
                  <div className="dynamic-text-xs font-light">
                    {settings.personalityEnabled ? 'turn off personality - give stream a vacation' : 'bring stream back from vacation'}
                  </div>
                </button>
              </div>

              {/* SAMO */}
              <div>
                <button
                  onClick={() => updateSettings({ samoModeEnabled: !settings.samoModeEnabled })}
                  className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
                >
                  <div className="dynamic-text-xs font-light">
                    {settings.samoModeEnabled ? 'hide samo' : 'show samo'}
                  </div>
                </button>
              </div>

              {/* Steal This Quote */}
              <div>
                <button
                  onClick={() => updateSettings({ stealThisQuoteEnabled: !settings.stealThisQuoteEnabled })}
                  className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
                >
                  <div className="dynamic-text-xs font-light">
                    {settings.stealThisQuoteEnabled ? 'hide steal this quote' : 'show steal this quote'}
                  </div>
                </button>
              </div>
            </div>
          </CollapsibleSection>

          {/* Note Controls */}
          <CollapsibleSection title="note controls">
            <div>
              <button
                onClick={() => {
                  const newValue = !settings.enhancedEditingEnabled;
                  updateSettings({ enhancedEditingEnabled: newValue });
                  if (newValue) {
                    const alreadyUnlocked = localStorage.getItem('stream-matrix-unlocked') === 'true';
                    if (!alreadyUnlocked) {
                      localStorage.setItem('stream-matrix-unlocked', 'true');
                      showToast('Matrix theme unlocked!', 5000);
                    }
                  }
                }}
                className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
              >
                <div className="dynamic-text-xs font-light">
                  {settings.enhancedEditingEnabled ? 'disable all editing controls' : 'enable all editing controls'}
                </div>
              </button>
            </div>
          </CollapsibleSection>

          {/* Lists */}
          <CollapsibleSection title={settings.personalityEnabled ? "lists" : "list formatting"}>
            <div className="space-y-2">
              {Object.entries(ORGANIZATION_STYLES).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => updateSettings({ organizationStyle: key })}
                  className={`w-full text-left pb-3 border-b transition-all duration-200 ${
                    settings.organizationStyle === key
                      ? `${theme.border} ${theme.text}`
                      : `${theme.borderSecondary} ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
                  }`}
                >
                  <div className="dynamic-text-xs font-light mb-1">
                    {style.name.toLowerCase()}
                  </div>
                  <div className={`dynamic-text-xs ${theme.textTertiary} font-mono whitespace-pre-line leading-tight`}>
                    {style.example}
                  </div>
                </button>
              ))}
            </div>
          </CollapsibleSection>

          {/* Auto-Sorting */}
          <CollapsibleSection title={settings.personalityEnabled ? "smart lists" : "auto-sorting"}>
            <div>
              <button
                onClick={() => updateSettings({ autoSortingEnabled: !settings.autoSortingEnabled })}
                className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
              >
                <div className="dynamic-text-xs font-light">
                  {settings.autoSortingEnabled ? 'disable smart formatting' : 'enable smart formatting'}
                </div>
              </button>
            </div>
          </CollapsibleSection>

          {/* Show More by Default */}
          <CollapsibleSection title={settings.personalityEnabled ? "expand notes" : "show more by default"}>
            <div>
              <button
                onClick={() => updateSettings({ showMoreByDefault: !settings.showMoreByDefault })}
                className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
              >
                <div className="dynamic-text-xs font-light">
                  {settings.showMoreByDefault ? 'disable auto-expansion' : 'enable auto-expansion'}
                </div>
              </button>
            </div>
          </CollapsibleSection>

          {/* Folders */}
          <CollapsibleSection title="folders">
            <div>
              <button
                onClick={() => {
                  const newValue = !settings.foldersEnabled;
                  updateSettings({ foldersEnabled: newValue });
                  if (newValue) {
                    const alreadyUnlocked = localStorage.getItem('stream_edge_unlocked') === 'true';
                    if (!alreadyUnlocked) {
                      localStorage.setItem('stream_edge_unlocked', 'true');
                      showToast('Edge theme unlocked!', 5000);
                    }
                  }
                }}
                className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
              >
                <div className="dynamic-text-xs font-light">
                  {settings.foldersEnabled ? 'disable folders' : 'enable folders'}
                </div>
              </button>
            </div>
            {settings.foldersEnabled && (
              <div className="space-y-4 pt-4">
                <div>
                  <div className={`dynamic-text-xs ${theme.textTertiary} font-light mb-2`}>Create new folder</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newFolder}
                      onChange={(e) => setNewFolder(e.target.value)}
                      placeholder="new folder name"
                      className={`flex-grow bg-transparent ${theme.text} text-sm font-light focus:outline-none border-b ${theme.borderSecondary} pb-1`}
                    />
                    <button
                      onClick={handleAddFolder}
                      disabled={!newFolder.trim()}
                      className={`px-2 py-1 dynamic-text-xs font-light ${
                        newFolder.trim()
                          ? `${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`
                          : theme.textTertiary
                      } transition-colors`}
                    >
                      add
                    </button>
                  </div>
                </div>
                <div>
                  <div className={`dynamic-text-xs ${theme.textTertiary} font-light mb-2`}>Existing folders</div>
                  <div className="space-y-2">
                    {settings.folders.map((folder) => (
                      <div key={folder} className="flex items-center justify-between">
                        <span className={`dynamic-text-sm ${theme.text}`}>{folder}</span>
                        <button
                          onClick={() => handleDeleteFolder(folder)}
                          className={`text-xs ${theme.textTertiary} hover:text-red-500 transition-colors`}
                        >
                          delete
                        </button>
                      </div>
                    ))}
                    {settings.folders.length === 0 && (
                      <p className={`dynamic-text-xs ${theme.textTertiary} font-light`}>no folders yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CollapsibleSection>

          {/* Flow Formatting */}
          <CollapsibleSection title="flow formatting">
            <div>
              <button
                onClick={() => updateSettings({ flowFormattingEnabled: !settings.flowFormattingEnabled })}
                className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
              >
                <div className="dynamic-text-xs font-light">
                  {settings.flowFormattingEnabled ? 'disable flow formatting' : 'enable flow formatting'}
                </div>
              </button>
            </div>
          </CollapsibleSection>

          {/* Onboarding */}
          <CollapsibleSection title="onboarding">
            <button
              onClick={handleResetOnboarding}
              className={`w-full text-left pb-3 border-b transition-all duration-200 ${theme.border} ${theme.text} hover:${theme.textSecondary.replace('text-', 'hover:text-')}`}
            >
              <div className="dynamic-text-xs font-light">
                do it again (for fun)
              </div>
            </button>
          </CollapsibleSection>
        </div>

        {/* ACTIONS SECTION */}
        <div className={`mt-6 pt-4 border-t ${theme.borderSecondary} space-y-4`}>
          <div className={`${theme.textTertiary} dynamic-text-xs font-light uppercase tracking-wider`}>
            Actions
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => window.open('https://gleb-bogachev.notion.site/updates-stream?source=copy_link', '_blank')}
              className={`w-full text-left px-3 py-2 dynamic-text-xs font-light ${theme.text} ${theme.buttonHover} transition-colors flex items-center gap-2 rounded-sm`}
            >
              <span className={`${theme.textTertiary} w-3 text-center`}>↗</span>
              view updates
            </button>
            
            <button
              onClick={onFeedback}
              className={`w-full text-left px-3 py-2 dynamic-text-xs font-light ${theme.text} ${theme.buttonHover} transition-colors flex items-center gap-2 rounded-sm`}
            >
              <span className={`${theme.textTertiary} w-3 text-center`}>?</span>
              {settings.personalityEnabled ? 'help improve stream' : 'feedback'}
            </button>
            
            <button
              onClick={() => window.open('https://ko-fi.com/banhmii#avatarModal', '_blank')}
              className={`w-full text-left px-3 py-2 dynamic-text-xs font-light ${theme.text} ${theme.buttonHover} transition-colors flex items-center gap-2 rounded-sm`}
            >
              <span className={`${theme.textTertiary} w-3 text-center`}>♡</span>
              support project
            </button>
          </div>
        </div>

        <div className={`mt-6 pt-4 border-t ${theme.borderSecondary} space-y-3`}>
          <button
            onClick={handleReset}
            className={`dynamic-text-xs font-light ${theme.textTertiary} ${theme.textDestructive} transition-colors block mx-auto`}
          >
            reset preferences
          </button>
        </div>
        {showSignOutChoice && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-50">
            <div className={`${theme.bg} ${theme.border} border max-w-sm w-full p-5 sm:p-6 shadow-lg space-y-4`}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className={`dynamic-text-lg font-light ${theme.text}`}>sign out?</h2>
                  <p className={`mt-2 dynamic-text-sm font-light ${theme.textTertiary}`}>
                    leave your notes on this device, or clear everything so the next sign-in starts fresh.
                  </p>
                </div>
                <button
                  onClick={() => { if (!isSigningOut) setShowSignOutChoice(false); }}
                  className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
                  disabled={isSigningOut}
                >
                  [close]
                </button>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={() => performSignOut(false)}
                  className={`w-full px-3 py-2 dynamic-text-xs font-light ${theme.text} ${theme.buttonHover} transition-colors rounded-sm disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isSigningOut ? 'signing out…' : 'sign out & keep notes'}
                </button>
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={() => performSignOut(true)}
                  className={`w-full px-3 py-2 dynamic-text-xs font-light text-red-500 hover:text-red-400 hover:bg-red-500/5 transition-colors rounded-sm disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isSigningOut ? 'clearing & signing…' : 'sign out & clear notes'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => { if (!isSigningOut) setShowSignOutChoice(false); }}
                className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors disabled:opacity-60`}
                disabled={isSigningOut}
              >
                stay signed in
              </button>
            </div>
          </div>
        )}
        <ConfirmModal
          isOpen={showActiveDeleteConfirm}
          title="drain active notes?"
          message="This will delete every active note. Saved notes and SAMO art stay untouched."
          confirmLabel={isDeletingActiveNotes ? 'draining…' : 'drain active'}
          cancelLabel="keep them"
          onConfirm={handleDeleteActiveOnly}
          onCancel={() => {
            if (!isDeletingActiveNotes) {
              setShowActiveDeleteConfirm(false);
            }
          }}
          isDestructive
        />
        <ConfirmModal
          isOpen={showDeleteAllConfirm}
          title="drain the stream?"
          message="This will delete every active note, saved note, and SAMO art piece. There is no undo."
          confirmLabel={isDeletingAllNotes ? 'draining…' : 'pull the plug'}
          cancelLabel="keep my notes"
          onConfirm={handleDeleteAll}
          onCancel={() => {
            if (!isDeletingAllNotes) {
              setShowDeleteAllConfirm(false);
            }
          }}
          isDestructive
        />
        <ConfirmModal
          isOpen={!!folderPendingDeletion}
          title="delete folder"
          message={folderPendingDeletion
            ? `removing "${folderPendingDeletion}" will move its notes back to all notes. continue?`
            : 'removing this folder will move its notes back to all notes.'}
          confirmLabel="delete"
          cancelLabel="cancel"
          onConfirm={handleConfirmFolderDeletion}
          onCancel={handleCancelFolderDeletion}
          isDestructive
        />
      </div>
    </div>
  );
};

export default SettingsModal;

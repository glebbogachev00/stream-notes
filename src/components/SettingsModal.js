import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings, ORGANIZATION_STYLES, DELETE_TIMERS } from '../contexts/SettingsContext';
import { useStorage } from '../contexts/StorageContext';
import CollapsibleSection from './CollapsibleSection';
import FontSizeControl from './FontSizeControl';
import { getUserTag, setUserTag, validateUserTag, formatUserTag, clearUserTag } from '../utils/tags';
import { sanitizeInput } from '../utils/security';

const SettingsModal = ({ isOpen, onClose }) => {
  const { theme, switchTheme, themes } = useTheme();
  const { settings, updateSettings, resetSettings, togglePersonality } = useSettings();
  const { isSyncSupported } = useStorage();
  const [newUserTag, setNewUserTag] = useState('');
  const [tagError, setTagError] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const userTag = getUserTag();

  if (!isOpen) return null;

  const handleAddFolder = () => {
    const folderName = newFolder.trim();
    if (folderName && !settings.folders.includes(folderName)) {
      updateSettings({ folders: [...settings.folders, folderName] });
      setNewFolder('');
    }
  };

  const handleDeleteFolder = (folderName) => {
    updateSettings({ folders: settings.folders.filter(f => f !== folderName) });
  };

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
                    onClick={() => updateSettings({ letterSpacing: Math.max(-1, settings.letterSpacing - 0.5) })}
                    className={`dynamic-text-xs font-light ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')} transition-colors`}
                  >
                    [-]
                  </button>
                  <span className={`dynamic-text-xs font-light ${theme.text}`}>
                    {settings.letterSpacing}px
                  </span>
                  <button
                    onClick={() => updateSettings({ letterSpacing: Math.min(5, settings.letterSpacing + 0.5) })}
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

          {/* Personality */}
          <CollapsibleSection title="personality">
            <div className="space-y-4">
              {/* Personality Toggle */}
              <div>
                <div className={`dynamic-text-xs ${theme.textTertiary} font-light mb-2`}>Personality toggle</div>
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
                <div className={`dynamic-text-xs ${theme.textTertiary} font-light mb-2`}>SAMO</div>
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
                <div className={`dynamic-text-xs ${theme.textTertiary} font-light mb-2`}>Steal this quote</div>
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

          {/* Data Storage */}
          <CollapsibleSection title="data storage">
            <div>
              <div className={`dynamic-text-xs ${theme.textTertiary} font-light mb-2`}>Storage method</div>
              <div className="space-y-3">
                <button
                  onClick={() => updateSettings({ syncEnabled: false })}
                  className={`w-full text-left pb-3 border-b transition-all duration-200 ${
                    !settings.syncEnabled
                      ? `${theme.border} ${theme.text}`
                      : `${theme.borderSecondary} ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
                  }`}
                >
                  <div className="dynamic-text-xs font-light mb-1">
                    ○ local only (this device only)
                  </div>
                </button>
                
                {isSyncSupported() ? (
                  <button
                    onClick={() => updateSettings({ syncEnabled: true })}
                    className={`w-full text-left pb-3 border-b transition-all duration-200 ${
                      settings.syncEnabled
                        ? `${theme.border} ${theme.text}`
                        : `${theme.borderSecondary} ${theme.textTertiary} hover:${theme.text.replace('text-', 'hover:text-')}`
                    }`}
                  >
                    <div className="dynamic-text-xs font-light mb-1">
                      ○ browser sync (sync across devices)
                    </div>
                  </button>
                ) : (
                  <div className={`pb-3 border-b ${theme.borderSecondary}`}>
                    <div className={`dynamic-text-xs font-light mb-1 ${theme.textTertiary}`}>
                      ○ browser sync (not available)
                    </div>
                  </div>
                )}
              </div>
              
              <div className={`dynamic-text-xs ${theme.textTertiary} font-light leading-relaxed pt-2`}>
                browser sync uses your existing browser account. data never goes to stream servers.
              </div>
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

          {/* Note Controls */}
          <CollapsibleSection title="note controls">
            <div>
              <div className={`dynamic-text-xs ${theme.textTertiary} font-light mb-2`}>Enhanced editing</div>
              <div className={`dynamic-text-xs ${theme.textTertiary} font-light mb-3`}>
                Toggle for all note controls (bold, lists, timer display, etc.)
              </div>
              <button
                onClick={() => updateSettings({ enhancedEditingEnabled: !settings.enhancedEditingEnabled })}
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

          {/* Folders */}
          <CollapsibleSection title="folders">
            <div>
              <div className={`dynamic-text-xs ${theme.textTertiary} font-light mb-2`}>Enable folders</div>
              <button
                onClick={() => updateSettings({ foldersEnabled: !settings.foldersEnabled })}
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

        <div className={`mt-6 pt-4 border-t ${theme.borderSecondary} space-y-3`}>
          <div className={`dynamic-text-xs ${theme.textTertiary} font-light text-center`}>
            🔒 Your notes never leave your device
          </div>
          <button
            onClick={handleReset}
            className={`dynamic-text-xs font-light ${theme.textTertiary} ${theme.textDestructive} transition-colors block mx-auto`}
          >
            reset preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
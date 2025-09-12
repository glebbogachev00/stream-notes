import { formatNoteWithAI } from './aiService';

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Use AI to parse natural language commands
export const parseCommand = async (input, context = {}) => {
  if (!GROQ_API_KEY) {
    // Fallback to simple parsing if no API key
    return {
      type: 'CREATE_NOTE',
      originalInput: input,
      parameters: [input],
      confidence: 0.5,
      naturalResponse: "I'll create a note with that content."
    };
  }

  const { activeNotes = 0, savedNotes = 0, folders = [], themes = [] } = context;
  
  const systemPrompt = `You are stream, a minimal note-taking app's AI assistant. You embody stream's personality: minimalist, helpful, slightly playful, and focused on flow.

PERSONALITY & VOICE:
- Casual and friendly, but not overly excited
- Use lowercase for a relaxed vibe when appropriate
- Occasionally use stream-themed language: "flow", "let it stream", "flowing nicely"
- Be concise but warm - think minimalist helpfulness
- Sometimes use the water droplet emoji (💧) as your signature
- When things go well: "flowing nicely!" or "that's the stream way!"

AVAILABLE ACTIONS:
- CREATE_NOTE: Create a new note (parameters: [content])
- FORMAT_LATEST: Format the most recent note with AI
- FORMAT_ALL: Format all active notes 
- DELETE_LATEST: Delete the most recent note
- SAVE_ALL: Save all active notes to saved notes
- SAVE_LATEST: Save the most recent note
- MOVE_TO_FOLDER: Move latest note to folder (parameters: [folderName])
- CHANGE_THEME: Switch app theme (parameters: [themeName])
- ENABLE_SETTING: Enable a setting (parameters: [settingName])
- DISABLE_SETTING: Disable a setting (parameters: [settingName])
- TOGGLE_SETTING: Toggle a setting (parameters: [settingName])
- HELP: Show available commands
- CHAT: General conversation/questions

CURRENT STATE:
- Active notes: ${activeNotes}
- Saved notes: ${savedNotes}
- Available folders: ${folders.join(', ') || 'none'}
- Available themes: ${themes.join(', ') || 'default'}

AVAILABLE SETTINGS TO TOGGLE:
- flowFormattingEnabled: Enable/disable AI flow formatting
- autoSortingEnabled: Enable/disable smart list formatting
- foldersEnabled: Enable/disable folder organization
- enhancedEditingEnabled: Enable/disable editing controls
- samoModeEnabled: Enable/disable SAMO art mode
- stealThisQuoteEnabled: Enable/disable quote collection
- showHeaderButtons: Show/hide header action buttons
- showMoreByDefault: Auto-expand long notes
- personalityEnabled: Enable/disable stream personality

RESPONSE GUIDELINES:
- Always respond in stream's voice with naturalResponse
- For conversations, use CHAT and give helpful, stream-personality responses
- For confirmations, be friendly: "want me to go ahead?" instead of formal language
- Celebrate successes: "nice! that's flowing smoothly now" 
- Be encouraging: "let's get your notes flowing!" 

RESPONSE FORMAT - RETURN ONLY VALID JSON (no extra text):
{
  "type": "ACTION_TYPE",
  "parameters": ["param1", "param2"],
  "confidence": 0.9,
  "naturalResponse": "hey! I can help you with that. want me to go ahead?",
  "needsConfirmation": false
}

CRITICAL: Your response must be ONLY the JSON object above. No markdown, no explanations, no extra text.

CRITICAL RULES:
1. Only use CREATE_NOTE when user explicitly says "create/write/add/make a note"
2. For casual conversation, greetings, questions → use CHAT with stream personality
3. For bulk operations (save all, format all, delete) → set needsConfirmation: true
4. Always include naturalResponse in stream's voice - this is your main interaction!

Examples:
"create a note about coffee" → CREATE_NOTE, naturalResponse: "got it! creating a note about coffee 💧"
"hey what's up" → CHAT, naturalResponse: "hey there! just here helping with your notes. what's flowing through your mind?"
"can you help me" → CHAT, naturalResponse: "absolutely! I'm here to help with your notes. want to create something, format existing ones, or manage settings?"
"save everything" → SAVE_ALL, naturalResponse: "this'll save all your active notes to your saved collection. want me to go ahead?", needsConfirmation: true
"enable folders" → ENABLE_SETTING, naturalResponse: "nice! I'll enable folders so you can organize your notes. here we go!"
"what can you do" → HELP, naturalResponse: "I can help you create notes, format them, save them, and manage your stream settings. what sounds good?"

Remember: Your naturalResponse is the main user interaction - make it count with stream's personality!`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0.1,
        max_tokens: 200,
      })
    });

    if (!response.ok) {
      throw new Error('Failed to parse command with AI');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Try to parse JSON response
    try {
      // Clean the response to extract just the JSON part
      let cleanResponse = aiResponse.trim();
      
      // If the response contains markdown code blocks, extract the JSON
      if (cleanResponse.includes('```json')) {
        const jsonMatch = cleanResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[1];
        }
      } else if (cleanResponse.includes('```')) {
        const jsonMatch = cleanResponse.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[1];
        }
      }
      
      // Try to find JSON object in the response
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }
      
      const parsed = JSON.parse(cleanResponse);
      return {
        type: parsed.type || 'CHAT',
        originalInput: input,
        parameters: parsed.parameters || [],
        confidence: parsed.confidence || 0.7,
        naturalResponse: parsed.naturalResponse || "I'll help you with that!",
        needsConfirmation: parsed.needsConfirmation || false
      };
    } catch (jsonError) {
      console.warn('JSON parsing failed:', jsonError, 'Raw response:', aiResponse);
      
      // Enhanced fallback - don't create notes from failed parsing
      return {
        type: 'CHAT',
        originalInput: input,
        parameters: [],
        confidence: 0.3,
        naturalResponse: aiResponse || "sorry, I had a bit of trouble understanding that. can you try rephrasing?",
        needsConfirmation: false
      };
    }

  } catch (error) {
    console.warn('AI command parsing failed, using fallback:', error);
    
    // Enhanced fallback parsing to avoid saving commands as notes
    const lowerInput = input.toLowerCase().trim();
    
    // Help commands
    if (lowerInput.includes('help') || lowerInput.includes('what can you do')) {
      return {
        type: 'HELP',
        originalInput: input,
        parameters: [],
        confidence: 0.9,
        naturalResponse: "here's what I can help you with! 💧",
        needsConfirmation: false
      };
    }
    
    // Formatting commands
    if (lowerInput.includes('format')) {
      if (lowerInput.includes('latest') || lowerInput.includes('last')) {
        return {
          type: 'FORMAT_LATEST',
          originalInput: input,
          parameters: [],
          confidence: 0.8,
          naturalResponse: "let me clean up your latest note with some flow formatting!",
          needsConfirmation: false
        };
      } else if (lowerInput.includes('all') || lowerInput.includes('everything')) {
        return {
          type: 'FORMAT_ALL',
          originalInput: input,
          parameters: [],
          confidence: 0.8,
          naturalResponse: "this'll format all your active notes with flow formatting. want me to go ahead?",
          needsConfirmation: true
        };
      }
    }
    
    // Delete commands
    if (lowerInput.includes('delete') && (lowerInput.includes('latest') || lowerInput.includes('last'))) {
      return {
        type: 'DELETE_LATEST',
        originalInput: input,
        parameters: [],
        confidence: 0.8,
        naturalResponse: "want me to delete your latest note? just making sure!",
        needsConfirmation: true
      };
    }
    
    // Save commands
    if (lowerInput.includes('save') && (lowerInput.includes('all') || lowerInput.includes('everything'))) {
      return {
        type: 'SAVE_ALL',
        originalInput: input,
        parameters: [],
        confidence: 0.8,
        naturalResponse: "this'll save all your active notes to your saved collection. want me to go ahead?",
        needsConfirmation: true
      };
    }
    
    // Settings commands - Enable
    if ((lowerInput.includes('enable') || lowerInput.includes('turn on') || lowerInput.includes('activate')) && 
        (lowerInput.includes('flow') || lowerInput.includes('folders') || lowerInput.includes('samo') || lowerInput.includes('personality'))) {
      const settingName = lowerInput.replace(/enable|turn on|activate/g, '').trim();
      return {
        type: 'ENABLE_SETTING',
        originalInput: input,
        parameters: [settingName],
        confidence: 0.8,
        naturalResponse: `got it! enabling ${settingName} for you`,
        needsConfirmation: false
      };
    }
    
    // Settings commands - Disable
    if ((lowerInput.includes('disable') || lowerInput.includes('turn off') || lowerInput.includes('deactivate')) && 
        (lowerInput.includes('flow') || lowerInput.includes('folders') || lowerInput.includes('samo') || lowerInput.includes('personality'))) {
      const settingName = lowerInput.replace(/disable|turn off|deactivate/g, '').trim();
      return {
        type: 'DISABLE_SETTING',
        originalInput: input,
        parameters: [settingName],
        confidence: 0.8,
        naturalResponse: `sure thing! disabling ${settingName} for you`,
        needsConfirmation: false
      };
    }
    
    // Theme commands
    if (lowerInput.includes('theme') || lowerInput.includes('color')) {
      return {
        type: 'CHANGE_THEME',
        originalInput: input,
        parameters: [input.replace(/change|switch|theme|to|color/gi, '').trim()],
        confidence: 0.7,
        naturalResponse: "let's switch up your theme! which one sounds good?",
        needsConfirmation: false
      };
    }
    
    // Conversational inputs (avoid saving as notes)
    const conversationalKeywords = ['hi', 'hello', 'hey', 'thanks', 'thank you', 'good', 'great', 'awesome', 'cool', 'nice', 'how are', 'what\'s up', 'whats up'];
    if (conversationalKeywords.some(keyword => lowerInput.includes(keyword))) {
      return {
        type: 'CHAT',
        originalInput: input,
        parameters: [],
        confidence: 0.6,
        naturalResponse: "hey! just here helping with your notes. what's flowing through your mind?",
        needsConfirmation: false
      };
    }
    
    // Only create notes if explicitly asked
    const noteCreationKeywords = ['create', 'write', 'add', 'make', 'new'];
    const hasNoteKeyword = noteCreationKeywords.some(keyword => 
      lowerInput.includes(keyword + ' note') || 
      lowerInput.includes(keyword + ' a note') ||
      (lowerInput.startsWith(keyword + ' ') && lowerInput.length > keyword.length + 5)
    );
    
    if (hasNoteKeyword) {
      // Extract the content after the note creation command
      let content = input;
      noteCreationKeywords.forEach(keyword => {
        content = content.replace(new RegExp(`${keyword}\\s+(a\\s+)?note\\s+(about\\s+|that\\s+says\\s+|with\\s+)?`, 'gi'), '');
      });
      
      return {
        type: 'CREATE_NOTE',
        originalInput: input,
        parameters: [content.trim()],
        confidence: 0.8,
        naturalResponse: "got it! creating that note for you 💧",
        needsConfirmation: false
      };
    }
    
    // Check if input contains imperative verbs that suggest commands rather than notes
    const commandVerbs = ['show', 'list', 'find', 'search', 'get', 'give', 'tell', 'explain', 'help', 'can you', 'could you', 'please', 'how', 'what', 'where', 'when', 'why'];
    const isLikelyCommand = commandVerbs.some(verb => lowerInput.startsWith(verb) || lowerInput.includes(verb + ' '));
    
    if (isLikelyCommand) {
      return {
        type: 'CHAT',
        originalInput: input,
        parameters: [],
        confidence: 0.6,
        naturalResponse: "hmm, not sure about that one! but I can help with creating notes, formatting them, saving, and managing settings. what sounds good?",
        needsConfirmation: false
      };
    }
    
    // Default to chat for everything else - don't assume note creation
    return {
      type: 'CHAT',
      originalInput: input,
      parameters: [],
      confidence: 0.4,
      naturalResponse: "hey! I'm here to help with your notes. want to create something, format existing ones, or manage your settings? just let it flow! 💧",
      needsConfirmation: false
    };
  }
};

// Execute parsed commands
export class CommandExecutor {
  constructor(noteActions, settingsActions, showToast) {
    this.noteActions = noteActions;
    this.settingsActions = settingsActions;
    this.showToast = showToast;
  }

  async execute(command) {
    try {
      switch (command.type) {
        case 'CREATE_NOTE':
          return await this.createNote(command.parameters[0]);
          
        case 'FORMAT_LATEST':
          return await this.formatLatestNote();
          
        case 'FORMAT_ALL':
          return await this.formatAllNotes();
          
        case 'DELETE_LATEST':
          return await this.deleteLatestNote();
          
        case 'SAVE_ALL':
          return await this.saveAllNotes();
          
        case 'SAVE_LATEST':
          return await this.saveLatestNote();
          
        case 'MOVE_TO_FOLDER':
          return await this.moveToFolder(command.parameters[0]);
          
        case 'SEARCH_NOTES':
          return await this.searchNotes(command.parameters[0]);
          
        case 'CHANGE_THEME':
          return await this.changeTheme(command.parameters[0]);
          
        case 'ENABLE_SETTING':
          return await this.enableSetting(command.parameters[0]);
          
        case 'DISABLE_SETTING':
          return await this.disableSetting(command.parameters[0]);
          
        case 'TOGGLE_SETTING':
          return await this.toggleSetting(command.parameters[0]);
          
        case 'HELP':
          return this.showHelp();
          
        case 'CHAT':
          return this.handleChat(command);
          
        default:
          return {
            success: false,
            message: command.naturalResponse || "I didn't understand that command. Try 'help' to see what I can do.",
            isChat: command.type === 'CHAT'
          };
      }
    } catch (error) {
      console.error('Command execution error:', error);
      return {
        success: false,
        message: error.message || "Something went wrong while executing that command."
      };
    }
  }

  async createNote(content) {
    if (!content || !content.trim()) {
      return {
        success: false,
        message: "I need some content to create a note!"
      };
    }

    try {
      await this.noteActions.addNote(content.trim());
      return {
        success: true,
        message: "nice! your note is flowing 💧"
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to create note. Please try again."
      };
    }
  }

  async formatLatestNote() {
    const notes = this.noteActions.getNotes();
    if (notes.length === 0) {
      return {
        success: false,
        message: "No notes to format!"
      };
    }

    try {
      const latestNote = notes[0]; // Assuming notes are sorted by most recent first
      const formattedContent = await formatNoteWithAI(latestNote.content, this.settingsActions.getSettings());
      await this.noteActions.updateNoteContent(latestNote.id, formattedContent);
      
      return {
        success: true,
        message: "flowing nicely! your latest note is all cleaned up ✨"
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to format note."
      };
    }
  }

  async formatAllNotes() {
    const notes = this.noteActions.getNotes();
    if (notes.length === 0) {
      return {
        success: false,
        message: "No notes to format!"
      };
    }

    // This is a bulk operation, but formatting is generally safe
    try {
      let formattedCount = 0;
      for (const note of notes) {
        try {
          const formattedContent = await formatNoteWithAI(note.content, this.settingsActions.getSettings());
          await this.noteActions.updateNoteContent(note.id, formattedContent);
          formattedCount++;
        } catch (error) {
          console.warn(`Failed to format note ${note.id}:`, error);
        }
      }
      
      return {
        success: true,
        message: `that's the stream way! formatted ${formattedCount} of ${notes.length} notes ✨`
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to format notes. Please try again."
      };
    }
  }

  async deleteLatestNote() {
    const notes = this.noteActions.getNotes();
    if (notes.length === 0) {
      return {
        success: false,
        message: "No notes to delete!"
      };
    }

    try {
      const latestNote = notes[0];
      await this.noteActions.deleteNote(latestNote.id);
      
      return {
        success: true,
        message: "Latest note deleted!"
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to delete note. Please try again."
      };
    }
  }

  async saveAllNotes() {
    const notes = this.noteActions.getNotes();
    if (notes.length === 0) {
      return {
        success: false,
        message: "No active notes to save!"
      };
    }

    try {
      let savedCount = 0;
      for (const note of notes) {
        try {
          await this.noteActions.saveNote(note.id);
          savedCount++;
        } catch (error) {
          console.warn(`Failed to save note ${note.id}:`, error);
        }
      }
      
      return {
        success: true,
        message: `Saved ${savedCount} of ${notes.length} notes!`
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to save notes. Please try again."
      };
    }
  }

  async saveLatestNote() {
    const notes = this.noteActions.getNotes();
    if (notes.length === 0) {
      return {
        success: false,
        message: "No active notes to save!"
      };
    }

    try {
      const latestNote = notes[0];
      await this.noteActions.saveNote(latestNote.id);
      
      return {
        success: true,
        message: "Latest note saved!"
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to save note. Please try again."
      };
    }
  }

  async moveToFolder(folderName) {
    const notes = this.noteActions.getNotes();
    if (notes.length === 0) {
      return {
        success: false,
        message: "No notes to move!"
      };
    }

    const settings = this.settingsActions.getSettings();
    if (!settings.foldersEnabled) {
      return {
        success: false,
        message: "Folders are not enabled. Enable them in settings first!"
      };
    }

    try {
      const latestNote = notes[0];
      await this.noteActions.updateNoteFolder(latestNote.id, folderName.trim());
      
      return {
        success: true,
        message: `Moved latest note to "${folderName}" folder!`
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to move note. Please try again."
      };
    }
  }

  async searchNotes(query) {
    // This would require implementing search functionality
    return {
      success: false,
      message: "Search functionality is coming soon! For now, you can browse your saved notes."
    };
  }

  async changeTheme(themeName) {
    const availableThemes = this.settingsActions.getAvailableThemes();
    const normalizedTheme = themeName.toLowerCase().trim();
    
    // Find matching theme (fuzzy matching)
    const matchingTheme = availableThemes.find(theme => 
      theme.toLowerCase().includes(normalizedTheme) || 
      normalizedTheme.includes(theme.toLowerCase())
    );

    if (!matchingTheme) {
      return {
        success: false,
        message: `Theme "${themeName}" not found. Available themes: ${availableThemes.join(', ')}`
      };
    }

    try {
      await this.settingsActions.switchTheme(matchingTheme);
      return {
        success: true,
        message: `Switched to ${matchingTheme} theme!`
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to change theme. Please try again."
      };
    }
  }

  showHelp() {
    const helpText = `Hey! I'm here to help with your notes. Here's what I can do:

**Notes:**
• Create notes: "create a note about..." or "write a note that says..."
• Format notes: "clean up my latest note" or "format everything"  
• Save notes: "save my latest note" or "save all my notes"
• Delete notes: "delete my latest note"

**Settings:**
• Enable features: "enable flow formatting" or "turn on folders"
• Disable features: "disable SAMO mode" or "turn off personality" 
• Switch themes: "change to dark theme"

**Organization:**
• Move notes: "put my latest note in the work folder"
• Manage folders and themes

**Available settings to control:**
• Flow formatting • Smart lists • Folders • Editing controls
• SAMO art mode • Quote collection • Header buttons • Auto-expand

**Natural conversation:**
Just talk to me normally! I understand natural language:
• "hey, can you enable folders for me?"
• "I want to save everything and disable flow formatting"
• "turn on SAMO mode"

Try me out! 💧`;

    return {
      success: true,
      message: helpText,
      isHelp: true
    };
  }

  handleChat(command) {
    return {
      success: true,
      message: command.naturalResponse || "I'm here to help with your notes! What would you like to do?",
      isChat: true
    };
  }

  // Settings mapping for natural language to setting keys
  getSettingKey(settingName) {
    const settingMap = {
      'flow formatting': 'flowFormattingEnabled',
      'ai formatting': 'flowFormattingEnabled',
      'formatting': 'flowFormattingEnabled',
      'auto sorting': 'autoSortingEnabled',
      'smart lists': 'autoSortingEnabled',
      'folders': 'foldersEnabled',
      'editing controls': 'enhancedEditingEnabled',
      'enhanced editing': 'enhancedEditingEnabled',
      'enhanced editing enabled': 'enhancedEditingEnabled',
      'note controls': 'enhancedEditingEnabled',
      'editing': 'enhancedEditingEnabled',
      'controls': 'enhancedEditingEnabled',
      'samo': 'samoModeEnabled',
      'samo mode': 'samoModeEnabled',
      'art mode': 'samoModeEnabled',
      'quotes': 'stealThisQuoteEnabled',
      'steal this quote': 'stealThisQuoteEnabled',
      'header buttons': 'showHeaderButtons',
      'buttons': 'showHeaderButtons',
      'expand notes': 'showMoreByDefault',
      'auto expand': 'showMoreByDefault',
      'personality': 'personalityEnabled',
      'stream personality': 'personalityEnabled'
    };

    const normalizedName = settingName.toLowerCase().trim();
    
    // Try exact match first
    if (settingMap[normalizedName]) {
      return settingMap[normalizedName];
    }
    
    // Try partial matches for more flexibility
    for (const [key, value] of Object.entries(settingMap)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return value;
      }
    }
    
    return normalizedName;
  }

  getSettingDisplayName(settingKey) {
    const displayNames = {
      'flowFormattingEnabled': 'flow formatting',
      'autoSortingEnabled': 'smart lists',
      'foldersEnabled': 'folders',
      'enhancedEditingEnabled': 'editing controls',
      'samoModeEnabled': 'SAMO art mode',
      'stealThisQuoteEnabled': 'quote collection',
      'showHeaderButtons': 'header buttons',
      'showMoreByDefault': 'auto-expand notes',
      'personalityEnabled': 'stream personality'
    };

    return displayNames[settingKey] || settingKey;
  }

  async enableSetting(settingName) {
    if (!settingName) {
      return {
        success: false,
        message: "Which setting would you like me to enable?"
      };
    }

    const settingKey = this.getSettingKey(settingName);
    const displayName = this.getSettingDisplayName(settingKey);
    const currentSettings = this.settingsActions.getSettings();
    
    console.log('Enable setting debug:', {
      originalName: settingName,
      settingKey: settingKey,
      displayName: displayName,
      settingExists: settingKey in currentSettings,
      currentValue: currentSettings[settingKey],
      allSettings: Object.keys(currentSettings)
    });

    // Check if setting exists
    if (!(settingKey in currentSettings)) {
      return {
        success: false,
        message: `I don't recognize the "${settingName}" setting. Try asking for help to see available options!`
      };
    }

    // Check if already enabled
    if (currentSettings[settingKey] === true) {
      return {
        success: true,
        message: `looks like ${displayName} is already flowing! you're all set 💧`
      };
    }

    try {
      await this.settingsActions.updateSettings({ [settingKey]: true });
      return {
        success: true,
        message: `nice! ${displayName} is now flowing. you should see it kick in right away ✨`
      };
    } catch (error) {
      return {
        success: false,
        message: `Hmm, I had trouble enabling ${displayName}. Could you try again?`
      };
    }
  }

  async disableSetting(settingName) {
    if (!settingName) {
      return {
        success: false,
        message: "Which setting would you like me to disable?"
      };
    }

    const settingKey = this.getSettingKey(settingName);
    const displayName = this.getSettingDisplayName(settingKey);
    const currentSettings = this.settingsActions.getSettings();

    // Check if setting exists
    if (!(settingKey in currentSettings)) {
      return {
        success: false,
        message: `I don't recognize the "${settingName}" setting. Try asking for help to see available options!`
      };
    }

    // Check if already disabled
    if (currentSettings[settingKey] === false) {
      return {
        success: true,
        message: `${displayName} is already disabled. All set! 👍`
      };
    }

    try {
      await this.settingsActions.updateSettings({ [settingKey]: false });
      return {
        success: true,
        message: `Done! I've disabled ${displayName} for you. The change should be visible immediately! 🔄`
      };
    } catch (error) {
      return {
        success: false,
        message: `I had trouble disabling ${displayName}. Want to give it another try?`
      };
    }
  }

  async toggleSetting(settingName) {
    if (!settingName) {
      return {
        success: false,
        message: "Which setting would you like me to toggle?"
      };
    }

    const settingKey = this.getSettingKey(settingName);
    const displayName = this.getSettingDisplayName(settingKey);
    const currentSettings = this.settingsActions.getSettings();

    // Check if setting exists
    if (!(settingKey in currentSettings)) {
      return {
        success: false,
        message: `I don't recognize the "${settingName}" setting. Try asking for help to see available options!`
      };
    }

    const currentValue = currentSettings[settingKey];
    const newValue = !currentValue;

    try {
      await this.settingsActions.updateSettings({ [settingKey]: newValue });
      return {
        success: true,
        message: `Perfect! I've ${newValue ? 'enabled' : 'disabled'} ${displayName} for you. ${newValue ? '✨' : '🔄'}`
      };
    } catch (error) {
      return {
        success: false,
        message: `I ran into an issue toggling ${displayName}. Could you try that again?`
      };
    }
  }
}

const commandService = { parseCommand, CommandExecutor };
export default commandService;
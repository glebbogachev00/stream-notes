import { formatNoteWithAI } from './aiService';

const GROQ_PROXY_URL = '/api/groq-proxy';

// Use AI to parse natural language commands
export const parseCommand = async (input, context = {}) => {
  const { activeNotes = 0, savedNotes = 0, folders = [], themes = [] } = context;
  
  const systemPrompt = `You are stream, a minimal note-taking app's AI assistant. You embody stream's personality: minimalist, helpful, slightly playful, and focused on flow.

PERSONALITY & VOICE:
- Casual and friendly, but not overly excited
- Use lowercase for a relaxed vibe when appropriate
- Occasionally use stream-themed language: "flow", "let it stream", "flowing nicely"
- Be concise but warm - think minimalist helpfulness
- Sometimes use the water droplet emoji (💧) as your signature
- When things go well: "flowing nicely!" or "that's the stream way!"
- Can engage in light conversation: jokes, greetings, casual chat
- Keep conversations note-focused but be personable and fun
- For jokes, use water/flow themes when possible

AVAILABLE ACTIONS:
- CREATE_NOTE: Create a new note (parameters: [content])
- FORMAT_LATEST: Format the most recent note with AI
- FORMAT_ALL: Format all active notes 
- DELETE_LATEST: Delete the most recent note
- SAVE_ALL: Save all active notes to saved notes
- SAVE_LATEST: Save the most recent note
- CREATE_FOLDER: Create a new folder (parameters: [folderName])
- MOVE_TO_FOLDER: Move latest note to folder (parameters: [folderName])
- CHANGE_THEME: Switch app theme (parameters: [themeName])
- ENABLE_SETTING: Enable a setting (parameters: [settingName])
- DISABLE_SETTING: Disable a setting (parameters: [settingName])
- TOGGLE_SETTING: Toggle a setting (parameters: [settingName])
- MULTI_COMMAND: Execute multiple commands in sequence (commands: [array of command objects])
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

For SINGLE commands:
{
  "type": "ACTION_TYPE",
  "parameters": ["param1", "param2"],
  "confidence": 0.9,
  "naturalResponse": "hey! I can help you with that. want me to go ahead?",
  "needsConfirmation": false
}

For MULTIPLE commands (when user asks for several things):
{
  "type": "MULTI_COMMAND",
  "commands": [
    {
      "type": "ENABLE_SETTING",
      "parameters": ["foldersEnabled"],
      "confidence": 0.9
    },
    {
      "type": "CREATE_FOLDER", 
      "parameters": ["test"],
      "confidence": 0.9
    }
  ],
  "naturalResponse": "got it! I'll enable folders and create that test folder for you. let's flow! 💧",
  "needsConfirmation": false
}

CRITICAL: Your response must be ONLY the JSON object above. No markdown, no explanations, no extra text.

CRITICAL RULES:
1. Only use CREATE_NOTE when user explicitly says "create/write/add/make a note"
2. For casual conversation, greetings, questions → use CHAT with stream personality
3. For bulk operations (save all, format all, delete) → set needsConfirmation: true
4. For folder creation → set needsConfirmation: false (quick action)
5. For destructive actions (delete) → always set needsConfirmation: true
6. Always include naturalResponse in stream's voice - this is your main interaction!
7. If unsure about user intent, ask for clarification in naturalResponse
8. For jokes/fun requests → use CHAT and be playful with water/stream themes
9. Be conversational and personable while staying note-focused

Examples:
"create a note about coffee" → CREATE_NOTE, naturalResponse: "got it! creating a note about coffee 💧"
"create a folder named work" → CREATE_FOLDER, naturalResponse: "got it! creating a 'work' folder for you 💧"
"enable folders" → ENABLE_SETTING, naturalResponse: "nice! I'll enable folders so you can organize your notes. here we go!"
"enable folders and add folder test" → MULTI_COMMAND with both commands, naturalResponse: "perfect! I'll enable folders and create that test folder for you 💧"
"save all my notes and enable flow formatting" → MULTI_COMMAND, naturalResponse: "got it! I'll save everything and turn on flow formatting. want me to go ahead?", needsConfirmation: true
"hey what's up" → CHAT, naturalResponse: "hey there! just here helping with your notes. what's flowing through your mind?"
"how are you" → CHAT, naturalResponse: "flowing nicely! just here helping with your notes. how are your ideas streaming today? 💧"
"tell me a joke" → CHAT, naturalResponse: "why did the note go to therapy? because it had too many issues to stream through! 💧 want to create something?"
"want to tell you a joke" → CHAT, naturalResponse: "absolutely! I'm all ears. let it flow! 💧"
"good morning" → CHAT, naturalResponse: "morning! hope your ideas are flowing fresh today. ready to capture some thoughts? 💧"
"thanks" → CHAT, naturalResponse: "you're welcome! that's what I'm here for. keep those ideas flowing! 💧"
"what can you do" → HELP, naturalResponse: "I can help you create notes, format them, save them, and manage your stream settings. what sounds good?"

Remember: Your naturalResponse is the main user interaction - make it count with stream's personality!`;

  try {
    const response = await fetch(GROQ_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
      console.log('AI Raw Response:', aiResponse);
      console.log('Cleaned Response:', cleanResponse);
      
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
      
      // Handle multiple JSON objects (take the first valid one)
      const jsonObjects = cleanResponse.split('\n\n').filter(obj => obj.trim().startsWith('{'));
      
      let parsed = null;
      for (const jsonObj of jsonObjects) {
        try {
          const trimmed = jsonObj.trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            parsed = JSON.parse(trimmed);
            break; // Use the first successfully parsed JSON
          }
        } catch (e) {
          continue; // Try next JSON object
        }
      }
      
      // If no valid JSON found from split, try original method
      if (!parsed) {
        const jsonMatch = cleanResponse.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found');
        }
      }
      const result = {
        type: parsed.type || 'CHAT',
        originalInput: input,
        parameters: parsed.parameters || [],
        commands: parsed.commands || [], // For MULTI_COMMAND
        confidence: parsed.confidence || 0.7,
        naturalResponse: parsed.naturalResponse || "I'll help you with that!",
        needsConfirmation: parsed.needsConfirmation || false
      };
      console.log('Successfully parsed command:', result);
      return result;
    } catch (jsonError) {
      console.warn('JSON parsing failed:', jsonError, 'Raw response:', aiResponse);
      
      // Check if the AI response itself looks like raw JSON that got returned
      if (aiResponse.trim().startsWith('{') && aiResponse.trim().endsWith('}')) {
        console.warn('AI returned raw JSON instead of executing command:', aiResponse);
        return {
          type: 'CHAT',
          originalInput: input,
          parameters: [],
          confidence: 0.3,
          naturalResponse: "hmm, I got a bit mixed up there! can you try asking me that again? I'm here to help your notes flow 💧",
          needsConfirmation: false
        };
      }
      
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
    const conversationalKeywords = [
      'hi', 'hello', 'hey', 'thanks', 'thank you', 'good', 'great', 'awesome', 'cool', 'nice', 
      'how are', 'what\'s up', 'whats up', 'morning', 'afternoon', 'evening', 'night',
      'joke', 'funny', 'laugh', 'tell me', 'want to', 'lol', 'haha', 'hehe',
      'bye', 'goodbye', 'see you', 'later', 'peace', 'ok', 'okay', 'alright'
    ];
    
    // Special handling for jokes
    if (lowerInput.includes('joke') || lowerInput.includes('funny')) {
      const jokes = [
        "why did the note cross the road? to get to the other side of the page! 💧",
        "what do you call a note that won't stop talking? a chatter-note! 💧", 
        "why don't notes ever get lost? because they always know their place in the stream! 💧",
        "what's a note's favorite type of music? flow-sic! 💧",
        "why did the note break up with the pencil? it said their relationship wasn't flowing! 💧"
      ];
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
      
      return {
        type: 'CHAT',
        originalInput: input,
        parameters: [],
        confidence: 0.9,
        naturalResponse: randomJoke + " want to create something while you're smiling?",
        needsConfirmation: false
      };
    }
    
    if (conversationalKeywords.some(keyword => lowerInput.includes(keyword))) {
      const responses = [
        "hey! just here helping with your notes. what's flowing through your mind?",
        "hello there! ready to let some ideas flow? 💧",
        "hi! hope your thoughts are streaming nicely today. what can I help with?",
        "hey! I'm here to keep your ideas flowing. what would you like to work on? 💧"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      return {
        type: 'CHAT',
        originalInput: input,
        parameters: [],
        confidence: 0.7,
        naturalResponse: randomResponse,
        needsConfirmation: false
      };
    }
    
    // Folder creation commands
    const folderCreationKeywords = ['create', 'make', 'add', 'new'];
    const hasFolderKeyword = folderCreationKeywords.some(keyword => 
      lowerInput.includes(keyword + ' folder') || 
      lowerInput.includes(keyword + ' a folder')
    );
    
    if (hasFolderKeyword) {
      // Extract the folder name
      let folderName = input;
      folderCreationKeywords.forEach(keyword => {
        folderName = folderName.replace(new RegExp(`${keyword}\\s+(a\\s+)?folder\\s+(called\\s+|named\\s+|with\\s+the\\s+name\\s+)?`, 'gi'), '');
      });
      
      const cleanName = folderName.trim();
      if (!cleanName) {
        return {
          type: 'CHAT',
          originalInput: input,
          parameters: [],
          confidence: 0.7,
          naturalResponse: "I'd love to create a folder for you! what would you like to name it?",
          needsConfirmation: false
        };
      }
      
      return {
        type: 'CREATE_FOLDER',
        originalInput: input,
        parameters: [cleanName],
        confidence: 0.8,
        naturalResponse: `got it! creating a '${cleanName}' folder for you 💧`,
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
          
        case 'CREATE_FOLDER':
          return await this.createFolder(command.parameters[0]);
          
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

        case 'MULTI_COMMAND':
          return await this.executeMultipleCommands(command);
          
        default:
          return {
            success: false,
            message: command.naturalResponse || "hmm, not sure about that one! try saying 'help' to see what's flowing 💧",
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

  async createFolder(folderName) {
    if (!folderName || !folderName.trim()) {
      return {
        success: false,
        message: "I need a folder name to create!"
      };
    }

    const settings = this.settingsActions.getSettings();
    if (!settings.foldersEnabled) {
      return {
        success: false,
        message: "Folders are not enabled. Enable them in settings first!"
      };
    }

    const cleanFolderName = folderName.trim();
    const existingFolders = settings.folders || [];
    
    if (existingFolders.includes(cleanFolderName)) {
      return {
        success: true,
        message: `The '${cleanFolderName}' folder already exists! ready to flow 💧`
      };
    }

    try {
      const updatedFolders = [...existingFolders, cleanFolderName];
      await this.settingsActions.updateSettings({ folders: updatedFolders });
      
      return {
        success: true,
        message: `nice! created the '${cleanFolderName}' folder. it's ready for your notes to flow in 💧\n\nYou can now move notes to this folder by saying "move my latest note to ${cleanFolderName}"`
      };
    } catch (error) {
      console.error('Folder creation error:', error);
      return {
        success: false,
        message: "Failed to create folder. Please try again."
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

  async searchNotes() {
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
• Create folders: "create a folder called work" or "make a new folder named personal"
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

  async executeMultipleCommands(multiCommand) {
    if (!multiCommand.commands || multiCommand.commands.length === 0) {
      return {
        success: false,
        message: "No commands found to execute."
      };
    }

    const results = [];
    let overallSuccess = true;
    let hasConfirmationNeeded = false;

    // Check if any command needs confirmation
    for (const cmd of multiCommand.commands) {
      if (cmd.type === 'SAVE_ALL' || cmd.type === 'FORMAT_ALL' || cmd.type === 'DELETE_LATEST') {
        hasConfirmationNeeded = true;
        break;
      }
    }

    // If confirmation needed, return early
    if (hasConfirmationNeeded || multiCommand.needsConfirmation) {
      return {
        success: true,
        message: multiCommand.naturalResponse || "I'll execute those commands. Want me to go ahead?",
        needsConfirmation: true,
        commands: multiCommand.commands // Store for later execution
      };
    }

    // Execute commands in sequence
    for (const cmd of multiCommand.commands) {
      try {
        const cmdWithInput = {
          ...cmd,
          originalInput: multiCommand.originalInput
        };
        const result = await this.execute(cmdWithInput);
        results.push(result);
        
        if (!result.success) {
          overallSuccess = false;
        }
      } catch (error) {
        console.error('Error executing command in sequence:', error);
        results.push({
          success: false,
          message: `Failed to execute ${cmd.type}`
        });
        overallSuccess = false;
      }
    }

    // Combine results into a summary
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    if (overallSuccess) {
      return {
        success: true,
        message: multiCommand.naturalResponse || `great! completed all ${totalCount} tasks successfully 💧`,
        isMulti: true
      };
    } else {
      return {
        success: false,
        message: `completed ${successCount} of ${totalCount} tasks. ${multiCommand.naturalResponse || "some commands had issues, but I did what I could!"}`,
        isMulti: true
      };
    }
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

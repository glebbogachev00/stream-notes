const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const formatNoteWithAI = async (noteContent, userSettings = {}) => {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured');
  }

  // Determine list format from user settings
  const listFormat = userSettings.organizationStyle || 'bullets';
  const listExample = listFormat === 'bullets' ? '• Item' : listFormat === 'numbers' ? '1. Item' : '- Item';

  const prompt = `You are a minimal text corrector with smart list detection. Your job is to fix typos/grammar and format lists appropriately.

CORRECTION RULES:
- Fix ONLY obvious typos, spelling errors, and basic grammar
- Keep every word the user wrote (except fixing typos)  
- Preserve the user's voice, tone, and casual language
- Don't add new content or explanations

LIST DETECTION & FORMATTING:
- IF the text contains a todo list, shopping list, or series of tasks/items:
  * Format as: ${listExample}
  * Detect patterns like: "buy milk, call mom, fix car" or "task 1\ntask 2\ntask 3"
  * Look for action words: buy, call, email, check, visit, remember, etc.
  * IGNORE list headers: "todo", "shopping", "tasks", etc. - these are titles, not list items
- IF it's regular text/paragraphs: keep as paragraphs, don't force into lists
- IF already properly formatted: keep the existing format

Examples:
Input: "buy milk, call mom tomorow, fix broken sink"
Output: "${listExample.replace('Item', 'Buy milk')}\n${listExample.replace('Item', 'Call mom tomorrow')}\n${listExample.replace('Item', 'Fix broken sink')}"

Input: "todo\nbuy milk\nsay hi to friend\nbuild a robot"
Output: "Todo\n\n${listExample.replace('Item', 'Buy milk')}\n${listExample.replace('Item', 'Say hi to friend')}\n${listExample.replace('Item', 'Build a robot')}"

Input: "steam is populer platfrom for gamers"  
Output: "Steam is popular platform for gamers"

Note to process:
"${noteContent}"

Return ONLY the corrected/formatted version:`;

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
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: noteContent,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const formattedContent = data.choices?.[0]?.message?.content;
    
    if (!formattedContent) {
      throw new Error('No formatted content received from Groq');
    }

    return formattedContent.trim();
  } catch (error) {
    console.error('Error formatting note with Groq:', error);
    throw error;
  }
};

// Helper to check if API key is configured
export const isAIConfigured = () => {
  return !!GROQ_API_KEY;
};
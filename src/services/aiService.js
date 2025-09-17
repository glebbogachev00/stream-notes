const GROQ_PROXY_URL = '/api/groq-proxy';

export const formatNoteWithAI = async (noteContent, userSettings = {}) => {
  // Determine list format from user settings
  const listFormat = userSettings.organizationStyle || 'bullets';
  const listExample = listFormat === 'bullets' ? '• Item' : listFormat === 'numbers' ? '1. Item' : '- Item';

  const prompt = `You are a minimal text corrector with smart list detection. Your job is to fix typos/grammar and format lists appropriately.

CORRECTION RULES:
- Fix ONLY obvious typos, spelling errors, and basic grammar
- Keep every word the user wrote (except fixing typos)  
- Preserve the user's voice, tone, and casual language
- Don't add new content or explanations
- NEVER "correct" or change user's intentional phrasing - even if it seems awkward
- Trust that the user wrote what they meant to write
- NEVER add comments, explanations, or notes about what was changed
- Return ONLY the corrected text with no additional commentary

LIST DETECTION & FORMATTING:
- IF the text contains a todo list, shopping list, or series of tasks/items:
  * Format as: ${listExample}
  * Detect patterns like: "buy milk, call mom, fix car" or "task 1\ntask 2\ntask 3"
  * Look for action words: buy, call, email, check, visit, remember, etc.
  * PRESERVE list headers and titles exactly as written
  * Don't "correct" phrases like "Remember to" + list - these are intentional
- IF it's regular text/paragraphs: keep as paragraphs, don't force into lists
- IF already properly formatted: keep the existing format

Examples:
Input: "buy milk, call mom tomorow, fix broken sink"
Output: "${listExample.replace('Item', 'Buy milk')}\n${listExample.replace('Item', 'Call mom tomorrow')}\n${listExample.replace('Item', 'Fix broken sink')}"

Input: "Remember to to-do list\n- Charge the phone\n- Walk the dog\n- Call the police"
Output: "Remember to to-do list\n\n${listExample.replace('Item', 'Charge the phone')}\n${listExample.replace('Item', 'Walk the dog')}\n${listExample.replace('Item', 'Call the police')}"

Input: "steam is populer platfrom for gamers"  
Output: "Steam is popular platform for gamers"

Note to process:
"${noteContent}"

CRITICAL: Return ONLY the corrected/formatted text. NO comments, explanations, or notes about changes made.`;

  try {
    const response = await fetch(GROQ_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error || errorData?.message || 'Unknown error';
      console.error('[flow-format] proxy error', response.status, errorData);
      
      // Handle different error types with personality
      if (response.status === 429 || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
        throw new Error("stream's flow is running a bit dry right now - try again in a moment!");
      } else if (response.status === 401 || errorMessage.includes('API key')) {
        throw new Error("stream can't access the flow formatting service - check your settings");
      } else if (response.status >= 500) {
        throw new Error(errorMessage || "stream's formatting service took a coffee break - try again soon");
      } else {
        throw new Error(`stream hit a snag while formatting: ${errorMessage}`);
      }
    }

    const data = await response.json();
    const formattedContent = data.choices?.[0]?.message?.content;
    
    if (!formattedContent) {
      throw new Error('stream got distracted and forgot to format your note - try again!');
    }

    return formattedContent.trim();
  } catch (error) {
    console.error('Error formatting note with flow formatting:', error);
    if (error instanceof Response) {
      try {
        const data = await error.json();
        throw new Error(data?.error || 'stream hit a snag while formatting');
      } catch (parseError) {
        throw new Error('stream hit a snag while formatting');
      }
    }
    throw error;
  }
};

// Helper to check if API key is configured
export const isAIConfigured = () => true;

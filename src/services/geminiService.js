const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export const formatNoteWithGemini = async (noteContent) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `You are helping format messy notes for someone with ADHD who takes quick brain dumps. 

RULES:
- Keep the core meaning intact
- Fix obvious typos and grammar
- Structure with bullet points or paragraphs as appropriate
- Make it more readable but don't change the voice/tone
- If it's a list, make it a proper list
- If there are action items, highlight them clearly
- Keep it concise - don't add extra content
- Preserve any important details or numbers exactly

Note to format:
"${noteContent}"

Return ONLY the formatted version, no explanations or meta-text:`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent formatting
          maxOutputTokens: 1000, // Reasonable limit for notes
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const formattedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!formattedContent) {
      throw new Error('No formatted content received from Gemini');
    }

    return formattedContent.trim();
  } catch (error) {
    console.error('Error formatting note with Gemini:', error);
    throw error;
  }
};

// Helper to check if API key is configured
export const isGeminiConfigured = () => {
  return !!GEMINI_API_KEY;
};